"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tabs,
  TabsList,
  TabsTrigger,
  Skeleton,
  formatCurrency,
} from "@finance/ui";
import {
  SpendingChart,
  CategoryBreakdown,
  MonthlyOverview,
  InsightCard,
} from "@finance/analytics";
import { trpc } from "@/trpc/client";
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
  const [months, setMonths] = useState(6);

  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const trendsQuery = trpc.analytics.getSpendingTrends.useQuery({
    startDate,
    endDate,
    groupBy: months > 3 ? "week" : "day",
  });

  const categoryQuery = trpc.analytics.getCategoryBreakdown.useQuery({
    startDate,
    endDate,
  });

  const comparisonQuery = trpc.analytics.getMonthlyComparison.useQuery({
    months,
  });

  const trends = trendsQuery.data || [];
  const categories = categoryQuery.data || [];
  const monthlyData = comparisonQuery.data || [];

  // Calculate insights
  const totalSpent = categories.reduce((sum, c) => sum + c.total, 0);
  const avgMonthlySpend = monthlyData.length
    ? monthlyData.reduce((sum, m) => sum + m.expenses, 0) / monthlyData.length
    : 0;

  const latestMonth = monthlyData[monthlyData.length - 1];
  const previousMonth = monthlyData[monthlyData.length - 2];

  const spendingChange =
    latestMonth && previousMonth && previousMonth.expenses > 0
      ? ((latestMonth.expenses - previousMonth.expenses) /
          previousMonth.expenses) *
        100
      : 0;

  const insights = [
    {
      type:
        spendingChange > 10
          ? ("negative" as const)
          : spendingChange < -10
            ? ("positive" as const)
            : ("neutral" as const),
      title:
        spendingChange > 10
          ? "Spending Increased"
          : spendingChange < -10
            ? "Spending Decreased"
            : "Stable Spending",
      description:
        spendingChange > 10
          ? `Your spending increased ${Math.abs(spendingChange).toFixed(1)}% compared to last month.`
          : spendingChange < -10
            ? `Great job! You spent ${Math.abs(spendingChange).toFixed(1)}% less than last month.`
            : "Your spending is consistent with last month.",
      value: `${spendingChange >= 0 ? "+" : ""}${spendingChange.toFixed(1)}%`,
    },
    {
      type: "neutral" as const,
      title: "Average Monthly Spend",
      description: `Over the past ${months} months, you've averaged ${formatCurrency(avgMonthlySpend)} per month.`,
      value: formatCurrency(avgMonthlySpend),
    },
    categories.length > 0
      ? {
          type: "tip" as const,
          title: "Top Category",
          description: `"${categories[0].category}" is your biggest expense at ${categories[0].percentage.toFixed(1)}% of total spending.`,
          value: formatCurrency(categories[0].total),
        }
      : null,
  ].filter(Boolean) as Array<{
    type: "positive" | "negative" | "warning" | "neutral" | "tip";
    title: string;
    description: string;
    value: string;
  }>;

  return (
    <div className="space-y-6">
      {/* Header with tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
        <Tabs
          value={months.toString()}
          onValueChange={(v) => setMonths(parseInt(v))}
        >
          <TabsList>
            <TabsTrigger value="3">3M</TabsTrigger>
            <TabsTrigger value="6">6M</TabsTrigger>
            <TabsTrigger value="12">1Y</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Insights */}
      <div className="grid gap-4 md:grid-cols-3">
        {insights.map((insight, i) => (
          <InsightCard key={i} {...insight} />
        ))}
      </div>

      {/* Monthly Overview - Full Width */}
      {comparisonQuery.isLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[350px] w-full" />
          </CardContent>
        </Card>
      ) : monthlyData.length > 0 ? (
        <MonthlyOverview data={monthlyData} />
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Not enough data to show monthly comparison
            </p>
          </CardContent>
        </Card>
      )}

      {/* Two column layout for detailed charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Spending Trends */}
        {trendsQuery.isLoading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        ) : trends.length > 0 ? (
          <SpendingChart
            data={trends}
            title="Spending Over Time"
            description={`${months > 3 ? "Weekly" : "Daily"} spending trend`}
          />
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No spending data available
              </p>
            </CardContent>
          </Card>
        )}

        {/* Category Breakdown */}
        {categoryQuery.isLoading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[280px] w-full" />
            </CardContent>
          </Card>
        ) : categories.length > 0 ? (
          <CategoryBreakdown data={categories} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Spending by Category</CardTitle>
            </CardHeader>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No category data available
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Period Summary</CardTitle>
          <CardDescription>
            Financial overview for the past {months} months
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3 rounded-xl border p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
                <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Total Spent</p>
                <p className="text-lg font-bold">
                  {formatCurrency(totalSpent)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Avg. Monthly</p>
                <p className="text-lg font-bold">
                  {formatCurrency(avgMonthlySpend)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Total Income</p>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(
                    monthlyData.reduce((sum, m) => sum + m.income, 0)
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                <DollarSign className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Net Savings</p>
                <p
                  className={`text-lg font-bold ${
                    monthlyData.reduce((sum, m) => sum + m.savings, 0) >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {formatCurrency(
                    monthlyData.reduce((sum, m) => sum + m.savings, 0)
                  )}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
