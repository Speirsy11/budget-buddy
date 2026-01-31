/**
 * Format a number as currency (GBP)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amount);
}

/**
 * Format a date as a readable string
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Format a date as relative time (e.g., "2 days ago")
 */
export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

/**
 * Get the category color
 */
export function getCategoryColor(category: string | null): string {
  const colors: Record<string, string> = {
    housing: "#3b82f6",
    transportation: "#8b5cf6",
    food: "#f59e0b",
    utilities: "#6366f1",
    healthcare: "#ef4444",
    insurance: "#14b8a6",
    entertainment: "#ec4899",
    shopping: "#f97316",
    savings: "#10b981",
    income: "#22c55e",
    other: "#6b7280",
  };

  return colors[category?.toLowerCase() || "other"] || colors.other;
}

/**
 * Get the budget category color
 */
export function getBudgetCategoryColor(budgetCategory: string | null): {
  bg: string;
  text: string;
} {
  switch (budgetCategory?.toLowerCase()) {
    case "needs":
      return { bg: "#dbeafe", text: "#1d4ed8" };
    case "wants":
      return { bg: "#fce7f3", text: "#be185d" };
    case "savings":
      return { bg: "#d1fae5", text: "#059669" };
    default:
      return { bg: "#f3f4f6", text: "#374151" };
  }
}
