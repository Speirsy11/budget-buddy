import { View, Text, Pressable } from "react-native";
import { useTheme } from "@/lib/theme/provider";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { Ionicons } from "@expo/vector-icons";
import type { Transaction } from "@/lib/trpc/client";

interface TransactionItemProps {
  transaction: Transaction;
  onClassify?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

function categoryAccent(
  category: string | null,
  necessityType: "need" | "want" | "savings" | null,
  cat: ReturnType<typeof useTheme>["colors"]["cat"]
): string {
  if (necessityType === "savings") return cat.emerald;
  if (necessityType === "want") return cat.pink;
  if (necessityType === "need") return cat.blue;

  const c = category?.toLowerCase() ?? "";
  if (/transport|fuel|car/.test(c)) return cat.amber;
  if (/entertain|stream/.test(c)) return cat.violet;
  if (/shop|cloth/.test(c)) return cat.amber;
  if (/grocer|food|restaurant/.test(c)) return cat.blue;
  return cat.blue;
}

export function TransactionItem({
  transaction,
  onClassify,
  onDelete,
  showActions = false,
}: TransactionItemProps) {
  const { colors, radius, shadow } = useTheme();
  const accent = categoryAccent(
    transaction.category?.name ?? null,
    transaction.category?.necessityType ?? null,
    colors.cat
  );
  const isExpense = transaction.amount < 0;

  return (
    <View
      style={[
        {
          backgroundColor: colors.surface.white,
          borderRadius: radius.pill,
          overflow: "hidden",
          position: "relative",
        },
        shadow.card,
      ]}
    >
      {/* Coloured left border */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 4,
          height: "100%",
          backgroundColor: accent,
        }}
      />

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 10,
          paddingLeft: 16,
          paddingRight: 14,
        }}
      >
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={{ fontSize: 14, fontWeight: "600", color: colors.ink }}
            numberOfLines={1}
          >
            {transaction.merchant || transaction.description}
          </Text>
          <Text style={{ fontSize: 10, color: colors.muted, marginTop: 2 }}>
            {transaction.category?.name ?? "Uncategorised"} ·{" "}
            {formatDate(transaction.date)}
          </Text>
        </View>

        <Text
          style={{
            fontSize: 15,
            fontWeight: "800",
            color: isExpense ? colors.ink : colors.cat.emerald,
            letterSpacing: -0.3,
          }}
        >
          {isExpense ? "−" : "+"}
          {formatCurrency(Math.abs(transaction.amount))}
        </Text>
      </View>

      {showActions && (
        <View
          style={{
            flexDirection: "row",
            borderTopWidth: 1,
            borderTopColor: "rgba(0,0,0,0.05)",
          }}
        >
          <Pressable
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              paddingVertical: 10,
            }}
            onPress={onClassify}
          >
            <Ionicons name="sparkles" size={16} color={colors.cat.emerald} />
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: colors.cat.emerald,
              }}
            >
              Classify
            </Text>
          </Pressable>
          <Pressable
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              paddingVertical: 10,
            }}
            onPress={onDelete}
          >
            <Ionicons name="trash" size={16} color={colors.deep.peach} />
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: colors.deep.peach,
              }}
            >
              Delete
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
