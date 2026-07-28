"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Skeleton,
  formatCurrency,
} from "@finance/ui";
import { RefreshCw, CalendarClock, TrendingDown, Ban } from "lucide-react";
import { trpc } from "@/trpc/client";

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: typeof RefreshCw;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <div className="bg-surface-sage text-deep-sage grid h-11 w-11 shrink-0 place-items-center rounded-[14px]">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs">{label}</p>
          <p className="truncate text-xl font-bold">{value}</p>
          {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function SubscriptionsPage() {
  const { data, isLoading } = trpc.transactions.recurring.useQuery({});

  const active = data?.series.filter((s) => s.isActive) ?? [];
  const inactive = data?.series.filter((s) => !s.isActive) ?? [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">
          Recurring payments
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Found by looking for repeating charges in your history — no bank
          connection needed. Includes anything regular, not just subscriptions.
        </p>
      </header>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Active recurring payments"
            value={String(data?.summary.activeCount ?? 0)}
            icon={RefreshCw}
          />
          <StatCard
            label="Monthly cost"
            value={formatCurrency(data?.summary.totalMonthlyCost ?? 0)}
            hint={`${formatCurrency(data?.summary.totalAnnualCost ?? 0)} a year`}
            icon={TrendingDown}
          />
          <StatCard
            label="Due in the next 30 days"
            value={String(data?.summary.upcomingCount ?? 0)}
            icon={CalendarClock}
          />
        </div>
      )}

      {data?.upcoming && data.upcoming.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Coming up</CardTitle>
            <CardDescription>
              Predicted from each payment&apos;s usual cycle.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.upcoming.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {item.merchantName}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {item.cadenceLabel} · expected{" "}
                    {formatDate(item.nextExpectedDate)}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold">
                  {formatCurrency(item.medianAmount)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active</CardTitle>
          <CardDescription>
            {active.length === 0
              ? "Nothing detected yet. Recurring payments need at least three charges to show up."
              : "Sorted by what they cost you per month."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading && <Skeleton className="h-16 w-full" />}
          {active.map((item) => (
            <div
              key={item.key}
              className="hover:bg-muted/40 flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors"
            >
              <div className="min-w-[10rem] flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-medium">
                    {item.merchantName}
                  </p>
                  <Badge variant="outline" className="text-[10px]">
                    {item.cadenceLabel}
                  </Badge>
                  {!item.isFixedAmount && (
                    <Badge variant="secondary" className="text-[10px]">
                      Variable
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {item.occurrences} charges · last {formatDate(item.lastDate)}
                  {!item.isFixedAmount &&
                    ` · ${formatCurrency(item.minAmount)}–${formatCurrency(item.maxAmount)}`}
                </p>
              </div>

              {item.category && (
                <Badge
                  variant="secondary"
                  style={
                    item.category.color
                      ? {
                          backgroundColor: `${item.category.color}20`,
                          color: item.category.color,
                        }
                      : undefined
                  }
                >
                  {item.category.name}
                </Badge>
              )}

              <div className="text-right">
                <p className="text-sm font-semibold">
                  {formatCurrency(item.medianAmount)}
                </p>
                {item.cadence !== "monthly" && (
                  <p className="text-muted-foreground text-xs">
                    {formatCurrency(item.monthlyCost)}/mo
                  </p>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {inactive.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Ban className="h-4 w-4" aria-hidden="true" />
              Looks cancelled
            </CardTitle>
            <CardDescription>
              These were regular but have not charged recently. Worth checking
              you meant to stop them.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {inactive.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between gap-3 rounded-lg border border-dashed px-3 py-2 opacity-70"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {item.merchantName}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {item.cadenceLabel} · last charged{" "}
                    {formatDate(item.lastDate)}
                  </p>
                </div>
                <span className="shrink-0 text-sm">
                  {formatCurrency(item.medianAmount)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
