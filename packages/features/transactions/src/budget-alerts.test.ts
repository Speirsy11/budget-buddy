import { describe, it, expect } from "vitest";
import { detectBudgetAlerts, type BudgetSpend } from "./budget-alerts";

function spend(overrides: Partial<BudgetSpend> = {}): BudgetSpend {
  return {
    categoryId: "cat-groceries",
    categoryName: "Groceries",
    budgetAmount: 400,
    spentBefore: 0,
    spentAfter: 0,
    ...overrides,
  };
}

describe("detectBudgetAlerts", () => {
  it("alerts when spending crosses 80 percent", () => {
    const alerts = detectBudgetAlerts([
      spend({ spentBefore: 200, spentAfter: 340 }),
    ]);

    expect(alerts).toHaveLength(1);
    expect(alerts[0].thresholdCrossed).toBe(80);
    expect(alerts[0].percentageUsed).toBeCloseTo(85, 0);
  });

  it("alerts when spending crosses 100 percent", () => {
    const alerts = detectBudgetAlerts([
      spend({ spentBefore: 340, spentAfter: 420 }),
    ]);

    expect(alerts).toHaveLength(1);
    expect(alerts[0].thresholdCrossed).toBe(100);
  });

  it("does not alert twice for a category already past the threshold", () => {
    // Already over 80% before, still under 100% after — nothing new crossed.
    const alerts = detectBudgetAlerts([
      spend({ spentBefore: 340, spentAfter: 360 }),
    ]);

    expect(alerts).toEqual([]);
  });

  it("does not alert when spending stays below every threshold", () => {
    const alerts = detectBudgetAlerts([
      spend({ spentBefore: 50, spentAfter: 120 }),
    ]);

    expect(alerts).toEqual([]);
  });

  it("reports only the highest threshold when several are crossed at once", () => {
    // Straight from 10% to 130%: "exceeded" is the useful message, not both.
    const alerts = detectBudgetAlerts([
      spend({ spentBefore: 40, spentAfter: 520 }),
    ]);

    expect(alerts).toHaveLength(1);
    expect(alerts[0].thresholdCrossed).toBe(100);
  });

  it("ignores categories with no budget set", () => {
    const alerts = detectBudgetAlerts([
      spend({ budgetAmount: 0, spentBefore: 0, spentAfter: 500 }),
    ]);

    expect(alerts).toEqual([]);
  });

  it("handles several categories independently", () => {
    const alerts = detectBudgetAlerts([
      spend({
        categoryId: "a",
        categoryName: "Groceries",
        spentBefore: 0,
        spentAfter: 350,
      }),
      spend({
        categoryId: "b",
        categoryName: "Dining",
        budgetAmount: 200,
        spentBefore: 190,
        spentAfter: 195,
      }),
      spend({
        categoryId: "c",
        categoryName: "Travel",
        budgetAmount: 100,
        spentBefore: 0,
        spentAfter: 150,
      }),
    ]);

    expect(alerts.map((a) => a.categoryName)).toEqual(["Groceries", "Travel"]);
  });

  it("does not alert when spending falls back below a threshold", () => {
    // A refund taking a category back under budget is not an alert.
    const alerts = detectBudgetAlerts([
      spend({ spentBefore: 420, spentAfter: 300 }),
    ]);

    expect(alerts).toEqual([]);
  });

  it("handles an empty input", () => {
    expect(detectBudgetAlerts([])).toEqual([]);
  });
});
