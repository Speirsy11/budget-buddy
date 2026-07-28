/**
 * Spending insights.
 *
 * Turns a transaction history into a handful of sentences worth reading. The
 * bar for including something is that it should change what someone does — so
 * every insight carries a magnitude, and trivial movements are filtered out
 * rather than padded into a list.
 */

export interface InsightTransaction {
  id: string;
  amount: number;
  date: Date;
  description: string;
  merchant?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
}

export type InsightKind =
  | "category_spike"
  | "category_drop"
  | "unusual_transaction"
  | "projected_overspend"
  | "top_merchant"
  | "no_spend_streak";

export type InsightSeverity = "positive" | "neutral" | "warning";

export interface Insight {
  kind: InsightKind;
  severity: InsightSeverity;
  title: string;
  detail: string;
  /** Sorting weight — bigger money or bigger swing floats to the top. */
  magnitude: number;
  categoryId?: string;
}

/** Below this, a month-over-month move is noise rather than a change in habit. */
const MIN_CATEGORY_CHANGE_PERCENT = 25;

/** And it has to be worth at least this much to be worth saying out loud. */
const MIN_CATEGORY_CHANGE_ABSOLUTE = 20;

/** How many times the typical charge counts as "unusual" for that merchant. */
const UNUSUAL_MULTIPLIER = 2.5;

function isExpense(transaction: InsightTransaction): boolean {
  return transaction.amount < 0;
}

function sumExpenses(transactions: InsightTransaction[]): number {
  return transactions
    .filter(isExpense)
    .reduce((total, t) => total + Math.abs(t.amount), 0);
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const upper = sorted.at(mid) ?? 0;
  if (sorted.length % 2 !== 0) return upper;
  return ((sorted.at(mid - 1) ?? upper) + upper) / 2;
}

function totalsByCategory(
  transactions: InsightTransaction[]
): Map<string, { name: string; total: number }> {
  const totals = new Map<string, { name: string; total: number }>();

  for (const transaction of transactions) {
    if (!isExpense(transaction) || !transaction.categoryId) continue;

    const existing = totals.get(transaction.categoryId);
    totals.set(transaction.categoryId, {
      name: transaction.categoryName ?? existing?.name ?? "Uncategorised",
      total: (existing?.total ?? 0) + Math.abs(transaction.amount),
    });
  }

  return totals;
}

function formatMoney(amount: number): string {
  return `£${Math.abs(amount).toFixed(2)}`;
}

/**
 * Compare this month's category spending against last month's.
 *
 * A category absent last month is skipped rather than reported as an infinite
 * increase — "you spent ∞% more on Travel" is not useful.
 */
export function compareCategories(
  current: InsightTransaction[],
  previous: InsightTransaction[]
): Insight[] {
  const currentTotals = totalsByCategory(current);
  const previousTotals = totalsByCategory(previous);
  const insights: Insight[] = [];

  for (const [categoryId, currentEntry] of currentTotals) {
    const previousEntry = previousTotals.get(categoryId);
    if (!previousEntry || previousEntry.total <= 0) continue;

    const difference = currentEntry.total - previousEntry.total;
    const percent = (difference / previousEntry.total) * 100;

    if (
      Math.abs(percent) < MIN_CATEGORY_CHANGE_PERCENT ||
      Math.abs(difference) < MIN_CATEGORY_CHANGE_ABSOLUTE
    ) {
      continue;
    }

    const isUp = difference > 0;
    insights.push({
      kind: isUp ? "category_spike" : "category_drop",
      severity: isUp ? "warning" : "positive",
      title: `${currentEntry.name} ${isUp ? "up" : "down"} ${Math.abs(percent).toFixed(0)}%`,
      detail: `${formatMoney(currentEntry.total)} this month versus ${formatMoney(
        previousEntry.total
      )} last month.`,
      magnitude: Math.abs(difference),
      categoryId,
    });
  }

  return insights;
}

/**
 * Flag charges far larger than usual for the same merchant.
 *
 * Compared against the median of that merchant's other charges, so one large
 * outlier does not raise the bar and hide itself. Merchants with fewer than
 * three prior charges are skipped — there is no "usual" yet.
 */
export function detectUnusualTransactions(
  transactions: InsightTransaction[]
): Insight[] {
  const byMerchant = new Map<string, InsightTransaction[]>();

  for (const transaction of transactions) {
    if (!isExpense(transaction)) continue;
    const key = (transaction.merchant ?? transaction.description)
      .toLowerCase()
      .trim();
    if (!key) continue;
    byMerchant.set(key, [...(byMerchant.get(key) ?? []), transaction]);
  }

  const insights: Insight[] = [];

  for (const group of byMerchant.values()) {
    if (group.length < 4) continue;

    const sorted = [...group].sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    );
    const [latest, ...rest] = sorted;
    if (!latest) continue;

    const typical = median(rest.map((t) => Math.abs(t.amount)));
    if (typical <= 0) continue;

    const latestAmount = Math.abs(latest.amount);
    if (latestAmount < typical * UNUSUAL_MULTIPLIER) continue;

    insights.push({
      kind: "unusual_transaction",
      severity: "warning",
      title: `Unusually large charge at ${latest.merchant ?? latest.description}`,
      detail: `${formatMoney(latestAmount)} against a usual ${formatMoney(typical)}.`,
      magnitude: latestAmount - typical,
    });
  }

  return insights;
}

/**
 * Extrapolate the month's spending to month end from the pace so far.
 *
 * Only reported once a few days have passed — projecting an entire month from
 * the second of the month produces a number nobody should act on.
 */
export function projectMonthEnd(
  current: InsightTransaction[],
  referenceDate: Date,
  monthlyBudget?: number
): Insight | null {
  const dayOfMonth = referenceDate.getDate();
  if (dayOfMonth < 5) return null;

  const daysInMonth = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth() + 1,
    0
  ).getDate();

  const spentSoFar = sumExpenses(current);
  if (spentSoFar <= 0) return null;

  const projected = (spentSoFar / dayOfMonth) * daysInMonth;

  if (monthlyBudget && monthlyBudget > 0) {
    if (projected <= monthlyBudget) return null;

    return {
      kind: "projected_overspend",
      severity: "warning",
      title: `On track to overspend by ${formatMoney(projected - monthlyBudget)}`,
      detail: `At the current pace you will spend about ${formatMoney(
        projected
      )} against a ${formatMoney(monthlyBudget)} budget.`,
      magnitude: projected - monthlyBudget,
    };
  }

  return {
    kind: "projected_overspend",
    severity: "neutral",
    title: `Projected to spend ${formatMoney(projected)} this month`,
    detail: `${formatMoney(spentSoFar)} spent over ${dayOfMonth} days.`,
    magnitude: projected,
  };
}

/** Where the money actually went — the single biggest merchant this month. */
export function topMerchant(
  transactions: InsightTransaction[]
): Insight | null {
  const totals = new Map<string, number>();

  for (const transaction of transactions) {
    if (!isExpense(transaction)) continue;
    const name = transaction.merchant ?? transaction.description;
    if (!name) continue;
    totals.set(name, (totals.get(name) ?? 0) + Math.abs(transaction.amount));
  }

  const ranked = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  const top = ranked.at(0);
  if (!top) return null;

  const [name, amount] = top;
  const totalSpend = sumExpenses(transactions);
  const share = totalSpend > 0 ? (amount / totalSpend) * 100 : 0;

  return {
    kind: "top_merchant",
    severity: "neutral",
    title: `${name} is your biggest merchant this month`,
    detail: `${formatMoney(amount)}, ${share.toFixed(0)}% of everything you spent.`,
    magnitude: amount,
  };
}

export interface BuildInsightsOptions {
  referenceDate?: Date;
  monthlyBudget?: number;
  limit?: number;
}

/**
 * Assemble the ranked insight list shown on the dashboard.
 *
 * Ordered by magnitude so the largest sums of money lead, regardless of kind.
 */
export function buildInsights(
  currentMonth: InsightTransaction[],
  previousMonth: InsightTransaction[],
  history: InsightTransaction[],
  options: BuildInsightsOptions = {}
): Insight[] {
  const referenceDate = options.referenceDate ?? new Date();
  const limit = options.limit ?? 6;

  const projection = projectMonthEnd(
    currentMonth,
    referenceDate,
    options.monthlyBudget
  );
  const merchant = topMerchant(currentMonth);

  const insights: Insight[] = [
    ...compareCategories(currentMonth, previousMonth),
    ...detectUnusualTransactions(history),
    ...(projection ? [projection] : []),
    ...(merchant ? [merchant] : []),
  ];

  return insights.sort((a, b) => b.magnitude - a.magnitude).slice(0, limit);
}
