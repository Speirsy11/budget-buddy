import {
  constructWebhookEvent,
  handleWebhookEvent,
  markSubscriptionDeleted,
  persistSubscription,
} from "@finance/payments";
import { logger } from "@finance/logger";

const log = logger.child({ module: "stripe-webhook" });

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    log.warn("Stripe webhook signature or secret is missing");
    return Response.json(
      { error: "Webhook signature validation is unavailable" },
      { status: 400 }
    );
  }

  const payload = await request.text();

  try {
    const event = constructWebhookEvent(payload, signature, webhookSecret);

    await handleWebhookEvent(event, {
      onSubscriptionCreated: persistSubscription,
      onSubscriptionUpdated: persistSubscription,
      onSubscriptionDeleted: markSubscriptionDeleted,
    });

    return Response.json({ received: true });
  } catch (error) {
    log.error({ err: error }, "Stripe webhook processing failed");
    return Response.json({ error: "Invalid webhook event" }, { status: 400 });
  }
}
