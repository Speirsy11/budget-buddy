import { View, type StyleProp, type ViewStyle } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { useTheme } from "@/lib/theme/provider";

export type IconChipSize = "sm" | "md" | "lg";
export type IconChipSurface =
  | "sage"
  | "peach"
  | "sky"
  | "lav"
  | "lemon"
  | "linen"
  | "white";

const chipSize: Record<IconChipSize, number> = { sm: 32, md: 40, lg: 48 };
const iconSize: Record<IconChipSize, number> = { sm: 16, md: 20, lg: 24 };

export interface IconChipProps {
  icon: LucideIcon;
  surface?: IconChipSurface;
  size?: IconChipSize;
  style?: StyleProp<ViewStyle>;
}

export function IconChip({
  icon: Icon,
  surface = "linen",
  size = "md",
  style,
}: IconChipProps) {
  const { colors, radius } = useTheme();
  // eslint-disable-next-line security/detect-object-injection -- surface from IconChipSurface union
  const bg = colors.surface[surface];
  const tint =
    surface === "linen" || surface === "white"
      ? colors.inkSoft
      : // eslint-disable-next-line security/detect-object-injection -- surface from IconChipSurface union
        colors.deep[surface];

  return (
    <View
      style={[
        {
          // eslint-disable-next-line security/detect-object-injection -- size from IconChipSize union
          width: chipSize[size],
          // eslint-disable-next-line security/detect-object-injection -- size from IconChipSize union
          height: chipSize[size],
          borderRadius: radius.chip,
          backgroundColor: bg,
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      {/* eslint-disable-next-line security/detect-object-injection -- size from IconChipSize union */}
      <Icon size={iconSize[size]} strokeWidth={2.25} color={tint} />
    </View>
  );
}
