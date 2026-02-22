"use node";

import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

/**
 * Create a Stripe checkout session.
 */
export const createCheckoutSession = action({
  args: {
    priceId: v.string(),
    successUrl: v.string(),
    cancelUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: args.priceId, quantity: 1 }],
      success_url: args.successUrl,
      cancel_url: args.cancelUrl,
      client_reference_id: identity.subject,
      subscription_data: { trial_period_days: 14 },
    });

    return { url: session.url };
  },
});

/**
 * Create a Stripe billing portal session.
 */
export const createBillingPortalSession = action({
  args: {
    customerId: v.string(),
    returnUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    const session = await stripe.billingPortal.sessions.create({
      customer: args.customerId,
      return_url: args.returnUrl,
    });

    return { url: session.url };
  },
});

/**
 * Handle Stripe webhook event.
 */
export const handleWebhook = internalAction({
  args: {
    body: v.string(),
    signature: v.string(),
  },
  handler: async (ctx, args) => {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    const event = stripe.webhooks.constructEvent(
      args.body,
      args.signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.subscription && session.client_reference_id) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          await ctx.runMutation(internal.subscriptions.upsert, {
            stripeSubscriptionId: subscription.id,
            userId: session.client_reference_id,
            customerId: subscription.customer as string,
            status: subscription.status,
            planId: "pro",
            priceId: subscription.items.data[0]?.price.id,
            currentPeriodStart: subscription.current_period_start * 1000,
            currentPeriodEnd: subscription.current_period_end * 1000,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          });
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        // Find the userId from the subscription metadata or existing record
        const existingByCustomer = await ctx.runMutation(
          internal.subscriptions.upsert,
          {
            stripeSubscriptionId: subscription.id,
            userId: (subscription.metadata?.userId as string) || "",
            customerId: subscription.customer as string,
            status: subscription.status,
            planId: subscription.metadata?.planId || "pro",
            priceId: subscription.items.data[0]?.price.id,
            currentPeriodStart: subscription.current_period_start * 1000,
            currentPeriodEnd: subscription.current_period_end * 1000,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            canceledAt: subscription.canceled_at
              ? subscription.canceled_at * 1000
              : undefined,
            trialStart: subscription.trial_start
              ? subscription.trial_start * 1000
              : undefined,
            trialEnd: subscription.trial_end
              ? subscription.trial_end * 1000
              : undefined,
          }
        );
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        await ctx.runMutation(internal.subscriptions.markCanceled, {
          stripeSubscriptionId: subscription.id,
        });
        break;
      }

      case "invoice.payment_failed": {
        // Could send an email notification here
        break;
      }
    }
  },
});
