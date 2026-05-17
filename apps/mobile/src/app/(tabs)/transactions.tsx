import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Linking,
} from "react-native";
import Constants from "expo-constants";
import { useTheme } from "@/lib/theme/provider";
import { useTimedLoading } from "@/lib/hooks/use-timed-loading";
import { trpc, type Transaction } from "@/lib/trpc/client";
import { Ionicons } from "@expo/vector-icons";
import { TransactionItem } from "@/components/transactions/transaction-item";

function getWebImportUrl() {
  const webUrl = Constants.expoConfig?.extra?.webUrl;
  const baseUrl = typeof webUrl === "string" ? webUrl : "http://localhost:3000";
  return `${baseUrl.replace(/\/$/, "")}/dashboard/import`;
}

export default function TransactionsScreen() {
  const { colors } = useTheme();
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const transactionsQuery = trpc.transactions.list.useQuery({
    limit: 50,
    filters: search ? { search } : undefined,
  });

  const classifyMutation = trpc.transactions.classify.useMutation({
    onSuccess: () => {
      transactionsQuery.refetch();
    },
  });

  const deleteMutation = trpc.transactions.delete.useMutation({
    onSuccess: () => {
      transactionsQuery.refetch();
    },
  });

  const transactions: Transaction[] = transactionsQuery.data?.data || [];
  const isInitialLoading = useTimedLoading(transactionsQuery.isLoading);

  const onRefresh = async () => {
    setRefreshing(true);
    await transactionsQuery.refetch();
    setRefreshing(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Transaction",
      "Are you sure you want to delete this transaction?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteMutation.mutate({ id }),
        },
      ]
    );
  };

  const handleClassify = (id: string) => {
    classifyMutation.mutate({ id });
  };

  const openWebImport = async () => {
    const url = getWebImportUrl();
    const canOpen = await Linking.canOpenURL(url);

    if (!canOpen) {
      Alert.alert("Import CSV on web", url);
      return;
    }

    await Linking.openURL(url);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.inputBackground },
          ]}
        >
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search transactions..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons
                name="close-circle"
                size={20}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Transactions List */}
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TransactionItem
            transaction={item}
            onClassify={() => handleClassify(item.id)}
            onDelete={() => handleDelete(item.id)}
            showActions
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View
            style={[
              styles.importCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.importIconWrap}>
              <Ionicons name="cloud-upload" size={22} color={colors.primary} />
            </View>
            <View style={styles.importCopy}>
              <Text style={[styles.importTitle, { color: colors.text }]}>
                Import CSV on web
              </Text>
              <Text style={[styles.importText, { color: colors.textMuted }]}>
                Upload a bank CSV from web, then review, search, classify, and
                track it here. No persistent bank connection required.
              </Text>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Open web CSV import"
              style={[styles.importButton, { backgroundColor: colors.primary }]}
              onPress={openWebImport}
            >
              <Text style={styles.importButtonText}>Open</Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          isInitialLoading ? (
            <View style={styles.loadingPlaceholder}>
              {[1, 2, 3, 4].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.transactionSkeleton,
                    { backgroundColor: colors.border },
                  ]}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons
                name="receipt-outline"
                size={64}
                color={colors.textMuted}
              />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No Transactions
              </Text>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                Start with a web CSV import, then your mobile budget view will
                update here.
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 8,
  },
  importCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  importIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(16, 185, 129, 0.12)",
  },
  importCopy: {
    flex: 1,
    gap: 3,
  },
  importTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  importText: {
    fontSize: 12,
    lineHeight: 17,
  },
  importButton: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  importButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  loadingPlaceholder: {
    padding: 16,
    gap: 8,
  },
  transactionSkeleton: {
    height: 64,
    borderRadius: 12,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 24,
  },
});
