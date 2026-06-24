import { describe, it, expect, beforeEach } from "vitest";
import { createCallerFactory } from "@finance/api";
import { db, users, transactions } from "@finance/db";
import { analyticsRouter } from "./router";

const createCaller = createCallerFactory(analyticsRouter);

let userId: string;

function callerFor(id: string) {
  return createCaller({ userId: id, userPlan: "pro", clientIp: "127.0.0.1" });
}

async function seedUser(): Promise<string> {
  const id = `user_${crypto.randomUUID()}`;
  await db.insert(users).values({ id, email: `${id}@test.local` });
  return id;
}

async function addTxn(
  id: string,
  amount: number,
  date: Date,
  description: string,
  necessityScore?: number
) {
  await db.insert(transactions).values({
    userId: id,
    amount,
    date,
    description,
    necessityScore,
  });
}

beforeEach(async () => {
  userId = await seedUser();
});

describe("analyticsRouter (integration)", () => {
  it("reports no transactions for a fresh user", async () => {
    const range = await callerFor(userId).getDateRange();
    expect(range.hasTransactions).toBe(false);
  });

  it("derives the transaction date range once data exists", async () => {
    await addTxn(userId, -10, new Date("2026-01-15"), "A");
    await addTxn(userId, -20, new Date("2026-04-20"), "B");

    const range = await callerFor(userId).getDateRange();
    expect(range.hasTransactions).toBe(true);
    expect(range.suggestedMonth).toBe(4);
    expect(range.suggestedYear).toBe(2026);
  });

  it("computes a 50/30/20 breakdown from a month's income", async () => {
    await addTxn(userId, 4000, new Date("2026-03-05"), "SALARY");
    await addTxn(userId, -800, new Date("2026-03-10"), "RENT", 1); // need

    const result = await callerFor(userId).get503020({ month: 3, year: 2026 });

    expect(result.needs.target).toBe(2000); // 50% of 4000
    expect(result.wants.target).toBe(1200); // 30%
    expect(result.savings.target).toBe(800); // 20%
  });

  it("persists and then updates a custom allocation", async () => {
    const caller = callerFor(userId);

    const created = await caller.updateAllocation({
      month: 5,
      year: 2026,
      totalIncome: 3000,
      needsPercent: 60,
      wantsPercent: 25,
      savingsPercent: 15,
    });
    expect(created?.needsPercent).toBe(60);

    const updated = await caller.updateAllocation({
      month: 5,
      year: 2026,
      totalIncome: 3000,
      needsPercent: 50,
      wantsPercent: 30,
      savingsPercent: 20,
    });
    expect(updated?.needsPercent).toBe(50);
    expect(updated?.id).toBe(created?.id); // updated in place, not duplicated
  });

  it("rejects allocations that do not sum to 100%", async () => {
    await expect(
      callerFor(userId).updateAllocation({
        month: 6,
        year: 2026,
        totalIncome: 3000,
        needsPercent: 50,
        wantsPercent: 30,
        savingsPercent: 30,
      })
    ).rejects.toThrow(/sum to 100/);
  });
});
