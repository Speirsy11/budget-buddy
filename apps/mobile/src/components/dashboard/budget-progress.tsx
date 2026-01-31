import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/lib/theme/provider";
import { formatCurrency } from "@/lib/utils/format";

interface BudgetProgressProps {
  label: string;
  actual: number;
  target: number;
  color: string;
}

export function BudgetProgress({
  label,
  actual,
  target,
  color,
}: BudgetProgressProps) {
  const { colors } = useTheme();
  const percentage = target > 0 ? Math.min((actual / target) * 100, 100) : 0;
  const isOver = actual > target;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.values, { color: colors.textMuted }]}>
          {formatCurrency(actual)} / {formatCurrency(target)}
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${percentage}%`,
              backgroundColor: isOver ? "#ef4444" : color,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
  },
  values: {
    fontSize: 13,
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 4,
  },
});
