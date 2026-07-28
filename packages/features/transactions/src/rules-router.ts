import { router, protectedProcedure, z } from "@finance/api";
import {
  db,
  transactions,
  categories,
  categorizationRules,
  ensureUserDefaults,
} from "@finance/db";
import { logger, createTimer } from "@finance/logger";
import { eq, and, asc, gt, inArray, isNull } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { applyRules } from "./rules";
import { necessityScoreFor } from "./categorization";

const log = logger.child({ module: "rules" });

/** Rows pulled per round-trip when backfilling categories over history. */
const APPLY_BATCH_SIZE = 500;

const matchTypeSchema = z.enum(["contains", "starts_with", "equals", "regex"]);
const matchFieldSchema = z.enum(["description", "merchant", "any"]);

/** Reject regex patterns that will not compile, before they reach the database. */
function assertValidPattern(pattern: string, matchType: string) {
  if (matchType !== "regex") return;
  try {
    /*
     * Compiling the user's pattern here is exactly the validation being
     * performed. The schema caps it at 200 chars and a failure surfaces as a
     * 400 rather than propagating.
     */
    // eslint-disable-next-line security/detect-non-literal-regexp -- see above
    new RegExp(pattern);
  } catch {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "That regular expression is not valid.",
    });
  }
}

/** Confirm a category belongs to the caller before pointing a rule at it. */
async function assertOwnedCategory(userId: string, categoryId: string) {
  const category = await db.query.categories.findFirst({
    where: and(eq(categories.id, categoryId), eq(categories.userId, userId)),
  });

  if (!category) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Category not found.",
    });
  }

  return category;
}

export const rulesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    await ensureUserDefaults(ctx.userId);

    const rules = await db.query.categorizationRules.findMany({
      where: eq(categorizationRules.userId, ctx.userId),
      orderBy: [
        asc(categorizationRules.priority),
        asc(categorizationRules.name),
      ],
      with: { category: true },
    });

    log.debug(
      { userId: ctx.userId, count: rules.length },
      "rules.list: completed"
    );

    return rules;
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(120),
        pattern: z.string().min(1).max(200),
        matchType: matchTypeSchema.default("contains"),
        matchField: matchFieldSchema.default("any"),
        categoryId: z.string(),
        priority: z.number().int().min(1).max(1000).default(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      assertValidPattern(input.pattern, input.matchType);
      await assertOwnedCategory(ctx.userId, input.categoryId);

      const [created] = await db
        .insert(categorizationRules)
        .values({ ...input, userId: ctx.userId, isBuiltIn: false })
        .returning();

      log.info(
        { userId: ctx.userId, ruleId: created?.id, pattern: input.pattern },
        "rules.create: rule created"
      );

      return created;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(120).optional(),
        pattern: z.string().min(1).max(200).optional(),
        matchType: matchTypeSchema.optional(),
        matchField: matchFieldSchema.optional(),
        categoryId: z.string().optional(),
        priority: z.number().int().min(1).max(1000).optional(),
        enabled: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...changes } = input;

      const existing = await db.query.categorizationRules.findFirst({
        where: and(
          eq(categorizationRules.id, id),
          eq(categorizationRules.userId, ctx.userId)
        ),
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Rule not found." });
      }

      if (changes.pattern) {
        assertValidPattern(
          changes.pattern,
          changes.matchType ?? existing.matchType
        );
      }
      if (changes.categoryId) {
        await assertOwnedCategory(ctx.userId, changes.categoryId);
      }

      const [updated] = await db
        .update(categorizationRules)
        .set({ ...changes, updatedAt: new Date() })
        .where(eq(categorizationRules.id, id))
        .returning();

      log.info(
        { userId: ctx.userId, ruleId: id },
        "rules.update: rule updated"
      );

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await db
        .delete(categorizationRules)
        .where(
          and(
            eq(categorizationRules.id, input.id),
            eq(categorizationRules.userId, ctx.userId)
          )
        )
        .returning();

      if (!deleted) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Rule not found." });
      }

      log.info(
        { userId: ctx.userId, ruleId: input.id },
        "rules.delete: rule deleted"
      );

      return { success: true };
    }),

  /**
   * Preview how many existing transactions a candidate rule would claim.
   * Lets someone check a pattern before committing to it.
   */
  preview: protectedProcedure
    .input(
      z.object({
        pattern: z.string().min(1).max(200),
        matchType: matchTypeSchema.default("contains"),
        matchField: matchFieldSchema.default("any"),
      })
    )
    .query(async ({ ctx, input }) => {
      assertValidPattern(input.pattern, input.matchType);

      const userTransactions = await db.query.transactions.findMany({
        where: eq(transactions.userId, ctx.userId),
        columns: { id: true, description: true, merchant: true, amount: true },
        limit: 2000,
      });

      const { matched } = applyRules(
        [
          {
            id: "preview",
            pattern: input.pattern,
            matchType: input.matchType,
            matchField: input.matchField,
            categoryId: "preview",
            priority: 1,
            enabled: true,
          },
        ],
        userTransactions
      );

      return {
        matchCount: matched.length,
        samples: matched.slice(0, 8).map((m) => m.transaction),
      };
    }),

  /**
   * Run every enabled rule across existing transactions.
   *
   * `onlyUncategorized` defaults to true so this is safe to press repeatedly —
   * it will not overwrite categories someone set by hand.
   */
  applyToExisting: protectedProcedure
    .input(
      z.object({ onlyUncategorized: z.boolean().default(true) }).default({})
    )
    .mutation(async ({ ctx, input }) => {
      const timer = createTimer();

      // An account that has never opened the rules page still has no rules, and
      // this would silently categorise nothing.
      await ensureUserDefaults(ctx.userId);

      const [userRules, userCategories] = await Promise.all([
        db.query.categorizationRules.findMany({
          where: and(
            eq(categorizationRules.userId, ctx.userId),
            eq(categorizationRules.enabled, true)
          ),
        }),
        db.query.categories.findMany({
          where: eq(categories.userId, ctx.userId),
        }),
      ]);

      const categoryById = new Map(userCategories.map((c) => [c.id, c]));

      // Keyset pagination on id, not offset. When onlyUncategorized is set the
      // rows we just categorised drop straight out of the filter, so an offset
      // would skip the rows that shifted into its place.
      let updatedCount = 0;
      let candidateCount = 0;
      let cursor: string | null = null;

      for (;;) {
        const conditions = [eq(transactions.userId, ctx.userId)];
        if (input.onlyUncategorized) {
          conditions.push(isNull(transactions.categoryId));
        }
        if (cursor) conditions.push(gt(transactions.id, cursor));

        const page = await db.query.transactions.findMany({
          where: and(...conditions),
          columns: {
            id: true,
            description: true,
            merchant: true,
            categoryId: true,
          },
          orderBy: [asc(transactions.id)],
          limit: APPLY_BATCH_SIZE,
        });

        if (page.length === 0) break;

        candidateCount += page.length;
        cursor = page[page.length - 1]?.id ?? null;

        const { matched } = applyRules(userRules, page);

        // Group by target category so each page costs a handful of bulk
        // updates rather than one round-trip per transaction.
        const idsByCategory = new Map<string, string[]>();
        for (const match of matched) {
          const ids = idsByCategory.get(match.categoryId) ?? [];
          ids.push(match.transaction.id);
          idsByCategory.set(match.categoryId, ids);
        }

        for (const [categoryId, ids] of idsByCategory) {
          const category = categoryById.get(categoryId);
          if (!category) continue;

          await db
            .update(transactions)
            .set({
              categoryId,
              aiClassified: category.name,
              necessityScore: necessityScoreFor(category.necessityType),
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(transactions.userId, ctx.userId),
                inArray(transactions.id, ids)
              )
            );

          updatedCount += ids.length;
        }

        if (page.length < APPLY_BATCH_SIZE) break;
      }

      log.info(
        {
          userId: ctx.userId,
          candidateCount,
          updatedCount,
          durationMs: timer.elapsed(),
        },
        "rules.applyToExisting: completed"
      );

      return { updatedCount, candidateCount };
    }),
});
