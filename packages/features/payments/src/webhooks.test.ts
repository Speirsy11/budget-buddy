import { describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";
import { handleWebhookEvent, isRelevantEvent } from "./webhooks";

function event(type: Stripe.Event.Type, object: object): Stripe.Event {
  return {
    id: "evt_123",
    object: "event",
    api_version: "2024-12-18.acacia",
    created: 0,
    livemode: false,
    pending_webhooks: 0,
    request: null,
    type,
    data: { object },
  } as Stripe.Event;
}

describe("Stripe webhook dispatch", () => {
  it("dispatches subscription updates to the persistence handler", async () => {
    const onSubscriptionUpdated = vi.fn();
    const subscription = { id: "sub_123" } as Stripe.Subscription;

    await handleWebhookEvent(
      event("customer.subscription.updated", subscription),
      { onSubscriptionUpdated }
    );

    expect(onSubscriptionUpdated).toHaveBeenCalledWith(subscription);
  });

  it("dispatches completed checkout sessions", async () => {
    const onCheckoutCompleted = vi.fn();
    const session = { id: "cs_123" } as Stripe.Checkout.Session;

    await handleWebhookEvent(event("checkout.session.completed", session), {
      onCheckoutCompleted,
    });

    expect(onCheckoutCompleted).toHaveBeenCalledWith(session);
  });

  it("identifies only supported webhook event types", () => {
    expect(isRelevantEvent("customer.subscription.deleted")).toBe(true);
    expect(isRelevantEvent("payment_intent.created")).toBe(false);
  });
});
