import {
  auth,
  clerkClient,
  currentUser,
  syncUser,
  verifyToken,
} from "@finance/auth/server";
import type { TRPCContext, UserPlan } from "@finance/api";
import { appRouter } from "./routers";
import { createCallerFactory } from "@finance/api";
import { db, subscriptions, eq, and } from "@finance/db";
import { logger } from "@finance/logger";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";

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

function getBearerToken(req?: Request): string | null {
  const authorization = req?.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim() || null;
}

async function getBearerUserId(req?: Request): Promise<string | null> {
  const token = getBearerToken(req);

  if (!token) {
    return null;
  }

  if (!process.env.CLERK_SECRET_KEY && !process.env.CLERK_JWT_KEY) {
    log.warn("Cannot verify mobile bearer token: Clerk server key is missing");
    return null;
  }

  const result = (await verifyToken(token, {
    secretKey: process.env.CLERK_SECRET_KEY,
    jwtKey: process.env.CLERK_JWT_KEY,
  })) as { data?: { sub?: string }; errors?: unknown[] };

  if (result.errors?.length) {
    log.warn({ err: result.errors[0] }, "Failed to verify Clerk bearer token");
    return null;
  }

  return result.data?.sub ?? null;
}

async function syncClerkUserById(userId: string) {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    await syncUser({
      id: user.id,
      emailAddresses: user.emailAddresses,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
    });
  } catch (error) {
    log.warn({ userId, err: error }, "Failed to sync Clerk user");
  }
}

export async function createContext(
  opts?: FetchCreateContextFnOptions
): Promise<TRPCContext> {
  const bearerUserId = await getBearerUserId(opts?.req);
  const session = bearerUserId ? null : await auth();
  const userId = bearerUserId ?? session?.userId ?? null;
  let userPlan: UserPlan | undefined;

  if (userId) {
    if (bearerUserId) {
      await syncClerkUserById(bearerUserId);
    } else {
      const user = await currentUser();
      if (user) {
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
    }

    userPlan = await getUserPlan(userId);
  }

  return {
    userId,
    userPlan,
  };
}

export const createCaller = createCallerFactory(appRouter);
