"use client";

import { format } from "date-fns";
import { cn, formatCurrency } from "@finance/ui";

export interface TransactionRowData {
  id: string;
  date: Date;
  description: string;
  merchant?: string | null;
  amount: number;
  aiClassified?: string | null;
  category?: {
    name: string;
    necessityType: "need" | "want" | "savings";
  } | null;
}

interface TransactionRowProps {
  transaction: TransactionRowData;
  /** When true, draws the top divider (skipped for the first row in a list). */
  divider?: boolean;
  onClick?: () => void;
}

// Map necessity types & common category names to the V1 category dot colours.
function dotColorFor(
  category?: TransactionRowData["category"],
  aiClassified?: string | null
): string {
  const name = category?.name ?? aiClassified ?? "";
  const necessity = category?.necessityType;

  if (necessity === "savings") return "bg-cat-emerald";
  if (necessity === "want") return "bg-cat-pink";
  if (necessity === "need") return "bg-cat-blue";

  if (/transport|fuel/i.test(name)) return "bg-cat-amber";
  if (/entertain|stream|movie/i.test(name)) return "bg-cat-violet";
  if (/shop|cloth/i.test(name)) return "bg-cat-amber";
  if (/grocer|food/i.test(name)) return "bg-cat-blue";

  return "bg-cat-blue";
}

export function TransactionRow({
  transaction,
  divider = true,
  onClick,
}: TransactionRowProps) {
  const isExpense = transaction.amount < 0;
  const dotClass = dotColorFor(transaction.category, transaction.aiClassified);
  const merchant = transaction.merchant ?? transaction.description;
  const category =
    transaction.category?.name ?? transaction.aiClassified ?? "—";

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center px-1 py-2",
        divider && "border-t border-black/[0.05]",
        onClick && "hover:bg-black/[0.03] cursor-pointer rounded-md"
      )}
    >
      <span
        className={cn("mr-3.5 h-2 w-2 shrink-0 rounded-full", dotClass)}
      />
      <div className="min-w-0 flex-1">
        <div className="text-ink truncate text-sm font-semibold">
          {merchant}
        </div>
      </div>
      <div className="text-muted-ink hidden w-[140px] truncate text-xs sm:block">
        {category}
      </div>
      <div className="text-muted-ink hidden w-[80px] text-xs sm:block">
        {format(new Date(transaction.date), "d MMM")}
      </div>
      <div
        className={cn(
          "tabular w-[110px] text-right text-[17px] font-extrabold tracking-tight",
          isExpense ? "text-ink" : "text-cat-emerald"
        )}
      >
        {isExpense ? "−" : "+"}
        {formatCurrency(Math.abs(transaction.amount))}
      </div>
    </div>
  );
}
