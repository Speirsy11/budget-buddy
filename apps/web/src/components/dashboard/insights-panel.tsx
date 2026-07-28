"use client";

import { InsightCard } from "@finance/analytics";
import type { InsightSeverity } from "@finance/analytics";
import { Skeleton } from "@finance/ui";
import { trpc } from "@/trpc/client";

/** The insights engine's severities map onto the card's visual vocabulary. */
const CARD_TYPE: Record<InsightSeverity, "positive" | "warning" | "neutral"> = {
  positive: "positive",
  warning: "warning",
  neutral: "neutral",
};

export function InsightsPanel({ limit = 4 }: { limit?: number }) {
  const { data, isLoading } = trpc.analytics.getInsights.useQuery({ limit });

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  // Nothing worth saying is better than filler. A new account with two
  // transactions should not be shown invented observations.
  if (!data || data.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight">
        What changed this month
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {data.map((insight, index) => (
          <InsightCard
            key={`${insight.kind}-${insight.categoryId ?? index}`}
            type={CARD_TYPE[insight.severity]}
            title={insight.title}
            description={insight.detail}
          />
        ))}
      </div>
    </section>
  );
}
