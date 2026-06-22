import { describe, it, expect, beforeEach } from "vitest";
import { createCallerFactory } from "@finance/api";
import { db, users, transactions, eq } from "@finance/db";
import { transactionsRouter } from "./router";

const createCaller = createCallerFactory(transactionsRouter);

let userId: string;

function callerFor(id: string) {
  return createCaller({ userId: id, userPlan: "pro", clientIp: "127.0.0.1" });
}

async function seedUser(): Promise<string> {
  const id = `user_${crypto.randomUUID()}`;
  await db.insert(users).values({ id, email: `${id}@test.local` });
  return id;
}

beforeEach(async () => {
  userId = await seedUser();
});

describe("transactionsRouter (integration)", () => {
  it("creates a transaction and lists it back scoped to the user", async () => {
    const caller = callerFor(userId);

    const created = await caller.create({
      amount: -42.5,
      date: new Date("2026-03-01"),
      description: "TESCO STORES",
    });
    expect(created?.id).toBeTruthy();

    const list = await caller.list({});
    expect(list.total).toBe(1);
    expect(list.data[0].description).toBe("TESCO STORES");
  });

  it("does not leak another user's transactions", async () => {
    const otherUser = await seedUser();
    await callerFor(otherUser).create({
      amount: -10,
      date: new Date("2026-03-02"),
      description: "OTHER USER COFFEE",
    });

    const list = await callerFor(userId).list({});
    expect(list.total).toBe(0);
  });

  it("getById returns null for a transaction owned by someone else", async () => {
    const otherUser = await seedUser();
    const theirTxn = await callerFor(otherUser).create({
      amount: -10,
      date: new Date("2026-03-02"),
      description: "PRIVATE",
    });
    if (!theirTxn) throw new Error("expected create to return a transaction");

    const result = await callerFor(userId).getById({ id: theirTxn.id });
    expect(result).toBeUndefined();
  });

  it("bulk-imports and auto-classifies via the mock classifier", async () => {
    const caller = callerFor(userId);

    const result = await caller.createMany({
      autoClassify: true,
      transactions: [
        { amount: -50, date: new Date("2026-03-01"), description: "TESCO" },
        {
          amount: -60,
          date: new Date("2026-03-02"),
          description: "SHELL PETROL",
        },
        {
          amount: 2500,
          date: new Date("2026-03-03"),
          description: "ACME SALARY",
        },
        { amount: -15, date: new Date("2026-03-04"), description: "SPOTIFY" },
      ],
    });

    expect(result.count).toBe(4);
    const tesco = result.transactions.find((t) => t.description === "TESCO");
    expect(tesco?.aiClassified).toBe("Food & Groceries");
    // Needs map to a necessity score of 1.
    expect(tesco?.necessityScore).toBe(1);
  });

  it("updates and deletes a transaction", async () => {
    const caller = callerFor(userId);
    const created = await caller.create({
      amount: -20,
      date: new Date("2026-03-01"),
      description: "ORIGINAL",
    });
    if (!created) throw new Error("expected create to return a transaction");

    const updated = await caller.update({
      id: created.id,
      description: "RENAMED",
    });
    expect(updated?.description).toBe("RENAMED");

    await caller.delete({ id: created.id });
    const remaining = await db.query.transactions.findMany({
      where: eq(transactions.userId, userId),
    });
    expect(remaining).toHaveLength(0);
  });

  it("summarises income, expenses and net cash flow over a period", async () => {
    const caller = callerFor(userId);
    await caller.create({
      amount: 3000,
      date: new Date("2026-03-10"),
      description: "SALARY",
    });
    await caller.create({
      amount: -1200,
      date: new Date("2026-03-12"),
      description: "RENT",
    });

    const summary = await caller.getSummary({
      startDate: new Date("2026-03-01"),
      endDate: new Date("2026-03-31"),
    });

    expect(summary.totalIncome).toBe(3000);
    expect(summary.totalExpenses).toBe(1200);
    expect(summary.netCashFlow).toBe(1800);
    expect(summary.transactionCount).toBe(2);
  });
});
