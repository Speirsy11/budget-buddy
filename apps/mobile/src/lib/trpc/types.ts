// Router types for the mobile app
// These types mirror the server router structure for type-safe API calls

// Budget types
export interface BudgetCategory {
  target: number;
  actual: number;
  status: "under" | "over" | "on-track";
}

export interface Budget503020 {
  totalIncome: number;
  needs: BudgetCategory;
  wants: BudgetCategory;
  savings: BudgetCategory;
  savingsRate: number;
}

// Analytics types
export interface TrendData {
  date: string;
  amount: number;
}

export interface CategoryData {
  category: string;
  total: number;
  percentage: number;
}

export interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
}
