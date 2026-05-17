import { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Mascot } from "@/components/mascot";
import { GreetingHeader } from "@/components/greeting-header";
import {
  create,
  destroy,
  dismissLink,
  LinkIOSPresentationStyle,
  LinkLogLevel,
  open,
  type LinkExit,
  type LinkSuccess,
} from "react-native-plaid-link-sdk";
import { useTheme } from "@/lib/theme/provider";
import { trpc } from "@/lib/trpc/client";

type BankConnection = {
  id: string;
  institutionName: string | null;
  accountIds: string[] | null;
  status: string;
  lastSyncedAt: Date | string | null;
  consentExpiresAt: Date | string | null;
};

type SyncResult = {
  added: number;
  modified: number;
  removed: number;
};

function formatDate(value: Date | string | null) {
  if (!value) {
    return "Never";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function isConsentExpiringSoon(value: Date | string | null) {
  if (!value) {
    return false;
  }

  const consentDate = new Date(value).getTime();
  const sevenDaysFromNow = Date.now() + 7 * 24 * 60 * 60 * 1000;
  return consentDate < sevenDaysFromNow;
}

export default function BankingScreen() {
  const { colors } = useTheme();
  const [syncingConnectionId, setSyncingConnectionId] = useState<string | null>(
    null
  );
  const [removingConnectionId, setRemovingConnectionId] = useState<
    string | null
  >(null);
  const [lastSync, setLastSync] = useState<SyncResult | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const providerStatus = trpc.banking.getProviderStatus.useQuery();
  const connectionsQuery = trpc.banking.listConnections.useQuery();

  const exchangeToken = trpc.banking.exchangeToken.useMutation({
    onSuccess: async (result: { connectionId?: string | null }) => {
      setStatusMessage("Bank connected. Syncing transactions…");
      await utils.banking.listConnections.invalidate();
      if (result.connectionId) {
        syncConnection(result.connectionId);
      }
    },
    onError: (error: Error) => {
      setStatusMessage(error.message);
    },
  });

  const createLinkToken = trpc.banking.createLinkToken.useMutation({
    onSuccess: async (result: { linkToken: string }) => {
      await openPlaidLink(result.linkToken);
    },
    onError: (error: Error) => {
      setStatusMessage(error.message);
    },
  });

  const createUpdateLinkToken = trpc.banking.createUpdateLinkToken.useMutation({
    onSuccess: async (result: { linkToken: string }) => {
      await openPlaidLink(result.linkToken, { updateMode: true });
    },
    onError: (error: Error) => {
      setStatusMessage(error.message);
    },
  });

  const syncMutation = trpc.banking.syncTransactions.useMutation({
    onMutate: ({ connectionId }: { connectionId: string }) => {
      setSyncingConnectionId(connectionId);
      setLastSync(null);
      setStatusMessage("Syncing transactions…");
    },
    onSuccess: async (result: SyncResult) => {
      setSyncingConnectionId(null);
      setLastSync(result);
      setStatusMessage("Sync complete.");
      await Promise.all([
        utils.banking.listConnections.invalidate(),
        utils.transactions.list.invalidate(),
        utils.analytics.invalidate(),
      ]);
    },
    onError: (error: Error) => {
      setSyncingConnectionId(null);
      setStatusMessage(error.message);
    },
  });

  const removeConnection = trpc.banking.removeConnection.useMutation({
    onMutate: ({ connectionId }: { connectionId: string }) => {
      setRemovingConnectionId(connectionId);
    },
    onSuccess: async () => {
      setRemovingConnectionId(null);
      setStatusMessage("Bank connection removed.");
      await utils.banking.listConnections.invalidate();
    },
    onError: (error: Error) => {
      setRemovingConnectionId(null);
      setStatusMessage(error.message);
    },
  });

  const syncConnection = useCallback(
    (connectionId: string) => {
      syncMutation.mutate({ connectionId });
    },
    [syncMutation]
  );

  const openPlaidLink = useCallback(
    async (linkToken: string, options?: { updateMode?: boolean }) => {
      try {
        await destroy();
      } catch {
        // Best-effort cleanup before starting a new Link session.
      }

      create({
        token: linkToken,
        logLevel: LinkLogLevel.ERROR,
      });

      open({
        iOSPresentationStyle: LinkIOSPresentationStyle.MODAL,
        logLevel: LinkLogLevel.ERROR,
        onSuccess: (success: LinkSuccess) => {
          if (options?.updateMode) {
            setStatusMessage("Bank re-authenticated. Sync when ready.");
            utils.banking.listConnections.invalidate();
            return;
          }

          exchangeToken.mutate({
            publicToken: success.publicToken,
            institutionId: success.metadata.institution?.id,
            institutionName: success.metadata.institution?.name,
          });
        },
        onExit: (exit: LinkExit) => {
          dismissLink();
          if (exit.error) {
            setStatusMessage(
              exit.error.displayMessage ?? exit.error.errorMessage
            );
          }
        },
      });
    },
    [exchangeToken, utils.banking.listConnections]
  );

  const handleConnect = () => {
    setStatusMessage(null);
    setLastSync(null);
    createLinkToken.mutate({
      ...(Platform.OS === "android" && {
        androidPackageName: "com.finance.budgetbuddy",
      }),
    });
  };

  const handleRemove = (connectionId: string) => {
    Alert.alert(
      "Remove bank connection?",
      "BudgetBuddy will attempt to revoke access with Plaid. Imported transactions will stay in your dashboard.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => removeConnection.mutate({ connectionId }),
        },
      ]
    );
  };

  const configured = providerStatus.data?.configured ?? false;
  const openBankingEnabled = providerStatus.data?.openBankingEnabled ?? false;
  const connections = (connectionsQuery.data ?? []) as BankConnection[];
  const isPreparingLink =
    createLinkToken.isPending ||
    exchangeToken.isPending ||
    createUpdateLinkToken.isPending;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <GreetingHeader
          mascot="pointer"
          title="Connect your bank"
          insight="UK Open Banking via Plaid"
          insightTone="muted"
        />
        <View style={[styles.heroCard, { backgroundColor: colors.surface.sage }]}>
          <View style={styles.heroHeader}>
            <Mascot name="shield" size={56} />
            <View style={styles.heroCopy}>
              <Text style={[styles.heroTitle, { color: colors.ink }]}>
                Privacy first
              </Text>
              <Text style={[styles.heroSubtitle, { color: colors.deep.sage }]}>
                Plaid handles bank consent; BudgetBuddy stores only the
                server-side access token. Disconnect any time.
              </Text>
            </View>
          </View>

        <View style={styles.statusGrid}>
          <StatusPill
            label={configured ? "Plaid configured" : "Needs Plaid env"}
            tone={configured ? "success" : "warning"}
          />
          <StatusPill
            label={openBankingEnabled ? "Plan enabled" : "Pro required"}
            tone={openBankingEnabled ? "success" : "warning"}
          />
          <StatusPill
            label={`${connections.length} connected`}
            tone="neutral"
          />
        </View>

        {!configured ? (
          <WarningBox text="Add PLAID_CLIENT_ID, PLAID_SECRET, and PLAID_ENV to the API environment before connecting accounts." />
        ) : null}
        {!openBankingEnabled ? (
          <WarningBox text="Open Banking is currently Pro-gated by the API. Use a Pro/trial dev user to test the live flow." />
        ) : null}

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Connect bank account"
          style={[
            styles.primaryButton,
            {
              backgroundColor:
                configured && openBankingEnabled && !isPreparingLink
                  ? colors.primary
                  : colors.border,
            },
          ]}
          disabled={!configured || !openBankingEnabled || isPreparingLink}
          onPress={handleConnect}
        >
          {isPreparingLink ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="link" size={18} color="#fff" />
          )}
          <Text style={styles.primaryButtonText}>
            {isPreparingLink ? "Preparing secure link…" : "Connect bank"}
          </Text>
        </TouchableOpacity>
      </View>

      {statusMessage ? (
        <View style={[styles.notice, { backgroundColor: colors.surface.linen }]}>
          <Ionicons
            name="information-circle"
            size={20}
            color={colors.primary}
          />
          <Text style={[styles.noticeText, { color: colors.text }]}>
            {statusMessage}
          </Text>
        </View>
      ) : null}

      {lastSync ? (
        <View style={[styles.notice, { backgroundColor: colors.surface.linen }]}>
          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          <Text style={[styles.noticeText, { color: colors.text }]}>
            Added {lastSync.added}, updated {lastSync.modified}, removed{" "}
            {lastSync.removed}.
          </Text>
        </View>
      ) : null}

      <View style={[styles.section, { backgroundColor: colors.surface.white }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Connected accounts
        </Text>
        {connectionsQuery.isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.mutedText, { color: colors.textMuted }]}>
              Loading connections…
            </Text>
          </View>
        ) : connectionsQuery.error ? (
          <Text style={[styles.errorText, { color: colors.error }]}>
            {connectionsQuery.error.message}
          </Text>
        ) : connections.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="business-outline"
              size={44}
              color={colors.textMuted}
            />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No banks connected
            </Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Connect a bank account or keep using CSV import if you prefer not
              to grant ongoing access.
            </Text>
          </View>
        ) : (
          connections.map((connection) => (
            <ConnectionCard
              key={connection.id}
              connection={connection}
              syncing={syncingConnectionId === connection.id}
              removing={removingConnectionId === connection.id}
              onSync={() => syncConnection(connection.id)}
              onReauth={() =>
                createUpdateLinkToken.mutate({ connectionId: connection.id })
              }
              onRemove={() => handleRemove(connection.id)}
            />
          ))
        )}
      </View>

      <View style={[styles.section, { backgroundColor: colors.surface.white }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Privacy note
        </Text>
        <Text style={[styles.privacyText, { color: colors.textMuted }]}>
          Open Banking is optional. Plaid handles bank consent, BudgetBuddy
          stores server-side access tokens, and CSV import remains available for
          users who do not want a persistent bank connection.
        </Text>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "success" | "warning" | "neutral";
}) {
  const colors =
    tone === "success"
      ? { backgroundColor: "rgba(16, 185, 129, 0.14)", color: "#059669" }
      : tone === "warning"
        ? { backgroundColor: "rgba(245, 158, 11, 0.14)", color: "#d97706" }
        : { backgroundColor: "rgba(100, 116, 139, 0.14)", color: "#64748b" };

  return (
    <View
      style={[styles.statusPill, { backgroundColor: colors.backgroundColor }]}
    >
      <Text style={[styles.statusPillText, { color: colors.color }]}>
        {label}
      </Text>
    </View>
  );
}

function WarningBox({ text }: { text: string }) {
  return (
    <View style={styles.warningBox}>
      <Ionicons name="warning" size={18} color="#d97706" />
      <Text style={styles.warningText}>{text}</Text>
    </View>
  );
}

function ConnectionCard({
  connection,
  syncing,
  removing,
  onSync,
  onReauth,
  onRemove,
}: {
  connection: BankConnection;
  syncing: boolean;
  removing: boolean;
  onSync: () => void;
  onReauth: () => void;
  onRemove: () => void;
}) {
  const { colors } = useTheme();
  const needsReauth =
    connection.status === "requires_reauth" ||
    connection.status === "error" ||
    isConsentExpiringSoon(connection.consentExpiresAt);

  return (
    <View style={[styles.connectionCard, { borderColor: colors.border }]}>
      <View style={styles.connectionHeader}>
        <View
          style={[
            styles.connectionIcon,
            { backgroundColor: colors.inputBackground },
          ]}
        >
          <Ionicons name="business" size={22} color={colors.primary} />
        </View>
        <View style={styles.connectionCopy}>
          <Text style={[styles.connectionName, { color: colors.text }]}>
            {connection.institutionName ?? "Unknown bank"}
          </Text>
          <Text style={[styles.connectionMeta, { color: colors.textMuted }]}>
            {connection.accountIds?.length ?? 0} account
            {(connection.accountIds?.length ?? 0) === 1 ? "" : "s"} · Last
            synced {formatDate(connection.lastSyncedAt)}
          </Text>
        </View>
      </View>

      <StatusPill
        label={needsReauth ? "Re-auth needed" : "Connected"}
        tone={needsReauth ? "warning" : "success"}
      />

      <View style={styles.connectionActions}>
        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: colors.border }]}
          disabled={syncing || removing}
          onPress={needsReauth ? onReauth : onSync}
        >
          {syncing ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons
              name={needsReauth ? "refresh-circle" : "sync"}
              size={16}
              color={colors.primary}
            />
          )}
          <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
            {needsReauth ? "Re-auth" : "Sync"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: colors.border }]}
          disabled={syncing || removing}
          onPress={onRemove}
        >
          {removing ? (
            <ActivityIndicator size="small" color={colors.error} />
          ) : (
            <Ionicons name="trash" size={16} color={colors.error} />
          )}
          <Text style={[styles.secondaryButtonText, { color: colors.error }]}>
            Remove
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 18,
    paddingBottom: 110,
    gap: 12,
  },
  heroCard: {
    borderRadius: 28,
    padding: 18,
    gap: 16,
  },
  heroHeader: {
    flexDirection: "row",
    gap: 14,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  heroCopy: {
    flex: 1,
    gap: 4,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "800",
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: "700",
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 14,
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    padding: 12,
    gap: 8,
  },
  warningText: {
    flex: 1,
    color: "#92400e",
    fontSize: 13,
    lineHeight: 18,
  },
  primaryButton: {
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  notice: {
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  noticeText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    borderRadius: 28,
    padding: 18,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  mutedText: {
    fontSize: 14,
  },
  errorText: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 28,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
  },
  connectionCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  connectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  connectionIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  connectionCopy: {
    flex: 1,
    gap: 3,
  },
  connectionName: {
    fontSize: 16,
    fontWeight: "700",
  },
  connectionMeta: {
    fontSize: 12,
    lineHeight: 17,
  },
  connectionActions: {
    flexDirection: "row",
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  privacyText: {
    fontSize: 14,
    lineHeight: 21,
  },
});
