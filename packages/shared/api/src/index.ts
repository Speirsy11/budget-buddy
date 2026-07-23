import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { z } from "zod";
import {
  checkRateLimit,
  createRateLimitError,
  rateLimits,
  type RateLimitConfig,
} from "./rate-limit";
import { getTierConfig, type TierConfig, type UserPlan } from "./tier-limits";

export interface Context {
  userId: string | null;
  /**
   * Client IP address for rate limiting anonymous requests
   */
  clientIp?: string;
  /**
   * User's current subscription plan for tier-based rate limiting
   */
  userPlan?: UserPlan;
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof z.ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;
export const createCallerFactory = t.createCallerFactory;

const enforceUserIsAuthed = middleware(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
    },
  });
});

function createRateLimitMiddleware(config: RateLimitConfig) {
  return middleware(async ({ ctx, next }) => {
    const identifier = ctx.userId || ctx.clientIp || "anonymous";
    const result = await checkRateLimit(identifier, config);

    if (!result.success) {
      throw createRateLimitError(result);
    }

    return next();
  });
}

/**
 * Uses the user's subscription plan from context to select the appropriate rate limit.
 */
function createTieredRateLimitMiddleware(
  configSelector: (tier: TierConfig) => RateLimitConfig
) {
  return middleware(async ({ ctx, next }) => {
    const tier = getTierConfig(ctx.userPlan as UserPlan | undefined);
    const config = configSelector(tier);
    const identifier = ctx.userId || ctx.clientIp || "anonymous";
    const result = await checkRateLimit(identifier, config);

    if (!result.success) {
      throw createRateLimitError(result);
    }

    return next();
  });
}

/**
 * Used to gate premium features like open banking.
 */
const enforceProPlan = middleware(async ({ ctx, next }) => {
  const tier = getTierConfig(ctx.userPlan as UserPlan | undefined);
  if (!tier.openBankingEnabled) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        "Open banking requires a Pro subscription. Upgrade to connect your bank accounts.",
    });
  }
  return next();
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

export const rateLimitedProcedure = t.procedure.use(
  createRateLimitMiddleware(rateLimits.standard)
);

export const rateLimitedProtectedProcedure = t.procedure
  .use(enforceUserIsAuthed)
  .use(createRateLimitMiddleware(rateLimits.standard));

// Strict rate-limited procedures (for sensitive operations)
export const strictRateLimitedProcedure = t.procedure.use(
  createRateLimitMiddleware(rateLimits.strict)
);

export const strictRateLimitedProtectedProcedure = t.procedure
  .use(enforceUserIsAuthed)
  .use(createRateLimitMiddleware(rateLimits.strict));

export const aiRateLimitedProcedure = t.procedure
  .use(enforceUserIsAuthed)
  .use(createRateLimitMiddleware(rateLimits.ai));

export const uploadRateLimitedProcedure = t.procedure
  .use(enforceUserIsAuthed)
  .use(createRateLimitMiddleware(rateLimits.upload));

// Tier-aware AI rate-limited procedure (free=5/min, pro=50/min)
export const tieredAiRateLimitedProcedure = t.procedure
  .use(enforceUserIsAuthed)
  .use(createTieredRateLimitMiddleware((tier) => tier.ai));

// Tier-aware upload rate-limited procedure (free=3/min, pro=15/min)
export const tieredUploadRateLimitedProcedure = t.procedure
  .use(enforceUserIsAuthed)
  .use(createTieredRateLimitMiddleware((tier) => tier.upload));

export const proProcedure = t.procedure
  .use(enforceUserIsAuthed)
  .use(enforceProPlan);

export type { Context as TRPCContext };
export { TRPCError };
export { z };

export { checkRateLimit, createRateLimitError, rateLimits };
export type { RateLimitConfig } from "./rate-limit";

export {
  getTierConfig,
  tierRateLimits,
  type TierConfig,
  type UserPlan,
} from "./tier-limits";
