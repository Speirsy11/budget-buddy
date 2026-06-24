import type Stripe from "stripe";
import { db, eq, subscriptions } from "@finance/db";
import { logger } from "@finance/logger";

const log = logger.child({ module: "payments-persistence" });

function customerId(subscription: Stripe.Subscription): string {
  return typeof subscription.customer === "string"
    ? subscription.customer
    : subscription.customer.id;
}

function unixDate(value: number | null | undefined): Date | null {
  return value ? new Date(value * 1000) : null;
}

export async function persistSubscription(
  subscription: Stripe.Subscription
): Promise<void> {
  const userId = subscription.metadata.userId;
  if (!userId) {
    log.error(
      { subscriptionId: subscription.id },
      "Subscription is missing userId metadata"
    );
    throw new Error("Subscription is missing userId metadata");
  }

  const firstItem = subscription.items.data[0];
  const periodStart = subscription.current_period_start;
  const periodEnd = subscription.current_period_end;

  await db
    .insert(subscriptions)
    .values({
      id: subscription.id,
      userId,
      customerId: customerId(subscription),
      status: subscription.status,
      planId: subscription.metadata.planId || "pro",
      priceId: firstItem?.price.id,
      currentPeriodStart: new Date(periodStart * 1000),
      currentPeriodEnd: new Date(periodEnd * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: unixDate(subscription.canceled_at),
      trialStart: unixDate(subscription.trial_start),
      trialEnd: unixDate(subscription.trial_end),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: subscriptions.id,
      set: {
        customerId: customerId(subscription),
        status: subscription.status,
        planId: subscription.metadata.planId || "pro",
        priceId: firstItem?.price.id,
        currentPeriodStart: new Date(periodStart * 1000),
        currentPeriodEnd: new Date(periodEnd * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt: unixDate(subscription.canceled_at),
        trialStart: unixDate(subscription.trial_start),
        trialEnd: unixDate(subscription.trial_end),
        updatedAt: new Date(),
      },
    });

  log.info(
    { userId, subscriptionId: subscription.id, status: subscription.status },
    "Subscription persisted"
  );
}

export async function markSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  await db
    .update(subscriptions)
    .set({
      status: "canceled",
      canceledAt: unixDate(subscription.canceled_at) ?? new Date(),
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, subscription.id));

  log.info({ subscriptionId: subscription.id }, "Subscription marked canceled");
}
