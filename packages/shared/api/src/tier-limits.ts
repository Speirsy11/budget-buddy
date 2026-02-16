import type { RateLimitConfig } from "./rate-limit";

export type UserPlan = "free" | "pro" | "pro-yearly";

export interface TierConfig {
  /** AI classification rate limit */
  ai: RateLimitConfig;
  /** CSV upload rate limit */
  upload: RateLimitConfig;
  /** Whether open banking is available */
  openBankingEnabled: boolean;
  /** Max bank connections allowed (0 = not available) */
  maxBankConnections: number;
  /** Max transactions per month (0 = unlimited) */
  maxTransactionsPerMonth: number;
}

/**
 * Rate limits and feature gates per subscription tier.
 *
 * Free tier: lower AI limits, CSV only, no open banking
 * Pro tiers: higher AI limits, open banking, unlimited transactions
 */
export const tierRateLimits: Record<UserPlan, TierConfig> = {
  free: {
    ai: {
      limit: 5,
      windowSeconds: 60,
      prefix: "api:ai:free",
    },
    upload: {
      limit: 3,
      windowSeconds: 60,
      prefix: "api:upload:free",
    },
    openBankingEnabled: false,
    maxBankConnections: 0,
    maxTransactionsPerMonth: 100,
  },
  pro: {
    ai: {
      limit: 50,
      windowSeconds: 60,
      prefix: "api:ai:pro",
    },
    upload: {
      limit: 15,
      windowSeconds: 60,
      prefix: "api:upload:pro",
    },
    openBankingEnabled: true,
    maxBankConnections: 5,
    maxTransactionsPerMonth: 0, // unlimited
  },
  "pro-yearly": {
    ai: {
      limit: 50,
      windowSeconds: 60,
      prefix: "api:ai:pro",
    },
    upload: {
      limit: 15,
      windowSeconds: 60,
      prefix: "api:upload:pro",
    },
    openBankingEnabled: true,
    maxBankConnections: 10,
    maxTransactionsPerMonth: 0, // unlimited
  },
};

/**
 * Get the tier config for a given plan, defaulting to free
 */
export function getTierConfig(plan?: UserPlan): TierConfig {
  return tierRateLimits[plan ?? "free"];
}
