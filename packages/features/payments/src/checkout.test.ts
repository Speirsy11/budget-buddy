import { beforeEach, describe, expect, it, vi } from "vitest";
import { createBillingPortalSession, createCheckoutSession } from "./checkout";

const checkoutCreate = vi.fn();
const portalCreate = vi.fn();

vi.mock("./stripe-client", () => ({
  getStripeClient: () => ({
    checkout: { sessions: { create: checkoutCreate } },
    billingPortal: { sessions: { create: portalCreate } },
  }),
}));

vi.mock("./plans", () => ({
  getPlanById: (planId: string) =>
    planId === "pro" ? { id: "pro", priceId: "price_pro_monthly" } : undefined,
}));

describe("payment sessions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a subscription checkout session with user metadata", async () => {
    checkoutCreate.mockResolvedValue({
      id: "cs_test_123",
      url: "https://checkout.stripe.test/session",
    });

    const result = await createCheckoutSession({
      userId: "user_123",
      userEmail: "person@example.com",
      planId: "pro",
      successUrl: "https://app.example.com/settings",
      cancelUrl: "https://app.example.com/settings",
    });

    expect(checkoutCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer_email: "person@example.com",
        client_reference_id: "user_123",
        mode: "subscription",
        line_items: [{ price: "price_pro_monthly", quantity: 1 }],
        success_url:
          "https://app.example.com/settings?session_id={CHECKOUT_SESSION_ID}",
        cancel_url: "https://app.example.com/settings",
        metadata: { userId: "user_123", planId: "pro" },
        subscription_data: expect.objectContaining({
          trial_period_days: 14,
          metadata: { userId: "user_123", planId: "pro" },
        }),
      })
    );
    expect(result).toEqual({
      sessionId: "cs_test_123",
      url: "https://checkout.stripe.test/session",
    });
  });

  it("rejects plans without a configured Stripe price", async () => {
    await expect(
      createCheckoutSession({
        userId: "user_123",
        userEmail: "person@example.com",
        planId: "free",
        successUrl: "https://app.example.com/settings",
        cancelUrl: "https://app.example.com/settings",
      })
    ).rejects.toThrow("Invalid plan: free");
    expect(checkoutCreate).not.toHaveBeenCalled();
  });

  it("creates a customer billing portal session", async () => {
    portalCreate.mockResolvedValue({
      url: "https://billing.stripe.test/session",
    });

    await expect(
      createBillingPortalSession("cus_123", "https://app.example.com/settings")
    ).resolves.toEqual({ url: "https://billing.stripe.test/session" });

    expect(portalCreate).toHaveBeenCalledWith({
      customer: "cus_123",
      return_url: "https://app.example.com/settings",
    });
  });
});
