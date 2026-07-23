import { View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import {
  BarChart3,
  Landmark,
  LayoutGrid,
  PieChart,
  ReceiptText,
  Settings,
  type LucideIcon,
} from "lucide-react-native";
import { useTheme } from "@/lib/theme/provider";

type TabKey =
  | "index"
  | "transactions"
  | "budget"
  | "analytics"
  | "banking"
  | "settings";

type SurfaceKey = "sage" | "peach" | "sky" | "lav" | "lemon" | "linen";

const TAB_CONFIG: Record<
  TabKey,
  {
    icon: LucideIcon;
    surface: SurfaceKey;
    label: string;
  }
> = {
  index: { icon: LayoutGrid, surface: "sage", label: "Overview" },
  transactions: {
    icon: ReceiptText,
    surface: "peach",
    label: "Transactions",
  },
  budget: { icon: PieChart, surface: "sky", label: "Budget" },
  analytics: { icon: BarChart3, surface: "lav", label: "Analytics" },
  banking: { icon: Landmark, surface: "lemon", label: "Open Banking" },
  settings: { icon: Settings, surface: "linen", label: "Settings" },
};

export function TabBar({ state, navigation }: BottomTabBarProps) {
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
        const Icon = config.icon;
        const deepColor =
          config.surface === "linen"
            ? colors.inkSoft
            : colors.deep[config.surface];

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
            accessibilityRole="tab"
            accessibilityLabel={config.label}
            accessibilityState={{ selected: isFocused }}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: radius.pill,
              backgroundColor: isFocused
                ? colors.surface[config.surface]
                : "transparent",
            }}
          >
            <Icon
              size={22}
              strokeWidth={2.25}
              color={isFocused ? deepColor : colors.sidebarMuted}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
