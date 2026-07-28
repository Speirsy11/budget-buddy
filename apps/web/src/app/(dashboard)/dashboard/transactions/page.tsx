"use client";

import { useState, useMemo } from "react";
import {
  Input,
  Button,
  Card,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@finance/ui";
import {
  createExportBlob,
  exportToCSV,
  TransactionTable,
} from "@finance/transactions";
import { trpc } from "@/trpc/client";
import {
  Search,
  Download,
  Plus,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";
import { Greeting } from "@/components/dashboard/greeting";

export default function TransactionsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [period, setPeriod] = useState("30");
  const [limit] = useState(25);
  const [offset, setOffset] = useState(0);
  const [uncategorizedOnly, setUncategorizedOnly] = useState(false);
  const [direction, setDirection] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const periodFilter = useMemo(() => {
    if (period === "all") return {};
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(period));
    return { startDate, endDate };
  }, [period]);

  const transactionsQuery = trpc.transactions.list.useQuery({
    limit,
    offset,
    filters: {
      ...(search ? { search } : {}),
      ...(category !== "all"
        ? { necessityType: category as "need" | "want" | "savings" }
        : {}),
      ...(uncategorizedOnly ? { uncategorizedOnly: true } : {}),
      ...(direction !== "all"
        ? { direction: direction as "expense" | "income" }
        : {}),
      ...periodFilter,
    },
  });

  const categoriesQuery = trpc.transactions.categories.useQuery();
  const utils = trpc.useUtils();

  const clearSelection = () => setSelectedIds(new Set());

  const bulkCategoryMutation = trpc.transactions.bulkUpdateCategory.useMutation(
    {
      onSuccess: () => {
        clearSelection();
        void utils.transactions.invalidate();
        void utils.analytics.invalidate();
      },
    }
  );

  const bulkDeleteMutation = trpc.transactions.bulkDelete.useMutation({
    onSuccess: () => {
      clearSelection();
      void utils.transactions.invalidate();
      void utils.analytics.invalidate();
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

  const transactions = transactionsQuery.data?.data || [];
  const total = transactionsQuery.data?.total || 0;
  const hasMore = transactionsQuery.data?.hasMore || false;

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  const handleNextPage = () => {
    setOffset(offset + limit);
  };

  const handlePrevPage = () => {
    setOffset(Math.max(0, offset - limit));
  };

  const handleExportVisibleTransactions = () => {
    const csv = exportToCSV(
      transactions.map((transaction) => ({
        id: transaction.id,
        date: new Date(transaction.date),
        description: transaction.description,
        amount: transaction.amount,
        merchant: transaction.merchant,
        category: transaction.category?.name,
        aiClassified: transaction.aiClassified,
        necessityType: transaction.category?.necessityType,
        notes: transaction.notes,
      }))
    );
    const { blob, filename } = createExportBlob(csv, "csv");
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-3.5">
      <Greeting
        title={<>Your transactions</>}
        insight={
          <span className="text-muted-ink text-base font-medium">
            {total > 0 ? `${total} tracked` : "Ready when you are"}
          </span>
        }
      />

      {/* Toolbar */}
      <Card
        surface="white"
        className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="relative max-w-md flex-1">
          <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOffset(0);
            }}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={category}
            onValueChange={(value) => {
              setCategory(value);
              setOffset(0);
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="need">Needs</SelectItem>
              <SelectItem value="want">Wants</SelectItem>
              <SelectItem value="savings">Savings</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={period}
            onValueChange={(value) => {
              setPeriod(value);
              setOffset(0);
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={direction}
            onValueChange={(value) => {
              setDirection(value);
              setOffset(0);
            }}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">In and out</SelectItem>
              <SelectItem value="expense">Money out</SelectItem>
              <SelectItem value="income">Money in</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant={uncategorizedOnly ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setUncategorizedOnly((on) => !on);
              setOffset(0);
            }}
            aria-pressed={uncategorizedOnly}
          >
            Uncategorised
          </Button>
          <div className="bg-border hidden h-6 w-px sm:block" />
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:flex"
            onClick={handleExportVisibleTransactions}
            disabled={transactions.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button
            size="sm"
            disabled
            title="Manual transaction entry is not live yet"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add
          </Button>
        </div>
      </Card>

      {/* Bulk action bar, shown only while something is selected */}
      {selectedIds.size > 0 && (
        <Card
          surface="white"
          className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-sm font-medium">
            {selectedIds.size} selected
            <button
              type="button"
              onClick={clearSelection}
              className="text-muted-foreground hover:text-foreground ml-3 text-sm font-normal underline"
            >
              Clear
            </button>
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              onValueChange={(categoryId) =>
                bulkCategoryMutation.mutate({
                  ids: [...selectedIds],
                  categoryId: categoryId === "none" ? null : categoryId,
                })
              }
            >
              <SelectTrigger className="w-[190px]">
                <SelectValue placeholder="Move to category…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Remove category</SelectItem>
                {categoriesQuery.data?.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              disabled={bulkDeleteMutation.isPending}
              onClick={() => {
                // eslint-disable-next-line no-alert -- Bulk delete is destructive and irreversible
                const confirmed = window.confirm(
                  `Delete ${selectedIds.size} transaction(s)? This cannot be undone.`
                );
                if (confirmed) {
                  bulkDeleteMutation.mutate({ ids: [...selectedIds] });
                }
              }}
            >
              Delete
            </Button>
          </div>
        </Card>
      )}

      {/* Transactions Table */}
      <TransactionTable
        transactions={transactions.map((t) => ({
          ...t,
          category: t.category ?? undefined,
        }))}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        isLoading={transactionsQuery.isLoading}
        onClassify={(id) => classifyMutation.mutate({ id })}
        onDelete={(id) => {
          // eslint-disable-next-line no-alert -- Simple confirmation dialog for delete action
          const shouldDelete = window.confirm(
            "Are you sure you want to delete this transaction?"
          );
          if (shouldDelete) {
            deleteMutation.mutate({ id });
          }
        }}
        onEdit={undefined}
      />

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            Showing{" "}
            <span className="text-foreground font-medium">
              {offset + 1}-{Math.min(offset + limit, total)}
            </span>{" "}
            of <span className="text-foreground font-medium">{total}</span>{" "}
            transactions
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handlePrevPage}
              disabled={offset === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="bg-background flex h-8 min-w-[3rem] items-center justify-center rounded-md border px-2 text-sm font-medium">
              {currentPage} / {totalPages || 1}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handleNextPage}
              disabled={!hasMore}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
