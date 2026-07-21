"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, Skeleton, formatCurrency, IconChip } from "@finance/ui";
import { Coins, Receipt, PiggyBank, FileSpreadsheet } from "lucide-react";
import { BudgetGauge, SpendingChart } from "@finance/analytics";
import { TransactionRow } from "@finance/transactions";
import { trpc } from "@/trpc/client";
import Link from "next/link";
import { Greeting } from "@/components/dashboard/greeting";
import { MonthPicker } from "@/components/dashboard/month-picker";
import { StatCard } from "@/components/dashboard/stat-card";
import { BentoSparkline } from "@/components/dashboard/bento-sparkline";

function splitCurrency(amount: number, opts?: { signed?: boolean }) {
  const formatted = formatCurrency(Math.abs(amount));
  const [intPart, decPart] = formatted.split(/(?=\.\d+$)/);
  const sign = opts?.signed ? (amount >= 0 ? "+" : "−") : "";
  return { intPart: `${sign}${intPart ?? formatted}`, decPart: decPart ?? "" };
}

export default function DashboardPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [hasAutoDetected, setHasAutoDetected] = useState(false);

  const dateRangeQuery = trpc.analytics.getDateRange.useQuery();

  useEffect(() => {
    if (dateRangeQuery.data?.hasTransactions && !hasAutoDetected) {
      setMonth(dateRangeQuery.data.suggestedMonth);
      setYear(dateRangeQuery.data.suggestedYear);
      setHasAutoDetected(true);
    }
  }, [dateRangeQuery.data, hasAutoDetected]);

  const thirtyDaysAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const today = useMemo(() => new Date(), []);

  const monthLong = new Date(year, month - 1).toLocaleString("en-GB", {
    month: "long",
  });

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const budgetQuery = trpc.analytics.get503020.useQuery({ month, year });
  const transactionsQuery = trpc.transactions.list.useQuery({ limit: 5 });
  const trendsQuery = trpc.analytics.getSpendingTrends.useQuery({
    startDate: thirtyDaysAgo,
    endDate: today,
    groupBy: "day",
  });

  const budget = budgetQuery.data;
  const transactions = transactionsQuery.data?.data ?? [];
  const trends = trendsQuery.data ?? [];

  const totalIncome = budget?.totalIncome ?? 0;
  const totalExpenses = budget?.totalExpenses ?? 0;
  const netCashFlow = totalIncome - totalExpenses;
  const savingsRate = budget?.savingsRate ?? 0;
  const transactionCount = transactionsQuery.data?.total ?? transactions.length;

  const income = splitCurrency(totalIncome);
  const expenses = splitCurrency(totalExpenses);
  const net = splitCurrency(netCashFlow, { signed: true });

  const sparklineValues =
    trends.length > 1 ? trends.map((t) => t.amount) : [0, 0];

  const aheadAmount = netCashFlow;
  const aheadCopy =
    aheadAmount >= 0 ? (
      <span className="text-cat-emerald font-bold">
        {formatCurrency(aheadAmount).replace(/\.\d+$/, "")} ahead
      </span>
    ) : (
      <span className="text-deep-peach font-bold">
        {formatCurrency(Math.abs(aheadAmount)).replace(/\.\d+$/, "")} behind
      </span>
    );

  return (
    <div className="flex flex-col gap-3.5">
      <Greeting
        insight={
          budget ? (
            <>
              <span className="text-muted-ink font-medium">You&apos;re</span>{" "}
              {aheadCopy}
            </>
          ) : null
        }
        trailing={
          <MonthPicker
            month={month}
            year={year}
            onPrev={handlePrevMonth}
            onNext={handleNextMonth}
          />
        }
      />

      {/* Row 1 — Income, Expenses, Net Cash Flow hero */}
      <section className="grid gap-3.5 lg:grid-cols-[1fr_1fr_2fr]">
        {budgetQuery.isLoading ? (
          <Skeleton className="rounded-bento h-[112px]" />
        ) : (
          <StatCard
            surface="sage"
            label="Income"
            icon={Coins}
            value={income.intPart}
            decimals={income.decPart}
            meta={`${monthLong}`}
          />
        )}
        {budgetQuery.isLoading ? (
          <Skeleton className="rounded-bento h-[112px]" />
        ) : (
          <StatCard
            surface="peach"
            label="Expenses"
            icon={Receipt}
            value={expenses.intPart}
            decimals={expenses.decPart}
            meta={`${transactionCount} transactions tracked`}
          />
        )}

        {/* Net flow hero — 2x wide */}
        <Card
          surface="sky"
          className="flex items-center gap-4 overflow-hidden px-6 py-4"
        >
          <div className="min-w-0 flex-1">
            <div className="text-deep-sky text-xs font-semibold">
              Net cash flow · {monthLong}
            </div>
            {budgetQuery.isLoading ? (
              <Skeleton className="mt-2 h-12 w-48" />
            ) : (
              <div className="text-hero tabular text-ink mt-1.5">
                {net.intPart}
                <span className="text-deep-sky text-[22px] font-extrabold">
                  {net.decPart}
                </span>
              </div>
            )}
            <div className="text-meta text-ink-soft mt-2">
              {netCashFlow >= 0
                ? "↑ tracking ahead this month"
                : "↓ spending exceeded income"}
            </div>
          </div>
          <div className="hidden h-[96px] w-[180px] shrink-0 md:block">
            <BentoSparkline
              values={sparklineValues}
              width={180}
              height={96}
              color="#1E3A8A"
            />
          </div>
        </Card>
      </section>

      {/* Row 2 — Savings rate, Budget, Daily spending */}
      <section className="grid gap-3.5 lg:grid-cols-[1fr_1.4fr_1.6fr]">
        {/* Savings rate */}
        <Card surface="lav" className="flex flex-col p-5">
          <div className="flex items-start justify-between">
            <div className="text-deep-lav text-xs font-semibold">
              Savings rate
            </div>
            <IconChip icon={PiggyBank} surface="lav" className="bg-white/60" />
          </div>
          {budgetQuery.isLoading ? (
            <Skeleton className="mt-2 h-14 w-32" />
          ) : (
            <div className="tabular text-ink mt-2 text-[60px] font-extrabold leading-none tracking-tight">
              {savingsRate.toFixed(1)}
              <span className="text-deep-lav text-[28px]">%</span>
            </div>
          )}
          <div className="text-meta text-ink-soft mt-1.5">
            of monthly income
          </div>
          <div className="mt-auto pt-3.5">
            <div className="text-deep-lav mb-1.5 flex justify-between text-[10px]">
              <span>0%</span>
              <span className="font-bold">Target 20%</span>
              <span>50%</span>
            </div>
            <div className="relative h-3 overflow-hidden rounded-[6px] bg-[rgba(76,29,149,0.15)]">
              <div
                className="h-full rounded-[6px] bg-gradient-to-r from-[#C084FC] to-[#8B5CF6] transition-all"
                style={{
                  width: `${Math.min(100, Math.max(0, (savingsRate / 50) * 100))}%`,
                }}
              />
              <div className="bg-deep-lav absolute -top-0.5 left-[40%] h-4 w-[2.5px]" />
            </div>
            <div className="text-meta text-ink-soft mt-2 italic">
              {savingsRate >= 20
                ? `${(savingsRate - 20).toFixed(1)} pts above target`
                : `${(20 - savingsRate).toFixed(1)} pts below target`}
            </div>
          </div>
        </Card>

        {/* Budget */}
        {budgetQuery.isLoading || !budget ? (
          <Card surface="lemon" className="p-5">
            <Skeleton className="h-7 w-40" />
            <div className="mt-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <BudgetGauge breakdown={budget} />
        )}

        {/* Chart */}
        {trendsQuery.isLoading ? (
          <Card surface="white" className="p-5">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="mt-3 h-[220px] w-full" />
          </Card>
        ) : trends.length > 0 ? (
          <SpendingChart
            data={trends}
            title="Daily spending"
            description="30-day rolling spend"
            showAvg
          />
        ) : (
          <Card surface="white" className="flex flex-col p-5">
            <div>
              <div className="text-ink text-base font-bold">Daily spending</div>
              <div className="text-meta text-ink-soft mt-0.5">
                Import to see your trends
              </div>
            </div>
            <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8">
              <IconChip icon={FileSpreadsheet} surface="lemon" size="lg" />
              <p className="text-meta text-ink-soft max-w-[220px] text-center">
                Bring your transactions in to chart your spending.
              </p>
            </div>
          </Card>
        )}
      </section>

      {/* Recent activity */}
      <Card surface="linen" className="px-6 py-4">
        <div className="flex items-baseline justify-between">
          <div className="text-ink text-base font-bold">Recent activity</div>
          <Link
            href="/dashboard/transactions"
            className="text-cat-emerald text-sm font-semibold hover:underline"
          >
            View all {transactionCount > 0 ? transactionCount : ""} →
          </Link>
        </div>
        <div className="mt-2 flex flex-col">
          {transactionsQuery.isLoading ? (
            <div className="space-y-2 py-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-10 w-full rounded-md" />
              ))}
            </div>
          ) : transactions.length > 0 ? (
            transactions.slice(0, 5).map((t, i) => (
              <TransactionRow
                key={t.id}
                transaction={{
                  ...t,
                  category: t.category ?? undefined,
                }}
                divider={i > 0}
              />
            ))
          ) : (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <IconChip icon={FileSpreadsheet} surface="linen" size="lg" />
              <h3 className="text-ink font-semibold">No transactions yet</h3>
              <p className="text-ink-soft max-w-sm text-sm">
                Import your bank statement to get started.
              </p>
              <Link
                href="/dashboard/import"
                className="bg-ink rounded-pill mt-2 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white"
              >
                Import transactions
              </Link>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
