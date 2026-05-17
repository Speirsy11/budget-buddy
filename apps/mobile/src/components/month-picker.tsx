import { View, Text, Pressable } from "react-native";
import { useTheme } from "@/lib/theme/provider";

interface MonthPickerProps {
  month: number; // 1-12
  year: number;
  onPrev: () => void;
  onNext: () => void;
}

const monthShort = (m: number) =>
  ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][
    m - 1
  ] ?? "";

export function MonthPicker({ month, year, onPrev, onNext }: MonthPickerProps) {
  const { colors, radius, shadow } = useTheme();
  const prevMonth = month === 1 ? 12 : month - 1;
  const nextMonth = month === 12 ? 1 : month + 1;

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <Pressable
        onPress={onPrev}
        style={[
          {
            backgroundColor: colors.surface.white,
            borderRadius: radius.pill,
            paddingHorizontal: 10,
            paddingVertical: 7,
          },
          shadow.card,
        ]}
      >
        <Text style={{ fontSize: 12, fontWeight: "600", color: colors.ink }}>
          ◀ {monthShort(prevMonth)}
        </Text>
      </Pressable>
      <View
        style={{
          backgroundColor: colors.ink,
          borderRadius: radius.pill,
          paddingHorizontal: 14,
          paddingVertical: 7,
        }}
      >
        <Text style={{ fontSize: 12, fontWeight: "700", color: "#fff" }}>
          {monthShort(month)} {year}
        </Text>
      </View>
      <Pressable
        onPress={onNext}
        style={[
          {
            backgroundColor: colors.surface.white,
            borderRadius: radius.pill,
            paddingHorizontal: 10,
            paddingVertical: 7,
          },
          shadow.card,
        ]}
      >
        <Text style={{ fontSize: 12, fontWeight: "600", color: colors.ink }}>
          {monthShort(nextMonth)} ▶
        </Text>
      </Pressable>
    </View>
  );
}
