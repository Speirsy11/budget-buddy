"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
  formatCurrency,
  Button,
} from "@finance/ui";
import { BudgetGauge, InsightCard, SpendingChart } from "@finance/analytics";
import { TransactionCard } from "@finance/transactions";
import { trpc } from "@/trpc/client";
import {
  Wallet,
  TrendingDown,
  PiggyBank,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Upload,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [hasAutoDetected, setHasAutoDetected] = useState(false);

  // Auto-detect date range from transactions
  const dateRangeQuery = trpc.analytics.getDateRange.useQuery();

  // Update to the most recent transaction month when data loads
  useEffect(() => {
    if (dateRangeQuery.data?.hasTransactions && !hasAutoDetected) {
      setMonth(dateRangeQuery.data.suggestedMonth);
      setYear(dateRangeQuery.data.suggestedYear);
      setHasAutoDetected(true);
    }
  }, [dateRangeQuery.data, hasAutoDetected]);

  const thirtyDaysAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const today = useMemo(() => new Date(), []);

  const monthName = new Date(year, month - 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const budgetQuery = trpc.analytics.get503020.useQuery({ month, year });
  const transactionsQuery = trpc.transactions.list.useQuery({
    limit: 5,
  });
  const trendsQuery = trpc.analytics.getSpendingTrends.useQuery({
    startDate: thirtyDaysAgo,
    endDate: today,
    groupBy: "day",
  });

  const isLoading =
    budgetQuery.isLoading ||
    transactionsQuery.isLoading ||
    trendsQuery.isLoading;

  const budget = budgetQuery.data;
  const transactions = transactionsQuery.data?.data || [];
  const trends = trendsQuery.data || [];

  const netCashFlow = (budget?.totalIncome || 0) - (budget?.totalExpenses || 0);

  // Generate insights based on data
  const insights = budget
    ? [
        budget.needs.status === "over"
          ? {
              type: "warning" as const,
              title: "Needs Over Budget",
              description: `You've spent ${formatCurrency(budget.needs.actual - budget.needs.target)} more than planned on essentials.`,
              value: formatCurrency(budget.needs.actual),
            }
          : budget.savingsRate >= 20
            ? {
                type: "positive" as const,
                title: "Great Savings Rate!",
                description: `You're saving ${budget.savingsRate.toFixed(1)}% of your income. Keep it up!`,
                value: `${budget.savingsRate.toFixed(1)}%`,
              }
            : {
                type: "tip" as const,
                title: "Boost Your Savings",
                description: `Try to save at least 20% of your income. You're currently at ${budget.savingsRate.toFixed(1)}%.`,
                value: `${budget.savingsRate.toFixed(1)}%`,
              },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header with Month Navigation */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Your financial overview at a glance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[150px] text-center font-medium">
            {monthName}
          </span>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <div className="absolute right-0 top-0 h-24 w-24 -translate-y-4 translate-x-8 rounded-full bg-emerald-500/10" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Total Income
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
              <Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(budget?.totalIncome || 0)}
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  {monthName}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute right-0 top-0 h-24 w-24 -translate-y-4 translate-x-8 rounded-full bg-red-500/10" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Total Expenses
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
              <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(budget?.totalExpenses || 0)}
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  {monthName}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div
            className={`absolute right-0 top-0 h-24 w-24 -translate-y-4 translate-x-8 rounded-full ${netCashFlow >= 0 ? "bg-blue-500/10" : "bg-red-500/10"}`}
          />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Net Cash Flow
            </CardTitle>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${netCashFlow >= 0 ? "bg-blue-500/10" : "bg-red-500/10"}`}
            >
              {netCashFlow >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-600 dark:text-red-400" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <>
                <div
                  className={`text-2xl font-bold ${
                    netCashFlow >= 0
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {netCashFlow >= 0 ? "+" : ""}
                  {formatCurrency(netCashFlow)}
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  {monthName}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute right-0 top-0 h-24 w-24 -translate-y-4 translate-x-8 rounded-full bg-violet-500/10" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Savings Rate
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
              <PiggyBank className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {(budget?.savingsRate || 0).toFixed(1)}%
                </div>
                <div className="mt-1 flex items-center gap-1.5">
                  <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
                    <div
                      className="h-full rounded-full bg-violet-500 transition-all duration-500"
                      style={{
                        width: `${Math.max(0, Math.min(((budget?.savingsRate || 0) / 20) * 100, 100))}%`,
                      }}
                    />
                  </div>
                  <span className="text-muted-foreground text-xs">of 20%</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {insights.map((insight, i) => (
            <InsightCard key={i} {...insight} />
          ))}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Budget Gauge */}
        {budget ? (
          <BudgetGauge breakdown={budget} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Smart Budget Goals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Spending Trends */}
        {trendsQuery.isLoading ? (
          <Card>
            <CardHeader>
              <CardTitle>Daily Spending</CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        ) : trends.length > 0 ? (
          <SpendingChart
            data={trends}
            title="Daily Spending"
            description={`Your spending in ${monthName}`}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Daily Spending</CardTitle>
              <CardDescription>
                Your spending over the past month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-[300px] flex-col items-center justify-center text-center">
                <div className="bg-primary/10 mb-4 flex h-14 w-14 items-center justify-center rounded-full">
                  <TrendingDown className="text-primary h-6 w-6" />
                </div>
                <h3 className="mb-1 font-semibold">No spending data yet</h3>
                <p className="text-muted-foreground max-w-sm text-sm">
                  Import transactions to see your daily spending trends.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Transactions in {monthName}</CardDescription>
          </div>
          <Link
            href="/dashboard/transactions"
            className="text-primary flex items-center gap-1 text-sm font-medium hover:underline"
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </Link>
        </CardHeader>
        <CardContent>
          {transactionsQuery.isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : transactions.length > 0 ? (
            <div className="space-y-2">
              {transactions.map((transaction) => (
                <TransactionCard
                  key={transaction.id}
                  transaction={{
                    ...transaction,
                    category: transaction.category ?? undefined,
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="bg-primary/10 mb-4 flex h-14 w-14 items-center justify-center rounded-full">
                <Upload className="text-primary h-6 w-6" />
              </div>
              <h3 className="mb-1 font-semibold">No transactions yet</h3>
              <p className="text-muted-foreground mb-4 max-w-sm text-sm">
                Import your bank statement to get started with automatic
                categorization and budget tracking.
              </p>
              <Link
                href="/dashboard/import"
                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              >
                <Upload className="h-4 w-4" />
                Import Transactions
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
