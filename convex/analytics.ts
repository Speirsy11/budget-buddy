import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Helper to get the authenticated userId or throw
async function getUserId(ctx: { auth: { getUserIdentity: () => Promise<{ subject: string } | null> } }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthenticated");
  return identity.subject;
}

/**
 * Get the date range of user's transactions.
 */
export const getDateRange = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      const now = Date.now();
      const d = new Date(now);
      return {
        hasTransactions: false,
        earliestDate: now,
        latestDate: now,
        suggestedMonth: d.getMonth() + 1,
        suggestedYear: d.getFullYear(),
      };
    }

    const allTransactions = await ctx.db
      .query("transactions")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .collect();

    if (allTransactions.length === 0) {
      const now = Date.now();
      const d = new Date(now);
      return {
        hasTransactions: false,
        earliestDate: now,
        latestDate: now,
        suggestedMonth: d.getMonth() + 1,
        suggestedYear: d.getFullYear(),
      };
    }

    const dates = allTransactions.map((t) => t.date);
    const earliestDate = Math.min(...dates);
    const latestDate = Math.max(...dates);
    const latestD = new Date(latestDate);

    return {
      hasTransactions: true,
      earliestDate,
      latestDate,
      suggestedMonth: latestD.getMonth() + 1,
      suggestedYear: latestD.getFullYear(),
    };
  },
});

/**
 * Calculate 50/30/20 budget breakdown for a given month/year.
 */
export const get503020 = query({
  args: {
    month: v.float64(),
    year: v.float64(),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);

    const startDate = new Date(args.year, args.month - 1, 1).getTime();
    const endDate = new Date(args.year, args.month, 0, 23, 59, 59, 999).getTime();

    const monthTransactions = await ctx.db
      .query("transactions")
      .withIndex("by_userId_date", (q) =>
        q.eq("userId", userId).gte("date", startDate).lte("date", endDate)
      )
      .collect();

    // Calculate income from positive transactions
    const totalIncome = monthTransactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = monthTransactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Get custom allocation if exists
    const allocation = await ctx.db
      .query("budgetAllocations")
      .withIndex("by_userId_month_year", (q) =>
        q.eq("userId", userId).eq("month", args.month).eq("year", args.year)
      )
      .unique();

    const needsPercent = allocation?.needsPercent ?? 50;
    const wantsPercent = allocation?.wantsPercent ?? 30;
    const savingsPercent = allocation?.savingsPercent ?? 20;

    // Calculate actual spending by necessity type
    const expenses = monthTransactions.filter((t) => t.amount < 0);

    let needsActual = 0;
    let wantsActual = 0;
    let savingsActual = 0;

    for (const t of expenses) {
      const amount = Math.abs(t.amount);
      if (t.necessityScore !== undefined && t.necessityScore !== null) {
        if (t.necessityScore >= 0.7) {
          needsActual += amount;
        } else if (t.necessityScore >= 0.3) {
          savingsActual += amount;
        } else {
          wantsActual += amount;
        }
      } else {
        // Default to wants for unclassified
        wantsActual += amount;
      }
    }

    const needsTarget = totalIncome * (needsPercent / 100);
    const wantsTarget = totalIncome * (wantsPercent / 100);
    const savingsTarget = totalIncome * (savingsPercent / 100);

    const getStatus = (actual: number, target: number) => {
      if (target === 0) return "on-track" as const;
      const ratio = actual / target;
      if (ratio <= 0.9) return "under" as const;
      if (ratio <= 1.1) return "on-track" as const;
      return "over" as const;
    };

    const savingsRate = totalIncome > 0
      ? ((totalIncome - totalExpenses) / totalIncome) * 100
      : 0;

    return {
      totalIncome,
      totalExpenses,
      savingsRate,
      needs: {
        target: needsTarget,
        actual: needsActual,
        percentage: needsPercent,
        status: getStatus(needsActual, needsTarget),
      },
      wants: {
        target: wantsTarget,
        actual: wantsActual,
        percentage: wantsPercent,
        status: getStatus(wantsActual, wantsTarget),
      },
      savings: {
        target: savingsTarget,
        actual: savingsActual,
        percentage: savingsPercent,
        status: getStatus(savingsActual, savingsTarget),
      },
    };
  },
});

/**
 * Calculate spending trends grouped by day, week, or month.
 */
export const getSpendingTrends = query({
  args: {
    startDate: v.float64(),
    endDate: v.float64(),
    groupBy: v.union(
      v.literal("day"),
      v.literal("week"),
      v.literal("month")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_userId_date", (q) =>
        q
          .eq("userId", userId)
          .gte("date", args.startDate)
          .lte("date", args.endDate)
      )
      .collect();

    // Group by period
    const groups = new Map<string, { total: number; count: number }>();

    for (const t of transactions) {
      if (t.amount >= 0) continue; // Only count expenses

      const date = new Date(t.date);
      let key: string;

      if (args.groupBy === "day") {
        key = date.toISOString().split("T")[0]!;
      } else if (args.groupBy === "week") {
        // Get the Monday of the week
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
        key = d.toISOString().split("T")[0]!;
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      }

      const existing = groups.get(key) ?? { total: 0, count: 0 };
      existing.total += Math.abs(t.amount);
      existing.count += 1;
      groups.set(key, existing);
    }

    return Array.from(groups.entries())
      .map(([date, data]) => ({
        date,
        total: Math.round(data.total * 100) / 100,
        count: data.count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },
});

/**
 * Get spending breakdown by category.
 */
export const getCategoryBreakdown = query({
  args: {
    startDate: v.float64(),
    endDate: v.float64(),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_userId_date", (q) =>
        q
          .eq("userId", userId)
          .gte("date", args.startDate)
          .lte("date", args.endDate)
      )
      .collect();

    const expenses = transactions.filter((t) => t.amount < 0);
    const totalSpent = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const categoryMap = new Map<string, number>();
    for (const t of expenses) {
      const category = t.aiClassified || "Uncategorized";
      categoryMap.set(category, (categoryMap.get(category) || 0) + Math.abs(t.amount));
    }

    return Array.from(categoryMap.entries())
      .map(([category, total]) => ({
        category,
        total: Math.round(total * 100) / 100,
        percentage: totalSpent > 0 ? (total / totalSpent) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  },
});

/**
 * Update or create budget allocation for a month/year.
 */
export const updateAllocation = mutation({
  args: {
    month: v.float64(),
    year: v.float64(),
    totalIncome: v.float64(),
    needsPercent: v.float64(),
    wantsPercent: v.float64(),
    savingsPercent: v.float64(),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);

    // Validate percentages
    const total = args.needsPercent + args.wantsPercent + args.savingsPercent;
    if (Math.abs(total - 100) > 0.01) {
      throw new Error("Percentages must sum to 100");
    }

    const existing = await ctx.db
      .query("budgetAllocations")
      .withIndex("by_userId_month_year", (q) =>
        q.eq("userId", userId).eq("month", args.month).eq("year", args.year)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        totalIncome: args.totalIncome,
        needsPercent: args.needsPercent,
        wantsPercent: args.wantsPercent,
        savingsPercent: args.savingsPercent,
      });
      return existing._id;
    }

    return await ctx.db.insert("budgetAllocations", {
      userId,
      totalIncome: args.totalIncome,
      needsPercent: args.needsPercent,
      wantsPercent: args.wantsPercent,
      savingsPercent: args.savingsPercent,
      month: args.month,
      year: args.year,
    });
  },
});

/**
 * Get monthly comparison data for the last N months.
 */
export const getMonthlyComparison = query({
  args: {
    months: v.float64(),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - args.months);

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_userId_date", (q) =>
        q
          .eq("userId", userId)
          .gte("date", startDate.getTime())
          .lte("date", endDate.getTime())
      )
      .collect();

    // Group by month
    const monthlyData = new Map<string, { income: number; expenses: number }>();

    for (const t of transactions) {
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

    return Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month,
        income: Math.round(data.income * 100) / 100,
        expenses: Math.round(data.expenses * 100) / 100,
        savings: Math.round((data.income - data.expenses) * 100) / 100,
        savingsRate:
          data.income > 0
            ? Math.round(((data.income - data.expenses) / data.income) * 10000) / 100
            : 0,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  },
});
