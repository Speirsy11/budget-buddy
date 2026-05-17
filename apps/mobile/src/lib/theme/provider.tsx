import { createContext, useContext, useMemo } from "react";
import { useColorScheme, type ViewStyle } from "react-native";

export interface ThemeSurface {
  sage: string;
  peach: string;
  sky: string;
  lav: string;
  lemon: string;
  linen: string;
  white: string;
}

export interface ThemeDeep {
  sage: string;
  peach: string;
  sky: string;
  lav: string;
  lemon: string;
}

export interface ThemeCat {
  blue: string;
  pink: string;
  emerald: string;
  amber: string;
  violet: string;
}

interface ThemeColors {
  // Legacy keys retained so existing screens keep compiling during the rollout
  primary: string;
  primaryForeground: string;
  background: string;
  card: string;
  text: string;
  textMuted: string;
  border: string;
  inputBackground: string;
  error: string;
  errorBackground: string;
  success: string;
  successBackground: string;
  warning: string;
  warningBackground: string;

  // V1 "Buddy Companion" tokens
  bg: string;
  ink: string;
  inkSoft: string;
  muted: string;
  surface: ThemeSurface;
  deep: ThemeDeep;
  cat: ThemeCat;
  sidebar: string;
  sidebarText: string;
  sidebarMuted: string;
}

interface ThemeContextValue {
  isDark: boolean;
  colors: ThemeColors;
  radius: { bento: number; pill: number; chip: number };
  shadow: { card: ViewStyle; float: ViewStyle };
}

const lightSurface: ThemeSurface = {
  sage: "#BFF0C3",
  peach: "#FFD2BD",
  sky: "#C8DEFC",
  lav: "#E5CFFC",
  lemon: "#FFEFA8",
  linen: "#EFEAE0",
  white: "#FFFFFF",
};

const lightDeep: ThemeDeep = {
  sage: "#155E2C",
  peach: "#7A3214",
  sky: "#1E3A8A",
  lav: "#4C1D95",
  lemon: "#92400E",
};

const cat: ThemeCat = {
  blue: "#3B82F6",
  pink: "#EC4899",
  emerald: "#10B981",
  amber: "#F59E0B",
  violet: "#8B5CF6",
};

const lightColors: ThemeColors = {
  primary: "#10B981",
  primaryForeground: "#FFFFFF",
  background: "#F7F4EE",
  card: "#FFFFFF",
  text: "#22201C",
  textMuted: "#807A6F",
  border: "rgba(0,0,0,0.07)",
  inputBackground: "#FFFFFF",
  error: "#7A3214",
  errorBackground: "#FFD2BD",
  success: "#10B981",
  successBackground: "#BFF0C3",
  warning: "#92400E",
  warningBackground: "#FFEFA8",

  bg: "#F7F4EE",
  ink: "#22201C",
  inkSoft: "#4B4842",
  muted: "#807A6F",
  surface: lightSurface,
  deep: lightDeep,
  cat,
  sidebar: "#1A1814",
  sidebarText: "#F5F0E8",
  sidebarMuted: "#9C958A",
};

const darkSurface: ThemeSurface = {
  sage: "#2B3F2F",
  peach: "#4A2E25",
  sky: "#25324E",
  lav: "#3A2D4E",
  lemon: "#4A3E1F",
  linen: "#2A2724",
  white: "#2A2724",
};

const darkDeep: ThemeDeep = {
  sage: "#BFF0C3",
  peach: "#FFD2BD",
  sky: "#C8DEFC",
  lav: "#E5CFFC",
  lemon: "#FFEFA8",
};

const darkColors: ThemeColors = {
  primary: "#10B981",
  primaryForeground: "#FFFFFF",
  background: "#1A1814",
  card: "#2A2724",
  text: "#F5F0E8",
  textMuted: "#9C958A",
  border: "rgba(255,255,255,0.05)",
  inputBackground: "#2A2724",
  error: "#FFD2BD",
  errorBackground: "#4A2E25",
  success: "#BFF0C3",
  successBackground: "#2B3F2F",
  warning: "#FFEFA8",
  warningBackground: "#4A3E1F",

  bg: "#1A1814",
  ink: "#F5F0E8",
  inkSoft: "#C8C2B5",
  muted: "#9C958A",
  surface: darkSurface,
  deep: darkDeep,
  cat,
  sidebar: "#0F0D0A",
  sidebarText: "#F5F0E8",
  sidebarMuted: "#9C958A",
};

const shadow = {
  light: {
    card: {
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    } satisfies ViewStyle,
    float: {
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    } satisfies ViewStyle,
  },
  dark: {
    card: {
      shadowColor: "#000",
      shadowOpacity: 0.4,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    } satisfies ViewStyle,
    float: {
      shadowColor: "#000",
      shadowOpacity: 0.5,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    } satisfies ViewStyle,
  },
};

const ThemeContext = createContext<ThemeContextValue>({
  isDark: false,
  colors: lightColors,
  radius: { bento: 28, pill: 14, chip: 10 },
  shadow: shadow.light,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const value = useMemo(
    () => ({
      isDark,
      colors: isDark ? darkColors : lightColors,
      radius: { bento: 28, pill: 14, chip: 10 },
      shadow: isDark ? shadow.dark : shadow.light,
    }),
    [isDark]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
