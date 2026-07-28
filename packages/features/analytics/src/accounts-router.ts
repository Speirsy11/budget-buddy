import { router, protectedProcedure, z } from "@finance/api";
import {
  db,
  accounts,
  accountBalanceSnapshots,
  transactions,
  accountTypes,
} from "@finance/db";
import { logger, createTimer } from "@finance/logger";
import { eq, and, asc, desc, gte, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  calculateNetWorth,
  buildNetWorthHistory,
  monthEndDates,
  netWorthChange,
} from "./net-worth";

const log = logger.child({ module: "accounts" });

const accountTypeSchema = z.enum(accountTypes);

/** Load an account, failing with NOT_FOUND if it is not the caller's. */
async function ownedAccount(userId: string, accountId: string) {
  const account = await db.query.accounts.findFirst({
    where: and(eq(accounts.id, accountId), eq(accounts.userId, userId)),
  });

  if (!account) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Account not found." });
  }

  return account;
}

export const accountsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const rows = await db.query.accounts.findMany({
      where: eq(accounts.userId, ctx.userId),
      orderBy: [desc(accounts.isActive), asc(accounts.name)],
    });

    // Transaction counts make it obvious which accounts are actually in use.
    const counts = await db
      .select({
        accountId: transactions.accountId,
        count: sql<number>`count(*)`,
      })
      .from(transactions)
      .where(eq(transactions.userId, ctx.userId))
      .groupBy(transactions.accountId);

    const countByAccount = new Map(
      counts.map((row) => [row.accountId, Number(row.count)])
    );

    return rows.map((account) => ({
      ...account,
      transactionCount: countByAccount.get(account.id) ?? 0,
    }));
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(120),
        type: accountTypeSchema,
        institutionName: z.string().max(120).optional(),
        currentBalance: z.number().default(0),
        creditLimit: z.number().positive().optional(),
        includeInNetWorth: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // One transaction: an account whose opening snapshot failed to write
      // would be missing from every historical net worth point.
      const created = await db.transaction(async (tx) => {
        const [account] = await tx
          .insert(accounts)
          .values({ ...input, userId: ctx.userId })
          .returning();

        if (!account) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Could not create the account.",
          });
        }

        // Seed the history immediately so a brand-new account still plots a
        // point on the net worth chart.
        await tx.insert(accountBalanceSnapshots).values({
          accountId: account.id,
          userId: ctx.userId,
          balance: account.currentBalance,
        });

        return account;
      });

      log.info(
        { userId: ctx.userId, accountId: created.id, type: created.type },
        "accounts.create: account created"
      );

      return created;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(120).optional(),
        type: accountTypeSchema.optional(),
        institutionName: z.string().max(120).nullable().optional(),
        creditLimit: z.number().positive().nullable().optional(),
        includeInNetWorth: z.boolean().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...changes } = input;
      await ownedAccount(ctx.userId, id);

      const [updated] = await db
        .update(accounts)
        .set({ ...changes, updatedAt: new Date() })
        .where(eq(accounts.id, id))
        .returning();

      log.info(
        { userId: ctx.userId, accountId: id },
        "accounts.update: account updated"
      );

      return updated;
    }),

  /**
   * Record a new balance.
   *
   * Kept separate from `update` because it appends to history rather than
   * overwriting a field — net worth over time depends on every balance the
   * account has held, not just its latest.
   */
  updateBalance: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        balance: z.number(),
        /** Backdating lets someone enter a statement from last month. */
        recordedAt: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const account = await ownedAccount(ctx.userId, input.id);

      // The account's own balance tracks the latest snapshot only. Backdated
      // entries fill in history without rewriting what the account is today.
      const isBackdated =
        input.recordedAt !== undefined && input.recordedAt < new Date();

      // One transaction: a snapshot without its matching balance update (or
      // vice versa) leaves the chart and the account disagreeing.
      const updated = await db.transaction(async (tx) => {
        await tx.insert(accountBalanceSnapshots).values({
          accountId: account.id,
          userId: ctx.userId,
          balance: input.balance,
          ...(input.recordedAt ? { recordedAt: input.recordedAt } : {}),
        });

        if (isBackdated) return account;

        const [row] = await tx
          .update(accounts)
          .set({ currentBalance: input.balance, updatedAt: new Date() })
          .where(eq(accounts.id, account.id))
          .returning();

        return row;
      });

      log.info(
        {
          userId: ctx.userId,
          accountId: account.id,
          balance: input.balance,
          isBackdated,
        },
        "accounts.updateBalance: balance recorded"
      );

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ownedAccount(ctx.userId, input.id);

      // Transactions survive with accountId set to null (FK is ON DELETE SET
      // NULL) so deleting an account never destroys spending history.
      await db.delete(accounts).where(eq(accounts.id, input.id));

      log.info(
        { userId: ctx.userId, accountId: input.id },
        "accounts.delete: account deleted"
      );

      return { success: true };
    }),

  netWorth: protectedProcedure
    .input(
      z
        .object({ months: z.number().int().min(1).max(60).default(12) })
        .default({})
    )
    .query(async ({ ctx, input }) => {
      const timer = createTimer();
      const now = new Date();

      const dates = monthEndDates(input.months, now);
      const earliest = dates.at(0) ?? now;

      const [userAccounts, snapshots] = await Promise.all([
        db.query.accounts.findMany({
          where: eq(accounts.userId, ctx.userId),
        }),
        db.query.accountBalanceSnapshots.findMany({
          where: eq(accountBalanceSnapshots.userId, ctx.userId),
          orderBy: [asc(accountBalanceSnapshots.recordedAt)],
        }),
      ]);

      const breakdown = calculateNetWorth(userAccounts);
      const history = buildNetWorthHistory(userAccounts, snapshots, dates);
      const change = netWorthChange(history);

      log.info(
        {
          userId: ctx.userId,
          accountCount: userAccounts.length,
          netWorth: breakdown.netWorth,
          durationMs: timer.elapsed(),
        },
        "accounts.netWorth: completed"
      );

      return {
        ...breakdown,
        history,
        change,
        // Surfaced so the UI can explain a flat chart rather than look broken.
        hasHistory: snapshots.some((s) => s.recordedAt >= earliest),
      };
    }),

  balanceHistory: protectedProcedure
    .input(
      z.object({
        accountId: z.string(),
        months: z.number().int().min(1).max(60).default(12),
      })
    )
    .query(async ({ ctx, input }) => {
      await ownedAccount(ctx.userId, input.accountId);

      const since = new Date();
      since.setMonth(since.getMonth() - input.months);

      return db.query.accountBalanceSnapshots.findMany({
        where: and(
          eq(accountBalanceSnapshots.accountId, input.accountId),
          gte(accountBalanceSnapshots.recordedAt, since)
        ),
        orderBy: [asc(accountBalanceSnapshots.recordedAt)],
      });
    }),
});
