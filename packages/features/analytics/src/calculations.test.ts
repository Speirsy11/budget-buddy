import { describe, it, expect } from "vitest";
import {
  calculate503020,
  calculateCategoryTotals,
  calculateSpendingTrends,
  formatCurrency,
  getPercentageChange,
} from "./calculations";

describe("Budget Calculations", () => {
  describe("calculate503020", () => {
    it("calculates correct budget allocations", () => {
      const income = 5000;
      const budget = calculate503020(income, []);

      expect(budget.needs.target).toBe(2500); // 50%
      expect(budget.wants.target).toBe(1500); // 30%
      expect(budget.savings.target).toBe(1000); // 20%
    });

    it("tracks spending against budgets using necessity score", () => {
      const income = 5000;
      const transactions = [
        { amount: -1000, necessityScore: 0.8, date: new Date() }, // Need (>0.7)
        { amount: -500, necessityScore: 0.5, date: new Date() }, // Want (0.3-0.7)
        { amount: -200, necessityScore: 0.2, date: new Date() }, // Savings (<0.3)
      ];

      const budget = calculate503020(income, transactions);

      expect(budget.needs.actual).toBe(1000);
      expect(budget.wants.actual).toBe(500);
      expect(budget.savings.actual).toBe(200);
    });

    it("calculates percentage of income spent", () => {
      const income = 5000;
      const transactions = [
        { amount: -500, necessityScore: 0.8, date: new Date() }, // 10% of income
      ];

      const budget = calculate503020(income, transactions);

      expect(budget.needs.percentage).toBe(10);
    });

    it("handles zero income", () => {
      const budget = calculate503020(0, []);

      expect(budget.needs.target).toBe(0);
      expect(budget.wants.target).toBe(0);
      expect(budget.savings.target).toBe(0);
    });

    it("ignores positive transactions (income)", () => {
      const income = 5000;
      const transactions = [
        { amount: 1000, necessityScore: 0.8, date: new Date() }, // Income, should be ignored
        { amount: -500, necessityScore: 0.8, date: new Date() }, // Expense
      ];

      const budget = calculate503020(income, transactions);

      expect(budget.needs.actual).toBe(500);
      expect(budget.totalExpenses).toBe(500);
    });

    it("supports custom ratios", () => {
      const income = 5000;
      const customRatios = { needs: 60, wants: 25, savings: 15 };
      const budget = calculate503020(income, [], customRatios);

      expect(budget.needs.target).toBe(3000); // 60%
      expect(budget.wants.target).toBe(1250); // 25%
      expect(budget.savings.target).toBe(750); // 15%
    });

    it("determines correct status based on actual vs target", () => {
      const income = 5000;

      // Under budget (< 90% of target)
      const underBudget = calculate503020(income, [
        { amount: -1000, necessityScore: 0.8, date: new Date() }, // 40% of needs target
      ]);
      expect(underBudget.needs.status).toBe("under");

      // Over budget (> 110% of target)
      const overBudget = calculate503020(income, [
        { amount: -3000, necessityScore: 0.8, date: new Date() }, // 120% of needs target
      ]);
      expect(overBudget.needs.status).toBe("over");
    });

    it("calculates savings rate", () => {
      const income = 5000;
      const transactions = [
        { amount: -2000, necessityScore: 0.8, date: new Date() },
      ];

      const budget = calculate503020(income, transactions);

      // Savings rate = (income - expenses) / income * 100
      // (5000 - 2000) / 5000 * 100 = 60%
      expect(budget.savingsRate).toBe(60);
    });
  });

  describe("calculateCategoryTotals", () => {
    it("groups transactions by category", () => {
      const transactions = [
        { aiClassified: "Food", amount: -50 },
        { aiClassified: "Food", amount: -30 },
        { aiClassified: "Transport", amount: -100 },
      ];

      const totals = calculateCategoryTotals(transactions);

      expect(totals).toContainEqual(
        expect.objectContaining({
          category: "Food",
          total: 80,
        })
      );
      expect(totals).toContainEqual(
        expect.objectContaining({
          category: "Transport",
          total: 100,
        })
      );
    });

    it("calculates percentage of total spending", () => {
      const transactions = [
        { aiClassified: "A", amount: -75 },
        { aiClassified: "B", amount: -25 },
      ];

      const totals = calculateCategoryTotals(transactions);

      const categoryA = totals.find((t) => t.category === "A");
      const categoryB = totals.find((t) => t.category === "B");

      expect(categoryA?.percentage).toBe(75);
      expect(categoryB?.percentage).toBe(25);
    });

    it("sorts by total descending", () => {
      const transactions = [
        { aiClassified: "Small", amount: -10 },
        { aiClassified: "Large", amount: -100 },
        { aiClassified: "Medium", amount: -50 },
      ];

      const totals = calculateCategoryTotals(transactions);

      expect(totals[0].category).toBe("Large");
      expect(totals[1].category).toBe("Medium");
      expect(totals[2].category).toBe("Small");
    });

    it("handles uncategorized transactions", () => {
      const transactions = [
        { aiClassified: null, amount: -50 },
        { aiClassified: undefined, amount: -30 },
      ];

      const totals = calculateCategoryTotals(transactions);

      expect(totals).toContainEqual(
        expect.objectContaining({
          category: "Uncategorized",
          total: 80,
        })
      );
    });

    it("returns empty array for empty input", () => {
      const totals = calculateCategoryTotals([]);
      expect(totals).toEqual([]);
    });

    it("ignores positive transactions (income)", () => {
      const transactions = [
        { aiClassified: "Income", amount: 1000 }, // Should be ignored
        { aiClassified: "Food", amount: -50 },
      ];

      const totals = calculateCategoryTotals(transactions);

      expect(totals).toHaveLength(1);
      expect(totals[0].category).toBe("Food");
    });
  });

  describe("calculateSpendingTrends", () => {
    it("groups transactions by day", () => {
      const transactions = [
        { date: new Date("2024-01-15"), amount: -50 },
        { date: new Date("2024-01-15"), amount: -30 },
        { date: new Date("2024-01-16"), amount: -100 },
      ];

      const trends = calculateSpendingTrends(transactions, "day");

      expect(trends).toHaveLength(2);
    });

    it("calculates daily spending correctly", () => {
      const transactions = [
        { date: new Date("2024-01-15"), amount: -50 },
        { date: new Date("2024-01-15"), amount: -30 },
      ];

      const trends = calculateSpendingTrends(transactions, "day");

      expect(trends[0].amount).toBe(80);
    });

    it("sorts by date ascending", () => {
      const transactions = [
        { date: new Date("2024-01-20"), amount: -30 },
        { date: new Date("2024-01-15"), amount: -50 },
        { date: new Date("2024-01-18"), amount: -40 },
      ];

      const trends = calculateSpendingTrends(transactions, "day");

      expect(trends[0].date).toBe("2024-01-15");
      expect(trends[1].date).toBe("2024-01-18");
      expect(trends[2].date).toBe("2024-01-20");
    });

    it("groups by week correctly", () => {
      const transactions = [
        { date: new Date("2024-01-15"), amount: -50 }, // Monday
        { date: new Date("2024-01-17"), amount: -30 }, // Wednesday (same week)
        { date: new Date("2024-01-22"), amount: -100 }, // Next week
      ];

      const trends = calculateSpendingTrends(transactions, "week");

      expect(trends).toHaveLength(2);
    });

    it("groups by month correctly", () => {
      const transactions = [
        { date: new Date("2024-01-15"), amount: -50 },
        { date: new Date("2024-01-25"), amount: -30 },
        { date: new Date("2024-02-10"), amount: -100 },
      ];

      const trends = calculateSpendingTrends(transactions, "month");

      expect(trends).toHaveLength(2);
      expect(trends[0].date).toBe("2024-01");
      expect(trends[1].date).toBe("2024-02");
    });

    it("ignores positive transactions", () => {
      const transactions = [
        { date: new Date("2024-01-15"), amount: 1000 }, // Income
        { date: new Date("2024-01-15"), amount: -50 },
      ];

      const trends = calculateSpendingTrends(transactions, "day");

      expect(trends[0].amount).toBe(50);
    });
  });

  describe("formatCurrency", () => {
    it("formats positive numbers", () => {
      expect(formatCurrency(1234.56)).toBe("$1,234.56");
    });

    it("formats negative numbers", () => {
      expect(formatCurrency(-1234.56)).toBe("-$1,234.56");
    });

    it("formats zero", () => {
      expect(formatCurrency(0)).toBe("$0.00");
    });

    it("rounds to two decimal places", () => {
      expect(formatCurrency(10.999)).toBe("$11.00");
    });

    it("formats large numbers with commas", () => {
      expect(formatCurrency(1000000)).toBe("$1,000,000.00");
    });
  });

  describe("getPercentageChange", () => {
    it("calculates increase correctly", () => {
      expect(getPercentageChange(100, 150)).toBe(50);
    });

    it("calculates decrease correctly", () => {
      expect(getPercentageChange(100, 75)).toBe(-25);
    });

    it("handles zero previous value", () => {
      expect(getPercentageChange(0, 100)).toBe(0);
    });

    it("handles no change", () => {
      expect(getPercentageChange(100, 100)).toBe(0);
    });

    it("handles negative values", () => {
      expect(getPercentageChange(-100, -50)).toBe(-50); // -50 is 50% less negative
    });
  });
});
