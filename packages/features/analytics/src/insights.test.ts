import { describe, it, expect } from "vitest";
import {
  compareCategories,
  detectUnusualTransactions,
  projectMonthEnd,
  topMerchant,
  buildInsights,
  type InsightTransaction,
} from "./insights";

let counter = 0;
function txn(overrides: Partial<InsightTransaction> = {}): InsightTransaction {
  counter += 1;
  return {
    id: `t-${counter}`,
    amount: -50,
    date: new Date("2026-07-10"),
    description: "SOMETHING",
    ...overrides,
  };
}

function repeat(count: number, build: (index: number) => InsightTransaction) {
  return Array.from({ length: count }, (_, index) => build(index));
}

describe("compareCategories", () => {
  const dining = (amount: number) =>
    txn({ amount, categoryId: "cat-dining", categoryName: "Dining Out" });

  it("flags a category that jumped month over month", () => {
    const insights = compareCategories([dining(-300)], [dining(-100)]);

    expect(insights).toHaveLength(1);
    expect(insights[0].kind).toBe("category_spike");
    expect(insights[0].severity).toBe("warning");
    expect(insights[0].title).toContain("200%");
  });

  it("celebrates a category that fell", () => {
    const insights = compareCategories([dining(-50)], [dining(-200)]);

    expect(insights[0].kind).toBe("category_drop");
    expect(insights[0].severity).toBe("positive");
  });

  it("ignores a small percentage move", () => {
    expect(compareCategories([dining(-105)], [dining(-100)])).toEqual([]);
  });

  it("ignores a large percentage move on trivial amounts", () => {
    // Tripled, but only £10 — not worth telling anyone.
    expect(compareCategories([dining(-15)], [dining(-5)])).toEqual([]);
  });

  it("skips a category with no previous month rather than reporting infinity", () => {
    const insights = compareCategories([dining(-300)], []);
    expect(insights).toEqual([]);
  });

  it("ignores income", () => {
    const salary = (amount: number) =>
      txn({ amount, categoryId: "cat-income", categoryName: "Income" });
    expect(compareCategories([salary(3000)], [salary(1000)])).toEqual([]);
  });

  it("handles empty inputs", () => {
    expect(compareCategories([], [])).toEqual([]);
  });
});

describe("detectUnusualTransactions", () => {
  it("flags a charge far above the usual for that merchant", () => {
    const history = [
      ...repeat(4, (index) =>
        txn({
          amount: -12,
          merchant: "Corner Cafe",
          date: new Date(2026, 5, index + 1),
        })
      ),
      txn({
        amount: -95,
        merchant: "Corner Cafe",
        date: new Date(2026, 6, 20),
      }),
    ];

    const insights = detectUnusualTransactions(history);
    expect(insights).toHaveLength(1);
    expect(insights[0].kind).toBe("unusual_transaction");
    expect(insights[0].title).toContain("Corner Cafe");
  });

  it("does not flag a charge in line with the usual", () => {
    const history = repeat(5, (index) =>
      txn({
        amount: -12,
        merchant: "Corner Cafe",
        date: new Date(2026, 5, index + 1),
      })
    );

    expect(detectUnusualTransactions(history)).toEqual([]);
  });

  it("needs enough history to know what usual means", () => {
    const history = [
      txn({ amount: -10, merchant: "New Shop", date: new Date(2026, 5, 1) }),
      txn({ amount: -200, merchant: "New Shop", date: new Date(2026, 6, 1) }),
    ];

    expect(detectUnusualTransactions(history)).toEqual([]);
  });

  it("uses the median so one outlier cannot hide itself", () => {
    // A mean would be dragged up by the £500; the median stays at £10.
    const history = [
      ...repeat(4, (index) =>
        txn({
          amount: -10,
          merchant: "Shop",
          date: new Date(2026, 5, index + 1),
        })
      ),
      txn({ amount: -500, merchant: "Shop", date: new Date(2026, 6, 25) }),
    ];

    expect(detectUnusualTransactions(history)).toHaveLength(1);
  });

  it("ignores income", () => {
    const history = repeat(5, (index) =>
      txn({
        amount: index === 4 ? 5000 : 100,
        merchant: "Employer",
        date: new Date(2026, 5, index + 1),
      })
    );

    expect(detectUnusualTransactions(history)).toEqual([]);
  });
});

describe("projectMonthEnd", () => {
  it("extrapolates the month from the pace so far", () => {
    // £310 across 10 days of a 31-day month projects to about £961.
    const current = repeat(10, () => txn({ amount: -31 }));
    const insight = projectMonthEnd(current, new Date(2026, 6, 10));

    expect(insight).not.toBeNull();
    expect(insight?.detail).toContain("10 days");
  });

  it("stays quiet in the first days of a month", () => {
    const current = [txn({ amount: -50 })];
    expect(projectMonthEnd(current, new Date(2026, 6, 2))).toBeNull();
  });

  it("warns when the projection exceeds a budget", () => {
    const current = repeat(10, () => txn({ amount: -100 }));
    const insight = projectMonthEnd(current, new Date(2026, 6, 10), 1500);

    expect(insight?.severity).toBe("warning");
    expect(insight?.title).toContain("overspend");
  });

  it("stays quiet when the projection is within budget", () => {
    const current = repeat(10, () => txn({ amount: -10 }));
    expect(projectMonthEnd(current, new Date(2026, 6, 10), 1500)).toBeNull();
  });

  it("returns null when nothing has been spent", () => {
    expect(projectMonthEnd([], new Date(2026, 6, 15))).toBeNull();
  });
});

describe("topMerchant", () => {
  it("identifies the biggest merchant and its share", () => {
    const insight = topMerchant([
      txn({ amount: -300, merchant: "Rent Co" }),
      txn({ amount: -100, merchant: "Tesco" }),
    ]);

    expect(insight?.title).toContain("Rent Co");
    expect(insight?.detail).toContain("75%");
  });

  it("returns null with no spending", () => {
    expect(topMerchant([])).toBeNull();
  });

  it("ignores income when ranking", () => {
    const insight = topMerchant([
      txn({ amount: 5000, merchant: "Employer" }),
      txn({ amount: -100, merchant: "Tesco" }),
    ]);

    expect(insight?.title).toContain("Tesco");
  });
});

describe("buildInsights", () => {
  it("ranks by magnitude so the biggest money leads", () => {
    const current = [
      txn({
        amount: -400,
        categoryId: "cat-dining",
        categoryName: "Dining Out",
      }),
      txn({ amount: -30, categoryId: "cat-travel", categoryName: "Travel" }),
    ];
    const previous = [
      txn({
        amount: -100,
        categoryId: "cat-dining",
        categoryName: "Dining Out",
      }),
      txn({ amount: -100, categoryId: "cat-travel", categoryName: "Travel" }),
    ];

    const insights = buildInsights(current, previous, current, {
      referenceDate: new Date(2026, 6, 15),
    });

    const magnitudes = insights.map((i) => i.magnitude);
    expect(magnitudes).toEqual([...magnitudes].sort((a, b) => b - a));
  });

  it("respects the limit", () => {
    const current = repeat(10, (index) =>
      txn({
        amount: -100 * (index + 1),
        categoryId: `cat-${index}`,
        categoryName: `Category ${index}`,
      })
    );
    const previous = repeat(10, (index) =>
      txn({
        amount: -10,
        categoryId: `cat-${index}`,
        categoryName: `Category ${index}`,
      })
    );

    const insights = buildInsights(current, previous, current, {
      referenceDate: new Date(2026, 6, 15),
      limit: 3,
    });

    expect(insights).toHaveLength(3);
  });

  it("returns an empty list for a user with no data", () => {
    expect(
      buildInsights([], [], [], { referenceDate: new Date(2026, 6, 15) })
    ).toEqual([]);
  });
});
