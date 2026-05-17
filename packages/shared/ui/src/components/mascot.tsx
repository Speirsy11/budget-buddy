"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export type MascotName =
  // Mascot poses
  | "wave"
  | "wave2"
  | "thumbsup"
  | "thumbs2"
  | "cheer"
  | "writing"
  | "peaceful"
  | "idle"
  | "concerned"
  | "pointer"
  | "praying"
  | "coinsman"
  | "walletman"
  | "receiptman"
  | "clipboardman"
  | "chartman"
  | "piggyman"
  // Claymation icons
  | "coins"
  | "coin"
  | "wallet"
  | "receipt"
  | "clipboard"
  | "shield"
  | "csv"
  | "bank"
  | "pie"
  | "bars"
  | "piggy"
  | "star";

export interface MascotProps {
  name: MascotName;
  size?: number;
  className?: string;
  alt?: string;
  style?: React.CSSProperties;
}

export function Mascot({
  name,
  size = 40,
  className,
  alt = "",
  style,
}: MascotProps) {
  // Tiny pre-keyed PNGs — plain <img> is intentional (see brief §6 tech notes).
  return (
    <img
      src={`/mascot/${name}.png`}
      alt={alt}
      width={size}
      height={size}
      draggable={false}
      style={{ width: size, height: "auto", ...style }}
      className={cn("pointer-events-none select-none", className)}
    />
  );
}
