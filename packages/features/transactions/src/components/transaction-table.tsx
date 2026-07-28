"use client";

import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
  cn,
  formatCurrency,
} from "@finance/ui";
import { Sparkles, Pencil, Trash2 } from "lucide-react";
import { CategoryBadge } from "./category-badge";

export interface TransactionTableData {
  id: string;
  date: Date;
  description: string;
  merchant?: string | null;
  amount: number;
  categoryId?: string | null;
  aiClassified?: string | null;
  necessityScore?: number | null;
  category?: {
    id: string;
    name: string;
    color?: string | null;
    necessityType: "need" | "want" | "savings";
  } | null;
}

interface TransactionTableProps {
  transactions: TransactionTableData[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClassify?: (id: string) => void;
  isLoading?: boolean;
  /**
   * Selection is opt-in: pass `selectedIds` and `onSelectionChange` to show
   * checkboxes. Callers that do not care about bulk actions are unaffected.
   */
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
}

export function TransactionTable({
  transactions,
  onEdit,
  onDelete,
  onClassify,
  isLoading,
  selectedIds,
  onSelectionChange,
}: TransactionTableProps) {
  const selectable = Boolean(selectedIds && onSelectionChange);

  const toggleOne = (id: string) => {
    if (!selectedIds || !onSelectionChange) return;
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  };

  // Header checkbox acts on the visible page only — selecting rows the user
  // cannot see would make the count meaningless.
  const allVisibleSelected =
    selectable &&
    transactions.length > 0 &&
    transactions.every((t) => selectedIds?.has(t.id));

  const toggleAllVisible = () => {
    if (!selectedIds || !onSelectionChange) return;
    const next = new Set(selectedIds);
    if (allVisibleSelected) {
      for (const t of transactions) next.delete(t.id);
    } else {
      for (const t of transactions) next.add(t.id);
    }
    onSelectionChange(next);
  };
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-muted h-16 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-muted mb-4 rounded-full p-4">
          <Sparkles className="text-muted-foreground h-8 w-8" />
        </div>
        <h3 className="text-lg font-semibold">No transactions yet</h3>
        <p className="text-muted-foreground mt-1">
          Import your bank statement or add transactions manually.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {selectable && (
              <TableHead className="w-[40px]">
                <input
                  type="checkbox"
                  className="h-4 w-4 cursor-pointer rounded border-gray-300"
                  checked={allVisibleSelected}
                  onChange={toggleAllVisible}
                  aria-label="Select all transactions on this page"
                />
              </TableHead>
            )}
            <TableHead className="w-[120px]">Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow
              key={transaction.id}
              className={cn(
                "group",
                selectedIds?.has(transaction.id) && "bg-muted/50"
              )}
            >
              {selectable && (
                <TableCell>
                  <input
                    type="checkbox"
                    className="h-4 w-4 cursor-pointer rounded border-gray-300"
                    checked={selectedIds?.has(transaction.id) ?? false}
                    onChange={() => toggleOne(transaction.id)}
                    aria-label={`Select ${transaction.description}`}
                  />
                </TableCell>
              )}
              <TableCell className="text-muted-foreground font-medium">
                {format(new Date(transaction.date), "MMM d, yyyy")}
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">{transaction.description}</p>
                  {transaction.merchant && (
                    <p className="text-muted-foreground text-sm">
                      {transaction.merchant}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <CategoryBadge
                  category={
                    transaction.category?.name ?? transaction.aiClassified
                  }
                  necessityType={transaction.category?.necessityType}
                  isAiSuggested={
                    !transaction.category && !!transaction.aiClassified
                  }
                />
              </TableCell>
              <TableCell
                className={cn(
                  "text-right font-semibold tabular-nums",
                  transaction.amount < 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-green-600 dark:text-green-400"
                )}
              >
                {transaction.amount < 0 ? "-" : "+"}
                {formatCurrency(Math.abs(transaction.amount))}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  {onClassify && !transaction.aiClassified && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onClassify(transaction.id)}
                    >
                      <Sparkles className="h-4 w-4" />
                    </Button>
                  )}
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onEdit(transaction.id)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive h-8 w-8"
                      onClick={() => onDelete(transaction.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
