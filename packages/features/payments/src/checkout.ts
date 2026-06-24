import { getStripeClient } from "./stripe-client";
import { getPlanById } from "./plans";

export interface CreateCheckoutSessionParams {
  userId: string;
  userEmail: string;
  planId: string;
  successUrl: string;
  cancelUrl: string;
}

export async function createCheckoutSession({
  userId,
  userEmail,
  planId,
  successUrl,
  cancelUrl,
}: CreateCheckoutSessionParams): Promise<{ sessionId: string; url: string }> {
  const stripe = getStripeClient();
  const plan = getPlanById(planId);

  if (!plan || !plan.priceId) {
    throw new Error(`Invalid plan: ${planId}`);
  }

  const session = await stripe.checkout.sessions.create({
    customer_email: userEmail,
    client_reference_id: userId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: plan.priceId,
        quantity: 1,
      },
    ],
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    subscription_data: {
      trial_period_days: 14,
      metadata: {
        userId,
        planId,
      },
    },
    metadata: {
      userId,
      planId,
    },
  });

  if (!session.url) {
    throw new Error("Stripe returned a checkout session without a URL");
  }

  return {
    sessionId: session.id,
    url: session.url,
  };
}

export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
) {
  const stripe = getStripeClient();

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return {
    url: session.url,
  };
}
