import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ClerkProvider, ClerkLoaded } from "@clerk/clerk-expo";
import { TRPCProvider } from "@/lib/trpc/provider";
import { tokenCache } from "@/lib/auth/token-cache";
import { ThemeProvider } from "@/lib/theme/provider";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { isMockAuthMode } from "@/lib/auth/mock-mode";
import { LogBox } from "react-native";

LogBox.ignoreAllLogs();

const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
if (!clerkPublishableKey && !isMockAuthMode) {
  throw new Error(
    "Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY. Please set it in your .env file."
  );
}

function AppProviders() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <TRPCProvider>
          <Slot />
          <StatusBar style="auto" />
        </TRPCProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  if (isMockAuthMode) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AppProviders />
      </GestureHandlerRootView>
    );
  }

  if (!clerkPublishableKey) {
    throw new Error(
      "Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY. Please set it in your .env file."
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ClerkProvider
        publishableKey={clerkPublishableKey}
        tokenCache={tokenCache}
      >
        <ClerkLoaded>
          <AppProviders />
        </ClerkLoaded>
      </ClerkProvider>
    </GestureHandlerRootView>
  );
}
