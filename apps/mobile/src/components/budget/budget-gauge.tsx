import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/lib/theme/provider";
import { formatCurrency } from "@/lib/utils/format";

interface BudgetGaugeProps {
  label: string;
  percentage: number;
  actual: number;
  target: number;
  status: string;
  color: string;
}

export function BudgetGauge({
  label,
  percentage,
  actual,
  target,
  status,
  color,
}: BudgetGaugeProps) {
  const { colors } = useTheme();
  const progressPercentage =
    target > 0 ? Math.min((actual / target) * 100, 100) : 0;
  const isOver = status === "over";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={styles.labelRow}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
          <Text style={[styles.percentage, { color: colors.textMuted }]}>
            ({percentage}%)
          </Text>
        </View>
        <View style={styles.statusContainer}>
          {isOver ? (
            <View style={[styles.statusBadge, { backgroundColor: "#fef2f2" }]}>
              <Text style={[styles.statusText, { color: "#ef4444" }]}>
                Over
              </Text>
            </View>
          ) : (
            <View style={[styles.statusBadge, { backgroundColor: "#f0fdf4" }]}>
              <Text style={[styles.statusText, { color: "#22c55e" }]}>
                On Track
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Progress Bar */}
      <View style={[styles.track, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${progressPercentage}%`,
              backgroundColor: isOver ? "#ef4444" : color,
            },
          ]}
        />
      </View>

      {/* Values */}
      <View style={styles.valuesRow}>
        <Text
          style={[
            styles.actualValue,
            { color: isOver ? "#ef4444" : colors.text },
          ]}
        >
          {formatCurrency(actual)}
        </Text>
        <Text style={[styles.targetValue, { color: colors.textMuted }]}>
          of {formatCurrency(target)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
  },
  percentage: {
    fontSize: 14,
  },
  statusContainer: {},
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  track: {
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: 8,
  },
  fill: {
    height: "100%",
    borderRadius: 5,
  },
  valuesRow: {
    flexDirection: "row",
    gap: 4,
  },
  actualValue: {
    fontSize: 15,
    fontWeight: "600",
  },
  targetValue: {
    fontSize: 15,
  },
});
