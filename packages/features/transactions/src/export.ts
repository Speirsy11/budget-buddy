export interface ExportableTransaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  merchant?: string | null;
  category?: string | null;
  aiClassified?: string | null;
  necessityType?: "need" | "want" | "savings" | null;
  notes?: string | null;
}

export interface ExportOptions {
  format: "csv" | "json";
  dateRange?: {
    start: Date;
    end: Date;
  };
  includeCategories?: boolean;
}

export function exportToCSV(transactions: ExportableTransaction[]): string {
  const headers = [
    "Date",
    "Description",
    "Amount",
    "Merchant",
    "Category",
    "Type",
    "Notes",
  ];

  const rows = transactions.map((t) => [
    t.date.toISOString().split("T")[0],
    escapeCSV(t.description),
    t.amount.toFixed(2),
    escapeCSV(t.merchant || ""),
    escapeCSV(t.category || t.aiClassified || "Uncategorized"),
    t.necessityType || "",
    escapeCSV(t.notes || ""),
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  return csvContent;
}

export function exportToJSON(
  transactions: ExportableTransaction[],
  pretty = true
): string {
  const exportData = {
    exportedAt: new Date().toISOString(),
    count: transactions.length,
    transactions: transactions.map((t) => ({
      id: t.id,
      date: t.date.toISOString(),
      description: t.description,
      amount: t.amount,
      merchant: t.merchant,
      category: t.category || t.aiClassified || "Uncategorized",
      necessityType: t.necessityType,
      notes: t.notes,
    })),
  };

  return pretty
    ? JSON.stringify(exportData, null, 2)
    : JSON.stringify(exportData);
}

export function exportBudgetData(data: {
  income: number;
  budgets: { category: string; amount: number }[];
  spending: { category: string; spent: number }[];
}): string {
  const exportData = {
    exportedAt: new Date().toISOString(),
    income: data.income,
    budgets: data.budgets,
    spending: data.spending,
    summary: {
      totalBudgeted: data.budgets.reduce((sum, b) => sum + b.amount, 0),
      totalSpent: data.spending.reduce((sum, s) => sum + s.spent, 0),
    },
  };

  return JSON.stringify(exportData, null, 2);
}

export function generateFullExport(data: {
  user: {
    id: string;
    email: string;
    name: string;
    createdAt: Date;
  };
  transactions: ExportableTransaction[];
  budgets: { category: string; amount: number; period: string }[];
  categories: { id: string; name: string; isCustom: boolean }[];
  settings: Record<string, unknown>;
}): string {
  const exportData = {
    exportedAt: new Date().toISOString(),
    version: "1.0",
    user: {
      id: data.user.id,
      email: data.user.email,
      name: data.user.name,
      memberSince: data.user.createdAt.toISOString(),
    },
    statistics: {
      totalTransactions: data.transactions.length,
      totalBudgets: data.budgets.length,
      customCategories: data.categories.filter((c) => c.isCustom).length,
    },
    data: {
      transactions: data.transactions.map((t) => ({
        id: t.id,
        date: t.date.toISOString(),
        description: t.description,
        amount: t.amount,
        merchant: t.merchant,
        category: t.category || t.aiClassified,
        necessityType: t.necessityType,
        notes: t.notes,
      })),
      budgets: data.budgets,
      categories: data.categories,
      settings: data.settings,
    },
  };

  return JSON.stringify(exportData, null, 2);
}

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function createExportBlob(
  data: string,
  format: "csv" | "json"
): { blob: Blob; filename: string; mimeType: string } {
  const mimeType = format === "csv" ? "text/csv" : "application/json";
  const extension = format === "csv" ? "csv" : "json";
  const timestamp = new Date().toISOString().split("T")[0];
  const filename = `financeai-export-${timestamp}.${extension}`;

  const blob = new Blob([data], { type: mimeType });

  return { blob, filename, mimeType };
}
