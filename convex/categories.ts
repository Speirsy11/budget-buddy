import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * List categories for the authenticated user (including system categories).
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const systemCategories = await ctx.db
      .query("categories")
      .withIndex("by_system", (q) => q.eq("isSystem", true))
      .collect();

    const userCategories = await ctx.db
      .query("categories")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .collect();

    return [...systemCategories, ...userCategories];
  },
});

/**
 * Create a user-specific category.
 */
export const create = mutation({
  args: {
    name: v.string(),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    necessityType: v.union(
      v.literal("need"),
      v.literal("want"),
      v.literal("savings")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    return await ctx.db.insert("categories", {
      ...args,
      userId: identity.subject,
      isSystem: false,
    });
  },
});

/**
 * Seed system categories (run once on initialization).
 */
export const seedSystemCategories = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("categories")
      .withIndex("by_system", (q) => q.eq("isSystem", true))
      .first();

    if (existing) return { seeded: false, message: "System categories already exist" };

    const systemCategories: Array<{
      name: string;
      necessityType: "need" | "want" | "savings";
      icon?: string;
      color?: string;
    }> = [
      { name: "Housing", necessityType: "need", color: "#3B82F6" },
      { name: "Transportation", necessityType: "need", color: "#6366F1" },
      { name: "Food & Groceries", necessityType: "need", color: "#22C55E" },
      { name: "Dining & Restaurants", necessityType: "want", color: "#F59E0B" },
      { name: "Healthcare", necessityType: "need", color: "#EF4444" },
      { name: "Entertainment", necessityType: "want", color: "#A855F7" },
      { name: "Shopping", necessityType: "want", color: "#EC4899" },
      { name: "Personal Care", necessityType: "want", color: "#14B8A6" },
      { name: "Education", necessityType: "need", color: "#0EA5E9" },
      { name: "Bills & Subscriptions", necessityType: "need", color: "#F97316" },
      { name: "Income", necessityType: "savings", color: "#10B981" },
      { name: "Savings & Investments", necessityType: "savings", color: "#059669" },
      { name: "Fees & Interest", necessityType: "need", color: "#DC2626" },
      { name: "Travel", necessityType: "want", color: "#8B5CF6" },
      { name: "Gifts & Donations", necessityType: "want", color: "#D946EF" },
      { name: "Other", necessityType: "want", color: "#6B7280" },
    ];

    for (const cat of systemCategories) {
      await ctx.db.insert("categories", {
        ...cat,
        isSystem: true,
      });
    }

    return { seeded: true, count: systemCategories.length };
  },
});
