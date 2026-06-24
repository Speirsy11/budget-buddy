import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Force the in-memory fallback path by ensuring no Redis client is available.
vi.mock("./redis", () => ({
  getRedisClient: () => null,
}));

import { checkRateLimit, createRateLimitError } from "./rate-limit";
import { getTierConfig, tierRateLimits } from "./tier-limits";

let counter = 0;
function uniqueId() {
  return `test-user-${counter++}-${Math.random().toString(36).slice(2)}`;
}

const config = { limit: 3, windowSeconds: 60, prefix: "test" };

describe("checkRateLimit (in-memory fallback)", () => {
  beforeEach(() => {
    counter += 1000; // keep identifiers unique across tests
  });

  it("allows requests up to the limit then blocks", async () => {
    const id = uniqueId();

    const r1 = await checkRateLimit(id, config);
    const r2 = await checkRateLimit(id, config);
    const r3 = await checkRateLimit(id, config);
    const r4 = await checkRateLimit(id, config);

    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);
    expect(r3.success).toBe(true);
    expect(r4.success).toBe(false); // 4th exceeds limit of 3
  });

  it("decrements remaining on each request", async () => {
    const id = uniqueId();

    const r1 = await checkRateLimit(id, config);
    const r2 = await checkRateLimit(id, config);

    expect(r1.remaining).toBe(2);
    expect(r2.remaining).toBe(1);
  });

  it("never reports negative remaining once over the limit", async () => {
    const id = uniqueId();
    for (let i = 0; i < config.limit; i++) await checkRateLimit(id, config);

    const over = await checkRateLimit(id, config);
    expect(over.success).toBe(false);
    expect(over.remaining).toBe(0);
  });

  it("tracks identifiers independently", async () => {
    const a = uniqueId();
    const b = uniqueId();

    for (let i = 0; i < config.limit; i++) await checkRateLimit(a, config);
    const aOver = await checkRateLimit(a, config);
    const bFirst = await checkRateLimit(b, config);

    expect(aOver.success).toBe(false);
    expect(bFirst.success).toBe(true);
  });

  describe("window reset", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it("resets the counter after the window elapses", async () => {
      vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
      const id = uniqueId();

      for (let i = 0; i < config.limit; i++) await checkRateLimit(id, config);
      expect((await checkRateLimit(id, config)).success).toBe(false);

      // Advance past the window so the stored entry expires.
      vi.advanceTimersByTime((config.windowSeconds + 1) * 1000);

      const afterReset = await checkRateLimit(id, config);
      expect(afterReset.success).toBe(true);
      expect(afterReset.remaining).toBe(config.limit - 1);
    });
  });
});

describe("createRateLimitError", () => {
  it("returns a TOO_MANY_REQUESTS tRPC error", () => {
    const err = createRateLimitError({
      success: false,
      remaining: 0,
      reset: 0,
    });
    expect(err.code).toBe("TOO_MANY_REQUESTS");
  });
});

describe("getTierConfig", () => {
  it("returns the free tier for undefined plan", () => {
    expect(getTierConfig(undefined)).toEqual(tierRateLimits.free);
  });

  it("free tier has open banking disabled with a stricter AI limit than pro", () => {
    const free = getTierConfig("free");
    const pro = getTierConfig("pro");

    expect(free.openBankingEnabled).toBe(false);
    expect(pro.openBankingEnabled).toBe(true);
    expect(free.ai.limit).toBeLessThan(pro.ai.limit);
  });

  it("treats pro-yearly the same as pro for feature gating", () => {
    const proYearly = getTierConfig("pro-yearly");
    expect(proYearly.openBankingEnabled).toBe(true);
    expect(proYearly.maxTransactionsPerMonth).toBe(0); // unlimited
  });
});
