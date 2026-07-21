"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  cn,
  formatCurrency,
  formatCurrencyWhole,
} from "@finance/ui";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  savings: number;
  savingsRate: number;
}

interface MonthlyOverviewProps {
  data: MonthlyData[];
  className?: string;
}

const SERIES = [
  { key: "income", name: "Income", color: "#10B981" },
  { key: "expenses", name: "Expenses", color: "#EC4899" },
  { key: "savings", name: "Savings", color: "#3B82F6" },
] as const;

function monthDate(month: string) {
  const [year, monthNum] = month.split("-");
  return new Date(parseInt(year), parseInt(monthNum) - 1);
}

export function MonthlyOverview({ data, className }: MonthlyOverviewProps) {
  const formatMonth = (month: string) =>
    monthDate(month).toLocaleDateString("en-GB", { month: "short" });

  return (
    <Card surface="white" className={cn("p-5", className)}>
      <CardHeader className="p-0">
        <CardTitle className="text-base font-bold">Monthly Overview</CardTitle>
      </CardHeader>
      <CardContent className="mt-3 p-0">
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="month"
                tickFormatter={formatMonth}
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={(value: number) => formatCurrencyWhole(value)}
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                tickLine={false}
                axisLine={false}
                width={80}
              />
              <Tooltip
                cursor={{ fill: "rgba(0,0,0,0.04)" }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const monthName = monthDate(label).toLocaleDateString(
                    "en-GB",
                    { month: "long", year: "numeric" }
                  );
                  return (
                    <div className="bg-surface-white rounded-[14px] shadow-card border-0 px-4 py-3">
                      <p className="text-meta text-muted-ink mb-1.5">
                        {monthName}
                      </p>
                      {payload.map((entry) => (
                        <div
                          key={entry.name}
                          className="flex items-center justify-between gap-6"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-ink-soft text-sm">
                              {entry.name}
                            </span>
                          </div>
                          <span className="tabular text-ink text-sm font-bold">
                            {formatCurrency(entry.value as number)}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ paddingTop: 20 }}
              />
              {SERIES.map(({ key, name, color }) => (
                <Bar
                  key={key}
                  dataKey={key}
                  name={name}
                  fill={color}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
