import { describe, it, expect, beforeEach } from "vitest";
import { createCallerFactory } from "@finance/api";
import { db, users, accounts, accountBalanceSnapshots, eq } from "@finance/db";
import { accountsRouter } from "./accounts-router";

const createCaller = createCallerFactory(accountsRouter);
const ctxFor = (id: string) => ({
  userId: id,
  userPlan: "pro" as const,
  clientIp: "127.0.0.1",
});

let userId: string;

async function seedUser(): Promise<string> {
  const id = `user_${crypto.randomUUID()}`;
  await db.insert(users).values({ id, email: `${id}@test.local` });
  return id;
}

beforeEach(async () => {
  userId = await seedUser();
});

describe("accountsRouter (integration)", () => {
  it("creates an account and records an opening snapshot", async () => {
    const caller = createCaller(ctxFor(userId));

    const created = await caller.create({
      name: "Monzo",
      type: "checking",
      currentBalance: 2500,
    });

    expect(created.name).toBe("Monzo");

    // The opening snapshot is what makes a brand-new account plot a point.
    const snapshots = await db.query.accountBalanceSnapshots.findMany({
      where: eq(accountBalanceSnapshots.accountId, created.id),
    });
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0].balance).toBe(2500);
  });

  it("computes net worth as assets minus liabilities", async () => {
    const caller = createCaller(ctxFor(userId));

    await caller.create({
      name: "Current",
      type: "checking",
      currentBalance: 3000,
    });
    await caller.create({
      name: "ISA",
      type: "savings",
      currentBalance: 12000,
    });
    await caller.create({
      name: "Amex",
      type: "credit_card",
      currentBalance: 1400,
    });

    const result = await caller.netWorth({});

    expect(result.totalAssets).toBe(15000);
    expect(result.totalLiabilities).toBe(1400);
    expect(result.netWorth).toBe(13600);
  });

  it("appends a snapshot and moves the current balance", async () => {
    const caller = createCaller(ctxFor(userId));
    const created = await caller.create({
      name: "Savings",
      type: "savings",
      currentBalance: 1000,
    });

    await caller.updateBalance({ id: created.id, balance: 1750 });

    const snapshots = await db.query.accountBalanceSnapshots.findMany({
      where: eq(accountBalanceSnapshots.accountId, created.id),
    });
    expect(snapshots).toHaveLength(2);

    const account = await db.query.accounts.findFirst({
      where: eq(accounts.id, created.id),
    });
    expect(account?.currentBalance).toBe(1750);
  });

  it("records a backdated balance without changing today's balance", async () => {
    const caller = createCaller(ctxFor(userId));
    const created = await caller.create({
      name: "Savings",
      type: "savings",
      currentBalance: 5000,
    });

    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    await caller.updateBalance({
      id: created.id,
      balance: 4000,
      recordedAt: lastMonth,
    });

    const account = await db.query.accounts.findFirst({
      where: eq(accounts.id, created.id),
    });
    // Filling in history must not rewrite what the account holds now.
    expect(account?.currentBalance).toBe(5000);
  });

  it("excludes opted-out and closed accounts from net worth", async () => {
    const caller = createCaller(ctxFor(userId));

    await caller.create({
      name: "Main",
      type: "checking",
      currentBalance: 1000,
    });
    const excluded = await caller.create({
      name: "Ignore me",
      type: "savings",
      currentBalance: 9999,
      includeInNetWorth: false,
    });
    const closed = await caller.create({
      name: "Old",
      type: "savings",
      currentBalance: 5000,
    });
    await caller.update({ id: closed.id, isActive: false });

    const result = await caller.netWorth({});

    expect(result.netWorth).toBe(1000);
    expect(result.excludedCount).toBe(2);
    expect(excluded.includeInNetWorth).toBe(false);
  });

  it("builds a history that carries balances forward month to month", async () => {
    const caller = createCaller(ctxFor(userId));
    const created = await caller.create({
      name: "Savings",
      type: "savings",
      currentBalance: 1000,
    });

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    await caller.updateBalance({
      id: created.id,
      balance: 500,
      recordedAt: threeMonthsAgo,
    });

    const result = await caller.netWorth({ months: 6 });

    // History starts at the first recorded balance, not at the start of the
    // requested window — months with nothing recorded are omitted rather than
    // drawn as zero.
    expect(result.history.length).toBeGreaterThan(0);
    expect(result.history.length).toBeLessThanOrEqual(6);
    expect(result.history.every((point) => point.date >= threeMonthsAgo)).toBe(
      true
    );
    // Latest point reflects the current balance, not the backdated one.
    expect(result.history.at(-1)?.netWorth).toBe(1000);
  });

  it("does not expose another user's accounts", async () => {
    const otherUser = await seedUser();
    await createCaller(ctxFor(otherUser)).create({
      name: "Theirs",
      type: "checking",
      currentBalance: 9999,
    });

    const caller = createCaller(ctxFor(userId));
    expect(await caller.list()).toHaveLength(0);
    expect((await caller.netWorth({})).netWorth).toBe(0);
  });

  it("refuses to update or delete another user's account", async () => {
    const otherUser = await seedUser();
    const theirs = await createCaller(ctxFor(otherUser)).create({
      name: "Theirs",
      type: "checking",
      currentBalance: 100,
    });

    const caller = createCaller(ctxFor(userId));

    await expect(
      caller.update({ id: theirs.id, name: "Hacked" })
    ).rejects.toThrow(/not found/i);
    await expect(
      caller.updateBalance({ id: theirs.id, balance: 0 })
    ).rejects.toThrow(/not found/i);
    await expect(caller.delete({ id: theirs.id })).rejects.toThrow(
      /not found/i
    );
  });

  it("returns zero net worth for a user with no accounts", async () => {
    const result = await createCaller(ctxFor(userId)).netWorth({});
    expect(result).toMatchObject({
      netWorth: 0,
      totalAssets: 0,
      totalLiabilities: 0,
    });
  });
});
