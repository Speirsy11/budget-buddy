import { View, Text, ActivityIndicator } from "react-native";
import { useTheme } from "@/lib/theme/provider";
import { Mascot, type MascotName } from "@/components/mascot";

type SurfaceKey = "sage" | "peach" | "sky" | "lav" | "lemon" | "linen" | "white";

interface StatCardProps {
  title: string;
  value: string;
  mascot: MascotName;
  surface: SurfaceKey;
  meta?: string;
  isLoading?: boolean;
}

export function StatCard({
  title,
  value,
  mascot,
  surface,
  meta,
  isLoading,
}: StatCardProps) {
  const { colors, radius, shadow } = useTheme();
  // eslint-disable-next-line security/detect-object-injection -- key from SurfaceKey union
  const bg = colors.surface[surface];
  const deep =
    surface === "linen" || surface === "white"
      ? colors.inkSoft
      : colors.deep[surface as keyof typeof colors.deep];

  return (
    <View
      style={[
        {
          width: "48%",
          backgroundColor: bg,
          borderRadius: radius.bento,
          paddingHorizontal: 14,
          paddingVertical: 12,
          overflow: "hidden",
          position: "relative",
        },
        shadow.card,
      ]}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: "600", color: deep }}>
          {title}
        </Text>
        <Mascot
          name={mascot}
          size={36}
          style={{ marginTop: -4, marginRight: -6 }}
        />
      </View>
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={colors.primary}
          style={{ marginTop: 8, alignSelf: "flex-start" }}
        />
      ) : (
        <Text
          style={{
            fontSize: 26,
            fontWeight: "800",
            marginTop: 4,
            letterSpacing: -0.5,
            lineHeight: 28,
            color: colors.ink,
          }}
        >
          {value}
        </Text>
      )}
      {meta && (
        <Text style={{ fontSize: 10, color: colors.inkSoft, marginTop: 4 }}>
          {meta}
        </Text>
      )}
    </View>
  );
}
