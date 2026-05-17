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
  SafeAreaView,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { parseCSV } from "@finance/transactions/csv-parser";
import { useTheme } from "@/lib/theme/provider";
import { useTimedLoading } from "@/lib/hooks/use-timed-loading";
import { trpc, type Transaction } from "@/lib/trpc/client";
import { Ionicons } from "@expo/vector-icons";
import { TransactionItem } from "@/components/transactions/transaction-item";
import { GreetingHeader } from "@/components/greeting-header";
import { Mascot } from "@/components/mascot";

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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={{ paddingHorizontal: 18, paddingTop: 8 }}>
        <GreetingHeader
          mascot="receiptman"
          title="Your transactions"
          insight={
            transactions.length > 0
              ? `${transactions.length} loaded`
              : "Ready when you are"
          }
          insightTone="muted"
        />
      </View>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.surface.white },
          ]}
        >
          <Ionicons name="search" size={20} color={colors.muted} />
          <TextInput
            style={[styles.searchInput, { color: colors.ink }]}
            placeholder="Search transactions..."
            placeholderTextColor={colors.muted}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={20} color={colors.muted} />
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
                { backgroundColor: colors.surface.lemon },
              ]}
            >
              <Mascot name="csv" size={48} />
              <View style={styles.importCopy}>
                <Text style={[styles.importTitle, { color: colors.ink }]}>
                  Import CSV
                </Text>
                <Text style={[styles.importText, { color: colors.deep.lemon }]}>
                  Parsed locally on this device — only the extracted
                  transactions are uploaded.
                </Text>
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Import CSV file"
                style={[
                  styles.importButton,
                  {
                    backgroundColor: isImporting ? colors.muted : colors.ink,
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
                  { backgroundColor: colors.surface.sage },
                ]}
              >
                <Mascot name="thumbs2" size={32} />
                <Text style={[styles.importNoticeText, { color: colors.ink }]}>
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
                    { backgroundColor: colors.surface.white },
                  ]}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Mascot name="receipt" size={72} />
              <Text style={[styles.emptyTitle, { color: colors.ink }]}>
                No transactions
              </Text>
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                Import a CSV from Files or connect Open Banking when you are
                ready.
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 14,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 110,
    gap: 8,
  },
  headerStack: {
    gap: 10,
    marginBottom: 10,
  },
  importCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 28,
    padding: 14,
    gap: 12,
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
    borderRadius: 18,
    padding: 12,
    gap: 10,
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
