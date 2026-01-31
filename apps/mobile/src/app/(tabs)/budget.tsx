import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useTheme } from "@/lib/theme/provider";
import { trpc, type CategoryData } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils/format";
import { Ionicons } from "@expo/vector-icons";
import { BudgetGauge } from "@/components/budget/budget-gauge";
import { CategoryBreakdownList } from "@/components/budget/category-breakdown";

export default function BudgetScreen() {
  const { colors } = useTheme();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [refreshing, setRefreshing] = useState(false);

  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);

  const budgetQuery = trpc.analytics.get503020.useQuery({ month, year });
  const categoryQuery = trpc.analytics.getCategoryBreakdown.useQuery({
    startDate: startOfMonth,
    endDate: endOfMonth,
  });

  const budget = budgetQuery.data;
  const categories: CategoryData[] = categoryQuery.data || [];

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

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([budgetQuery.refetch(), categoryQuery.refetch()]);
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {/* Month Navigation */}
      <View style={[styles.monthNav, { backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={handlePrevMonth} style={styles.navButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.monthText, { color: colors.text }]}>
          {monthName}
        </Text>
        <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Budget Gauges */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          50/30/20 Budget
        </Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
          Track your spending against recommended allocations
        </Text>

        {budget ? (
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
          <View style={styles.loadingPlaceholder}>
            <View
              style={[styles.gaugeSkeleton, { backgroundColor: colors.border }]}
            />
            <View
              style={[styles.gaugeSkeleton, { backgroundColor: colors.border }]}
            />
            <View
              style={[styles.gaugeSkeleton, { backgroundColor: colors.border }]}
            />
          </View>
        )}
      </View>

      {/* Income Summary */}
      {budget && (
        <View style={[styles.incomeCard, { backgroundColor: colors.card }]}>
          <View style={styles.incomeRow}>
            <Text style={[styles.incomeLabel, { color: colors.textMuted }]}>
              Monthly Income
            </Text>
            <Text style={[styles.incomeValue, { color: "#22c55e" }]}>
              {formatCurrency(budget.totalIncome)}
            </Text>
          </View>
          <View style={styles.incomeRow}>
            <Text style={[styles.incomeLabel, { color: colors.textMuted }]}>
              Total Spent
            </Text>
            <Text style={[styles.incomeValue, { color: colors.text }]}>
              {formatCurrency(budget.needs.actual + budget.wants.actual)}
            </Text>
          </View>
          <View style={styles.incomeRow}>
            <Text style={[styles.incomeLabel, { color: colors.textMuted }]}>
              Savings Rate
            </Text>
            <Text
              style={[
                styles.incomeValue,
                { color: budget.savingsRate >= 20 ? "#22c55e" : "#f59e0b" },
              ]}
            >
              {budget.savingsRate.toFixed(1)}%
            </Text>
          </View>
        </View>
      )}

      {/* Category Breakdown */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Spending by Category
        </Text>
        {categoryQuery.isLoading ? (
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
            <Ionicons
              name="pie-chart-outline"
              size={48}
              color={colors.textMuted}
            />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No spending data for this month
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
  },
  monthText: {
    fontSize: 18,
    fontWeight: "600",
  },
  section: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
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
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
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
