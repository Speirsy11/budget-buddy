import { router, protectedProcedure, z } from "@finance/api";
import { db, transactions, budgetAllocations } from "@finance/db";
import { logger, createTimer } from "@finance/logger";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import {
  calculate503020,
  calculateSpendingTrends,
  calculateCategoryTotals,
} from "./calculations";

const log = logger.child({ module: "analytics" });

export const analyticsRouter = router({
  getDateRange: protectedProcedure.query(async ({ ctx }) => {
    log.debug(
      { userId: ctx.userId },
      "getDateRange: fetching transaction date range"
    );

    const userTransactions = await db.query.transactions.findMany({
      where: eq(transactions.userId, ctx.userId),
      orderBy: [desc(transactions.date)],
    });

    if (userTransactions.length === 0) {
      const now = new Date();
      return {
        hasTransactions: false,
        earliestDate: now,
        latestDate: now,
        suggestedMonth: now.getMonth() + 1,
        suggestedYear: now.getFullYear(),
      };
    }

    const dates = userTransactions.map((t) => new Date(t.date));
    const earliestDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const latestDate = new Date(Math.max(...dates.map((d) => d.getTime())));

    log.debug(
      {
        userId: ctx.userId,
        transactionCount: userTransactions.length,
        earliestDate,
        latestDate,
      },
      "getDateRange: completed"
    );

    return {
      hasTransactions: true,
      earliestDate,
      latestDate,
      suggestedMonth: latestDate.getMonth() + 1,
      suggestedYear: latestDate.getFullYear(),
    };
  }),

  get503020: protectedProcedure
    .input(
      z.object({
        month: z.number().min(1).max(12),
        year: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const timer = createTimer();
      log.debug(
        { userId: ctx.userId, month: input.month, year: input.year },
        "get503020: calculating budget breakdown"
      );

      const startDate = new Date(input.year, input.month - 1, 1);
      const endDate = new Date(input.year, input.month, 0, 23, 59, 59);

      const monthTransactions = await db.query.transactions.findMany({
        where: and(
          eq(transactions.userId, ctx.userId),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate)
        ),
      });

      log.debug(
        { userId: ctx.userId, transactionCount: monthTransactions.length },
        "get503020: fetched transactions for period"
      );

      // Calculate income from positive transactions
      const income = monthTransactions
        .filter((t) => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);

      // Get user's custom allocation if exists
      const allocation = await db.query.budgetAllocations.findFirst({
        where: and(
          eq(budgetAllocations.userId, ctx.userId),
          eq(budgetAllocations.month, input.month),
          eq(budgetAllocations.year, input.year)
        ),
      });

      const customRatios = allocation
        ? {
            needs: allocation.needsPercent,
            wants: allocation.wantsPercent,
            savings: allocation.savingsPercent,
          }
        : undefined;

      if (allocation) {
        log.debug(
          { userId: ctx.userId, customRatios },
          "get503020: using custom allocation"
        );
      }

      const result = calculate503020(income, monthTransactions, customRatios);

      log.info(
        {
          userId: ctx.userId,
          month: input.month,
          year: input.year,
          income,
          transactionCount: monthTransactions.length,
          durationMs: timer.elapsed(),
        },
        "get503020: completed"
      );

      return result;
    }),

  getSpendingTrends: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
        groupBy: z.enum(["day", "week", "month"]).default("day"),
      })
    )
    .query(async ({ ctx, input }) => {
      const timer = createTimer();
      log.debug(
        {
          userId: ctx.userId,
          startDate: input.startDate,
          endDate: input.endDate,
          groupBy: input.groupBy,
        },
        "getSpendingTrends: calculating trends"
      );

      const userTransactions = await db.query.transactions.findMany({
        where: and(
          eq(transactions.userId, ctx.userId),
          gte(transactions.date, input.startDate),
          lte(transactions.date, input.endDate)
        ),
        orderBy: [desc(transactions.date)],
      });

      const result = calculateSpendingTrends(userTransactions, input.groupBy);

      log.info(
        {
          userId: ctx.userId,
          transactionCount: userTransactions.length,
          trendPoints: result.length,
          groupBy: input.groupBy,
          durationMs: timer.elapsed(),
        },
        "getSpendingTrends: completed"
      );

      return result;
    }),

  getCategoryBreakdown: protectedProcedure
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
        "getCategoryBreakdown: calculating breakdown"
      );

      const userTransactions = await db.query.transactions.findMany({
        where: and(
          eq(transactions.userId, ctx.userId),
          gte(transactions.date, input.startDate),
          lte(transactions.date, input.endDate)
        ),
      });

      const result = calculateCategoryTotals(userTransactions);

      log.info(
        {
          userId: ctx.userId,
          transactionCount: userTransactions.length,
          categoryCount: result.length,
          durationMs: timer.elapsed(),
        },
        "getCategoryBreakdown: completed"
      );

      return result;
    }),

  updateAllocation: protectedProcedure
    .input(
      z.object({
        month: z.number().min(1).max(12),
        year: z.number(),
        totalIncome: z.number(),
        needsPercent: z.number().min(0).max(100).default(50),
        wantsPercent: z.number().min(0).max(100).default(30),
        savingsPercent: z.number().min(0).max(100).default(20),
      })
    )
    .mutation(async ({ ctx, input }) => {
      log.debug(
        {
          userId: ctx.userId,
          month: input.month,
          year: input.year,
          needs: input.needsPercent,
          wants: input.wantsPercent,
          savings: input.savingsPercent,
        },
        "updateAllocation: updating budget allocation"
      );

      // Validate percentages sum to 100
      const total =
        input.needsPercent + input.wantsPercent + input.savingsPercent;
      if (Math.abs(total - 100) > 0.01) {
        log.warn(
          { userId: ctx.userId, total, expected: 100 },
          "updateAllocation: percentages do not sum to 100"
        );
        throw new Error("Percentages must sum to 100");
      }

      const existing = await db.query.budgetAllocations.findFirst({
        where: and(
          eq(budgetAllocations.userId, ctx.userId),
          eq(budgetAllocations.month, input.month),
          eq(budgetAllocations.year, input.year)
        ),
      });

      if (existing) {
        log.debug(
          { userId: ctx.userId, allocationId: existing.id },
          "updateAllocation: updating existing allocation"
        );

        const [updated] = await db
          .update(budgetAllocations)
          .set({
            totalIncome: input.totalIncome,
            needsPercent: input.needsPercent,
            wantsPercent: input.wantsPercent,
            savingsPercent: input.savingsPercent,
            updatedAt: new Date(),
          })
          .where(eq(budgetAllocations.id, existing.id))
          .returning();

        log.info(
          { userId: ctx.userId, allocationId: existing.id },
          "updateAllocation: allocation updated"
        );

        return updated;
      }

      log.debug(
        { userId: ctx.userId },
        "updateAllocation: creating new allocation"
      );

      const [created] = await db
        .insert(budgetAllocations)
        .values({
          userId: ctx.userId,
          month: input.month,
          year: input.year,
          totalIncome: input.totalIncome,
          needsPercent: input.needsPercent,
          wantsPercent: input.wantsPercent,
          savingsPercent: input.savingsPercent,
        })
        .returning();

      log.info(
        {
          userId: ctx.userId,
          allocationId: created?.id,
          month: input.month,
          year: input.year,
        },
        "updateAllocation: allocation created"
      );

      return created;
    }),

  getMonthlyComparison: protectedProcedure
    .input(
      z.object({
        months: z.number().min(1).max(12).default(6),
      })
    )
    .query(async ({ ctx, input }) => {
      const timer = createTimer();
      log.debug(
        { userId: ctx.userId, months: input.months },
        "getMonthlyComparison: calculating comparison"
      );

      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - input.months);

      const userTransactions = await db.query.transactions.findMany({
        where: and(
          eq(transactions.userId, ctx.userId),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate)
        ),
      });

      // Group by month
      const monthlyData = new Map<
        string,
        { income: number; expenses: number }
      >();

      for (const t of userTransactions) {
        const date = new Date(t.date);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

        const existing = monthlyData.get(key) ?? { income: 0, expenses: 0 };
        if (t.amount > 0) {
          existing.income += t.amount;
        } else {
          existing.expenses += Math.abs(t.amount);
        }
        monthlyData.set(key, existing);
      }

      const result = Array.from(monthlyData.entries())
        .map(([month, data]) => ({
          month,
          income: data.income,
          expenses: data.expenses,
          savings: data.income - data.expenses,
          savingsRate:
            data.income > 0
              ? ((data.income - data.expenses) / data.income) * 100
              : 0,
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

      log.info(
        {
          userId: ctx.userId,
          transactionCount: userTransactions.length,
          monthsReturned: result.length,
          durationMs: timer.elapsed(),
        },
        "getMonthlyComparison: completed"
      );

      return result;
    }),
});
