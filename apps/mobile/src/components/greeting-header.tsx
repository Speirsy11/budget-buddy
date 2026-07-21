import { View, Text } from "react-native";
import { useTheme } from "@/lib/theme/provider";

interface GreetingHeaderProps {
  title: string;
  insight?: string;
  insightTone?: "emerald" | "muted";
  trailing?: React.ReactNode;
}

const days = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function GreetingHeader({
  title,
  insight,
  insightTone = "emerald",
  trailing,
}: GreetingHeaderProps) {
  const { colors } = useTheme();
  const today = new Date();
  const eyebrow = `${days[today.getDay()] ?? ""}, ${today.getDate()} ${today.toLocaleString(
    "en-GB",
    { month: "short" }
  )}`;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingTop: 4,
      }}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 11, color: colors.muted }}>{eyebrow}</Text>
        <Text
          style={{
            fontSize: 22,
            fontWeight: "700",
            color: colors.ink,
            letterSpacing: -0.4,
            lineHeight: 26,
          }}
        >
          {title}
        </Text>
        {insight && (
          <Text
            style={{
              fontSize: 12,
              color:
                insightTone === "emerald" ? colors.cat.emerald : colors.muted,
              fontWeight: "600",
              marginTop: 2,
            }}
          >
            {insight}
          </Text>
        )}
      </View>
      {trailing}
    </View>
  );
}
