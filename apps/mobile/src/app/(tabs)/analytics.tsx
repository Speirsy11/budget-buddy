import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from "react-native";
import { useTheme } from "@/lib/theme/provider";
import { GreetingHeader } from "@/components/greeting-header";
import {
  trpc,
  type TrendData,
  type CategoryData,
  type MonthlyData,
} from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils/format";
import { InsightCard } from "@/components/analytics/insight-card";
import { SpendingTrendChart } from "@/components/analytics/spending-trend-chart";
import { MonthlyComparisonChart } from "@/components/analytics/monthly-comparison-chart";

export default function AnalyticsScreen() {
  const { colors } = useTheme();
  const [months, setMonths] = useState(6);
  const [refreshing, setRefreshing] = useState(false);

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

  const trends: TrendData[] = trendsQuery.data || [];
  const categories: CategoryData[] = categoryQuery.data || [];
  const monthlyData: MonthlyData[] = comparisonQuery.data || [];

  // Calculate insights
  const avgMonthlySpend = monthlyData.length
    ? monthlyData.reduce((sum: number, m: MonthlyData) => sum + m.expenses, 0) /
      monthlyData.length
    : 0;

  const latestMonth = monthlyData[monthlyData.length - 1];
  const previousMonth = monthlyData[monthlyData.length - 2];

  const spendingChange =
    latestMonth && previousMonth
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

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      trendsQuery.refetch(),
      categoryQuery.refetch(),
      comparisonQuery.refetch(),
    ]);
    setRefreshing(false);
  };

  const periodOptions = [
    { label: "3M", value: 3 },
    { label: "6M", value: 6 },
    { label: "1Y", value: 12 },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <GreetingHeader
          mascot="chartman"
          title="Analytics"
          insight={`Past ${months} months`}
          insightTone="muted"
        />
        <View style={{ height: 12 }} />
        {/* Period Selector */}
        <View style={[styles.periodSelector, { backgroundColor: colors.surface.white }]}>
        {periodOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.periodButton,
              months === option.value && { backgroundColor: colors.ink },
            ]}
            onPress={() => setMonths(option.value)}
          >
            <Text
              style={[
                styles.periodText,
                { color: months === option.value ? "#fff" : colors.ink },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Insights */}
      <View style={styles.insightsContainer}>
        {insights.map((insight, i) => (
          <InsightCard key={i} {...insight} />
        ))}
      </View>

      {/* Monthly Comparison */}
      <View style={[styles.section, { backgroundColor: colors.surface.white }]}>
        <Text style={[styles.sectionTitle, { color: colors.ink }]}>
          Monthly Overview
        </Text>
        <Text style={[styles.sectionSubtitle, { color: colors.inkSoft }]}>
          Income vs Expenses comparison
        </Text>
        {monthlyData.length > 0 ? (
          <MonthlyComparisonChart data={monthlyData} />
        ) : (
          <View style={styles.chartPlaceholder}>
            <Text style={[styles.placeholderText, { color: colors.inkSoft }]}>
              Not enough data
            </Text>
          </View>
        )}
      </View>

      {/* Spending Trends */}
      <View style={[styles.section, { backgroundColor: colors.surface.white }]}>
        <Text style={[styles.sectionTitle, { color: colors.ink }]}>
          Spending Trends
        </Text>
        <Text style={[styles.sectionSubtitle, { color: colors.inkSoft }]}>
          {months > 3 ? "Weekly" : "Daily"} spending over time
        </Text>
        {trends.length > 0 ? (
          <SpendingTrendChart data={trends} />
        ) : (
          <View style={styles.chartPlaceholder}>
            <Text style={[styles.placeholderText, { color: colors.inkSoft }]}>
              Not enough data
            </Text>
          </View>
        )}
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 18,
    paddingBottom: 110,
  },
  periodSelector: {
    flexDirection: "row",
    borderRadius: 14,
    padding: 4,
    marginBottom: 12,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 9,
    alignItems: "center",
    borderRadius: 10,
  },
  periodText: {
    fontSize: 14,
    fontWeight: "600",
  },
  insightsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  section: {
    borderRadius: 28,
    padding: 18,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  chartPlaceholder: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 14,
  },
});
