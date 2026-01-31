import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/lib/theme/provider";

interface MonthData {
  month: string;
  income: number;
  expenses: number;
}

interface MonthlyComparisonChartProps {
  data: MonthData[];
}

export function MonthlyComparisonChart({ data }: MonthlyComparisonChartProps) {
  const { colors } = useTheme();
  const height = 200;

  if (data.length === 0) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          No data available
        </Text>
      </View>
    );
  }

  const maxValue = Math.max(...data.map((d) => Math.max(d.income, d.expenses)));

  return (
    <View style={styles.container}>
      <View style={[styles.chartArea, { height }]}>
        {data.slice(-6).map((item, index) => {
          const incomeHeight = (item.income / maxValue) * (height - 60);
          const expenseHeight = (item.expenses / maxValue) * (height - 60);
          const monthLabel = item.month.slice(0, 3);

          return (
            <View key={index} style={styles.monthGroup}>
              <View style={styles.barsRow}>
                <View
                  style={[
                    styles.bar,
                    { height: incomeHeight, backgroundColor: "#22c55e" },
                  ]}
                />
                <View
                  style={[
                    styles.bar,
                    { height: expenseHeight, backgroundColor: "#ef4444" },
                  ]}
                />
              </View>
              <Text style={[styles.monthLabel, { color: colors.textMuted }]}>
                {monthLabel}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#22c55e" }]} />
          <Text style={[styles.legendText, { color: colors.textMuted }]}>
            Income
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#ef4444" }]} />
          <Text style={[styles.legendText, { color: colors.textMuted }]}>
            Expenses
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  chartArea: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    paddingBottom: 24,
  },
  monthGroup: {
    alignItems: "center",
  },
  barsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
  },
  bar: {
    width: 16,
    borderRadius: 4,
    minHeight: 4,
  },
  monthLabel: {
    fontSize: 12,
    marginTop: 8,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 13,
  },
  empty: {
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
  },
});
