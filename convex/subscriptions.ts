import { query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get the current user's subscription.
 */
export const get = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .first();
  },
});

/**
 * Upsert a subscription from Stripe webhook.
 */
export const upsert = internalMutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripeSubscriptionId", (q) =>
        q.eq("stripeSubscriptionId", args.stripeSubscriptionId)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        planId: args.planId,
        priceId: args.priceId,
        currentPeriodStart: args.currentPeriodStart,
        currentPeriodEnd: args.currentPeriodEnd,
        cancelAtPeriodEnd: args.cancelAtPeriodEnd,
        canceledAt: args.canceledAt,
        trialStart: args.trialStart,
        trialEnd: args.trialEnd,
      });
      return existing._id;
    }

    return await ctx.db.insert("subscriptions", args);
  },
});

/**
 * Mark a subscription as canceled from Stripe webhook.
 */
export const markCanceled = internalMutation({
  args: {
    stripeSubscriptionId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripeSubscriptionId", (q) =>
        q.eq("stripeSubscriptionId", args.stripeSubscriptionId)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: "canceled",
        canceledAt: Date.now(),
      });
    }
  },
});
