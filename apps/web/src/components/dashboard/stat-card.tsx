"use client";

import { type ReactNode } from "react";
import { Mascot, type MascotName, cn } from "@finance/ui";
import type { CardSurface } from "@finance/ui";

const deepText: Record<CardSurface, string> = {
  sage: "text-deep-sage",
  peach: "text-deep-peach",
  sky: "text-deep-sky",
  lav: "text-deep-lav",
  lemon: "text-deep-lemon",
  linen: "text-ink-soft",
  white: "text-ink-soft",
};

const surfaceBg: Record<CardSurface, string> = {
  sage: "bg-surface-sage",
  peach: "bg-surface-peach",
  sky: "bg-surface-sky",
  lav: "bg-surface-lav",
  lemon: "bg-surface-lemon",
  linen: "bg-surface-linen",
  white: "bg-surface-white",
};

interface StatCardProps {
  surface: CardSurface;
  label: string;
  mascot?: MascotName;
  mascotSize?: number;
  value: ReactNode;
  /** Faded decimals appended after the main value (e.g. ".00"). */
  decimals?: string;
  meta?: ReactNode;
  className?: string;
}

export function StatCard({
  surface,
  label,
  mascot,
  mascotSize = 56,
  value,
  decimals,
  meta,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-bento shadow-card relative overflow-hidden px-5 py-4",
        // eslint-disable-next-line security/detect-object-injection -- surface from CardSurface union
        surfaceBg[surface],
        className
      )}
    >
      {mascot && (
        <Mascot
          name={mascot}
          size={mascotSize}
          className="absolute right-2.5 top-2 z-0"
        />
      )}
      <div
        className={cn(
          "relative z-10 text-xs font-semibold",
          // eslint-disable-next-line security/detect-object-injection -- surface from CardSurface union
          deepText[surface]
        )}
      >
        {label}
      </div>
      <div className="text-stat tabular relative z-10 mt-2 text-ink">
        {value}
        {decimals && (
          <span
            className={cn(
              "ml-0.5 text-[18px] font-extrabold",
              // eslint-disable-next-line security/detect-object-injection -- surface from CardSurface union
              deepText[surface]
            )}
          >
            {decimals}
          </span>
        )}
      </div>
      {meta && (
        <div className="text-meta text-ink-soft relative z-10 mt-1.5">
          {meta}
        </div>
      )}
    </div>
  );
}
