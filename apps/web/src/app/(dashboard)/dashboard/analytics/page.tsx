"use client";

import { useState, useMemo } from "react";
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
import { IconChip } from "@finance/ui";
import {
  BarChart3,
  Coins,
  PiggyBank,
  Receipt,
  type LucideIcon,
} from "lucide-react";
import { trpc } from "@/trpc/client";
import { InsightsPanel } from "@/components/dashboard/insights-panel";
import { Greeting } from "@/components/dashboard/greeting";

export default function AnalyticsPage() {
  const [months, setMonths] = useState(6);

  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - months);
    return { startDate: start, endDate: end };
  }, [months]);

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
    <div className="flex flex-col gap-3.5">
      <Greeting
        title={<>Analytics</>}
        insight={
          <span className="text-muted-ink text-base font-medium">
            Past {months} months
          </span>
        }
        trailing={
          <Tabs
            value={months.toString()}
            onValueChange={(v) => setMonths(parseInt(v))}
          >
            <TabsList className="rounded-pill bg-surface-white shadow-btn">
              <TabsTrigger value="3" className="rounded-pill">
                3M
              </TabsTrigger>
              <TabsTrigger value="6" className="rounded-pill">
                6M
              </TabsTrigger>
              <TabsTrigger value="12" className="rounded-pill">
                1Y
              </TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />

      {/* Headline figures for the selected window */}
      <div className="grid gap-4 md:grid-cols-3">
        {insights.map((insight, i) => (
          <InsightCard key={i} {...insight} />
        ))}
      </div>

      {/* Generated insights: month-over-month moves, anomalies, projections */}
      <InsightsPanel limit={4} />

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
      <Card surface="linen" className="px-6 py-5">
        <div className="mb-4">
          <CardTitle>Period summary</CardTitle>
          <CardDescription className="mt-0.5">
            Financial overview for the past {months} months
          </CardDescription>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryTile
            surface="peach"
            icon={Receipt}
            label="Total spent"
            value={formatCurrency(totalSpent)}
          />
          <SummaryTile
            surface="sky"
            icon={BarChart3}
            label="Avg. monthly"
            value={formatCurrency(avgMonthlySpend)}
          />
          <SummaryTile
            surface="sage"
            icon={Coins}
            label="Total income"
            value={formatCurrency(
              monthlyData.reduce((sum, m) => sum + m.income, 0)
            )}
            valueClass="text-cat-emerald"
          />
          <SummaryTile
            surface="lav"
            icon={PiggyBank}
            label="Net savings"
            value={formatCurrency(
              monthlyData.reduce((sum, m) => sum + m.savings, 0)
            )}
          />
        </div>
      </Card>
    </div>
  );
}

function SummaryTile({
  surface,
  icon,
  label,
  value,
  valueClass,
}: {
  surface: "peach" | "sky" | "sage" | "lav";
  icon: LucideIcon;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <Card surface={surface} className="flex items-center gap-3 p-4">
      <IconChip icon={icon} surface={surface} className="bg-white/60" />
      <div className="min-w-0">
        <p className="text-meta text-ink-soft">{label}</p>
        <p
          className={`tabular text-ink text-lg font-extrabold ${valueClass ?? ""}`}
        >
          {value}
        </p>
      </div>
    </Card>
  );
}
