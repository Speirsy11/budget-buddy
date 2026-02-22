"use client";

import { useState, useMemo } from "react";
import {
  Input,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@finance/ui";
import { TransactionTable } from "@finance/transactions";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../../convex/_generated/dataModel";
import {
  Search,
  Download,
  Plus,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";

export default function TransactionsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [period, setPeriod] = useState("30");

  const periodFilter = useMemo(() => {
    if (period === "all") return {};
    const endDate = Date.now();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(period));
    return { startDate: startDate.getTime(), endDate };
  }, [period]);

  const transactions = useQuery(api.transactions.listAll, {
    ...periodFilter,
  });

  const classifyTransaction = useAction(api.ai.classifyTransaction);
  const deleteTransaction = useMutation(api.transactions.remove);

  // Client-side filtering for search and category
  const filtered = useMemo(() => {
    if (!transactions) return [];
    let result = transactions;

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.description.toLowerCase().includes(s) ||
          t.merchant?.toLowerCase().includes(s)
      );
    }

    if (category !== "all") {
      result = result.filter((t) => {
        if (!t.necessityScore && t.necessityScore !== 0) return false;
        if (category === "need") return t.necessityScore >= 0.7;
        if (category === "savings")
          return t.necessityScore >= 0.3 && t.necessityScore < 0.7;
        if (category === "want") return t.necessityScore < 0.3;
        return true;
      });
    }

    return result;
  }, [transactions, search, category]);

  // Pagination
  const limit = 25;
  const [offset, setOffset] = useState(0);
  const total = filtered.length;
  const paged = filtered.slice(offset, offset + limit);
  const hasMore = offset + limit < total;
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  const handleNextPage = () => setOffset(offset + limit);
  const handlePrevPage = () => setOffset(Math.max(0, offset - limit));

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
          <div className="bg-border hidden h-6 w-px sm:block" />
          <Button variant="outline" size="sm" className="hidden sm:flex">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add
          </Button>
        </div>
      </div>

      {/* Transactions Table */}
      <TransactionTable
        transactions={paged.map((t) => ({
          id: t._id,
          amount: t.amount,
          date: new Date(t.date),
          description: t.description,
          merchant: t.merchant ?? null,
          aiClassified: t.aiClassified ?? null,
          necessityScore: t.necessityScore ?? null,
          categoryId: t.categoryId ?? null,
          notes: t.notes ?? null,
          userId: t.userId,
          createdAt: new Date(t._creationTime),
          updatedAt: new Date(t._creationTime),
        }))}
        isLoading={transactions === undefined}
        onClassify={(id) =>
          classifyTransaction({
            transactionId: id as Id<"transactions">,
          })
        }
        onDelete={(id) => {
          // eslint-disable-next-line no-alert -- Simple confirmation dialog for delete action
          const shouldDelete = window.confirm(
            "Are you sure you want to delete this transaction?"
          );
          if (shouldDelete) {
            deleteTransaction({ id: id as Id<"transactions"> });
          }
        }}
        onEdit={(_id) => {
          // TODO: Open edit modal
        }}
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
