"use client";

import { Card, CardContent, IconChip, cn } from "@finance/ui";
import type { CardSurface } from "@finance/ui";
import {
  AlertTriangle,
  Info,
  Lightbulb,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

type InsightType = "positive" | "negative" | "warning" | "neutral" | "tip";

interface InsightCardProps {
  type: InsightType;
  title: string;
  description: string;
  value?: string;
  className?: string;
}

const typeConfig: Record<
  InsightType,
  { icon: LucideIcon; surface: CardSurface; deep: string }
> = {
  positive: { icon: TrendingUp, surface: "sage", deep: "text-deep-sage" },
  negative: { icon: TrendingDown, surface: "peach", deep: "text-deep-peach" },
  warning: { icon: AlertTriangle, surface: "lemon", deep: "text-deep-lemon" },
  neutral: { icon: Info, surface: "sky", deep: "text-deep-sky" },
  tip: { icon: Lightbulb, surface: "lav", deep: "text-deep-lav" },
};

export function InsightCard({
  type,
  title,
  description,
  value,
  className,
}: InsightCardProps) {
  // eslint-disable-next-line security/detect-object-injection -- key from InsightType union
  const config = typeConfig[type];

  return (
    <Card surface={config.surface} className={cn("overflow-hidden", className)}>
      <CardContent className="flex items-start gap-3 p-5">
        <IconChip
          icon={config.icon}
          surface={config.surface}
          className="bg-white/60"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-ink text-base font-bold">{title}</p>
            {value && (
              <span
                className={cn(
                  "tabular whitespace-nowrap text-lg font-extrabold",
                  config.deep
                )}
              >
                {value}
              </span>
            )}
          </div>
          <p className="text-ink-soft mt-1 text-sm leading-snug">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
