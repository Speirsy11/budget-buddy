import { describe, it, expect, beforeEach } from "vitest";
import { createCallerFactory } from "@finance/api";
import {
  db,
  users,
  transactions,
  categories,
  categorizationRules,
  eq,
  and,
} from "@finance/db";
import { rulesRouter } from "./rules-router";
import { transactionsRouter } from "./router";

const createRulesCaller = createCallerFactory(rulesRouter);
const createTransactionsCaller = createCallerFactory(transactionsRouter);

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

async function categoryNamed(id: string, name: string) {
  const found = await db.query.categories.findFirst({
    where: and(eq(categories.userId, id), eq(categories.name, name)),
  });
  if (!found) throw new Error(`Expected category "${name}" to exist`);
  return found;
}

beforeEach(async () => {
  userId = await seedUser();
});

describe("account provisioning", () => {
  it("gives a brand-new user default categories on first list", async () => {
    const before = await db.query.categories.findMany({
      where: eq(categories.userId, userId),
    });
    expect(before).toHaveLength(0);

    await createRulesCaller(ctxFor(userId)).list();

    const after = await db.query.categories.findMany({
      where: eq(categories.userId, userId),
    });
    expect(after.length).toBeGreaterThan(0);
    expect(after.map((c) => c.name)).toContain("Groceries");
  });

  it("seeds built-in rules pointing at real category rows", async () => {
    const rules = await createRulesCaller(ctxFor(userId)).list();

    const builtIn = rules.filter((rule) => rule.isBuiltIn);
    expect(builtIn.length).toBeGreaterThan(0);

    // Every built-in must resolve to a category the user actually owns,
    // otherwise imports would silently fail to categorise.
    for (const rule of builtIn) {
      expect(rule.category).toBeTruthy();
      expect(rule.category?.name).toBeTruthy();
    }
  });

  it("is idempotent across repeated calls", async () => {
    await createRulesCaller(ctxFor(userId)).list();
    const firstCount = (
      await db.query.categories.findMany({
        where: eq(categories.userId, userId),
      })
    ).length;

    await createRulesCaller(ctxFor(userId)).list();
    await createRulesCaller(ctxFor(userId)).list();

    const finalCount = (
      await db.query.categories.findMany({
        where: eq(categories.userId, userId),
      })
    ).length;
    expect(finalCount).toBe(firstCount);
  });
});

describe("rule CRUD", () => {
  it("creates a rule and rejects a category owned by someone else", async () => {
    const caller = createRulesCaller(ctxFor(userId));
    await caller.list();

    const groceries = await categoryNamed(userId, "Groceries");
    const created = await caller.create({
      name: "Corner shop",
      pattern: "corner shop",
      categoryId: groceries.id,
    });
    expect(created?.pattern).toBe("corner shop");
    expect(created?.isBuiltIn).toBe(false);

    const otherUser = await seedUser();
    await createRulesCaller(ctxFor(otherUser)).list();
    const otherGroceries = await categoryNamed(otherUser, "Groceries");

    await expect(
      caller.create({
        name: "Cross-tenant",
        pattern: "nope",
        categoryId: otherGroceries.id,
      })
    ).rejects.toThrow(/not found/i);
  });

  it("rejects an invalid regex with a 400 rather than storing it", async () => {
    const caller = createRulesCaller(ctxFor(userId));
    await caller.list();
    const groceries = await categoryNamed(userId, "Groceries");

    await expect(
      caller.create({
        name: "Bad regex",
        pattern: "([unclosed",
        matchType: "regex",
        categoryId: groceries.id,
      })
    ).rejects.toThrow(/not valid/i);
  });

  it("will not update or delete another user's rule", async () => {
    const caller = createRulesCaller(ctxFor(userId));
    await caller.list();
    const groceries = await categoryNamed(userId, "Groceries");
    const mine = await caller.create({
      name: "Mine",
      pattern: "mine only",
      categoryId: groceries.id,
    });
    if (!mine) throw new Error("expected create to return a rule");

    const otherUser = await seedUser();
    const otherCaller = createRulesCaller(ctxFor(otherUser));

    await expect(
      otherCaller.update({ id: mine.id, enabled: false })
    ).rejects.toThrow(/not found/i);
    await expect(otherCaller.delete({ id: mine.id })).rejects.toThrow(
      /not found/i
    );
  });
});

describe("rule preview", () => {
  it("counts how many existing transactions a pattern would claim", async () => {
    const transactionsCaller = createTransactionsCaller(ctxFor(userId));
    await transactionsCaller.create({
      amount: -20,
      date: new Date("2026-03-01"),
      description: "TESCO STORES 1234",
    });
    await transactionsCaller.create({
      amount: -55,
      date: new Date("2026-03-02"),
      description: "SHELL GARAGE",
    });

    const preview = await createRulesCaller(ctxFor(userId)).preview({
      pattern: "tesco",
      matchType: "contains",
      matchField: "any",
    });

    expect(preview.matchCount).toBe(1);
    expect(preview.samples[0]?.description).toBe("TESCO STORES 1234");
  });
});

describe("import categorisation", () => {
  it("categorises via built-in rules without calling the AI classifier", async () => {
    const caller = createTransactionsCaller(ctxFor(userId));

    const result = await caller.createMany({
      transactions: [
        {
          amount: -32.1,
          date: new Date("2026-03-01"),
          description: "TESCO STORES 3294 LONDON GB",
        },
        {
          amount: -10.99,
          date: new Date("2026-03-02"),
          description: "NETFLIX.COM",
        },
      ],
      autoClassify: false, // proves the rules path alone did the work
    });

    expect(result.count).toBe(2);

    const stored = await db.query.transactions.findMany({
      where: eq(transactions.userId, userId),
      with: { category: true },
    });

    const tesco = stored.find((t) => t.description.includes("TESCO"));
    const netflix = stored.find((t) => t.description.includes("NETFLIX"));

    expect(tesco?.category?.name).toBe("Groceries");
    expect(netflix?.category?.name).toBe("Entertainment");
  });

  it("writes categoryId, aiClassified and necessityScore together", async () => {
    // These three fields are read by different parts of the app (the
    // transactions table joins categoryId; analytics reads the other two), so
    // they must never disagree.
    const caller = createTransactionsCaller(ctxFor(userId));
    await caller.createMany({
      transactions: [
        {
          amount: -32.1,
          date: new Date("2026-03-01"),
          description: "TESCO STORES",
        },
      ],
      autoClassify: false,
    });

    const [stored] = await db.query.transactions.findMany({
      where: eq(transactions.userId, userId),
    });

    expect(stored.categoryId).toBeTruthy();
    expect(stored.aiClassified).toBe("Groceries");
    expect(stored.necessityScore).toBe(1); // Groceries is a "need"
  });

  it("increments the usage counter on rules that fired", async () => {
    const caller = createTransactionsCaller(ctxFor(userId));
    await caller.createMany({
      transactions: [
        {
          amount: -32.1,
          date: new Date("2026-03-01"),
          description: "TESCO STORES",
        },
      ],
      autoClassify: false,
    });

    const tescoRule = await db.query.categorizationRules.findFirst({
      where: and(
        eq(categorizationRules.userId, userId),
        eq(categorizationRules.pattern, "tesco")
      ),
    });

    expect(tescoRule?.timesApplied).toBe(1);
    expect(tescoRule?.lastAppliedAt).toBeTruthy();
  });

  it("leaves genuinely unknown merchants uncategorised when AI is off", async () => {
    const caller = createTransactionsCaller(ctxFor(userId));
    await caller.createMany({
      transactions: [
        {
          amount: -12,
          date: new Date("2026-03-01"),
          description: "ZZQQ OBSCURE VENDOR 99",
        },
      ],
      autoClassify: false,
    });

    const [stored] = await db.query.transactions.findMany({
      where: eq(transactions.userId, userId),
    });

    expect(stored.categoryId).toBeNull();
  });
});

describe("applyToExisting", () => {
  it("categorises previously uncategorised transactions", async () => {
    const transactionsCaller = createTransactionsCaller(ctxFor(userId));

    // `create` (singular) does not categorise, so this lands uncategorised.
    await transactionsCaller.create({
      amount: -18.5,
      date: new Date("2026-03-01"),
      description: "TESCO STORES 8080",
    });

    const before = await db.query.transactions.findMany({
      where: eq(transactions.userId, userId),
    });
    expect(before[0].categoryId).toBeNull();

    const result = await createRulesCaller(ctxFor(userId)).applyToExisting({
      onlyUncategorized: true,
    });
    expect(result.updatedCount).toBe(1);

    const after = await db.query.transactions.findMany({
      where: eq(transactions.userId, userId),
      with: { category: true },
    });
    expect(after[0].category?.name).toBe("Groceries");
  });

  it("does not overwrite a category the user set by hand", async () => {
    const transactionsCaller = createTransactionsCaller(ctxFor(userId));
    await createRulesCaller(ctxFor(userId)).list();

    // File a Tesco transaction under Travel deliberately.
    const travel = await categoryNamed(userId, "Travel");
    const created = await transactionsCaller.create({
      amount: -18.5,
      date: new Date("2026-03-01"),
      description: "TESCO STORES 8080",
      categoryId: travel.id,
    });
    if (!created) throw new Error("expected create to return a transaction");

    await createRulesCaller(ctxFor(userId)).applyToExisting({
      onlyUncategorized: true,
    });

    const after = await db.query.transactions.findFirst({
      where: eq(transactions.id, created.id),
      with: { category: true },
    });
    expect(after?.category?.name).toBe("Travel");
  });
});

describe("bulk operations", () => {
  async function seedThree() {
    const caller = createTransactionsCaller(ctxFor(userId));
    const created = await Promise.all([
      caller.create({
        amount: -10,
        date: new Date("2026-03-01"),
        description: "ONE",
      }),
      caller.create({
        amount: -20,
        date: new Date("2026-03-02"),
        description: "TWO",
      }),
      caller.create({
        amount: -30,
        date: new Date("2026-03-03"),
        description: "THREE",
      }),
    ]);
    return created.map((t) => {
      if (!t) throw new Error("expected a transaction");
      return t.id;
    });
  }

  it("recategorises many transactions at once", async () => {
    const ids = await seedThree();
    await createRulesCaller(ctxFor(userId)).list();
    const travel = await categoryNamed(userId, "Travel");

    const result = await createTransactionsCaller(
      ctxFor(userId)
    ).bulkUpdateCategory({ ids, categoryId: travel.id });

    expect(result.updatedCount).toBe(3);

    const stored = await db.query.transactions.findMany({
      where: eq(transactions.userId, userId),
    });
    for (const row of stored) {
      expect(row.categoryId).toBe(travel.id);
      // All three category fields must move together.
      expect(row.aiClassified).toBe("Travel");
      expect(row.necessityScore).toBe(0);
    }
  });

  it("clears the category when passed null", async () => {
    const ids = await seedThree();
    await createRulesCaller(ctxFor(userId)).list();
    const travel = await categoryNamed(userId, "Travel");
    const caller = createTransactionsCaller(ctxFor(userId));

    await caller.bulkUpdateCategory({ ids, categoryId: travel.id });
    await caller.bulkUpdateCategory({ ids, categoryId: null });

    const stored = await db.query.transactions.findMany({
      where: eq(transactions.userId, userId),
    });
    expect(stored.every((row) => row.categoryId === null)).toBe(true);
    expect(stored.every((row) => row.aiClassified === null)).toBe(true);
  });

  it("cannot touch another user's transactions", async () => {
    const otherUser = await seedUser();
    const theirs = await createTransactionsCaller(ctxFor(otherUser)).create({
      amount: -99,
      date: new Date("2026-03-01"),
      description: "THEIRS",
    });
    if (!theirs) throw new Error("expected a transaction");

    await createRulesCaller(ctxFor(userId)).list();
    const travel = await categoryNamed(userId, "Travel");

    const result = await createTransactionsCaller(
      ctxFor(userId)
    ).bulkUpdateCategory({ ids: [theirs.id], categoryId: travel.id });

    // Scoped by userId as well as id, so nothing is updated.
    expect(result.updatedCount).toBe(0);

    const untouched = await db.query.transactions.findFirst({
      where: eq(transactions.id, theirs.id),
    });
    expect(untouched?.categoryId).toBeNull();
  });

  it("rejects a category owned by someone else", async () => {
    const ids = await seedThree();
    const otherUser = await seedUser();
    await createRulesCaller(ctxFor(otherUser)).list();
    const theirCategory = await categoryNamed(otherUser, "Travel");

    await expect(
      createTransactionsCaller(ctxFor(userId)).bulkUpdateCategory({
        ids,
        categoryId: theirCategory.id,
      })
    ).rejects.toThrow(/not found/i);
  });

  it("bulk deletes only the caller's transactions", async () => {
    const ids = await seedThree();
    const otherUser = await seedUser();
    const theirs = await createTransactionsCaller(ctxFor(otherUser)).create({
      amount: -99,
      date: new Date("2026-03-01"),
      description: "THEIRS",
    });
    if (!theirs) throw new Error("expected a transaction");

    const result = await createTransactionsCaller(ctxFor(userId)).bulkDelete({
      ids: [...ids, theirs.id],
    });

    expect(result.deletedCount).toBe(3);
    const survivor = await db.query.transactions.findFirst({
      where: eq(transactions.id, theirs.id),
    });
    expect(survivor).toBeTruthy();
  });
});

describe("transaction filters", () => {
  beforeEach(async () => {
    const caller = createTransactionsCaller(ctxFor(userId));
    await caller.create({
      amount: -45,
      date: new Date("2026-03-01"),
      description: "TESCO STORES",
      merchant: "Tesco",
    });
    await caller.create({
      amount: 2500,
      date: new Date("2026-03-02"),
      description: "ACME SALARY",
    });
  });

  it("searches case-insensitively", async () => {
    // Postgres LIKE is case-sensitive; a lowercase query must still match
    // an uppercase bank description.
    const result = await createTransactionsCaller(ctxFor(userId)).list({
      filters: { search: "tesco" },
    });

    expect(result.total).toBe(1);
    expect(result.data[0].description).toBe("TESCO STORES");
  });

  it("searches the merchant field as well as the description", async () => {
    const result = await createTransactionsCaller(ctxFor(userId)).list({
      filters: { search: "Tesco" },
    });
    expect(result.total).toBe(1);
  });

  it("filters to money out", async () => {
    const result = await createTransactionsCaller(ctxFor(userId)).list({
      filters: { direction: "expense" },
    });

    expect(result.total).toBe(1);
    expect(result.data[0].amount).toBeLessThan(0);
  });

  it("filters to money in", async () => {
    const result = await createTransactionsCaller(ctxFor(userId)).list({
      filters: { direction: "income" },
    });

    expect(result.total).toBe(1);
    expect(result.data[0].amount).toBeGreaterThan(0);
  });

  it("filters to uncategorised only", async () => {
    await createRulesCaller(ctxFor(userId)).list();
    const travel = await categoryNamed(userId, "Travel");
    const all = await createTransactionsCaller(ctxFor(userId)).list({});

    await createTransactionsCaller(ctxFor(userId)).bulkUpdateCategory({
      ids: [all.data[0].id],
      categoryId: travel.id,
    });

    const result = await createTransactionsCaller(ctxFor(userId)).list({
      filters: { uncategorizedOnly: true },
    });

    expect(result.total).toBe(1);
    expect(result.data[0].categoryId).toBeNull();
  });
});
