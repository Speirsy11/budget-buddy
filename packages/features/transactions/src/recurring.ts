/**
 * Recurring-payment detection.
 *
 * Finds subscriptions, direct debits and standing orders in ordinary
 * transaction history — no bank metadata required, so it works identically for
 * CSV imports and open-banking syncs.
 *
 * The approach is deliberately statistical rather than rule-based: group by a
 * normalised merchant name, then look for a consistent gap between charges.
 * That catches things a merchant list never would (a local gym, a niche SaaS)
 * and does not need maintaining.
 */

export interface RecurringInput {
  id: string;
  amount: number;
  date: Date;
  description: string;
  merchant?: string | null;
  categoryId?: string | null;
}

export type RecurringCadence =
  | "weekly"
  | "fortnightly"
  | "four_weekly"
  | "monthly"
  | "quarterly"
  | "annual";

export interface CadenceProfile {
  cadence: RecurringCadence;
  /** Typical gap in days. */
  days: number;
  /** How far an individual gap may stray and still count as this cadence. */
  tolerance: number;
  label: string;
}

/**
 * Ordered shortest-first. Monthly carries a wider tolerance than its
 * neighbours because calendar months are 28–31 days, so a genuine monthly
 * subscription legitimately varies by three days.
 */
export const CADENCES: CadenceProfile[] = [
  { cadence: "weekly", days: 7, tolerance: 2, label: "Weekly" },
  { cadence: "fortnightly", days: 14, tolerance: 3, label: "Every 2 weeks" },
  // Four-weekly billing is machine-generated and lands on exactly 28 days, so
  // it gets a tight tolerance. Anything looser steals gaps that belong to
  // monthly, which is far more common.
  { cadence: "four_weekly", days: 28, tolerance: 1.5, label: "Every 4 weeks" },
  { cadence: "monthly", days: 30.44, tolerance: 4.5, label: "Monthly" },
  { cadence: "quarterly", days: 91.3, tolerance: 12, label: "Quarterly" },
  { cadence: "annual", days: 365.25, tolerance: 30, label: "Yearly" },
];

export interface RecurringSeries {
  key: string;
  /** Best display name for the merchant, taken from the most recent charge. */
  merchantName: string;
  cadence: RecurringCadence;
  cadenceLabel: string;
  /** Representative charge; the median resists a one-off price spike. */
  medianAmount: number;
  minAmount: number;
  maxAmount: number;
  /** True when charges barely move — a fixed subscription vs. a variable bill. */
  isFixedAmount: boolean;
  occurrences: number;
  firstDate: Date;
  lastDate: Date;
  nextExpectedDate: Date;
  /** 0–1. Blends how regular the gaps are with how many charges we have seen. */
  confidence: number;
  /** A series stops being "active" once it is overdue by half a cycle. */
  isActive: boolean;
  categoryId: string | null;
  transactionIds: string[];
  /** Normalised monthly cost, for totalling across mixed cadences. */
  monthlyCost: number;
}

const DAY_MS = 86_400_000;
const DAYS_PER_MONTH = 30.44;

/** Minimum charges before a pattern is credible. Two points is a coincidence. */
const MIN_OCCURRENCES = 3;

/** Below this, the pattern is too irregular to be worth surfacing. */
const MIN_CONFIDENCE = 0.5;

/**
 * Reduce a bank description to a stable merchant key.
 *
 * Bank descriptions carry store numbers, cities, card suffixes and reference
 * codes that differ between charges from the same merchant:
 *   "NETFLIX.COM 4392         AMSTERDAM NL"
 *   "NETFLIX.COM 8871         AMSTERDAM NL"
 * Both must collapse to "netflix com" for grouping to work.
 */
/** Tokens that carry no identifying information on a bank statement. */
const NOISE_TOKENS = new Set([
  "ref",
  "reference",
  "card",
  "txn",
  "trn",
  "auth",
  "payment",
  "purchase",
  "gb",
  "gbr",
  "uk",
  "usa",
  "us",
  "nl",
  "ie",
  "de",
  "fr",
  "ltd",
  "limited",
  "plc",
  "inc",
]);

export function normalizeMerchantKey(
  description: string,
  merchant?: string | null
): string {
  const source = merchant?.trim() || description;

  return (
    source
      .toLowerCase()
      // Split on anything that is not a letter or digit, so "netflix.com"
      // becomes two tokens and punctuation never distinguishes two charges.
      .split(/[^a-z0-9]+/)
      .filter((token) => {
        if (!token) return false;
        // Any token containing a digit is a store number, reference or card
        // tail — "3294", "p1a2b3", "xx4471". Dropping the whole token (rather
        // than just its digits) is what makes two charges from the same
        // merchant collapse to one key.
        if (/\d/.test(token)) return false;
        return !NOISE_TOKENS.has(token);
      })
      .join(" ")
      .trim()
  );
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  const upper = sorted.at(mid) ?? 0;
  if (sorted.length % 2 !== 0) return upper;

  const lower = sorted.at(mid - 1) ?? upper;
  return (lower + upper) / 2;
}

function daysBetween(earlier: Date, later: Date): number {
  return (later.getTime() - earlier.getTime()) / DAY_MS;
}

/**
 * Best-fitting cadence for an observed gap, or null if it matches none.
 *
 * Fit is measured as a fraction of each cadence's own tolerance rather than in
 * raw days. A 29-day gap sits 1 day from four-weekly and 1.4 days from
 * monthly, but it uses two thirds of four-weekly's narrow budget and under a
 * third of monthly's — so monthly is the more comfortable fit, which matches
 * how these actually bill.
 */
export function matchCadence(intervalDays: number): CadenceProfile | null {
  let best: CadenceProfile | null = null;
  let bestFit = Infinity;

  for (const profile of CADENCES) {
    const distance = Math.abs(intervalDays - profile.days);
    if (distance > profile.tolerance) continue;

    const fit = distance / profile.tolerance;
    if (fit < bestFit) {
      best = profile;
      bestFit = fit;
    }
  }

  return best;
}

/** Convert any cadence to a comparable monthly figure. */
export function toMonthlyCost(
  amount: number,
  cadence: RecurringCadence
): number {
  const profile = CADENCES.find((c) => c.cadence === cadence);
  if (!profile) return amount;
  return (amount * DAYS_PER_MONTH) / profile.days;
}

interface DetectOptions {
  /** Treated as "now" for activity and next-charge calculations. */
  referenceDate?: Date;
  minOccurrences?: number;
  minConfidence?: number;
}

/**
 * Detect recurring series across a transaction history.
 *
 * Only outgoing transactions are considered — income has its own cadence but
 * calling a salary a "subscription" is not useful.
 */
export function detectRecurringTransactions(
  input: RecurringInput[],
  options: DetectOptions = {}
): RecurringSeries[] {
  const referenceDate = options.referenceDate ?? new Date();
  const minOccurrences = options.minOccurrences ?? MIN_OCCURRENCES;
  const minConfidence = options.minConfidence ?? MIN_CONFIDENCE;

  const groups = new Map<string, RecurringInput[]>();
  for (const transaction of input) {
    if (transaction.amount >= 0) continue; // expenses only

    const key = normalizeMerchantKey(
      transaction.description,
      transaction.merchant
    );
    if (!key) continue;

    const group = groups.get(key) ?? [];
    group.push(transaction);
    groups.set(key, group);
  }

  const series: RecurringSeries[] = [];

  for (const [key, group] of groups) {
    if (group.length < minOccurrences) continue;

    const ordered = [...group].sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );

    const intervals: number[] = [];
    for (let i = 1; i < ordered.length; i += 1) {
      const previous = ordered.at(i - 1);
      const current = ordered.at(i);
      if (!previous || !current) continue;
      intervals.push(daysBetween(previous.date, current.date));
    }

    // Two charges on the same day are a split payment, not a cycle.
    const meaningful = intervals.filter((interval) => interval >= 1);
    if (meaningful.length === 0) continue;

    const medianInterval = median(meaningful);
    const profile = matchCadence(medianInterval);
    if (!profile) continue;

    // Regularity: what share of gaps actually sit near the cadence. A series
    // with one missed month still scores well; a random scatter does not.
    const withinTolerance = meaningful.filter(
      (interval) => Math.abs(interval - profile.days) <= profile.tolerance
    ).length;
    const regularity = withinTolerance / meaningful.length;

    const amounts = ordered.map((t) => Math.abs(t.amount));
    const medianAmount = median(amounts);
    const minAmount = Math.min(...amounts);
    const maxAmount = Math.max(...amounts);

    // Spread relative to the typical charge. Utilities drift; Netflix does not.
    const amountSpread =
      medianAmount > 0 ? (maxAmount - minAmount) / medianAmount : 0;
    const isFixedAmount = amountSpread <= 0.1;

    // More observations make a pattern more believable, with diminishing
    // returns — six charges is plenty, sixty is not ten times better.
    const evidence = Math.min(1, ordered.length / 6);
    // Wildly varying amounts weaken the case, but never veto it outright.
    const amountConsistency = 1 / (1 + amountSpread);
    const confidence =
      regularity * 0.6 + evidence * 0.25 + amountConsistency * 0.15;

    if (confidence < minConfidence) continue;

    const lastDate = ordered[ordered.length - 1].date;
    const nextExpectedDate = new Date(
      lastDate.getTime() + profile.days * DAY_MS
    );

    // Overdue by more than half a cycle suggests it was cancelled.
    const daysSinceLast = daysBetween(lastDate, referenceDate);
    const isActive = daysSinceLast <= profile.days * 1.5;

    series.push({
      key,
      merchantName: displayNameFor(ordered),
      cadence: profile.cadence,
      cadenceLabel: profile.label,
      medianAmount,
      minAmount,
      maxAmount,
      isFixedAmount,
      occurrences: ordered.length,
      firstDate: ordered[0].date,
      lastDate,
      nextExpectedDate,
      confidence: Number(confidence.toFixed(3)),
      isActive,
      categoryId: mostCommonCategoryId(ordered),
      transactionIds: ordered.map((t) => t.id),
      monthlyCost: toMonthlyCost(medianAmount, profile.cadence),
    });
  }

  // Most expensive first — that is the order someone reviewing spending wants.
  return series.sort((a, b) => b.monthlyCost - a.monthlyCost);
}

/**
 * Pick a human-friendly label. The merchant field is cleanest when present;
 * otherwise fall back to the most recent description, which is more likely to
 * reflect the merchant's current trading name.
 */
function displayNameFor(ordered: RecurringInput[]): string {
  const latest = ordered[ordered.length - 1];
  if (latest.merchant?.trim()) return latest.merchant.trim();

  return latest.description.replace(/\s+/g, " ").trim().slice(0, 60);
}

/** The category the user files this merchant under most often. */
function mostCommonCategoryId(ordered: RecurringInput[]): string | null {
  const counts = new Map<string, number>();
  for (const transaction of ordered) {
    if (!transaction.categoryId) continue;
    counts.set(
      transaction.categoryId,
      (counts.get(transaction.categoryId) ?? 0) + 1
    );
  }

  let winner: string | null = null;
  let best = 0;
  for (const [categoryId, count] of counts) {
    if (count > best) {
      winner = categoryId;
      best = count;
    }
  }
  return winner;
}

export interface RecurringSummary {
  activeCount: number;
  /** Combined monthly cost of everything still active. */
  totalMonthlyCost: number;
  totalAnnualCost: number;
  /** Series whose next charge falls within the lookahead window. */
  upcoming: RecurringSeries[];
  /** Series that look cancelled — useful for spotting a forgotten trial. */
  inactive: RecurringSeries[];
}

export function summarizeRecurring(
  series: RecurringSeries[],
  options: { referenceDate?: Date; lookaheadDays?: number } = {}
): RecurringSummary {
  const referenceDate = options.referenceDate ?? new Date();
  const lookaheadDays = options.lookaheadDays ?? 30;
  const horizon = new Date(referenceDate.getTime() + lookaheadDays * DAY_MS);

  const active = series.filter((s) => s.isActive);
  const totalMonthlyCost = active.reduce((sum, s) => sum + s.monthlyCost, 0);

  return {
    activeCount: active.length,
    totalMonthlyCost,
    totalAnnualCost: totalMonthlyCost * 12,
    upcoming: active
      .filter((s) => s.nextExpectedDate <= horizon)
      .sort(
        (a, b) => a.nextExpectedDate.getTime() - b.nextExpectedDate.getTime()
      ),
    inactive: series.filter((s) => !s.isActive),
  };
}
