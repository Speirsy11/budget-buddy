"use client";

import {
  Card,
  Mascot,
  cn,
  formatCurrency,
} from "@finance/ui";
import type { BudgetBreakdown } from "../calculations";

interface BudgetGaugeProps {
  breakdown: BudgetBreakdown;
  className?: string;
  /** Lemon surface variant (default for dashboard); set false to render on neutral white. */
  surface?: "lemon" | "white";
  /** Title — shown in the top-left. */
  title?: string;
  /** Description shown under the title. */
  description?: string;
  /** Show the clipboard mascot in the top-right (overview card). */
  showMascot?: boolean;
}

type Bucket = "needs" | "wants" | "savings";

const BUCKETS: Array<{ key: Bucket; label: string; dot: string; bar: string }> = [
  { key: "needs", label: "Needs", dot: "bg-cat-blue", bar: "bg-cat-blue" },
  { key: "wants", label: "Wants", dot: "bg-cat-pink", bar: "bg-cat-pink" },
  {
    key: "savings",
    label: "Savings",
    dot: "bg-cat-emerald",
    bar: "bg-cat-emerald",
  },
];

export function BudgetGauge({
  breakdown,
  className,
  surface = "lemon",
  title = "50/30/20 Budget",
  description = "Spending vs. your goals",
  showMascot = true,
}: BudgetGaugeProps) {
  return (
    <Card surface={surface} className={cn("flex flex-col p-5", className)}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-base font-bold text-ink">{title}</div>
          <div className="text-meta text-ink-soft mt-0.5">{description}</div>
        </div>
        {showMascot && <Mascot name="clipboard" size={50} className="-mr-1" />}
      </div>

      <div className="mt-3.5 flex flex-1 flex-col gap-3">
        {BUCKETS.map(({ key, label, dot, bar }) => {
          // eslint-disable-next-line security/detect-object-injection -- bucket key is from hardcoded array
          const d = breakdown[key];
          const pct = d.target > 0 ? Math.min(100, (d.actual / d.target) * 100) : 0;

          return (
            <div key={key}>
              <div className="mb-1.5 flex items-baseline justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn("h-2.5 w-2.5 rounded-full", dot)} />
                  <span className="text-sm font-semibold text-ink">{label}</span>
                </div>
                <div className="text-meta tabular text-ink-soft">
                  <span className="font-semibold text-ink">
                    {formatCurrency(d.actual)}
                  </span>
                  <span className="text-muted-ink"> / {formatCurrency(d.target)}</span>
                </div>
              </div>
              <div className="h-4 overflow-hidden rounded-[8px] bg-black/[0.07]">
                <div
                  className={cn(
                    "h-full rounded-[8px] transition-all duration-700",
                    bar
                  )}
                  style={{
                    width: `${pct}%`,
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
