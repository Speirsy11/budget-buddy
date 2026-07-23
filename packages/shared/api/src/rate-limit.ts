import { TRPCError } from "@trpc/server";
import { logger } from "@finance/logger";
import { getRedisClient } from "./redis";

const log = logger.child({ module: "rate-limit" });

export interface RateLimitConfig {
  limit: number;
  windowSeconds: number;
  /**
   * Prefix for the Redis key (helps organize different rate limits)
   */
  prefix?: string;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number; // Unix timestamp when the limit resets
}

// In-memory fallback for when Redis is not available
const memoryStore = new Map<string, { count: number; resetAt: number }>();

export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const { limit, windowSeconds, prefix = "ratelimit" } = config;
  const key = `${prefix}:${identifier}`;
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - (now % windowSeconds);
  const windowEnd = windowStart + windowSeconds;

  const redis = getRedisClient();

  if (redis) {
    return checkRateLimitRedis(redis, key, limit, windowSeconds, windowEnd);
  }

  return checkRateLimitMemory(key, limit, windowEnd);
}

async function checkRateLimitRedis(
  redis: Awaited<ReturnType<typeof getRedisClient>>,
  key: string,
  limit: number,
  windowSeconds: number,
  windowEnd: number
): Promise<RateLimitResult> {
  if (!redis) {
    return { success: true, remaining: limit, reset: windowEnd };
  }

  try {
    // Use a Lua script for atomic increment and expire
    const script = `
      local current = redis.call('INCR', KEYS[1])
      if current == 1 then
        redis.call('EXPIRE', KEYS[1], ARGV[1])
      end
      return current
    `;

    const count = (await redis.eval(
      script,
      1,
      key,
      windowSeconds.toString()
    )) as number;

    const remaining = Math.max(0, limit - count);
    const success = count <= limit;

    return { success, remaining, reset: windowEnd };
  } catch (error) {
    // If Redis fails, allow the request but log the error
    log.error(
      { err: error, key },
      "Redis rate limit check failed, allowing request"
    );
    return { success: true, remaining: limit, reset: windowEnd };
  }
}

function checkRateLimitMemory(
  key: string,
  limit: number,
  windowEnd: number
): RateLimitResult {
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (memoryStore.size > 10000) {
    for (const [k, v] of memoryStore.entries()) {
      if (v.resetAt * 1000 < now) {
        memoryStore.delete(k);
      }
    }
  }

  if (!entry || entry.resetAt * 1000 < now) {
    // New window
    memoryStore.set(key, { count: 1, resetAt: windowEnd });
    return { success: true, remaining: limit - 1, reset: windowEnd };
  }

  // Existing window
  entry.count++;
  const remaining = Math.max(0, limit - entry.count);
  const success = entry.count <= limit;

  return { success, remaining, reset: windowEnd };
}

export function createRateLimitError(result: RateLimitResult): TRPCError {
  return new TRPCError({
    code: "TOO_MANY_REQUESTS",
    message: `Rate limit exceeded. Try again at ${new Date(result.reset * 1000).toISOString()}`,
  });
}

export const rateLimits = {
  standard: {
    limit: 100,
    windowSeconds: 60,
    prefix: "api:standard",
  },
  // Strict limit for sensitive operations: 10 per minute
  strict: {
    limit: 10,
    windowSeconds: 60,
    prefix: "api:strict",
  },
  // AI operations (expensive): 20 per minute
  ai: {
    limit: 20,
    windowSeconds: 60,
    prefix: "api:ai",
  },
  upload: {
    limit: 5,
    windowSeconds: 60,
    prefix: "api:upload",
  },
  auth: {
    limit: 5,
    windowSeconds: 900,
    prefix: "api:auth",
  },
} as const;
