import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/lib/theme/provider";
import { formatCurrency, getCategoryColor } from "@/lib/utils/format";

interface Category {
  category: string;
  total: number;
  percentage: number;
}

interface CategoryBreakdownListProps {
  categories: Category[];
}

export function CategoryBreakdownList({
  categories,
}: CategoryBreakdownListProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {categories.map((category, index) => {
        const color = getCategoryColor(category.category);
        return (
          <View
            key={category.category}
            style={[
              styles.item,
              index !== categories.length - 1 && {
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <View style={styles.left}>
              <View style={[styles.colorDot, { backgroundColor: color }]} />
              <Text style={[styles.categoryName, { color: colors.text }]}>
                {category.category}
              </Text>
            </View>
            <View style={styles.right}>
              <Text style={[styles.amount, { color: colors.text }]}>
                {formatCurrency(category.total)}
              </Text>
              <Text style={[styles.percentage, { color: colors.textMuted }]}>
                {category.percentage.toFixed(1)}%
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 0,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  right: {
    alignItems: "flex-end",
  },
  amount: {
    fontSize: 15,
    fontWeight: "600",
  },
  percentage: {
    fontSize: 13,
    marginTop: 2,
  },
});
