import { describe, it, expect, beforeEach } from "vitest";
import { createCallerFactory } from "@finance/api";
import { db, users, goals, eq } from "@finance/db";
import { goalsRouter } from "./goals-router";
import { accountsRouter } from "./accounts-router";

const createGoalsCaller = createCallerFactory(goalsRouter);
const createAccountsCaller = createCallerFactory(accountsRouter);
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

describe("goalsRouter (integration)", () => {
  it("creates a goal and reports progress", async () => {
    const caller = createGoalsCaller(ctxFor(userId));

    await caller.create({
      name: "Emergency fund",
      targetAmount: 6000,
      currentAmount: 1500,
    });

    const result = await caller.list({});
    expect(result.goals).toHaveLength(1);
    expect(result.goals[0].progress.percentComplete).toBeCloseTo(25, 1);
    expect(result.summary.totalTarget).toBe(6000);
  });

  it("records a contribution and marks the goal achieved at target", async () => {
    const caller = createGoalsCaller(ctxFor(userId));
    const created = await caller.create({
      name: "Holiday",
      targetAmount: 1000,
      currentAmount: 900,
    });
    if (!created) throw new Error("expected a goal");

    await caller.contribute({ id: created.id, amount: 100 });

    const stored = await db.query.goals.findFirst({
      where: eq(goals.id, created.id),
    });
    expect(stored?.currentAmount).toBe(1000);
    expect(stored?.status).toBe("achieved");
  });

  it("never lets a contribution push the balance below zero", async () => {
    const caller = createGoalsCaller(ctxFor(userId));
    const created = await caller.create({
      name: "Car",
      targetAmount: 5000,
      currentAmount: 100,
    });
    if (!created) throw new Error("expected a goal");

    await caller.contribute({ id: created.id, amount: -500 });

    const stored = await db.query.goals.findFirst({
      where: eq(goals.id, created.id),
    });
    expect(stored?.currentAmount).toBe(0);
  });

  it("tracks a linked account's balance instead of a stored amount", async () => {
    const accountsCaller = createAccountsCaller(ctxFor(userId));
    const account = await accountsCaller.create({
      name: "Savings pot",
      type: "savings",
      currentBalance: 2500,
    });

    const goalsCaller = createGoalsCaller(ctxFor(userId));
    await goalsCaller.create({
      name: "Deposit",
      targetAmount: 10000,
      linkedAccountId: account.id,
    });

    const before = await goalsCaller.list({});
    expect(before.goals[0].progress.currentAmount).toBe(2500);

    // Moving the account balance must move the goal, with nothing to sync.
    await accountsCaller.updateBalance({ id: account.id, balance: 4000 });

    const after = await goalsCaller.list({});
    expect(after.goals[0].progress.currentAmount).toBe(4000);
  });

  it("rejects a manual contribution to an account-linked goal", async () => {
    const accountsCaller = createAccountsCaller(ctxFor(userId));
    const account = await accountsCaller.create({
      name: "Savings pot",
      type: "savings",
      currentBalance: 100,
    });

    const goalsCaller = createGoalsCaller(ctxFor(userId));
    const created = await goalsCaller.create({
      name: "Linked",
      targetAmount: 1000,
      linkedAccountId: account.id,
    });
    if (!created) throw new Error("expected a goal");

    await expect(
      goalsCaller.contribute({ id: created.id, amount: 50 })
    ).rejects.toThrow(/linked account/i);
  });

  it("refuses to link an account belonging to someone else", async () => {
    const otherUser = await seedUser();
    const theirAccount = await createAccountsCaller(ctxFor(otherUser)).create({
      name: "Theirs",
      type: "savings",
      currentBalance: 500,
    });

    await expect(
      createGoalsCaller(ctxFor(userId)).create({
        name: "Sneaky",
        targetAmount: 1000,
        linkedAccountId: theirAccount.id,
      })
    ).rejects.toThrow(/not found/i);
  });

  it("does not expose another user's goals", async () => {
    const otherUser = await seedUser();
    await createGoalsCaller(ctxFor(otherUser)).create({
      name: "Theirs",
      targetAmount: 1000,
    });

    const result = await createGoalsCaller(ctxFor(userId)).list({});
    expect(result.goals).toHaveLength(0);
  });

  it("hides archived goals unless asked for them", async () => {
    const caller = createGoalsCaller(ctxFor(userId));
    const created = await caller.create({ name: "Old", targetAmount: 100 });
    if (!created) throw new Error("expected a goal");

    await caller.update({ id: created.id, status: "archived" });

    expect((await caller.list({})).goals).toHaveLength(0);
    expect((await caller.list({ includeArchived: true })).goals).toHaveLength(
      1
    );
  });

  it("computes the monthly contribution needed for a dated goal", async () => {
    const caller = createGoalsCaller(ctxFor(userId));
    const sixMonthsOut = new Date();
    sixMonthsOut.setMonth(sixMonthsOut.getMonth() + 6);

    await caller.create({
      name: "Deposit",
      targetAmount: 6000,
      currentAmount: 0,
      targetDate: sixMonthsOut,
    });

    const result = await caller.list({});
    const required = result.goals[0].progress.requiredMonthlyContribution;

    expect(required).not.toBeNull();
    expect(required).toBeGreaterThan(900);
    expect(required).toBeLessThan(1100);
  });

  it("keeps accumulated progress when a goal is unlinked from its account", async () => {
    const accountsCaller = createAccountsCaller(ctxFor(userId));
    const account = await accountsCaller.create({
      name: "Savings pot",
      type: "savings",
      currentBalance: 3200,
    });

    const goalsCaller = createGoalsCaller(ctxFor(userId));
    const created = await goalsCaller.create({
      name: "Deposit",
      targetAmount: 10000,
      linkedAccountId: account.id,
    });
    if (!created) throw new Error("expected a goal");

    // A linked goal stores currentAmount: 0 and reads progress from the
    // account, so unlinking must carry the balance across or the user watches
    // their progress reset to zero.
    await goalsCaller.update({ id: created.id, linkedAccountId: null });

    const after = await goalsCaller.list({});
    expect(after.goals[0].progress.currentAmount).toBe(3200);
    expect(after.goals[0].linkedAccountId).toBeNull();
  });

  it("respects an explicit currentAmount when unlinking", async () => {
    const accountsCaller = createAccountsCaller(ctxFor(userId));
    const account = await accountsCaller.create({
      name: "Savings pot",
      type: "savings",
      currentBalance: 3200,
    });

    const goalsCaller = createGoalsCaller(ctxFor(userId));
    const created = await goalsCaller.create({
      name: "Deposit",
      targetAmount: 10000,
      linkedAccountId: account.id,
    });
    if (!created) throw new Error("expected a goal");

    await goalsCaller.update({
      id: created.id,
      linkedAccountId: null,
      currentAmount: 500,
    });

    const after = await goalsCaller.list({});
    expect(after.goals[0].progress.currentAmount).toBe(500);
  });
});
