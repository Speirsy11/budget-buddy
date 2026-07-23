"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
  formatCurrency,
} from "@finance/ui";
import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Dot,
} from "recharts";
import type { SpendingTrend } from "../calculations";

interface SpendingChartProps {
  data: SpendingTrend[];
  title?: string;
  description?: string;
  className?: string;
  /** Render the avg/day stat block in the header (overview screen). */
  showAvg?: boolean;
}

const EMERALD = "#10B981";

export function SpendingChart({
  data,
  title = "Daily spending",
  description,
  className,
  showAvg = false,
}: SpendingChartProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      month: "short",
      day: "numeric",
    });
  };

  const total = data.reduce((sum, d) => sum + d.amount, 0);
  const avg = data.length ? total / data.length : 0;

  return (
    <Card surface="white" className={cn("flex flex-col p-5", className)}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 p-0">
        <div>
          <CardTitle className="text-base font-bold">{title}</CardTitle>
          {description && (
            <CardDescription className="text-meta mt-0.5">
              {description}
            </CardDescription>
          )}
        </div>
        {showAvg && (
          <div className="flex items-center gap-2.5">
            <div className="text-right">
              <div className="tabular text-ink text-[22px] font-extrabold leading-none">
                {formatCurrency(avg)}
              </div>
              <div className="text-meta text-muted-ink mt-0.5">avg / day</div>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="mt-3 flex-1 p-0">
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 6, right: 8, left: 8, bottom: 0 }}
            >
              <defs>
                <linearGradient id="bbSpendArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={EMERALD} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={EMERALD} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 11, fill: "var(--bb-muted)" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                minTickGap={48}
              />
              <Tooltip
                cursor={{ stroke: EMERALD, strokeOpacity: 0.3, strokeWidth: 1 }}
                content={({ active, payload }) => {
                  if (active && payload?.[0]) {
                    return (
                      <div className="bg-surface-white rounded-pill shadow-card border-0 px-3 py-2">
                        <p className="text-meta text-muted-ink">
                          {formatDate(payload[0].payload.date)}
                        </p>
                        <p className="tabular text-ink text-sm font-extrabold">
                          {formatCurrency(payload[0].value as number)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="amount"
                isAnimationActive={false}
                stroke={EMERALD}
                strokeWidth={2.5}
                strokeLinecap="round"
                fill="url(#bbSpendArea)"
                dot={(props: {
                  cx?: number;
                  cy?: number;
                  index?: number;
                  key?: string | number;
                }) => {
                  const { cx, cy, index } = props;
                  if (
                    cx === undefined ||
                    cy === undefined ||
                    index === undefined ||
                    index % 6 !== 0
                  ) {
                    return (
                      <Dot
                        key={props.key ?? index}
                        cx={0}
                        cy={0}
                        r={0}
                        fill="transparent"
                      />
                    );
                  }
                  return (
                    <circle
                      key={props.key ?? index}
                      cx={cx}
                      cy={cy}
                      r={3}
                      fill="#fff"
                      stroke={EMERALD}
                      strokeWidth={2}
                    />
                  );
                }}
                activeDot={{
                  r: 4,
                  fill: "#fff",
                  stroke: EMERALD,
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
