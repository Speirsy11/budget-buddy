import { View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Mascot, type MascotName } from "./mascot";
import { useTheme } from "@/lib/theme/provider";

type TabKey = "index" | "transactions" | "budget" | "analytics" | "banking" | "settings";

const TAB_CONFIG: Record<
  TabKey,
  { mascot: MascotName; surface: "sage" | "peach" | "sky" | "lav" | "lemon" | "linen" }
> = {
  index: { mascot: "coins", surface: "sage" },
  transactions: { mascot: "receipt", surface: "peach" },
  budget: { mascot: "pie", surface: "sky" },
  analytics: { mascot: "bars", surface: "lav" },
  banking: { mascot: "bank", surface: "lemon" },
  settings: { mascot: "shield", surface: "linen" },
};

export function BuddyTabBar({ state, navigation }: BottomTabBarProps) {
  const { colors, radius, shadow } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        {
          position: "absolute",
          left: 16,
          right: 16,
          bottom: insets.bottom > 0 ? insets.bottom : 12,
          flexDirection: "row",
          justifyContent: "space-around",
          alignItems: "center",
          backgroundColor: colors.sidebar,
          borderRadius: 22,
          paddingHorizontal: 8,
          paddingVertical: 8,
        },
        shadow.card,
      ]}
    >
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const config = TAB_CONFIG[route.name as TabKey] ?? TAB_CONFIG.index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: radius.pill,
              backgroundColor: isFocused
                ? colors.surface[config.surface]
                : "transparent",
            }}
          >
            <Mascot name={config.mascot} size={28} />
          </Pressable>
        );
      })}
    </View>
  );
}
