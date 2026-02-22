import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"]),

  transactions: defineTable({
    userId: v.string(),
    amount: v.float64(),
    date: v.float64(), // Unix timestamp (ms)
    description: v.string(),
    merchant: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
    necessityScore: v.optional(v.float64()),
    aiClassified: v.optional(v.string()),
    notes: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_date", ["userId", "date"])
    .index("by_userId_categoryId", ["userId", "categoryId"]),

  categories: defineTable({
    userId: v.optional(v.string()),
    name: v.string(),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    necessityType: v.union(
      v.literal("need"),
      v.literal("want"),
      v.literal("savings")
    ),
    isSystem: v.boolean(),
  })
    .index("by_userId", ["userId"])
    .index("by_system", ["isSystem"]),

  budgets: defineTable({
    userId: v.string(),
    categoryId: v.optional(v.id("categories")),
    name: v.optional(v.string()),
    amount: v.optional(v.float64()),
    period: v.optional(v.string()),
    month: v.optional(v.float64()),
    year: v.optional(v.float64()),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_month_year", ["userId", "month", "year"]),

  budgetAllocations: defineTable({
    userId: v.string(),
    totalIncome: v.float64(),
    needsPercent: v.float64(),
    wantsPercent: v.float64(),
    savingsPercent: v.float64(),
    month: v.float64(),
    year: v.float64(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_month_year", ["userId", "month", "year"]),

  subscriptions: defineTable({
    stripeSubscriptionId: v.string(),
    userId: v.string(),
    customerId: v.string(),
    status: v.string(),
    planId: v.string(),
    priceId: v.optional(v.string()),
    currentPeriodStart: v.optional(v.float64()),
    currentPeriodEnd: v.optional(v.float64()),
    cancelAtPeriodEnd: v.optional(v.boolean()),
    canceledAt: v.optional(v.float64()),
    trialStart: v.optional(v.float64()),
    trialEnd: v.optional(v.float64()),
  })
    .index("by_userId", ["userId"])
    .index("by_stripeSubscriptionId", ["stripeSubscriptionId"])
    .index("by_customerId", ["customerId"]),
});
