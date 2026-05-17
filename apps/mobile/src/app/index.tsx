import { Redirect } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { isMockAuthMode } from "@/lib/auth/mock-mode";

export default function Index() {
  if (isMockAuthMode) {
    return <Redirect href="/(tabs)" />;
  }

  return <AuthenticatedIndex />;
}

function AuthenticatedIndex() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/sign-in" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
});
