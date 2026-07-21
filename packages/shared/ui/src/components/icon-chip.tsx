import type { LucideIcon } from "lucide-react";
import { cn } from "../lib/utils";
import type { CardSurface } from "./card";

export type IconChipSize = "sm" | "md" | "lg";

const surfaceBg: Record<CardSurface, string> = {
  sage: "bg-surface-sage",
  peach: "bg-surface-peach",
  sky: "bg-surface-sky",
  lav: "bg-surface-lav",
  lemon: "bg-surface-lemon",
  linen: "bg-surface-linen",
  white: "bg-surface-white",
};

const surfaceText: Record<CardSurface, string> = {
  sage: "text-deep-sage",
  peach: "text-deep-peach",
  sky: "text-deep-sky",
  lav: "text-deep-lav",
  lemon: "text-deep-lemon",
  linen: "text-ink-soft",
  white: "text-ink-soft",
};

const chipSize: Record<IconChipSize, string> = {
  sm: "h-8 w-8 rounded-chip",
  md: "h-10 w-10 rounded-chip",
  lg: "h-12 w-12 rounded-[14px]",
};

const iconSize: Record<IconChipSize, number> = {
  sm: 16,
  md: 20,
  lg: 24,
};

export interface IconChipProps {
  icon: LucideIcon;
  surface?: CardSurface;
  size?: IconChipSize;
  /** Accessible name. Omit for purely decorative chips. */
  label?: string;
  className?: string;
}

export function IconChip({
  icon: Icon,
  surface = "linen",
  size = "md",
  label,
  className,
}: IconChipProps) {
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn(
        "inline-flex shrink-0 items-center justify-center",
        // eslint-disable-next-line security/detect-object-injection -- keys from closed unions
        chipSize[size],
        // eslint-disable-next-line security/detect-object-injection -- keys from closed unions
        surfaceBg[surface],
        // eslint-disable-next-line security/detect-object-injection -- keys from closed unions
        surfaceText[surface],
        className
      )}
    >
      {/* eslint-disable-next-line security/detect-object-injection -- keys from closed unions */}
      <Icon size={iconSize[size]} strokeWidth={2.25} aria-hidden="true" />
    </span>
  );
}
