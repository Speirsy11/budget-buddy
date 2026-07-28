import { router, protectedProcedure, z } from "@finance/api";
import { db, goals, accounts, goalStatuses } from "@finance/db";
import { logger } from "@finance/logger";
import { eq, and, asc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { calculateGoalProgress, summarizeGoals } from "./goals";

const log = logger.child({ module: "goals" });

async function ownedGoal(userId: string, goalId: string) {
  const goal = await db.query.goals.findFirst({
    where: and(eq(goals.id, goalId), eq(goals.userId, userId)),
  });

  if (!goal) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Goal not found." });
  }

  return goal;
}

async function assertOwnedAccount(userId: string, accountId: string) {
  const account = await db.query.accounts.findFirst({
    where: and(eq(accounts.id, accountId), eq(accounts.userId, userId)),
  });

  if (!account) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Account not found." });
  }

  return account;
}

export const goalsRouter = router({
  list: protectedProcedure
    .input(
      z.object({ includeArchived: z.boolean().default(false) }).default({})
    )
    .query(async ({ ctx, input }) => {
      const rows = await db.query.goals.findMany({
        where: eq(goals.userId, ctx.userId),
        orderBy: [asc(goals.targetDate), asc(goals.name)],
        with: { linkedAccount: true },
      });

      const visible = input.includeArchived
        ? rows
        : rows.filter((goal) => goal.status !== "archived");

      const now = new Date();
      const withProgress = visible.map((goal) => {
        // A linked account's balance is the source of truth — the stored
        // currentAmount is only used for goals tracked by hand.
        const currentAmount =
          goal.linkedAccount?.currentBalance ?? goal.currentAmount;

        return {
          ...goal,
          currentAmount,
          progress: calculateGoalProgress(
            { ...goal, currentAmount, targetDate: goal.targetDate },
            now
          ),
        };
      });

      return {
        goals: withProgress,
        summary: summarizeGoals(withProgress.map((g) => g.progress)),
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(120),
        targetAmount: z.number().positive(),
        currentAmount: z.number().min(0).default(0),
        targetDate: z.date().optional(),
        linkedAccountId: z.string().optional(),
        icon: z.string().max(40).optional(),
        color: z.string().max(20).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.linkedAccountId) {
        await assertOwnedAccount(ctx.userId, input.linkedAccountId);
      }

      const [created] = await db
        .insert(goals)
        .values({ ...input, userId: ctx.userId })
        .returning();

      log.info(
        { userId: ctx.userId, goalId: created?.id, target: input.targetAmount },
        "goals.create: goal created"
      );

      return created;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(120).optional(),
        targetAmount: z.number().positive().optional(),
        currentAmount: z.number().min(0).optional(),
        targetDate: z.date().nullable().optional(),
        linkedAccountId: z.string().nullable().optional(),
        status: z.enum(goalStatuses).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...changes } = input;
      await ownedGoal(ctx.userId, id);

      if (changes.linkedAccountId) {
        await assertOwnedAccount(ctx.userId, changes.linkedAccountId);
      }

      const [updated] = await db
        .update(goals)
        .set({ ...changes, updatedAt: new Date() })
        .where(eq(goals.id, id))
        .returning();

      log.info(
        { userId: ctx.userId, goalId: id },
        "goals.update: goal updated"
      );

      return updated;
    }),

  /**
   * Add to (or subtract from) a manually tracked goal.
   *
   * Rejected for account-linked goals: their balance comes from the account,
   * so accepting a contribution here would silently do nothing.
   */
  contribute: protectedProcedure
    .input(z.object({ id: z.string(), amount: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const goal = await ownedGoal(ctx.userId, input.id);

      if (goal.linkedAccountId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "This goal tracks a linked account. Update the account balance instead.",
        });
      }

      const nextAmount = Math.max(0, goal.currentAmount + input.amount);
      const achieved = nextAmount >= goal.targetAmount;

      const [updated] = await db
        .update(goals)
        .set({
          currentAmount: nextAmount,
          status: achieved ? "achieved" : "active",
          updatedAt: new Date(),
        })
        .where(eq(goals.id, goal.id))
        .returning();

      log.info(
        {
          userId: ctx.userId,
          goalId: goal.id,
          amount: input.amount,
          achieved,
        },
        "goals.contribute: contribution recorded"
      );

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ownedGoal(ctx.userId, input.id);
      await db.delete(goals).where(eq(goals.id, input.id));

      log.info(
        { userId: ctx.userId, goalId: input.id },
        "goals.delete: goal deleted"
      );

      return { success: true };
    }),
});
