import { protectedProcedure, router, TRPCError, z } from "@finance/api";
import { and, db, desc, eq, subscriptions, users } from "@finance/db";
import { logger } from "@finance/logger";
import { createBillingPortalSession, createCheckoutSession } from "./checkout";

const log = logger.child({ module: "payments-router" });

const paidPlanSchema = z.enum(["pro", "pro-yearly"]);

function settingsUrl(): string {
  const appUrl =
    process.env.APP_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";
  return new URL("/dashboard/settings", appUrl).toString();
}

export const paymentsRouter = router({
  status: protectedProcedure.query(async ({ ctx }) => {
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, ctx.userId),
      orderBy: [desc(subscriptions.createdAt)],
    });

    if (!subscription) {
      return {
        planId: "free" as const,
        status: "inactive" as const,
        cancelAtPeriodEnd: false,
        currentPeriodEnd: null,
        canManageBilling: false,
      };
    }

    return {
      planId: subscription.planId,
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd ?? false,
      currentPeriodEnd: subscription.currentPeriodEnd,
      canManageBilling: Boolean(subscription.customerId),
    };
  }),

  createCheckout: protectedProcedure
    .input(z.object({ planId: paidPlanSchema }))
    .mutation(async ({ ctx, input }) => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, ctx.userId),
      });

      if (!user?.email) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "A verified email address is required to start checkout.",
        });
      }

      const activeSubscription = await db.query.subscriptions.findFirst({
        where: and(
          eq(subscriptions.userId, ctx.userId),
          eq(subscriptions.status, "active")
        ),
      });

      if (activeSubscription) {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "You already have an active subscription. Manage it instead.",
        });
      }

      try {
        const session = await createCheckoutSession({
          userId: ctx.userId,
          userEmail: user.email,
          planId: input.planId,
          successUrl: settingsUrl(),
          cancelUrl: settingsUrl(),
        });

        log.info(
          { userId: ctx.userId, planId: input.planId },
          "Checkout session created"
        );
        return session;
      } catch (error) {
        log.error(
          { userId: ctx.userId, planId: input.planId, err: error },
          "Failed to create checkout session"
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unable to start checkout. Please try again.",
          cause: error,
        });
      }
    }),

  createPortal: protectedProcedure.input(z.void()).mutation(async ({ ctx }) => {
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, ctx.userId),
      orderBy: [desc(subscriptions.createdAt)],
    });

    if (!subscription?.customerId) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No billing account was found for this user.",
      });
    }

    try {
      const session = await createBillingPortalSession(
        subscription.customerId,
        settingsUrl()
      );

      log.info({ userId: ctx.userId }, "Billing portal session created");
      return session;
    } catch (error) {
      log.error(
        { userId: ctx.userId, err: error },
        "Failed to create billing portal session"
      );
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Unable to open billing management. Please try again.",
        cause: error,
      });
    }
  }),
});
