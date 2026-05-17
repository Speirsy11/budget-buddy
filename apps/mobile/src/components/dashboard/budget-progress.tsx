import { View, Text } from "react-native";
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

  return (
    <View style={{ gap: 6 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: color,
            }}
          />
          <Text style={{ fontSize: 12, fontWeight: "600", color: colors.ink }}>
            {label}
          </Text>
        </View>
        <Text style={{ fontSize: 11, color: colors.inkSoft }}>
          {formatCurrency(actual)} / {formatCurrency(target)}
        </Text>
      </View>
      <View
        style={{
          height: 11,
          borderRadius: 6,
          backgroundColor: "rgba(0,0,0,0.07)",
          overflow: "hidden",
        }}
      >
        <View
          style={{
            width: `${percentage}%`,
            height: "100%",
            borderRadius: 6,
            backgroundColor: color,
          }}
        />
      </View>
    </View>
  );
}
