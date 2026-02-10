"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
  formatCurrency,
  formatPercent,
} from "@finance/ui";
import { Home, ShoppingBag, PiggyBank, type LucideIcon } from "lucide-react";
import type { BudgetBreakdown } from "../calculations";

interface BudgetGaugeProps {
  breakdown: BudgetBreakdown;
  className?: string;
}

export function BudgetGauge({ breakdown, className }: BudgetGaugeProps) {
  const categories: Array<{
    name: string;
    data: BudgetBreakdown["needs"];
    color: string;
    bgColor: string;
    textColor: string;
    icon: LucideIcon;
  }> = [
    {
      name: "Needs",
      data: breakdown.needs,
      color: "bg-blue-500",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      textColor: "text-blue-600 dark:text-blue-400",
      icon: Home,
    },
    {
      name: "Wants",
      data: breakdown.wants,
      color: "bg-violet-500",
      bgColor: "bg-violet-100 dark:bg-violet-900/30",
      textColor: "text-violet-600 dark:text-violet-400",
      icon: ShoppingBag,
    },
    {
      name: "Savings",
      data: breakdown.savings,
      color: "bg-emerald-500",
      bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
      textColor: "text-emerald-600 dark:text-emerald-400",
      icon: PiggyBank,
    },
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>50/30/20 Budget</CardTitle>
            <CardDescription>Track spending against your goals</CardDescription>
          </div>
          <div className="bg-muted/50 flex h-9 items-center rounded-lg border px-3 text-sm font-medium tabular-nums">
            {formatPercent(breakdown.savingsRate)} saved
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {categories.map((category) => {
          const progressPercent = Math.min(
            category.data.target > 0
              ? (category.data.actual / category.data.target) * 100
              : category.data.actual > 0
                ? 100
                : 0,
            100
          );
          const isOver = category.data.actual > category.data.target;
          const Icon = category.icon;

          return (
            <div key={category.name} className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg",
                      category.bgColor
                    )}
                  >
                    <Icon className={cn("h-4 w-4", category.textColor)} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{category.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {formatPercent(category.data.percentage)} of income
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={cn(
                      "text-sm font-semibold tabular-nums",
                      isOver
                        ? "text-red-600 dark:text-red-400"
                        : "text-foreground"
                    )}
                  >
                    {formatCurrency(category.data.actual)}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    of {formatCurrency(category.data.target)}
                  </p>
                </div>
              </div>
              <div
                className={cn(
                  "h-2.5 overflow-hidden rounded-full",
                  category.bgColor
                )}
              >
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-700 ease-out",
                    isOver ? "bg-red-500" : category.color
                  )}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p
                className={cn(
                  "text-xs font-medium",
                  category.data.status === "over"
                    ? "text-red-600 dark:text-red-400"
                    : category.data.status === "on-track"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-muted-foreground"
                )}
              >
                {category.data.status === "over"
                  ? `${formatCurrency(category.data.actual - category.data.target)} over budget`
                  : category.data.status === "on-track"
                    ? "On track"
                    : `${formatCurrency(category.data.target - category.data.actual)} remaining`}
              </p>
            </div>
          );
        })}

        <div className="grid grid-cols-2 gap-3 border-t pt-4">
          <div className="rounded-lg bg-emerald-50 p-3 text-center dark:bg-emerald-950/20">
            <p className="text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatCurrency(breakdown.totalIncome)}
            </p>
            <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
              Total Income
            </p>
          </div>
          <div className="rounded-lg bg-red-50 p-3 text-center dark:bg-red-950/20">
            <p className="text-lg font-bold tabular-nums text-red-600 dark:text-red-400">
              {formatCurrency(breakdown.totalExpenses)}
            </p>
            <p className="text-xs text-red-600/70 dark:text-red-400/70">
              Total Expenses
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
