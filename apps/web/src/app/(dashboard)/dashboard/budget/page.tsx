"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Skeleton,
} from "@finance/ui";
import { BudgetGauge, CategoryBreakdown } from "@finance/analytics";
import { IconChip } from "@finance/ui";
import { trpc } from "@/trpc/client";
import { Coins, PiggyBank, Settings, Wallet } from "lucide-react";
import { Greeting } from "@/components/dashboard/greeting";
import { MonthPicker } from "@/components/dashboard/month-picker";

export default function BudgetPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [isEditing, setIsEditing] = useState(false);
  const [hasAutoDetected, setHasAutoDetected] = useState(false);

  // Auto-detect date range from transactions
  const dateRangeQuery = trpc.analytics.getDateRange.useQuery();

  // Update to the most recent transaction month when data loads
  useEffect(() => {
    if (dateRangeQuery.data?.hasTransactions && !hasAutoDetected) {
      setMonth(dateRangeQuery.data.suggestedMonth);
      setYear(dateRangeQuery.data.suggestedYear);
      setHasAutoDetected(true);
    }
  }, [dateRangeQuery.data, hasAutoDetected]);

  const startOfMonth = useMemo(
    () => new Date(year, month - 1, 1),
    [year, month]
  );
  const endOfMonth = useMemo(
    () => new Date(year, month, 0, 23, 59, 59),
    [year, month]
  );

  const budgetQuery = trpc.analytics.get503020.useQuery({ month, year });
  const categoryQuery = trpc.analytics.getCategoryBreakdown.useQuery({
    startDate: startOfMonth,
    endDate: endOfMonth,
  });

  const updateAllocation = trpc.analytics.updateAllocation.useMutation({
    onSuccess: () => {
      budgetQuery.refetch();
      setIsEditing(false);
    },
  });

  const budget = budgetQuery.data;
  const categories = categoryQuery.data || [];

  // Derive target allocation percentages from budget targets and income
  const savedNeedsPercent =
    budget && budget.totalIncome > 0
      ? Math.round((budget.needs.target / budget.totalIncome) * 100)
      : 50;
  const savedWantsPercent =
    budget && budget.totalIncome > 0
      ? Math.round((budget.wants.target / budget.totalIncome) * 100)
      : 30;
  const savedSavingsPercent =
    budget && budget.totalIncome > 0
      ? Math.round((budget.savings.target / budget.totalIncome) * 100)
      : 20;

  const monthName = new Date(year, month - 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
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

  return (
    <div className="flex flex-col gap-3.5">
      <Greeting
        title={<>Your budget</>}
        insight={
          <span className="text-muted-ink text-base font-medium">
            {monthName}
          </span>
        }
        trailing={
          <div className="flex items-center gap-2">
            <MonthPicker
              month={month}
              year={year}
              onPrev={handlePrevMonth}
              onNext={handleNextMonth}
            />
            <Button
              variant={isEditing ? "default" : "outline"}
              size="sm"
              className="rounded-pill"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Settings className="mr-2 h-4 w-4" />
              {isEditing ? "Cancel" : "Customize"}
            </Button>
          </div>
        }
      />

      {/* Editing Panel */}
      {isEditing && (
        <Card className="border-primary/20 bg-primary/[0.02]">
          <CardHeader>
            <CardTitle>Customize Budget</CardTitle>
            <CardDescription>
              Set your monthly income and adjust allocation percentages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const needsPercent =
                  parseFloat(formData.get("needs") as string) || 50;
                const wantsPercent =
                  parseFloat(formData.get("wants") as string) || 30;
                const savingsPercent =
                  parseFloat(formData.get("savings") as string) || 20;
                const sum = needsPercent + wantsPercent + savingsPercent;
                if (sum !== 100) {
                  // eslint-disable-next-line no-alert -- Simple validation feedback for budget form
                  window.alert(
                    `Percentages must add up to 100%. Currently: ${sum}%`
                  );
                  return;
                }
                updateAllocation.mutate({
                  month,
                  year,
                  totalIncome:
                    parseFloat(formData.get("income") as string) || 0,
                  needsPercent,
                  wantsPercent,
                  savingsPercent,
                });
              }}
              className="space-y-4"
            >
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="income">Monthly Income</Label>
                  <Input
                    id="income"
                    name="income"
                    type="number"
                    placeholder="5000"
                    defaultValue={budget?.totalIncome || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="needs">Needs (%)</Label>
                  <Input
                    id="needs"
                    name="needs"
                    type="number"
                    placeholder="50"
                    defaultValue={savedNeedsPercent}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wants">Wants (%)</Label>
                  <Input
                    id="wants"
                    name="wants"
                    type="number"
                    placeholder="30"
                    defaultValue={savedWantsPercent}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="savings">Savings (%)</Label>
                  <Input
                    id="savings"
                    name="savings"
                    type="number"
                    placeholder="20"
                    defaultValue={savedSavingsPercent}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateAllocation.isPending}>
                  {updateAllocation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Budget Gauge */}
        {budgetQuery.isLoading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : budget ? (
          <BudgetGauge breakdown={budget} />
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No budget data available for this month
              </p>
            </CardContent>
          </Card>
        )}

        {/* Category Breakdown */}
        {categoryQuery.isLoading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[280px] w-full" />
            </CardContent>
          </Card>
        ) : categories.length > 0 ? (
          <CategoryBreakdown data={categories} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Spending by Category</CardTitle>
            </CardHeader>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No spending data for this month
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Budget Education */}
      <div className="grid gap-3.5 sm:grid-cols-3">
        <Card surface="sky" className="p-5">
          <IconChip icon={Wallet} surface="sky" size="lg" className="mb-2" />
          <h4 className="text-ink mb-1 text-lg font-bold">50% Needs</h4>
          <p className="text-deep-sky text-sm leading-snug">
            Housing, utilities, groceries, healthcare, and minimum debt
            payments. Buddy tracks these automatically.
          </p>
        </Card>

        <Card surface="peach" className="p-5">
          <IconChip icon={Coins} surface="peach" size="lg" className="mb-2" />
          <h4 className="text-ink mb-1 text-lg font-bold">30% Wants</h4>
          <p className="text-deep-peach text-sm leading-snug">
            Entertainment, dining out, shopping, and subscriptions. Enjoy life
            while staying on track.
          </p>
        </Card>

        <Card surface="sage" className="p-5">
          <IconChip
            icon={PiggyBank}
            surface="sage"
            size="lg"
            className="mb-2"
          />
          <h4 className="text-ink mb-1 text-lg font-bold">20% Savings</h4>
          <p className="text-deep-sage text-sm leading-snug">
            Savings, investments, and extra debt payments. Buddy cheers you on
            as you build wealth.
          </p>
        </Card>
      </div>
    </div>
  );
}
