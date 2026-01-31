import { View, Text, StyleSheet, Dimensions } from "react-native";
import { useTheme } from "@/lib/theme/provider";
import { formatCurrency } from "@/lib/utils/format";

interface TrendData {
  date: string;
  amount: number;
}

interface SpendingTrendChartProps {
  data: TrendData[];
}

export function SpendingTrendChart({ data }: SpendingTrendChartProps) {
  const { colors } = useTheme();
  const width = Dimensions.get("window").width - 64;
  const height = 180;

  if (data.length === 0) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          No data available
        </Text>
      </View>
    );
  }

  const maxAmount = Math.max(...data.map((d) => d.amount));
  const minAmount = Math.min(...data.map((d) => d.amount));
  const range = maxAmount - minAmount || 1;

  // Simple bar chart representation
  const barWidth = Math.max((width - (data.length - 1) * 4) / data.length, 4);

  return (
    <View style={styles.container}>
      <View style={[styles.chartArea, { height }]}>
        <View style={styles.barsContainer}>
          {data.slice(-12).map((item, index) => {
            const barHeight =
              ((item.amount - minAmount) / range) * (height - 40) + 20;
            return (
              <View key={index} style={styles.barWrapper}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      backgroundColor: colors.primary,
                      width: Math.min(barWidth, 24),
                    },
                  ]}
                />
              </View>
            );
          })}
        </View>
      </View>
      <View style={styles.legend}>
        <Text style={[styles.legendText, { color: colors.textMuted }]}>
          Min: {formatCurrency(minAmount)}
        </Text>
        <Text style={[styles.legendText, { color: colors.textMuted }]}>
          Max: {formatCurrency(maxAmount)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  chartArea: {
    overflow: "hidden",
  },
  barsContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  barWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  bar: {
    borderRadius: 4,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  legendText: {
    fontSize: 12,
  },
  empty: {
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
  },
});
