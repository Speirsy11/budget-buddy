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
  ActivityIndicator,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { parseCSV } from "@finance/transactions/csv-parser";
import { useTheme } from "@/lib/theme/provider";
import { useTimedLoading } from "@/lib/hooks/use-timed-loading";
import { trpc, type Transaction } from "@/lib/trpc/client";
import { Ionicons } from "@expo/vector-icons";
import { TransactionItem } from "@/components/transactions/transaction-item";

const MAX_CSV_SIZE_BYTES = 5 * 1024 * 1024;

export default function TransactionsScreen() {
  const { colors } = useTheme();
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [importSummary, setImportSummary] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const transactionsQuery = trpc.transactions.list.useQuery({
    limit: 50,
    filters: search ? { search } : undefined,
  });

  const createManyMutation = trpc.transactions.createMany.useMutation({
    onSuccess: async (data: { count: number }) => {
      setImportSummary(`Imported ${data.count} transactions from CSV.`);
      await Promise.all([
        transactionsQuery.refetch(),
        utils.analytics.invalidate(),
      ]);
    },
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
  const isImporting = createManyMutation.isPending;

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

  const handleCsvImport = async () => {
    try {
      setImportSummary(null);
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "text/csv",
          "text/comma-separated-values",
          "application/csv",
          "application/vnd.ms-excel",
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      if (!file) {
        Alert.alert("CSV import failed", "No file was selected.");
        return;
      }

      if (file.size && file.size > MAX_CSV_SIZE_BYTES) {
        Alert.alert(
          "CSV is too large",
          "Please choose a CSV under 5 MB for mobile import."
        );
        return;
      }

      const csvContent = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const parsed = parseCSV(csvContent);

      if (!parsed.success || parsed.data.length === 0) {
        const errorPreview = parsed.errors.slice(0, 4).join("\n");
        Alert.alert(
          "Could not read CSV",
          errorPreview ||
            "BudgetBuddy could not detect date, description, and amount columns."
        );
        return;
      }

      if (parsed.errors.length > 0) {
        setImportSummary(
          `Importing ${parsed.data.length} rows. Skipped ${parsed.errors.length} row${
            parsed.errors.length === 1 ? "" : "s"
          } with issues.`
        );
      }

      await createManyMutation.mutateAsync({
        transactions: parsed.data.map((transaction) => ({
          amount: transaction.amount,
          date: transaction.date,
          description: transaction.description,
          merchant: transaction.merchant,
        })),
        autoClassify: true,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert("CSV import failed", message);
    }
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
          <View style={styles.headerStack}>
            <View
              style={[
                styles.importCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.importIconWrap}>
                <Ionicons
                  name="document-attach"
                  size={22}
                  color={colors.primary}
                />
              </View>
              <View style={styles.importCopy}>
                <Text style={[styles.importTitle, { color: colors.text }]}>
                  Import CSV on mobile
                </Text>
                <Text style={[styles.importText, { color: colors.textMuted }]}>
                  Pick a bank CSV from Files. BudgetBuddy parses it locally on
                  this device, then uploads only the extracted transactions.
                </Text>
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Import CSV file"
                style={[
                  styles.importButton,
                  {
                    backgroundColor: isImporting
                      ? colors.border
                      : colors.primary,
                  },
                ]}
                disabled={isImporting}
                onPress={handleCsvImport}
              >
                {isImporting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.importButtonText}>Import</Text>
                )}
              </TouchableOpacity>
            </View>
            {importSummary ? (
              <View
                style={[
                  styles.importNotice,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color={colors.success}
                />
                <Text style={[styles.importNoticeText, { color: colors.text }]}>
                  {importSummary}
                </Text>
              </View>
            ) : null}
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
                Import a CSV from Files or connect Open Banking when you are
                ready.
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
  headerStack: {
    gap: 8,
    marginBottom: 8,
  },
  importCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
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
    minWidth: 74,
    minHeight: 34,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  importButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  importNotice: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  importNoticeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
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
