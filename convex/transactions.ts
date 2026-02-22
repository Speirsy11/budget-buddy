import {
  query,
  mutation,
  internalQuery,
  internalMutation,
} from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

// Helper to get the authenticated userId or throw
async function getUserId(ctx: { auth: { getUserIdentity: () => Promise<{ subject: string } | null> } }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthenticated");
  return identity.subject;
}

/**
 * List transactions with pagination and optional filters.
 */
export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    startDate: v.optional(v.float64()),
    endDate: v.optional(v.float64()),
    search: v.optional(v.string()),
    categoryFilter: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);

    let q;
    if (args.startDate !== undefined && args.endDate !== undefined) {
      q = ctx.db
        .query("transactions")
        .withIndex("by_userId_date", (idx) =>
          idx
            .eq("userId", userId)
            .gte("date", args.startDate!)
            .lte("date", args.endDate!)
        );
    } else {
      q = ctx.db
        .query("transactions")
        .withIndex("by_userId", (idx) => idx.eq("userId", userId));
    }

    const results = await q.order("desc").paginate(args.paginationOpts);

    // Apply client-side filters that can't be done via index
    let filtered = results.page;
    if (args.search) {
      const s = args.search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.description.toLowerCase().includes(s) ||
          t.merchant?.toLowerCase().includes(s)
      );
    }
    if (args.categoryFilter) {
      filtered = filtered.filter(
        (t) => t.aiClassified === args.categoryFilter
      );
    }

    return { ...results, page: filtered };
  },
});

/**
 * List transactions without pagination (for analytics).
 * Returns all matching transactions for a user within a date range.
 */
export const listAll = query({
  args: {
    startDate: v.optional(v.float64()),
    endDate: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);

    let q;
    if (args.startDate !== undefined && args.endDate !== undefined) {
      q = ctx.db
        .query("transactions")
        .withIndex("by_userId_date", (idx) =>
          idx
            .eq("userId", userId)
            .gte("date", args.startDate!)
            .lte("date", args.endDate!)
        );
    } else {
      q = ctx.db
        .query("transactions")
        .withIndex("by_userId", (idx) => idx.eq("userId", userId));
    }

    return await q.order("desc").collect();
  },
});

/**
 * Get a single transaction by ID.
 */
export const getById = query({
  args: { id: v.id("transactions") },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const transaction = await ctx.db.get(args.id);

    if (!transaction || transaction.userId !== userId) return null;
    return transaction;
  },
});

/**
 * Internal query: get transactions by IDs (for AI action).
 */
export const getByIds = internalQuery({
  args: { ids: v.array(v.id("transactions")) },
  handler: async (ctx, args) => {
    const results = [];
    for (const id of args.ids) {
      const tx = await ctx.db.get(id);
      if (tx) results.push(tx);
    }
    return results;
  },
});

/**
 * Create a single transaction.
 */
export const create = mutation({
  args: {
    amount: v.float64(),
    date: v.float64(),
    description: v.string(),
    merchant: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);

    return await ctx.db.insert("transactions", {
      ...args,
      userId,
    });
  },
});

/**
 * Bulk create transactions (for CSV import).
 */
export const createMany = mutation({
  args: {
    transactions: v.array(
      v.object({
        amount: v.float64(),
        date: v.float64(),
        description: v.string(),
        merchant: v.optional(v.string()),
        aiClassified: v.optional(v.string()),
        necessityScore: v.optional(v.float64()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);

    const ids = [];
    for (const tx of args.transactions) {
      const id = await ctx.db.insert("transactions", {
        ...tx,
        userId,
      });
      ids.push(id);
    }
    return ids;
  },
});

/**
 * Update a transaction.
 */
export const update = mutation({
  args: {
    id: v.id("transactions"),
    amount: v.optional(v.float64()),
    date: v.optional(v.float64()),
    description: v.optional(v.string()),
    merchant: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
    notes: v.optional(v.string()),
    aiClassified: v.optional(v.string()),
    necessityScore: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== userId) {
      throw new Error("Transaction not found");
    }

    const { id, ...updates } = args;
    // Filter out undefined values
    const cleanUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        cleanUpdates[key] = value;
      }
    }

    await ctx.db.patch(args.id, cleanUpdates);
    return await ctx.db.get(args.id);
  },
});

/**
 * Delete a transaction.
 */
export const remove = mutation({
  args: { id: v.id("transactions") },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== userId) {
      throw new Error("Transaction not found");
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});

/**
 * Get summary statistics for a date range.
 */
export const getSummary = query({
  args: {
    startDate: v.float64(),
    endDate: v.float64(),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);

    const userTransactions = await ctx.db
      .query("transactions")
      .withIndex("by_userId_date", (idx) =>
        idx
          .eq("userId", userId)
          .gte("date", args.startDate)
          .lte("date", args.endDate)
      )
      .collect();

    const totalIncome = userTransactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = userTransactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const categoryTotals: Record<string, number> = {};
    for (const t of userTransactions) {
      const category = t.aiClassified || "Uncategorized";
      categoryTotals[category] = (categoryTotals[category] || 0) + Math.abs(t.amount);
    }

    return {
      totalIncome,
      totalExpenses,
      netCashFlow: totalIncome - totalExpenses,
      transactionCount: userTransactions.length,
      categoryTotals,
    };
  },
});

/**
 * Internal mutation: apply AI classifications to transactions.
 */
export const applyClassifications = internalMutation({
  args: {
    classifications: v.array(
      v.object({
        transactionId: v.id("transactions"),
        category: v.string(),
        necessityType: v.string(),
        confidence: v.float64(),
      })
    ),
  },
  handler: async (ctx, args) => {
    for (const c of args.classifications) {
      await ctx.db.patch(c.transactionId, {
        aiClassified: c.category,
        necessityScore:
          c.necessityType === "need"
            ? 1
            : c.necessityType === "savings"
              ? 0.5
              : 0,
      });
    }
  },
});
