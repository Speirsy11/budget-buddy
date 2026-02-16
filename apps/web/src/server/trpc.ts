import { auth, currentUser, syncUser } from "@finance/auth/server";
import type { TRPCContext, UserPlan } from "@finance/api";
import { appRouter } from "./routers";
import { createCallerFactory } from "@finance/api";
import { db, subscriptions, eq, and } from "@finance/db";
import { logger } from "@finance/logger";

const log = logger.child({ module: "trpc-context" });

async function getUserPlan(userId: string): Promise<UserPlan> {
  try {
    const subscription = await db.query.subscriptions.findFirst({
      where: and(eq(subscriptions.userId, userId)),
      orderBy: (sub, { desc }) => [desc(sub.createdAt)],
    });

    if (!subscription) {
      return "free";
    }

    const isActive =
      subscription.status === "active" || subscription.status === "trialing";
    if (!isActive) {
      return "free";
    }

    return (subscription.planId as UserPlan) ?? "free";
  } catch (error) {
    log.warn(
      { userId, err: error },
      "Failed to lookup user plan, defaulting to free"
    );
    return "free";
  }
}

export async function createContext(): Promise<TRPCContext> {
  const session = await auth();
  let userPlan: UserPlan | undefined;

  // Sync user to database if authenticated
  if (session?.userId) {
    const user = await currentUser();
    if (user) {
      // Sync user to ensure they exist in our database
      await syncUser({
        id: user.id,
        emailAddresses: user.emailAddresses,
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
      }).catch(() => {
        // Ignore sync errors - user will be synced on next request
      });
    }

    userPlan = await getUserPlan(session.userId);
  }

  return {
    userId: session?.userId ?? null,
    userPlan,
  };
}

export const createCaller = createCallerFactory(appRouter);
