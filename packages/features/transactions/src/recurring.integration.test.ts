import { describe, it, expect, beforeEach } from "vitest";
import { createCallerFactory } from "@finance/api";
import { db, users, transactions } from "@finance/db";
import { transactionsRouter } from "./router";

const createCaller = createCallerFactory(transactionsRouter);
const ctxFor = (id: string) => ({
  userId: id,
  userPlan: "pro" as const,
  clientIp: "127.0.0.1",
});

let userId: string;

beforeEach(async () => {
  userId = `user_${crypto.randomUUID()}`;
  await db.insert(users).values({ id: userId, email: `${userId}@test.local` });
});

/** Insert directly so we control dates precisely and skip categorisation. */
async function insert(
  rows: { amount: number; date: Date; description: string }[]
) {
  await db.insert(transactions).values(rows.map((row) => ({ ...row, userId })));
}

/** N monthly charges ending `monthsAgoEnd` months before now. */
function monthlyCharges(
  description: string,
  amount: number,
  count: number,
  monthsAgoEnd = 0
) {
  const now = new Date();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now);
    date.setMonth(date.getMonth() - monthsAgoEnd - (count - 1 - index));
    date.setDate(12);
    return { amount, date, description };
  });
}

describe("transactions.recurring (integration)", () => {
  it("finds a monthly subscription and excludes irregular spending", async () => {
    await insert([
      ...monthlyCharges("NETFLIX.COM", -10.99, 6),
      // Irregular grocery shops at varying intervals and amounts.
      { amount: -42.1, date: daysAgo(3), description: "TESCO EXPRESS" },
      { amount: -8.75, date: daysAgo(11), description: "TESCO EXPRESS" },
      { amount: -96.4, date: daysAgo(12), description: "TESCO EXPRESS" },
      { amount: -23.3, date: daysAgo(40), description: "TESCO EXPRESS" },
    ]);

    const result = await createCaller(ctxFor(userId)).recurring({});

    const names = result.series.map((s) => s.merchantName);
    expect(names).toContain("NETFLIX.COM");
    expect(names).not.toContain("TESCO EXPRESS");
  });

  it("reports a monthly total that reflects only active series", async () => {
    await insert([
      ...monthlyCharges("SPOTIFY", -11.99, 6),
      // Ended six months ago, so it should not count towards the total.
      ...monthlyCharges("OLD GYM", -40, 5, 7),
    ]);

    const result = await createCaller(ctxFor(userId)).recurring({});

    expect(result.summary.activeCount).toBe(1);
    expect(result.summary.totalMonthlyCost).toBeCloseTo(11.99, 1);
    expect(result.summary.inactiveCount).toBe(1);
  });

  it("scopes detection to the calling user", async () => {
    const otherUser = `user_${crypto.randomUUID()}`;
    await db
      .insert(users)
      .values({ id: otherUser, email: `${otherUser}@test.local` });
    await db.insert(transactions).values(
      monthlyCharges("THEIR SUBSCRIPTION", -99, 6).map((row) => ({
        ...row,
        userId: otherUser,
      }))
    );

    const result = await createCaller(ctxFor(userId)).recurring({});
    expect(result.series).toHaveLength(0);
  });

  it("returns an empty result for a user with no history", async () => {
    const result = await createCaller(ctxFor(userId)).recurring({});

    expect(result.series).toEqual([]);
    expect(result.summary).toMatchObject({
      activeCount: 0,
      totalMonthlyCost: 0,
    });
  });

  it("lists an upcoming charge with a predicted date", async () => {
    await insert(monthlyCharges("DISNEY PLUS", -7.99, 6));

    const result = await createCaller(ctxFor(userId)).recurring({
      lookaheadDays: 45,
    });

    expect(result.upcoming.length).toBeGreaterThan(0);
    const next = result.upcoming[0];
    expect(next.merchantName).toBe("DISNEY PLUS");
    expect(new Date(next.nextExpectedDate).getTime()).toBeGreaterThan(
      Date.now() - 86_400_000
    );
  });
});

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 86_400_000);
}
