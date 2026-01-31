import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { Link } from "expo-router";
import { useTheme } from "@/lib/theme/provider";
import { trpc, type Transaction } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils/format";
import { Ionicons } from "@expo/vector-icons";
import { StatCard } from "@/components/dashboard/stat-card";
import { BudgetProgress } from "@/components/dashboard/budget-progress";
import { TransactionItem } from "@/components/transactions/transaction-item";

export default function DashboardScreen() {
  const { colors } = useTheme();
  const now = new Date();
  const [month] = useState(now.getMonth() + 1);
  const [year] = useState(now.getFullYear());
  const [refreshing, setRefreshing] = useState(false);

  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);

  const budgetQuery = trpc.analytics.get503020.useQuery({ month, year });
  const transactionsQuery = trpc.transactions.list.useQuery({
    limit: 5,
    filters: {
      startDate: startOfMonth,
      endDate: endOfMonth,
    },
  });

  const budget = budgetQuery.data;
  const transactions: Transaction[] = transactionsQuery.data?.data || [];

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([budgetQuery.refetch(), transactionsQuery.refetch()]);
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.greeting, { color: colors.textMuted }]}>
          Welcome back
        </Text>
        <Text style={[styles.title, { color: colors.text }]}>
          Your Finance Overview
        </Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          title="Income"
          value={formatCurrency(budget?.totalIncome || 0)}
          icon="wallet"
          color="#22c55e"
          isLoading={budgetQuery.isLoading}
        />
        <StatCard
          title="Expenses"
          value={formatCurrency(
            (budget?.needs.actual || 0) + (budget?.wants.actual || 0)
          )}
          icon="trending-down"
          color="#ef4444"
          isLoading={budgetQuery.isLoading}
        />
        <StatCard
          title="Savings"
          value={formatCurrency(budget?.savings.actual || 0)}
          icon="piggy-bank"
          color="#10b981"
          isLoading={budgetQuery.isLoading}
        />
        <StatCard
          title="Savings Rate"
          value={`${budget?.savingsRate?.toFixed(1) || 0}%`}
          icon="percent"
          color="#8b5cf6"
          isLoading={budgetQuery.isLoading}
        />
      </View>

      {/* Budget Progress */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            50/30/20 Budget
          </Text>
          <Link href="/(tabs)/budget" asChild>
            <TouchableOpacity>
              <Text style={[styles.seeAll, { color: colors.primary }]}>
                See Details
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
        {budget ? (
          <View style={styles.budgetBars}>
            <BudgetProgress
              label="Needs"
              actual={budget.needs.actual}
              target={budget.needs.target}
              color="#3b82f6"
            />
            <BudgetProgress
              label="Wants"
              actual={budget.wants.actual}
              target={budget.wants.target}
              color="#ec4899"
            />
            <BudgetProgress
              label="Savings"
              actual={budget.savings.actual}
              target={budget.savings.target}
              color="#10b981"
            />
          </View>
        ) : (
          <View style={styles.loadingPlaceholder}>
            <View
              style={[styles.skeleton, { backgroundColor: colors.border }]}
            />
            <View
              style={[styles.skeleton, { backgroundColor: colors.border }]}
            />
            <View
              style={[styles.skeleton, { backgroundColor: colors.border }]}
            />
          </View>
        )}
      </View>

      {/* Recent Transactions */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Recent Transactions
          </Text>
          <Link href="/(tabs)/transactions" asChild>
            <TouchableOpacity>
              <Text style={[styles.seeAll, { color: colors.primary }]}>
                See All
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
        {transactionsQuery.isLoading ? (
          <View style={styles.loadingPlaceholder}>
            {[1, 2, 3].map((i) => (
              <View
                key={i}
                style={[
                  styles.transactionSkeleton,
                  { backgroundColor: colors.border },
                ]}
              />
            ))}
          </View>
        ) : transactions.length > 0 ? (
          <View style={styles.transactionsList}>
            {transactions.map((transaction: Transaction) => (
              <TransactionItem key={transaction.id} transaction={transaction} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name="receipt-outline"
              size={48}
              color={colors.textMuted}
            />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No transactions yet
            </Text>
            <Link href="/(tabs)/transactions" asChild>
              <TouchableOpacity
                style={[
                  styles.emptyButton,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text style={styles.emptyButtonText}>Import Transactions</Text>
              </TouchableOpacity>
            </Link>
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
  header: {
    marginBottom: 20,
  },
  greeting: {
    fontSize: 14,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  section: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  seeAll: {
    fontSize: 14,
    fontWeight: "500",
  },
  budgetBars: {
    gap: 12,
  },
  loadingPlaceholder: {
    gap: 12,
  },
  skeleton: {
    height: 40,
    borderRadius: 8,
  },
  transactionSkeleton: {
    height: 64,
    borderRadius: 12,
  },
  transactionsList: {
    gap: 8,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
    marginBottom: 16,
  },
  emptyButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
