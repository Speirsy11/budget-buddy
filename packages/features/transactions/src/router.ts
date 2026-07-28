import {
  router,
  protectedProcedure,
  tieredAiRateLimitedProcedure,
  tieredUploadRateLimitedProcedure,
  z,
} from "@finance/api";
import {
  db,
  transactions,
  users,
  budgets,
  categories,
  categorizationRules,
  ensureUserDefaults,
} from "@finance/db";
import { logger, createTimer } from "@finance/logger";
import {
  eq,
  and,
  gte,
  lte,
  gt,
  lt,
  desc,
  asc,
  ilike,
  isNull,
  sql,
  or,
  inArray,
} from "drizzle-orm";
import { transactionFilterSchema } from "./schema";
import { classifyTransaction, classifyTransactionsBatch } from "./classifier";
import { generateFullExport } from "./export";
import { applyRules } from "./rules";
import { necessityScoreFor, resolveCategoryByName } from "./categorization";
import { detectRecurringTransactions, summarizeRecurring } from "./recurring";
import { detectBudgetAlerts } from "./budget-alerts";
import { notifyBudgetAlert } from "@finance/email";
import { TRPCError } from "@trpc/server";

const log = logger.child({ module: "transactions" });

/**
 * Compare each affected category's month-to-date spend before and after an
 * import, and email an alert for any budget threshold newly crossed.
 *
 * "Before" is derived by subtracting the imported amounts from the stored
 * total rather than querying twice — the rows are already written by the time
 * this runs, and a second query would race with a concurrent import.
 */
async function raiseBudgetAlerts(
  userId: string,
  imported: { categoryId: string | null; amount: number; date: Date }[]
): Promise<void> {
  const affected = imported.filter((t) => t.categoryId && t.amount < 0) as {
    categoryId: string;
    amount: number;
    date: Date;
  }[];
  if (affected.length === 0) return;

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59);

  const categoryIds = [...new Set(affected.map((t) => t.categoryId))];

  const [user, categoryBudgets, monthSpend] = await Promise.all([
    db.query.users.findFirst({ where: eq(users.id, userId) }),
    db.query.budgets.findMany({
      where: and(
        eq(budgets.userId, userId),
        eq(budgets.month, month),
        eq(budgets.year, year),
        inArray(budgets.categoryId, categoryIds)
      ),
    }),
    db
      .select({
        categoryId: transactions.categoryId,
        total: sql<number>`sum(abs(${transactions.amount}))`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          gte(transactions.date, monthStart),
          lte(transactions.date, monthEnd),
          lte(transactions.amount, 0),
          inArray(transactions.categoryId, categoryIds)
        )
      )
      .groupBy(transactions.categoryId),
  ]);

  if (!user?.email || categoryBudgets.length === 0) return;

  const spentByCategory = new Map(
    monthSpend.map((row) => [row.categoryId, Number(row.total ?? 0)])
  );

  // Only amounts dated inside the current month moved this month's totals.
  const importedByCategory = new Map<string, number>();
  for (const transaction of affected) {
    if (transaction.date < monthStart || transaction.date > monthEnd) continue;
    importedByCategory.set(
      transaction.categoryId,
      (importedByCategory.get(transaction.categoryId) ?? 0) +
        Math.abs(transaction.amount)
    );
  }

  const userCategories = await db.query.categories.findMany({
    where: inArray(categories.id, categoryIds),
  });
  const categoryNameById = new Map(userCategories.map((c) => [c.id, c.name]));

  const alerts = detectBudgetAlerts(
    categoryBudgets.flatMap((budget) => {
      if (!budget.categoryId) return [];
      const spentAfter = spentByCategory.get(budget.categoryId) ?? 0;
      const delta = importedByCategory.get(budget.categoryId) ?? 0;

      return [
        {
          categoryId: budget.categoryId,
          categoryName: categoryNameById.get(budget.categoryId) ?? budget.name,
          budgetAmount: budget.amount,
          spentBefore: spentAfter - delta,
          spentAfter,
        },
      ];
    })
  );

  for (const alert of alerts) {
    await notifyBudgetAlert({
      email: user.email,
      userName: user.firstName ?? "there",
      userId,
      categoryName: alert.categoryName,
      budgetAmount: alert.budgetAmount,
      spentAmount: alert.spentAmount,
      percentageUsed: alert.percentageUsed,
    });
  }

  if (alerts.length > 0) {
    log.info(
      { userId, alertCount: alerts.length },
      "createMany: budget alerts raised"
    );
  }
}

export const transactionsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        filters: transactionFilterSchema.optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const timer = createTimer();
      log.debug({ userId: ctx.userId, input }, "list: fetching transactions");

      const conditions = [eq(transactions.userId, ctx.userId)];

      if (input.filters?.startDate) {
        conditions.push(gte(transactions.date, input.filters.startDate));
      }
      if (input.filters?.endDate) {
        conditions.push(lte(transactions.date, input.filters.endDate));
      }
      if (input.filters?.categoryId) {
        conditions.push(eq(transactions.categoryId, input.filters.categoryId));
      }
      if (input.filters?.minAmount !== undefined) {
        conditions.push(gte(transactions.amount, input.filters.minAmount));
      }
      if (input.filters?.maxAmount !== undefined) {
        conditions.push(lte(transactions.amount, input.filters.maxAmount));
      }
      if (input.filters?.accountId) {
        conditions.push(eq(transactions.accountId, input.filters.accountId));
      }
      if (input.filters?.uncategorizedOnly) {
        conditions.push(isNull(transactions.categoryId));
      }
      if (input.filters?.direction === "expense") {
        conditions.push(lt(transactions.amount, 0));
      }
      if (input.filters?.direction === "income") {
        conditions.push(gt(transactions.amount, 0));
      }
      if (input.filters?.necessityType) {
        // necessityScore encodes the type numerically: 1 need, 0.5 savings,
        // 0 want. The analytics layer buckets on the same thresholds.
        const necessity = input.filters.necessityType;
        if (necessity === "need") {
          conditions.push(gte(transactions.necessityScore, 0.7));
        } else if (necessity === "want") {
          conditions.push(lte(transactions.necessityScore, 0.3));
        } else {
          // Everything in `conditions` is ANDed, so the two bounds can be
          // pushed separately rather than combined.
          conditions.push(gt(transactions.necessityScore, 0.3));
          conditions.push(lt(transactions.necessityScore, 0.7));
        }
      }
      if (input.filters?.search) {
        const pattern = `%${input.filters.search}%`;
        // ilike, not like: Postgres `like` is case-sensitive, so searching
        // "tesco" would miss every "TESCO STORES" on a bank statement.
        const matchesSearch = or(
          ilike(transactions.description, pattern),
          ilike(transactions.merchant, pattern)
        );
        if (matchesSearch) conditions.push(matchesSearch);
      }

      const [data, countResult] = await Promise.all([
        db.query.transactions.findMany({
          where: and(...conditions),
          orderBy: [desc(transactions.date)],
          limit: input.limit,
          offset: input.offset,
          with: {
            category: true,
          },
        }),
        db
          .select({ count: sql<number>`count(*)` })
          .from(transactions)
          .where(and(...conditions)),
      ]);

      // Postgres returns count(*) as a string; coerce to match the number type.
      const total = Number(countResult[0]?.count ?? 0);
      const result = {
        data,
        total,
        hasMore: input.offset + data.length < total,
      };

      log.info(
        {
          userId: ctx.userId,
          count: data.length,
          total: result.total,
          durationMs: timer.elapsed(),
        },
        "list: completed"
      );

      return result;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      log.debug(
        { userId: ctx.userId, transactionId: input.id },
        "getById: fetching transaction"
      );

      const transaction = await db.query.transactions.findFirst({
        where: and(
          eq(transactions.id, input.id),
          eq(transactions.userId, ctx.userId)
        ),
        with: {
          category: true,
        },
      });

      if (!transaction) {
        log.warn(
          { userId: ctx.userId, transactionId: input.id },
          "getById: transaction not found"
        );
      } else {
        log.debug(
          { userId: ctx.userId, transactionId: input.id },
          "getById: found"
        );
      }

      return transaction;
    }),

  create: protectedProcedure
    .input(
      z.object({
        amount: z.number(),
        date: z.date(),
        description: z.string(),
        merchant: z.string().optional(),
        categoryId: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      log.debug(
        {
          userId: ctx.userId,
          amount: input.amount,
          description: input.description,
        },
        "create: creating transaction"
      );

      const [transaction] = await db
        .insert(transactions)
        .values({
          userId: ctx.userId,
          amount: input.amount,
          date: input.date,
          description: input.description,
          merchant: input.merchant,
          categoryId: input.categoryId,
          notes: input.notes,
        })
        .returning();

      log.info(
        {
          userId: ctx.userId,
          transactionId: transaction?.id,
          amount: input.amount,
        },
        "create: transaction created"
      );

      return transaction;
    }),

  createMany: tieredUploadRateLimitedProcedure
    .input(
      z.object({
        transactions: z.array(
          z.object({
            amount: z.number(),
            date: z.date(),
            description: z.string(),
            merchant: z.string().optional(),
          })
        ),
        autoClassify: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const timer = createTimer();
      log.info(
        {
          userId: ctx.userId,
          count: input.transactions.length,
          autoClassify: input.autoClassify,
        },
        "createMany: starting bulk import"
      );

      // Make sure the account has categories and starter rules. Without this,
      // an import by a user who never had defaults provisioned has nothing to
      // categorise into.
      await ensureUserDefaults(ctx.userId);

      const [userCategories, userRules] = await Promise.all([
        db.query.categories.findMany({
          where: eq(categories.userId, ctx.userId),
        }),
        db.query.categorizationRules.findMany({
          where: and(
            eq(categorizationRules.userId, ctx.userId),
            eq(categorizationRules.enabled, true)
          ),
        }),
      ]);

      const categoryById = new Map(userCategories.map((c) => [c.id, c]));

      // Rules run before AI: they are deterministic, free, and instant. Only
      // what they miss is worth spending a model call on.
      const { matched, unmatched } = applyRules(userRules, input.transactions);

      log.info(
        {
          userId: ctx.userId,
          ruleMatched: matched.length,
          needsAi: unmatched.length,
        },
        "createMany: applied categorisation rules"
      );

      const categoryByTransaction = new Map<
        (typeof input.transactions)[number],
        { categoryId: string; categoryName: string; necessityScore: number }
      >();

      for (const match of matched) {
        const category = categoryById.get(match.categoryId);
        if (!category) continue;
        categoryByTransaction.set(match.transaction, {
          categoryId: category.id,
          categoryName: category.name,
          necessityScore: necessityScoreFor(category.necessityType),
        });
      }

      if (input.autoClassify && unmatched.length > 0) {
        log.debug(
          { userId: ctx.userId, count: unmatched.length },
          "createMany: starting AI classification"
        );
        const classifyTimer = createTimer();

        try {
          const classifications = await classifyTransactionsBatch(
            unmatched.map((t) => ({
              description: t.description,
              amount: t.amount,
              merchant: t.merchant,
              date: t.date,
            }))
          );

          log.info(
            {
              userId: ctx.userId,
              count: classifications.length,
              durationMs: classifyTimer.elapsed(),
            },
            "createMany: AI classification completed"
          );

          unmatched.forEach((transaction, index) => {
            // eslint-disable-next-line security/detect-object-injection -- Safe array index access within forEach callback
            const classification = classifications[index];
            if (!classification) return;

            const category = resolveCategoryByName(
              userCategories,
              classification.category
            );

            categoryByTransaction.set(transaction, {
              // A model category we cannot map stays uncategorised rather than
              // being filed somewhere arbitrary.
              categoryId: category?.id ?? "",
              categoryName: classification.category,
              necessityScore: necessityScoreFor(classification.necessityType),
            });
          });
        } catch (error) {
          log.error(
            { err: error, userId: ctx.userId },
            "createMany: AI classification failed, proceeding without classification"
          );
        }
      }

      const transactionsToInsert = input.transactions.map((t) => {
        const resolved = categoryByTransaction.get(t);
        return {
          userId: ctx.userId,
          amount: t.amount,
          date: t.date,
          description: t.description,
          merchant: t.merchant,
          // Both fields are written together. Analytics reads necessityScore /
          // aiClassified while the transactions UI joins on categoryId, so
          // setting only one of them makes the two views disagree.
          categoryId: resolved?.categoryId || null,
          aiClassified: resolved?.categoryName ?? null,
          necessityScore: resolved?.necessityScore ?? null,
        };
      });

      const inserted = await db
        .insert(transactions)
        .values(transactionsToInsert)
        .returning();

      // Alerting is best-effort and never blocks the import result.
      void raiseBudgetAlerts(ctx.userId, transactionsToInsert).catch(
        (error: unknown) => {
          log.warn(
            { err: error, userId: ctx.userId },
            "createMany: budget alerting failed"
          );
        }
      );

      // Usage counters let the rules UI show which rules are actually earning
      // their place. Best-effort: a failure here must not fail the import.
      if (matched.length > 0) {
        const appliedRuleIds = [...new Set(matched.map((m) => m.ruleId))];
        try {
          await db
            .update(categorizationRules)
            .set({
              timesApplied: sql`${categorizationRules.timesApplied} + 1`,
              lastAppliedAt: new Date(),
            })
            .where(inArray(categorizationRules.id, appliedRuleIds));
        } catch (error) {
          log.warn(
            { err: error, userId: ctx.userId },
            "createMany: failed to update rule usage counters"
          );
        }
      }

      log.info(
        {
          userId: ctx.userId,
          count: inserted.length,
          durationMs: timer.elapsed(),
        },
        "createMany: bulk import completed"
      );

      return { count: inserted.length, transactions: inserted };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        amount: z.number().optional(),
        date: z.date().optional(),
        description: z.string().optional(),
        merchant: z.string().optional(),
        categoryId: z.string().nullable().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;
      log.debug(
        {
          userId: ctx.userId,
          transactionId: id,
          fields: Object.keys(updateData),
        },
        "update: updating transaction"
      );

      const [updated] = await db
        .update(transactions)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(
          and(eq(transactions.id, id), eq(transactions.userId, ctx.userId))
        )
        .returning();

      if (!updated) {
        log.warn(
          { userId: ctx.userId, transactionId: id },
          "update: transaction not found"
        );
      } else {
        log.info(
          { userId: ctx.userId, transactionId: id },
          "update: transaction updated"
        );
      }

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      log.debug(
        { userId: ctx.userId, transactionId: input.id },
        "delete: deleting transaction"
      );

      await db
        .delete(transactions)
        .where(
          and(
            eq(transactions.id, input.id),
            eq(transactions.userId, ctx.userId)
          )
        );

      log.info(
        { userId: ctx.userId, transactionId: input.id },
        "delete: transaction deleted"
      );

      return { success: true };
    }),

  classify: tieredAiRateLimitedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const timer = createTimer();
      log.debug(
        { userId: ctx.userId, transactionId: input.id },
        "classify: starting AI classification"
      );

      const transaction = await db.query.transactions.findFirst({
        where: and(
          eq(transactions.id, input.id),
          eq(transactions.userId, ctx.userId)
        ),
      });

      if (!transaction) {
        log.warn(
          { userId: ctx.userId, transactionId: input.id },
          "classify: transaction not found"
        );
        throw new Error("Transaction not found");
      }

      log.debug(
        {
          userId: ctx.userId,
          transactionId: input.id,
          description: transaction.description,
        },
        "classify: calling AI classifier"
      );

      const classification = await classifyTransaction({
        description: transaction.description,
        amount: transaction.amount,
        merchant: transaction.merchant ?? undefined,
        date: transaction.date,
      });

      log.debug(
        { userId: ctx.userId, transactionId: input.id, classification },
        "classify: AI classification result"
      );

      const [updated] = await db
        .update(transactions)
        .set({
          aiClassified: classification.category,
          necessityScore:
            classification.necessityType === "need"
              ? 1
              : classification.necessityType === "savings"
                ? 0.5
                : 0,
          updatedAt: new Date(),
        })
        .where(eq(transactions.id, input.id))
        .returning();

      log.info(
        {
          userId: ctx.userId,
          transactionId: input.id,
          category: classification.category,
          necessityType: classification.necessityType,
          durationMs: timer.elapsed(),
        },
        "classify: classification completed"
      );

      return { transaction: updated, classification };
    }),

  exportAll: protectedProcedure.query(async ({ ctx }) => {
    const timer = createTimer();
    log.info({ userId: ctx.userId }, "exportAll: generating full export");

    const [user, userTransactions, userBudgets, availableCategories] =
      await Promise.all([
        db.query.users.findFirst({ where: eq(users.id, ctx.userId) }),
        db.query.transactions.findMany({
          where: eq(transactions.userId, ctx.userId),
          orderBy: [desc(transactions.date)],
          with: { category: true },
        }),
        db.query.budgets.findMany({
          where: eq(budgets.userId, ctx.userId),
          with: { category: true },
        }),
        db.query.categories.findMany({
          where: or(
            eq(categories.isSystem, true),
            eq(categories.userId, ctx.userId)
          ),
          orderBy: [categories.name],
        }),
      ]);

    const exportJson = generateFullExport({
      user: {
        id: ctx.userId,
        email: user?.email ?? "",
        name: [user?.firstName, user?.lastName].filter(Boolean).join(" "),
        createdAt: user?.createdAt ?? new Date(),
      },
      transactions: userTransactions.map((transaction) => ({
        id: transaction.id,
        date: transaction.date,
        description: transaction.description,
        amount: transaction.amount,
        merchant: transaction.merchant,
        category: transaction.category?.name ?? transaction.aiClassified,
        aiClassified: transaction.aiClassified,
        necessityType: transaction.category?.necessityType,
        notes: transaction.notes,
      })),
      budgets: userBudgets.map((budget) => ({
        category: budget.category?.name ?? budget.name,
        amount: budget.amount,
        period: budget.period,
      })),
      categories: availableCategories.map((category) => ({
        id: category.id,
        name: category.name,
        isCustom: !category.isSystem,
      })),
      settings: {},
    });

    log.info(
      {
        userId: ctx.userId,
        transactionCount: userTransactions.length,
        budgetCount: userBudgets.length,
        durationMs: timer.elapsed(),
      },
      "exportAll: completed"
    );

    return { json: exportJson };
  }),

  /**
   * Recurring payments detected from transaction history.
   *
   * Computed on read rather than stored: the answer changes every time a new
   * transaction lands, and recomputing over a couple of years of history is
   * only a few milliseconds.
   */
  recurring: protectedProcedure
    .input(
      z
        .object({
          /** History window. Two years covers annual subscriptions twice over. */
          lookbackMonths: z.number().int().min(3).max(36).default(24),
          lookaheadDays: z.number().int().min(1).max(90).default(30),
          includeInactive: z.boolean().default(true),
        })
        .default({})
    )
    .query(async ({ ctx, input }) => {
      const timer = createTimer();
      const now = new Date();
      const since = new Date(now);
      since.setMonth(since.getMonth() - input.lookbackMonths);

      const history = await db.query.transactions.findMany({
        where: and(
          eq(transactions.userId, ctx.userId),
          gte(transactions.date, since)
        ),
        columns: {
          id: true,
          amount: true,
          date: true,
          description: true,
          merchant: true,
          categoryId: true,
        },
      });

      const detected = detectRecurringTransactions(history, {
        referenceDate: now,
      });
      const summary = summarizeRecurring(detected, {
        referenceDate: now,
        lookaheadDays: input.lookaheadDays,
      });

      // Attach category rows so the UI can colour each series without a
      // second round-trip.
      const userCategories = await db.query.categories.findMany({
        where: eq(categories.userId, ctx.userId),
      });
      const categoryById = new Map(userCategories.map((c) => [c.id, c]));

      const withCategory = detected
        .filter((s) => input.includeInactive || s.isActive)
        .map((s) => ({
          ...s,
          category: s.categoryId
            ? (categoryById.get(s.categoryId) ?? null)
            : null,
        }));

      log.info(
        {
          userId: ctx.userId,
          analysed: history.length,
          detected: detected.length,
          activeCount: summary.activeCount,
          durationMs: timer.elapsed(),
        },
        "recurring: completed"
      );

      return {
        series: withCategory,
        summary: {
          activeCount: summary.activeCount,
          totalMonthlyCost: summary.totalMonthlyCost,
          totalAnnualCost: summary.totalAnnualCost,
          upcomingCount: summary.upcoming.length,
          inactiveCount: summary.inactive.length,
        },
        upcoming: summary.upcoming.map((s) => ({
          key: s.key,
          merchantName: s.merchantName,
          medianAmount: s.medianAmount,
          nextExpectedDate: s.nextExpectedDate,
          cadenceLabel: s.cadenceLabel,
        })),
      };
    }),

  /**
   * Recategorise many transactions at once.
   *
   * Every write is scoped by userId as well as id, so a crafted list of
   * someone else's transaction IDs updates nothing rather than partially
   * succeeding.
   */
  bulkUpdateCategory: protectedProcedure
    .input(
      z.object({
        ids: z.array(z.string()).min(1).max(500),
        categoryId: z.string().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const timer = createTimer();

      let category = null;
      if (input.categoryId) {
        category = await db.query.categories.findFirst({
          where: and(
            eq(categories.id, input.categoryId),
            eq(categories.userId, ctx.userId)
          ),
        });

        if (!category) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Category not found.",
          });
        }
      }

      const updated = await db
        .update(transactions)
        .set({
          categoryId: category?.id ?? null,
          // Keep the three category fields consistent; analytics reads the
          // other two and would otherwise disagree with the table view.
          aiClassified: category?.name ?? null,
          necessityScore: category
            ? necessityScoreFor(category.necessityType)
            : null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(transactions.userId, ctx.userId),
            inArray(transactions.id, input.ids)
          )
        )
        .returning({ id: transactions.id });

      log.info(
        {
          userId: ctx.userId,
          requested: input.ids.length,
          updated: updated.length,
          categoryId: category?.id ?? null,
          durationMs: timer.elapsed(),
        },
        "bulkUpdateCategory: completed"
      );

      return { updatedCount: updated.length };
    }),

  bulkDelete: protectedProcedure
    .input(z.object({ ids: z.array(z.string()).min(1).max(500) }))
    .mutation(async ({ ctx, input }) => {
      const deleted = await db
        .delete(transactions)
        .where(
          and(
            eq(transactions.userId, ctx.userId),
            inArray(transactions.id, input.ids)
          )
        )
        .returning({ id: transactions.id });

      log.info(
        {
          userId: ctx.userId,
          requested: input.ids.length,
          deleted: deleted.length,
        },
        "bulkDelete: completed"
      );

      return { deletedCount: deleted.length };
    }),

  /**
   * The caller's category list, provisioning defaults first so a brand-new
   * account never sees an empty picker.
   */
  categories: protectedProcedure.query(async ({ ctx }) => {
    await ensureUserDefaults(ctx.userId);

    return db.query.categories.findMany({
      where: eq(categories.userId, ctx.userId),
      orderBy: [asc(categories.name)],
    });
  }),

  getSummary: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      const timer = createTimer();
      log.debug(
        {
          userId: ctx.userId,
          startDate: input.startDate,
          endDate: input.endDate,
        },
        "getSummary: calculating summary"
      );

      const userTransactions = await db.query.transactions.findMany({
        where: and(
          eq(transactions.userId, ctx.userId),
          gte(transactions.date, input.startDate),
          lte(transactions.date, input.endDate)
        ),
      });

      const totalIncome = userTransactions
        .filter((t) => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);

      const totalExpenses = userTransactions
        .filter((t) => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const categoryTotals: Record<string, number> = {};
      for (const t of userTransactions) {
        const category = t.aiClassified || "Uncategorized";
        // eslint-disable-next-line security/detect-object-injection -- Safe: category is derived from user data in typed Record
        const currentTotal = categoryTotals[category] || 0;
        // eslint-disable-next-line security/detect-object-injection -- Safe: category is derived from user data in typed Record
        categoryTotals[category] = currentTotal + Math.abs(t.amount);
      }

      const result = {
        totalIncome,
        totalExpenses,
        netCashFlow: totalIncome - totalExpenses,
        transactionCount: userTransactions.length,
        categoryTotals,
      };

      log.info(
        {
          userId: ctx.userId,
          transactionCount: result.transactionCount,
          totalIncome: result.totalIncome,
          totalExpenses: result.totalExpenses,
          durationMs: timer.elapsed(),
        },
        "getSummary: completed"
      );

      return result;
    }),
});
