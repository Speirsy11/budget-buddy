// Router types for the mobile app
// These types mirror the server router structure for type-safe API calls

// Transaction types
export interface Transaction {
  id: string;
  amount: number;
  date: Date;
  description: string;
  merchant: string | null;
  category: string | null;
  budgetCategory: string | null;
}

export interface TransactionListResult {
  data: Transaction[];
  total: number;
  hasMore: boolean;
}

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
