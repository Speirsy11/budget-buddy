// Calculations (client-safe)
export {
  calculate503020,
  calculateBudgetProgress,
  calculateCategoryTotals,
  calculateSpendingTrends,
  formatCurrency,
  getPercentageChange,
  type BudgetBreakdown,
  type SpendingTrend,
} from "./calculations";

// Net worth calculations (client-safe)
export {
  calculateNetWorth,
  buildNetWorthHistory,
  monthEndDates,
  netWorthChange,
  creditUtilisation,
  accountTypeLabel,
  type NetWorthAccount,
  type NetWorthBreakdown,
  type NetWorthPoint,
  type AccountGroup,
} from "./net-worth";

// Goal calculations (client-safe)
export {
  calculateGoalProgress,
  summarizeGoals,
  type GoalProgress,
  type GoalsSummary,
  type GoalPace,
} from "./goals";

export { BudgetGauge } from "./components/budget-gauge";
export { SpendingChart } from "./components/spending-chart";
export { CategoryBreakdown } from "./components/category-breakdown";
export { MonthlyOverview } from "./components/monthly-overview";
export { InsightCard } from "./components/insight-card";
