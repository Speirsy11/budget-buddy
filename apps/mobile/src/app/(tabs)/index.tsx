import { useState } from "react";
import {
  View,
  Text,
  RefreshControl,
  Pressable,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { Link } from "expo-router";
import { useTheme } from "@/lib/theme/provider";
import { useTimedLoading } from "@/lib/hooks/use-timed-loading";
import { trpc, type Transaction } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils/format";
import { GreetingHeader } from "@/components/greeting-header";
import { BentoCard } from "@/components/bento-card";
import { IconChip } from "@/components/icon-chip";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  ClipboardList,
  Coins,
  FileSpreadsheet,
  PiggyBank,
  ReceiptText,
  Star,
  TrendingDown,
  TrendingUp,
} from "lucide-react-native";
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
    filters: { startDate: startOfMonth, endDate: endOfMonth },
  });

  const budget = budgetQuery.data;
  const transactions: Transaction[] = transactionsQuery.data?.data || [];
  const showBudgetSkeleton = useTimedLoading(budgetQuery.isLoading);
  const showTransactionsSkeleton = useTimedLoading(transactionsQuery.isLoading);

  const netCashFlow = (budget?.totalIncome ?? 0) - (budget?.totalExpenses ?? 0);
  const monthLong = new Date(year, month - 1).toLocaleString("en-GB", {
    month: "long",
  });

  const aheadCopy =
    netCashFlow >= 0
      ? `${formatCurrency(netCashFlow).replace(/\.\d+$/, "")} ahead this month`
      : `${formatCurrency(Math.abs(netCashFlow)).replace(/\.\d+$/, "")} behind this month`;

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([budgetQuery.refetch(), transactionsQuery.refetch()]);
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 18, paddingBottom: 110, gap: 12 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <GreetingHeader
          title="Hey, there!"
          insight={budget ? aheadCopy : undefined}
        />

        {/* Hero net-flow card */}
        <BentoCard
          surface="sky"
          padded={false}
          style={{
            paddingVertical: 14,
            paddingHorizontal: 18,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: colors.deep.sky,
              }}
            >
              Net flow · {monthLong}
            </Text>
            <Text
              style={{
                fontSize: 42,
                fontWeight: "800",
                letterSpacing: -1,
                marginTop: 4,
                color: colors.ink,
                lineHeight: 44,
              }}
            >
              {netCashFlow >= 0 ? "+" : "−"}
              {formatCurrency(Math.abs(netCashFlow)).replace(/\.\d+$/, "")}
            </Text>
            <Text style={{ fontSize: 11, color: colors.inkSoft, marginTop: 4 }}>
              {netCashFlow >= 0 ? "Tracking ahead" : "Spending exceeded income"}
            </Text>
          </View>
          <IconChip
            icon={netCashFlow >= 0 ? TrendingUp : TrendingDown}
            surface="white"
            size="lg"
            style={{ marginRight: -10 }}
          />
        </BentoCard>

        {/* 2x2 stat grid */}
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 10,
            justifyContent: "space-between",
          }}
        >
          <StatCard
            surface="sage"
            icon={Coins}
            title="Income"
            value={formatCurrency(budget?.totalIncome ?? 0).replace(
              /\.\d+$/,
              ""
            )}
            meta={`${monthLong}`}
            isLoading={budgetQuery.isLoading}
          />
          <StatCard
            surface="peach"
            icon={ReceiptText}
            title="Expenses"
            value={formatCurrency(budget?.totalExpenses ?? 0).replace(
              /\.\d+$/,
              ""
            )}
            meta="this month"
            isLoading={budgetQuery.isLoading}
          />
          <StatCard
            surface="lav"
            icon={PiggyBank}
            title="Savings"
            value={formatCurrency(budget?.savings.actual ?? 0).replace(
              /\.\d+$/,
              ""
            )}
            meta="vs target"
            isLoading={budgetQuery.isLoading}
          />
          <StatCard
            surface="lemon"
            icon={Star}
            title="Rate"
            value={`${(budget?.savingsRate ?? 0).toFixed(1)}%`}
            meta="goal 20%"
            isLoading={budgetQuery.isLoading}
          />
        </View>

        {/* Budget */}
        <BentoCard surface="lemon" padded={false} style={{ padding: 16 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 12,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontSize: 14, fontWeight: "700", color: colors.ink }}
              >
                50/30/20 Budget
              </Text>
              <Text
                style={{ fontSize: 11, color: colors.inkSoft, marginTop: 2 }}
              >
                Spending vs. your goals
              </Text>
            </View>
            <IconChip icon={ClipboardList} surface="white" size="lg" />
          </View>

          {showBudgetSkeleton ? (
            <View style={{ gap: 10 }}>
              {[1, 2, 3].map((i) => (
                <View
                  key={i}
                  style={{
                    height: 28,
                    borderRadius: 8,
                    backgroundColor: "rgba(0,0,0,0.07)",
                  }}
                />
              ))}
            </View>
          ) : budget ? (
            <View style={{ gap: 10 }}>
              <BudgetProgress
                label="Needs"
                actual={budget.needs.actual}
                target={budget.needs.target}
                color={colors.cat.blue}
              />
              <BudgetProgress
                label="Wants"
                actual={budget.wants.actual}
                target={budget.wants.target}
                color={colors.cat.pink}
              />
              <BudgetProgress
                label="Savings"
                actual={budget.savings.actual}
                target={budget.savings.target}
                color={colors.cat.emerald}
              />
            </View>
          ) : (
            <View style={{ alignItems: "center", paddingVertical: 16 }}>
              <IconChip icon={FileSpreadsheet} surface="white" size="lg" />
              <Text
                style={{
                  color: colors.inkSoft,
                  marginTop: 8,
                  fontSize: 13,
                  textAlign: "center",
                }}
              >
                Import transactions to see your 50/30/20.
              </Text>
            </View>
          )}
        </BentoCard>

        {/* Recent activity */}
        <View style={{ gap: 6 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "baseline",
              paddingHorizontal: 4,
              marginBottom: 4,
            }}
          >
            <Text
              style={{ fontSize: 14, fontWeight: "700", color: colors.ink }}
            >
              Recent activity
            </Text>
            <Link href="/(tabs)/transactions" asChild>
              <Pressable>
                <Text
                  style={{
                    fontSize: 11,
                    color: colors.cat.emerald,
                    fontWeight: "600",
                  }}
                >
                  View all →
                </Text>
              </Pressable>
            </Link>
          </View>

          {showTransactionsSkeleton ? (
            <View style={{ gap: 6 }}>
              {[1, 2, 3].map((i) => (
                <View
                  key={i}
                  style={{
                    height: 56,
                    borderRadius: 14,
                    backgroundColor: colors.surface.white,
                  }}
                />
              ))}
            </View>
          ) : transactions.length > 0 ? (
            <View style={{ gap: 6 }}>
              {transactions.map((transaction: Transaction) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                />
              ))}
            </View>
          ) : (
            <BentoCard surface="white">
              <View style={{ alignItems: "center", paddingVertical: 20 }}>
                <IconChip icon={ReceiptText} surface="linen" size="lg" />
                <Text
                  style={{ color: colors.ink, marginTop: 8, fontWeight: "700" }}
                >
                  No transactions yet
                </Text>
                <Link href="/(tabs)/transactions" asChild>
                  <Pressable
                    style={{
                      marginTop: 12,
                      paddingHorizontal: 18,
                      paddingVertical: 10,
                      borderRadius: 14,
                      backgroundColor: colors.ink,
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "700" }}>
                      Import transactions
                    </Text>
                  </Pressable>
                </Link>
              </View>
            </BentoCard>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
