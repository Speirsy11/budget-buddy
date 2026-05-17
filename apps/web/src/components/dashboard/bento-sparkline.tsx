"use client";

import { useId } from "react";

interface BentoSparklineProps {
  values: number[];
  height?: number;
  width?: number;
  /** Stroke colour (defaults to deep-sky). */
  color?: string;
  /** Area fill opacity at top of the gradient. */
  fillOpacity?: number;
  className?: string;
}

type Point = [number, number];

function smoothPath(pts: Point[]): string {
  if (pts.length === 0) return "";
  const first = pts[0];
  if (!first) return "";
  if (pts.length === 1) return `M ${first[0]},${first[1]}`;

  let d = `M ${first[0]},${first[1]}`;
  for (let i = 1; i < pts.length; i++) {
    const p0 = pts[i - 1];
    // eslint-disable-next-line security/detect-object-injection -- bounded loop index
    const p1 = pts[i];
    if (!p0 || !p1) continue;
    const cpx = (p0[0] + p1[0]) / 2;
    d += ` Q ${cpx},${p0[1]} ${cpx},${(p0[1] + p1[1]) / 2}`;
    d += ` T ${p1[0]},${p1[1]}`;
  }
  return d;
}

export function BentoSparkline({
  values,
  height = 90,
  width = 200,
  color = "#1E3A8A",
  fillOpacity = 0.18,
  className,
}: BentoSparklineProps) {
  const id = useId();
  if (values.length < 2) {
    return <div style={{ height, width }} className={className} />;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const padX = 4;
  const padY = 6;
  const xStep = (width - padX * 2) / (values.length - 1);

  const pts: Point[] = values.map((v, i) => [
    padX + i * xStep,
    padY + (1 - (v - min) / range) * (height - padY * 2),
  ]);

  const line = smoothPath(pts);
  const last = pts[pts.length - 1];
  const first = pts[0];
  const area =
    last && first
      ? `${line} L ${last[0]},${height} L ${first[0]},${height} Z`
      : line;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      className={className}
    >
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={fillOpacity} />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path
        d={line}
        stroke={color}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
