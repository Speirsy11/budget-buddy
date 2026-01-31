import { createContext, useContext, useMemo } from "react";
import { useColorScheme } from "react-native";

interface ThemeColors {
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
}

interface ThemeContextValue {
  isDark: boolean;
  colors: ThemeColors;
}

const lightColors: ThemeColors = {
  primary: "#10b981",
  primaryForeground: "#ffffff",
  background: "#ffffff",
  card: "#f9fafb",
  text: "#111827",
  textMuted: "#6b7280",
  border: "#e5e7eb",
  inputBackground: "#f3f4f6",
  error: "#dc2626",
  errorBackground: "#fef2f2",
  success: "#16a34a",
  successBackground: "#f0fdf4",
  warning: "#d97706",
  warningBackground: "#fffbeb",
};

const darkColors: ThemeColors = {
  primary: "#10b981",
  primaryForeground: "#ffffff",
  background: "#111827",
  card: "#1f2937",
  text: "#f9fafb",
  textMuted: "#9ca3af",
  border: "#374151",
  inputBackground: "#374151",
  error: "#ef4444",
  errorBackground: "#450a0a",
  success: "#22c55e",
  successBackground: "#052e16",
  warning: "#f59e0b",
  warningBackground: "#451a03",
};

const ThemeContext = createContext<ThemeContextValue>({
  isDark: false,
  colors: lightColors,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const value = useMemo(
    () => ({
      isDark,
      colors: isDark ? darkColors : lightColors,
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
