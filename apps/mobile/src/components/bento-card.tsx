import {
  View,
  type ViewProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useTheme } from "@/lib/theme/provider";

type SurfaceKey =
  | "sage"
  | "peach"
  | "sky"
  | "lav"
  | "lemon"
  | "linen"
  | "white";

interface BentoCardProps extends ViewProps {
  surface?: SurfaceKey;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function BentoCard({
  surface = "white",
  padded = true,
  style,
  children,
  ...rest
}: BentoCardProps) {
  const { colors, radius, shadow } = useTheme();
  // eslint-disable-next-line security/detect-object-injection -- key from SurfaceKey union
  const backgroundColor = colors.surface[surface];

  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor,
          borderRadius: radius.bento,
          padding: padded ? 16 : 0,
          overflow: "hidden",
        },
        shadow.card,
        style,
      ]}
    >
      {children}
    </View>
  );
}
