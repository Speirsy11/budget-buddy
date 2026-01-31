import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/lib/theme/provider";
import { Ionicons } from "@expo/vector-icons";

interface InsightCardProps {
  type: "positive" | "negative" | "warning" | "neutral" | "tip";
  title: string;
  description: string;
  value: string;
}

export function InsightCard({
  type,
  title,
  description,
  value,
}: InsightCardProps) {
  const { colors } = useTheme();

  const getColors = () => {
    switch (type) {
      case "positive":
        return { bg: "#f0fdf4", icon: "#22c55e", border: "#bbf7d0" };
      case "negative":
        return { bg: "#fef2f2", icon: "#ef4444", border: "#fecaca" };
      case "warning":
        return { bg: "#fffbeb", icon: "#f59e0b", border: "#fde68a" };
      case "tip":
        return { bg: "#f0f9ff", icon: "#0ea5e9", border: "#bae6fd" };
      default:
        return {
          bg: colors.card,
          icon: colors.textMuted,
          border: colors.border,
        };
    }
  };

  const getIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case "positive":
        return "checkmark-circle";
      case "negative":
        return "alert-circle";
      case "warning":
        return "warning";
      case "tip":
        return "bulb";
      default:
        return "information-circle";
    }
  };

  const typeColors = getColors();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: typeColors.bg, borderColor: typeColors.border },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name={getIcon()} size={20} color={typeColors.icon} />
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        </View>
        <Text style={[styles.value, { color: typeColors.icon }]}>{value}</Text>
      </View>
      <Text style={[styles.description, { color: colors.textMuted }]}>
        {description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  value: {
    fontSize: 16,
    fontWeight: "700",
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
});
