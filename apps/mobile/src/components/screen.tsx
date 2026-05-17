import {
  SafeAreaView,
  ScrollView,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useTheme } from "@/lib/theme/provider";

interface ScreenProps {
  children: React.ReactNode;
  /** Disable the ScrollView wrapping — use a plain View. */
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}

export function Screen({ children, scroll = true, contentStyle }: ScreenProps) {
  const { colors } = useTheme();

  if (!scroll) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View
          style={[
            { flex: 1, padding: 18, paddingBottom: 100 },
            contentStyle,
          ]}
        >
          {children}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={[
          {
            padding: 18,
            paddingBottom: 110,
            gap: 12,
          },
          contentStyle,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
