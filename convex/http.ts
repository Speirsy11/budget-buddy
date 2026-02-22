import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

/**
 * Stripe webhook endpoint.
 * Configure in Stripe Dashboard to point to:
 * https://<your-deployment>.convex.site/stripe-webhook
 */
http.route({
  path: "/stripe-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return new Response("Missing stripe-signature header", { status: 400 });
    }

    try {
      await ctx.runAction(internal.stripe.handleWebhook, {
        body,
        signature,
      });
      return new Response("OK", { status: 200 });
    } catch (error) {
      return new Response("Webhook processing failed", { status: 500 });
    }
  }),
});

/**
 * Clerk webhook endpoint.
 * Configure in Clerk Dashboard to point to:
 * https://<your-deployment>.convex.site/clerk-webhook
 */
http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const payload = await request.json();
    const { type, data } = payload as {
      type: string;
      data: {
        id: string;
        email_addresses?: Array<{ email_address: string }>;
        first_name?: string;
        last_name?: string;
        image_url?: string;
      };
    };

    if (type === "user.created" || type === "user.updated") {
      await ctx.runMutation(internal.users.upsertFromClerk, {
        clerkId: data.id,
        email: data.email_addresses?.[0]?.email_address ?? "",
        firstName: data.first_name ?? undefined,
        lastName: data.last_name ?? undefined,
        imageUrl: data.image_url ?? undefined,
      });
    }

    return new Response("OK", { status: 200 });
  }),
});

export default http;
