import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useTheme } from "@/lib/theme/provider";
import { Ionicons } from "@expo/vector-icons";

interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  color: string;
  isLoading?: boolean;
}

const iconMap = new Map<string, keyof typeof Ionicons.glyphMap>([
  ["wallet", "wallet"],
  ["trending-down", "trending-down"],
  ["piggy-bank", "cash"],
  ["percent", "analytics"],
]);

export function StatCard({
  title,
  value,
  icon,
  color,
  isLoading,
}: StatCardProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
        <Ionicons
          name={iconMap.get(icon) || "stats-chart"}
          size={20}
          color={color}
        />
      </View>
      <Text style={[styles.title, { color: colors.textMuted }]}>{title}</Text>
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: "45%",
    borderRadius: 12,
    padding: 16,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 13,
    marginBottom: 4,
  },
  value: {
    fontSize: 18,
    fontWeight: "700",
  },
});
