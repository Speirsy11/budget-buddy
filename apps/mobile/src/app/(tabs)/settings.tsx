import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useTheme } from "@/lib/theme/provider";
import { Ionicons } from "@expo/vector-icons";

export default function SettingsScreen() {
  const { colors } = useTheme();
  const { signOut } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/(auth)/sign-in");
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Profile Section */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Profile
        </Text>
        <View style={styles.profileRow}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {user?.firstName?.[0] ||
                user?.emailAddresses[0]?.emailAddress[0]?.toUpperCase() ||
                "U"}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>
              {user?.fullName || "User"}
            </Text>
            <Text style={[styles.profileEmail, { color: colors.textMuted }]}>
              {user?.emailAddresses[0]?.emailAddress}
            </Text>
          </View>
        </View>
      </View>

      {/* Preferences Section */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Preferences
        </Text>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="notifications" size={20} color={colors.primary} />
            <View style={styles.settingText}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Budget Alerts
              </Text>
              <Text
                style={[styles.settingDescription, { color: colors.textMuted }]}
              >
                Get notified when approaching limits
              </Text>
            </View>
          </View>
          <Switch
            value={true}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="mail" size={20} color={colors.primary} />
            <View style={styles.settingText}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Weekly Summary
              </Text>
              <Text
                style={[styles.settingDescription, { color: colors.textMuted }]}
              >
                Receive weekly spending summary
              </Text>
            </View>
          </View>
          <Switch
            value={false}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="warning" size={20} color={colors.primary} />
            <View style={styles.settingText}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Large Transaction Alerts
              </Text>
              <Text
                style={[styles.settingDescription, { color: colors.textMuted }]}
              >
                Notify for transactions over £100
              </Text>
            </View>
          </View>
          <Switch
            value={true}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>
      </View>

      {/* Data Section */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Data</Text>
        <TouchableOpacity
          style={styles.settingRow}
          onPress={() => {
            Alert.alert(
              "Export Data",
              "To export your data, please use the web app."
            );
          }}
        >
          <View style={styles.settingInfo}>
            <Ionicons name="download" size={20} color={colors.primary} />
            <View style={styles.settingText}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Export Data
              </Text>
              <Text
                style={[styles.settingDescription, { color: colors.textMuted }]}
              >
                Download your data as CSV or JSON
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* About Section */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
        <View style={styles.aboutRow}>
          <Text style={[styles.aboutLabel, { color: colors.textMuted }]}>
            Version
          </Text>
          <Text style={[styles.aboutValue, { color: colors.text }]}>1.0.0</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <TouchableOpacity style={styles.aboutRow}>
          <Text style={[styles.aboutLabel, { color: colors.textMuted }]}>
            Privacy Policy
          </Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <TouchableOpacity style={styles.aboutRow}>
          <Text style={[styles.aboutLabel, { color: colors.textMuted }]}>
            Terms of Service
          </Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity
        style={[
          styles.signOutButton,
          { backgroundColor: colors.errorBackground },
        ]}
        onPress={handleSignOut}
      >
        <Ionicons name="log-out" size={20} color={colors.error} />
        <Text style={[styles.signOutText, { color: colors.error }]}>
          Sign Out
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "600",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  settingDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  aboutRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  aboutLabel: {
    fontSize: 16,
  },
  aboutValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
