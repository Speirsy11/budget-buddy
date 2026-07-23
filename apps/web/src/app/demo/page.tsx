"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  formatCurrency,
} from "@finance/ui";
import { BudgetGauge, SpendingChart } from "@finance/analytics";
import {
  Wallet,
  TrendingDown,
  PiggyBank,
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Receipt,
  PieChart,
  Upload,
  TrendingUp,
  Landmark,
  Settings,
  ChevronsLeft,
  Bell,
  Sun,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@finance/ui";

// ── Mock data ────────────────────────────────────────────────────────────────

const mockBudget = {
  totalIncome: 4200,
  totalExpenses: 2847,
  savingsRate: 32.2,
  needs: {
    actual: 1420,
    target: 2100,
    percentage: 33.8,
    status: "under" as const,
  },
  wants: {
    actual: 891,
    target: 1260,
    percentage: 21.2,
    status: "under" as const,
  },
  savings: {
    actual: 1353,
    target: 840,
    percentage: 32.2,
    status: "on-track" as const,
  },
};

const mockTrends = Array.from({ length: 28 }, (_, i) => {
  const date = new Date(2026, 4, i + 1);
  return {
    date: date.toISOString().split("T")[0],
    amount: 60 + Math.random() * 120 + (i % 7 === 5 ? 80 : 0),
    count: Math.floor(2 + Math.random() * 5),
  };
});

const mockTransactions = [
  {
    id: "1",
    description: "Tesco Extra",
    amount: -64.5,
    date: new Date("2026-05-14"),
    category: "Groceries",
    type: "expense" as const,
  },
  {
    id: "2",
    description: "Netflix",
    amount: -15.99,
    date: new Date("2026-05-13"),
    category: "Entertainment",
    type: "expense" as const,
  },
  {
    id: "3",
    description: "BP Fuel",
    amount: -78.2,
    date: new Date("2026-05-12"),
    category: "Transport",
    type: "expense" as const,
  },
  {
    id: "4",
    description: "ASOS",
    amount: -42.0,
    date: new Date("2026-05-11"),
    category: "Shopping",
    type: "expense" as const,
  },
  {
    id: "5",
    description: "Salary",
    amount: 4200.0,
    date: new Date("2026-05-01"),
    category: "Income",
    type: "income" as const,
  },
];

const navigation = [
  { name: "Overview", href: "/demo", icon: LayoutDashboard, active: true },
  { name: "Transactions", href: "#", icon: Receipt, active: false },
  { name: "Budget", href: "#", icon: PieChart, active: false },
  { name: "Analytics", href: "#", icon: TrendingUp, active: false },
  { name: "Import", href: "#", icon: Upload, active: false },
  { name: "Open Banking", href: "#", icon: Landmark, active: false },
];

// ── Components ───────────────────────────────────────────────────────────────

function DemoSidebar() {
  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-64 lg:flex-col">
      <div className="bg-card flex grow flex-col border-r">
        <div className="flex h-16 shrink-0 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2.5">
            <img src="/budgetbuddy-mark.svg" alt="" className="h-9 w-9" />
            <span className="text-lg font-bold tracking-tight">
              BudgetBuddy
            </span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronsLeft className="h-4 w-4" />
          </Button>
        </div>
        <nav className="flex flex-1 flex-col px-3 py-4">
          <ul className="flex flex-1 flex-col gap-1">
            {navigation.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    item.active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 shrink-0",
                      item.active
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  {item.name}
                  {item.active && (
                    <div className="bg-primary ml-auto h-1.5 w-1.5 rounded-full" />
                  )}
                </Link>
              </li>
            ))}
            <li className="mt-auto pt-4">
              <div className="mb-2 border-t" />
              <Link
                href="#"
                className="text-muted-foreground hover:bg-accent hover:text-foreground group flex items-center gap-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all"
              >
                <Settings className="text-muted-foreground group-hover:text-foreground h-5 w-5 shrink-0" />
                Settings
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </aside>
  );
}

function DemoHeader() {
  return (
    <header className="bg-background/95 sticky top-0 z-30 border-b backdrop-blur-sm">
      <div className="flex h-16 items-center gap-4 px-4 sm:px-6">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold tracking-tight">
            Overview
          </h1>
          <p className="text-muted-foreground hidden truncate text-xs sm:block">
            Your financial snapshot at a glance
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground h-9 w-9"
          >
            <Sun className="h-[1.15rem] w-[1.15rem]" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground h-9 w-9"
          >
            <Bell className="h-[1.15rem] w-[1.15rem]" />
          </Button>
          <div className="bg-border mx-1.5 h-6 w-px" />
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-semibold text-white">
            C
          </div>
        </div>
      </div>
    </header>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function DemoPage() {
  const [month] = useState(5);
  const [year] = useState(2026);
  const monthName = new Date(year, month - 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  const netCashFlow = mockBudget.totalIncome - mockBudget.totalExpenses;

  return (
    <div className="bg-muted/40 min-h-screen">
      <DemoSidebar />
      <div className="lg:pl-64">
        <DemoHeader />
        <main className="p-4 pb-20 sm:p-6 lg:pb-6">
          <div className="space-y-6">
            {/* Header with Month Navigation */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
                <p className="text-muted-foreground">
                  Your financial overview at a glance
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="min-w-[150px] text-center font-medium">
                  {monthName}
                </span>
                <Button variant="outline" size="icon">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="relative overflow-hidden">
                <div className="absolute right-0 top-0 h-24 w-24 -translate-y-4 translate-x-8 rounded-full bg-emerald-500/10" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-muted-foreground text-sm font-medium">
                    Total Income
                  </CardTitle>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                    <Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(mockBudget.totalIncome)}
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {monthName}
                  </p>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden">
                <div className="absolute right-0 top-0 h-24 w-24 -translate-y-4 translate-x-8 rounded-full bg-red-500/10" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-muted-foreground text-sm font-medium">
                    Total Expenses
                  </CardTitle>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
                    <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(mockBudget.totalExpenses)}
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {monthName}
                  </p>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden">
                <div className="absolute right-0 top-0 h-24 w-24 -translate-y-4 translate-x-8 rounded-full bg-blue-500/10" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-muted-foreground text-sm font-medium">
                    Net Cash Flow
                  </CardTitle>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                    <ArrowUpRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    +{formatCurrency(netCashFlow)}
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {monthName}
                  </p>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden">
                <div className="absolute right-0 top-0 h-24 w-24 -translate-y-4 translate-x-8 rounded-full bg-violet-500/10" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-muted-foreground text-sm font-medium">
                    Savings Rate
                  </CardTitle>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                    <PiggyBank className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {mockBudget.savingsRate.toFixed(1)}%
                  </div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
                      <div
                        className="h-full rounded-full bg-violet-500 transition-all duration-500"
                        style={{
                          width: `${Math.min((mockBudget.savingsRate / 20) * 100, 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-muted-foreground text-xs">
                      of 20%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Insight */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                      <PiggyBank className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-medium text-emerald-900 dark:text-emerald-100">
                        Great Savings Rate!
                      </p>
                      <p className="text-muted-foreground mt-0.5 text-sm">
                        You&apos;re saving 32.2% of your income. Keep it up!
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Budget + Chart */}
            <div className="grid gap-6 lg:grid-cols-2">
              <BudgetGauge breakdown={mockBudget} />
              <SpendingChart
                data={mockTrends}
                title="Daily Spending"
                description={`Your spending in ${monthName}`}
              />
            </div>

            {/* Recent Transactions */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>Transactions in {monthName}</CardDescription>
                </div>
                <Link
                  href="#"
                  className="text-primary flex items-center gap-1 text-sm font-medium hover:underline"
                >
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {mockTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="hover:bg-muted/50 flex items-center justify-between rounded-lg p-3 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                            tx.type === "income"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {tx.description[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {tx.description}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {tx.category} ·{" "}
                            {tx.date.toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                            })}
                          </p>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "text-sm font-semibold tabular-nums",
                          tx.amount > 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-foreground"
                        )}
                      >
                        {tx.amount > 0 ? "+" : ""}
                        {formatCurrency(Math.abs(tx.amount))}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
