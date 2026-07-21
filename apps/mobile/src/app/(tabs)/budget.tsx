import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  SafeAreaView,
} from "react-native";
import { useTheme } from "@/lib/theme/provider";
import { useTimedLoading } from "@/lib/hooks/use-timed-loading";
import { useMonthCursor } from "@/lib/hooks/use-month-cursor";
import { trpc, type CategoryData } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils/format";
import { BudgetGauge } from "@/components/budget/budget-gauge";
import { CategoryBreakdownList } from "@/components/budget/category-breakdown";
import { GreetingHeader } from "@/components/greeting-header";
import { MonthPicker } from "@/components/month-picker";
import { IconChip } from "@/components/icon-chip";
import { BarChart3, PieChart } from "lucide-react-native";

export default function BudgetScreen() {
  const { colors } = useTheme();
  const { month, year, range, goToPrevMonth, goToNextMonth } = useMonthCursor();
  const [refreshing, setRefreshing] = useState(false);

  const budgetQuery = trpc.analytics.get503020.useQuery({ month, year });
  const categoryQuery = trpc.analytics.getCategoryBreakdown.useQuery(range);

  const budget = budgetQuery.data;
  const categories: CategoryData[] = categoryQuery.data || [];
  const showBudgetSkeleton = useTimedLoading(budgetQuery.isLoading);
  const showCategorySkeleton = useTimedLoading(categoryQuery.isLoading);

  const monthName = new Date(year, month - 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([budgetQuery.refetch(), categoryQuery.refetch()]);
    setRefreshing(false);
  };

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
          title="Your budget"
          insight={monthName}
          insightTone="muted"
        />
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            marginVertical: 12,
          }}
        >
          <MonthPicker
            month={month}
            year={year}
            onPrev={goToPrevMonth}
            onNext={goToNextMonth}
          />
        </View>

        {/* Budget Gauges */}
        <View
          style={[styles.section, { backgroundColor: colors.surface.lemon }]}
        >
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>
            50/30/20 Budget
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.inkSoft }]}>
            Track your spending against recommended allocations
          </Text>

          {showBudgetSkeleton ? (
            <View style={styles.loadingPlaceholder}>
              <View
                style={[
                  styles.gaugeSkeleton,
                  { backgroundColor: colors.border },
                ]}
              />
              <View
                style={[
                  styles.gaugeSkeleton,
                  { backgroundColor: colors.border },
                ]}
              />
              <View
                style={[
                  styles.gaugeSkeleton,
                  { backgroundColor: colors.border },
                ]}
              />
            </View>
          ) : budget ? (
            <View style={styles.gaugesContainer}>
              <BudgetGauge
                label="Needs"
                percentage={50}
                actual={budget.needs.actual}
                target={budget.needs.target}
                status={budget.needs.status}
                color="#3b82f6"
              />
              <BudgetGauge
                label="Wants"
                percentage={30}
                actual={budget.wants.actual}
                target={budget.wants.target}
                status={budget.wants.status}
                color="#ec4899"
              />
              <BudgetGauge
                label="Savings"
                percentage={20}
                actual={budget.savings.actual}
                target={budget.savings.target}
                status={budget.savings.status}
                color="#10b981"
              />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <IconChip icon={BarChart3} surface="white" size="lg" />
              <Text style={[styles.emptyText, { color: colors.inkSoft }]}>
                No budget data for this month
              </Text>
            </View>
          )}
        </View>

        {/* Income Summary */}
        {budget && (
          <View
            style={[
              styles.incomeCard,
              { backgroundColor: colors.surface.linen },
            ]}
          >
            <View style={styles.incomeRow}>
              <Text style={[styles.incomeLabel, { color: colors.inkSoft }]}>
                Monthly Income
              </Text>
              <Text style={[styles.incomeValue, { color: colors.cat.emerald }]}>
                {formatCurrency(budget.totalIncome)}
              </Text>
            </View>
            <View style={styles.incomeRow}>
              <Text style={[styles.incomeLabel, { color: colors.inkSoft }]}>
                Total Spent
              </Text>
              <Text style={[styles.incomeValue, { color: colors.ink }]}>
                {formatCurrency(budget.needs.actual + budget.wants.actual)}
              </Text>
            </View>
            <View style={styles.incomeRow}>
              <Text style={[styles.incomeLabel, { color: colors.inkSoft }]}>
                Savings Rate
              </Text>
              <Text
                style={[
                  styles.incomeValue,
                  {
                    color:
                      budget.savingsRate >= 20
                        ? colors.cat.emerald
                        : colors.cat.amber,
                  },
                ]}
              >
                {budget.savingsRate.toFixed(1)}%
              </Text>
            </View>
          </View>
        )}

        {/* Category Breakdown */}
        <View style={[styles.section, { backgroundColor: colors.surface.lav }]}>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>
            Spending by Category
          </Text>
          {showCategorySkeleton ? (
            <View style={styles.loadingPlaceholder}>
              {[1, 2, 3, 4].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.categorySkeleton,
                    { backgroundColor: colors.border },
                  ]}
                />
              ))}
            </View>
          ) : categories.length > 0 ? (
            <CategoryBreakdownList categories={categories} />
          ) : (
            <View style={styles.emptyState}>
              <IconChip icon={PieChart} surface="white" size="lg" />
              <Text style={[styles.emptyText, { color: colors.inkSoft }]}>
                No spending data for this month
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
    marginBottom: 20,
  },
  gaugesContainer: {
    gap: 16,
  },
  loadingPlaceholder: {
    gap: 12,
  },
  gaugeSkeleton: {
    height: 80,
    borderRadius: 12,
  },
  categorySkeleton: {
    height: 56,
    borderRadius: 8,
  },
  incomeCard: {
    borderRadius: 28,
    padding: 18,
    marginBottom: 12,
    gap: 12,
  },
  incomeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  incomeLabel: {
    fontSize: 14,
  },
  incomeValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
  },
});
