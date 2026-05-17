import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useTheme } from "@/lib/theme/provider";
import { Ionicons } from "@expo/vector-icons";
import { isMockAuthMode, mockUser } from "@/lib/auth/mock-mode";
import { Mascot } from "@/components/mascot";
import { GreetingHeader } from "@/components/greeting-header";

type SettingsUser = {
  firstName?: string | null;
  fullName?: string | null;
  emailAddresses: Array<{ emailAddress: string }>;
};

type SettingsContentProps = {
  user: SettingsUser;
  signOut: () => Promise<unknown>;
};

export default function SettingsScreen() {
  if (isMockAuthMode) {
    return <SettingsContent signOut={async () => undefined} user={mockUser} />;
  }

  return <AuthenticatedSettingsScreen />;
}

function AuthenticatedSettingsScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();

  return (
    <SettingsContent
      signOut={signOut}
      user={{
        firstName: user?.firstName,
        fullName: user?.fullName,
        emailAddresses: user?.emailAddresses ?? [],
      }}
    />
  );
}

function SettingsContent({ user, signOut }: SettingsContentProps) {
  const { colors } = useTheme();
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <GreetingHeader
          mascot="peaceful"
          title="Settings"
          insight="Make Buddy yours"
          insightTone="muted"
        />
        <View style={{ height: 6 }} />

      {/* Profile Section */}
      <View style={[styles.section, { backgroundColor: colors.surface.sage }]}>
        <Text style={[styles.sectionTitle, { color: colors.deep.sage }]}>
          Profile
        </Text>
        <View style={styles.profileRow}>
          <Mascot name="wave" size={56} />
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.ink }]}>
              {user?.fullName || "User"}
            </Text>
            <Text style={[styles.profileEmail, { color: colors.inkSoft }]}>
              {user?.emailAddresses[0]?.emailAddress}
            </Text>
          </View>
        </View>
      </View>

      {/* Preferences Section */}
      <View style={[styles.section, { backgroundColor: colors.surface.sky }]}>
        <Text style={[styles.sectionTitle, { color: colors.deep.sky }]}>
          Preferences
        </Text>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="notifications" size={20} color={colors.primary} />
            <View style={styles.settingText}>
              <Text style={[styles.settingLabel, { color: colors.ink }]}>
                Budget Alerts
              </Text>
              <Text
                style={[styles.settingDescription, { color: colors.inkSoft }]}
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
        <View style={[styles.divider, { backgroundColor: "rgba(0,0,0,0.07)" }]} />
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="mail" size={20} color={colors.primary} />
            <View style={styles.settingText}>
              <Text style={[styles.settingLabel, { color: colors.ink }]}>
                Weekly Summary
              </Text>
              <Text
                style={[styles.settingDescription, { color: colors.inkSoft }]}
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
        <View style={[styles.divider, { backgroundColor: "rgba(0,0,0,0.07)" }]} />
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="warning" size={20} color={colors.primary} />
            <View style={styles.settingText}>
              <Text style={[styles.settingLabel, { color: colors.ink }]}>
                Large Transaction Alerts
              </Text>
              <Text
                style={[styles.settingDescription, { color: colors.inkSoft }]}
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
      <View style={[styles.section, { backgroundColor: colors.surface.linen }]}>
        <Text style={[styles.sectionTitle, { color: colors.inkSoft }]}>Data</Text>
        <TouchableOpacity
          style={styles.settingRow}
          onPress={() => router.push("/(tabs)/banking" as never)}
        >
          <View style={styles.settingInfo}>
            <Mascot name="bank" size={28} />
            <View style={styles.settingText}>
              <Text style={[styles.settingLabel, { color: colors.ink }]}>
                Open Banking
              </Text>
              <Text
                style={[styles.settingDescription, { color: colors.inkSoft }]}
              >
                Connect or sync UK bank accounts
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: "rgba(0,0,0,0.07)" }]} />
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
            <Mascot name="csv" size={28} />
            <View style={styles.settingText}>
              <Text style={[styles.settingLabel, { color: colors.ink }]}>
                Export Data
              </Text>
              <Text
                style={[styles.settingDescription, { color: colors.inkSoft }]}
              >
                Download your data as CSV or JSON
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        </TouchableOpacity>
      </View>

      {/* About Section */}
      <View style={[styles.section, { backgroundColor: colors.surface.white }]}>
        <Text style={[styles.sectionTitle, { color: colors.inkSoft }]}>About</Text>
        <View style={styles.aboutRow}>
          <Text style={[styles.aboutLabel, { color: colors.inkSoft }]}>
            Version
          </Text>
          <Text style={[styles.aboutValue, { color: colors.ink }]}>1.0.0</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: "rgba(0,0,0,0.07)" }]} />
        <TouchableOpacity style={styles.aboutRow}>
          <Text style={[styles.aboutLabel, { color: colors.inkSoft }]}>
            Privacy Policy
          </Text>
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: "rgba(0,0,0,0.07)" }]} />
        <TouchableOpacity style={styles.aboutRow}>
          <Text style={[styles.aboutLabel, { color: colors.inkSoft }]}>
            Terms of Service
          </Text>
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        </TouchableOpacity>
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity
        style={[
          styles.signOutButton,
          { backgroundColor: colors.surface.peach },
        ]}
        onPress={handleSignOut}
      >
        <Mascot name="concerned" size={24} />
        <Text style={[styles.signOutText, { color: colors.deep.peach }]}>
          Sign Out
        </Text>
      </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 18,
    paddingBottom: 110,
  },
  section: {
    borderRadius: 28,
    padding: 18,
    marginBottom: 12,
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
    gap: 10,
    padding: 16,
    borderRadius: 18,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
