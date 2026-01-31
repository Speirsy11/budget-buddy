import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "@/lib/theme/provider";
import {
  formatCurrency,
  formatDate,
  getCategoryColor,
  getBudgetCategoryColor,
} from "@/lib/utils/format";
import { Ionicons } from "@expo/vector-icons";

interface Transaction {
  id: string;
  amount: number;
  date: Date;
  description: string;
  merchant: string | null;
  category: string | null;
  budgetCategory: string | null;
}

interface TransactionItemProps {
  transaction: Transaction;
  onClassify?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

export function TransactionItem({
  transaction,
  onClassify,
  onDelete,
  showActions = false,
}: TransactionItemProps) {
  const { colors } = useTheme();
  const categoryColor = getCategoryColor(transaction.category);
  const budgetColors = getBudgetCategoryColor(transaction.budgetCategory);

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.mainContent}>
        {/* Category Icon */}
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: `${categoryColor}20` },
          ]}
        >
          <Ionicons
            name={getIconForCategory(transaction.category)}
            size={20}
            color={categoryColor}
          />
        </View>

        {/* Transaction Details */}
        <View style={styles.details}>
          <Text
            style={[styles.description, { color: colors.text }]}
            numberOfLines={1}
          >
            {transaction.merchant || transaction.description}
          </Text>
          <View style={styles.metaRow}>
            <Text style={[styles.date, { color: colors.textMuted }]}>
              {formatDate(transaction.date)}
            </Text>
            {transaction.category && (
              <View
                style={[
                  styles.categoryBadge,
                  { backgroundColor: `${categoryColor}20` },
                ]}
              >
                <Text style={[styles.categoryText, { color: categoryColor }]}>
                  {transaction.category}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Amount */}
        <View style={styles.amountContainer}>
          <Text
            style={[
              styles.amount,
              { color: transaction.amount < 0 ? colors.text : "#22c55e" },
            ]}
          >
            {transaction.amount < 0 ? "-" : "+"}
            {formatCurrency(Math.abs(transaction.amount))}
          </Text>
          {transaction.budgetCategory && (
            <View
              style={[styles.budgetBadge, { backgroundColor: budgetColors.bg }]}
            >
              <Text style={[styles.budgetText, { color: budgetColors.text }]}>
                {transaction.budgetCategory}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Actions */}
      {showActions && (
        <View style={[styles.actions, { borderTopColor: colors.border }]}>
          <TouchableOpacity style={styles.actionButton} onPress={onClassify}>
            <Ionicons name="sparkles" size={16} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.primary }]}>
              Classify
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
            <Ionicons name="trash" size={16} color={colors.error} />
            <Text style={[styles.actionText, { color: colors.error }]}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function getIconForCategory(
  category: string | null
): keyof typeof Ionicons.glyphMap {
  const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
    housing: "home",
    transportation: "car",
    food: "restaurant",
    utilities: "flash",
    healthcare: "medkit",
    insurance: "shield",
    entertainment: "game-controller",
    shopping: "cart",
    savings: "wallet",
    income: "trending-up",
  };
  return icons[category?.toLowerCase() || ""] || "receipt";
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: "hidden",
  },
  mainContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  details: {
    flex: 1,
  },
  description: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  date: {
    fontSize: 13,
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  amountContainer: {
    alignItems: "flex-end",
  },
  amount: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  budgetBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  budgetText: {
    fontSize: 10,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  actions: {
    flexDirection: "row",
    borderTopWidth: 1,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
  },
  actionText: {
    fontSize: 13,
    fontWeight: "500",
  },
});
