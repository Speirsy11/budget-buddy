export interface BudgetBreakdown {
  needs: {
    target: number;
    actual: number;
    percentage: number;
    status: "under" | "on-track" | "over";
  };
  wants: {
    target: number;
    actual: number;
    percentage: number;
    status: "under" | "on-track" | "over";
  };
  savings: {
    target: number;
    actual: number;
    percentage: number;
    status: "under" | "on-track" | "over";
  };
  totalIncome: number;
  totalExpenses: number;
  savingsRate: number;
}

export interface SpendingTrend {
  date: string;
  amount: number;
  category?: string;
}

export interface TransactionForAnalysis {
  amount: number;
  necessityScore?: number | null;
  aiClassified?: string | null;
  date: Date;
}

/**
 * Calculate 50/30/20 budget breakdown
 * 50% Needs - Essential expenses (housing, utilities, groceries, healthcare)
 * 30% Wants - Discretionary spending (entertainment, dining out, shopping)
 * 20% Savings - Savings and debt repayment
 */
export function calculate503020(
  income: number,
  transactions: TransactionForAnalysis[],
  customRatios?: { needs: number; wants: number; savings: number }
): BudgetBreakdown {
  const ratios = customRatios ?? { needs: 50, wants: 30, savings: 20 };

  const needsTarget = income * (ratios.needs / 100);
  const wantsTarget = income * (ratios.wants / 100);
  const savingsTarget = income * (ratios.savings / 100);

  // Calculate actual spending by category
  let needsActual = 0;
  let wantsActual = 0;
  let savingsActual = 0;

  for (const t of transactions) {
    if (t.amount >= 0) continue; // Skip income
    const amount = Math.abs(t.amount);

    if (t.necessityScore !== null && t.necessityScore !== undefined) {
      // Use necessity score if available
      if (t.necessityScore >= 0.7) {
        needsActual += amount;
      } else if (t.necessityScore <= 0.3) {
        savingsActual += amount;
      } else {
        wantsActual += amount;
      }
    } else if (t.aiClassified) {
      // Fallback to category-based classification
      const needCategories = [
        "Housing",
        "Healthcare",
        "Food & Groceries",
        "Transportation",
        "Bills & Subscriptions",
      ];
      const savingsCategories = ["Savings & Investments"];

      if (needCategories.includes(t.aiClassified)) {
        needsActual += amount;
      } else if (savingsCategories.includes(t.aiClassified)) {
        savingsActual += amount;
      } else {
        wantsActual += amount;
      }
    } else {
      // Default to wants if no classification
      wantsActual += amount;
    }
  }

  const totalExpenses = needsActual + wantsActual + savingsActual;
  const savingsRate =
    income > 0 ? ((income - totalExpenses) / income) * 100 : 0;

  const getStatus = (
    actual: number,
    target: number
  ): "under" | "on-track" | "over" => {
    const ratio = actual / target;
    if (ratio < 0.9) return "under";
    if (ratio > 1.1) return "over";
    return "on-track";
  };

  return {
    needs: {
      target: needsTarget,
      actual: needsActual,
      percentage: income > 0 ? (needsActual / income) * 100 : 0,
      status: getStatus(needsActual, needsTarget),
    },
    wants: {
      target: wantsTarget,
      actual: wantsActual,
      percentage: income > 0 ? (wantsActual / income) * 100 : 0,
      status: getStatus(wantsActual, wantsTarget),
    },
    savings: {
      target: savingsTarget,
      actual: savingsActual,
      percentage: income > 0 ? (savingsActual / income) * 100 : 0,
      status: getStatus(savingsActual, savingsTarget),
    },
    totalIncome: income,
    totalExpenses,
    savingsRate,
  };
}

export interface BudgetProgressItem {
  name: string;
  budgeted: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: "under" | "warning" | "over";
}

export function calculateBudgetProgress(
  budgets: { name: string; amount: number; categoryId?: string | null }[],
  transactions: { amount: number; categoryId?: string | null }[]
): BudgetProgressItem[] {
  return budgets.map((budget) => {
    const spent = transactions
      .filter((t) => t.amount < 0 && t.categoryId === budget.categoryId)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const remaining = Math.max(0, budget.amount - spent);
    const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

    let status: "under" | "warning" | "over";
    if (percentage >= 100) {
      status = "over";
    } else if (percentage >= 80) {
      status = "warning";
    } else {
      status = "under";
    }

    return {
      name: budget.name,
      budgeted: budget.amount,
      spent,
      remaining,
      percentage,
      status,
    };
  });
}

export function calculateSpendingTrends(
  transactions: { amount: number; date: Date; aiClassified?: string | null }[],
  groupBy: "day" | "week" | "month" = "day"
): SpendingTrend[] {
  const groups = new Map<string, number>();

  for (const t of transactions) {
    if (t.amount >= 0) continue; // Skip income

    const date = new Date(t.date);
    let key: string;

    switch (groupBy) {
      case "day":
        key = date.toISOString().split("T")[0];
        break;
      case "week": {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split("T")[0];
        break;
      }
      case "month":
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        break;
    }

    groups.set(key, (groups.get(key) || 0) + Math.abs(t.amount));
  }

  return Array.from(groups.entries())
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function calculateCategoryTotals(
  transactions: { amount: number; aiClassified?: string | null }[]
): { category: string; total: number; percentage: number }[] {
  const totals = new Map<string, number>();
  let grandTotal = 0;

  for (const t of transactions) {
    if (t.amount >= 0) continue;
    const amount = Math.abs(t.amount);
    const category = t.aiClassified || "Uncategorized";
    totals.set(category, (totals.get(category) || 0) + amount);
    grandTotal += amount;
  }

  return Array.from(totals.entries())
    .map(([category, total]) => ({
      category,
      total,
      percentage: grandTotal > 0 ? (total / grandTotal) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

/**
 * Format a number as currency (USD)
 */
export function formatCurrency(amount: number): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const formatted = absAmount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Calculate percentage change between two values
 */
export function getPercentageChange(previous: number, current: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}
