"use client";

import { useState } from "react";
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
import { trpc } from "@/trpc/client";
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  Home,
  ShoppingBag,
  PiggyBank,
} from "lucide-react";

export default function BudgetPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [isEditing, setIsEditing] = useState(false);

  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);

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
    <div className="space-y-6">
      {/* Navigation Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={handlePrevMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[160px] text-center text-lg font-semibold">
            {monthName}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={handleNextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button
          variant={isEditing ? "default" : "outline"}
          size="sm"
          onClick={() => setIsEditing(!isEditing)}
        >
          <Settings className="mr-2 h-4 w-4" />
          {isEditing ? "Cancel" : "Customize"}
        </Button>
      </div>

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
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-50/50 dark:border-blue-900/50 dark:from-blue-950/30 dark:to-blue-950/10">
          <CardContent className="pt-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Home className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h4 className="mb-1 text-lg font-bold text-blue-700 dark:text-blue-300">
              50% Needs
            </h4>
            <p className="text-sm text-blue-600/80 dark:text-blue-400/80">
              Housing, utilities, groceries, healthcare, and minimum debt
              payments. Your buddy tracks these automatically.
            </p>
          </CardContent>
        </Card>

        <Card className="border-violet-200 bg-gradient-to-br from-violet-50 to-violet-50/50 dark:border-violet-900/50 dark:from-violet-950/30 dark:to-violet-950/10">
          <CardContent className="pt-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
              <ShoppingBag className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <h4 className="mb-1 text-lg font-bold text-violet-700 dark:text-violet-300">
              30% Wants
            </h4>
            <p className="text-sm text-violet-600/80 dark:text-violet-400/80">
              Entertainment, dining out, shopping, and subscriptions. Enjoy life
              while staying on track!
            </p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-50/50 dark:border-emerald-900/50 dark:from-emerald-950/30 dark:to-emerald-950/10">
          <CardContent className="pt-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <PiggyBank className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h4 className="mb-1 text-lg font-bold text-emerald-700 dark:text-emerald-300">
              20% Savings
            </h4>
            <p className="text-sm text-emerald-600/80 dark:text-emerald-400/80">
              Savings, investments, and extra debt payments. Your buddy cheers
              you on as you build wealth!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
