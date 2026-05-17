"use client";

import {
  Card,
  CardContent,
  Mascot,
  cn,
  type MascotName,
} from "@finance/ui";
import type { CardSurface } from "@finance/ui";

type InsightType = "positive" | "negative" | "warning" | "neutral" | "tip";

interface InsightCardProps {
  type: InsightType;
  title: string;
  description: string;
  value?: string;
  className?: string;
  /** Override the auto-selected mascot for this insight. */
  mascot?: MascotName;
}

const typeConfig: Record<
  InsightType,
  { mascot: MascotName; surface: CardSurface; deep: string }
> = {
  positive: {
    mascot: "thumbs2",
    surface: "sage",
    deep: "text-deep-sage",
  },
  negative: {
    mascot: "concerned",
    surface: "peach",
    deep: "text-deep-peach",
  },
  warning: {
    mascot: "concerned",
    surface: "lemon",
    deep: "text-deep-lemon",
  },
  neutral: {
    mascot: "peaceful",
    surface: "sky",
    deep: "text-deep-sky",
  },
  tip: {
    mascot: "pointer",
    surface: "lav",
    deep: "text-deep-lav",
  },
};

export function InsightCard({
  type,
  title,
  description,
  value,
  className,
  mascot,
}: InsightCardProps) {
  // eslint-disable-next-line security/detect-object-injection -- key from InsightType union
  const config = typeConfig[type];
  const pickedMascot = mascot ?? config.mascot;

  return (
    <Card
      surface={config.surface}
      className={cn("overflow-hidden", className)}
    >
      <CardContent className="flex items-start gap-3 p-5">
        <div className="shrink-0">
          <Mascot name={pickedMascot} size={56} />
        </div>
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
