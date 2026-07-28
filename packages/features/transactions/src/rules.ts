import type { RuleMatchField, RuleMatchType } from "@finance/db";

/** The subset of a rule row the matcher needs. Keeps this pure and testable. */
export interface MatchableRule {
  id: string;
  pattern: string;
  matchType: RuleMatchType;
  matchField: RuleMatchField;
  categoryId: string;
  priority: number;
  enabled: boolean;
}

export interface MatchableTransaction {
  description: string;
  merchant?: string | null;
}

export interface RuleMatch {
  rule: MatchableRule;
  categoryId: string;
}

/**
 * Bank descriptions are noisy and inconsistently cased:
 * "TESCO STORES 3294   LONDON  GB" vs "Tesco Stores".
 * Normalising both sides makes `contains` matching behave predictably.
 */
function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Build the haystack for a rule, honouring its `matchField`.
 * Returns null when the field the rule targets is absent, so a merchant-only
 * rule never accidentally matches against the description.
 */
function haystackFor(
  transaction: MatchableTransaction,
  field: RuleMatchField
): string | null {
  switch (field) {
    case "description":
      return normalize(transaction.description);
    case "merchant":
      return transaction.merchant ? normalize(transaction.merchant) : null;
    case "any":
      return normalize(
        [transaction.description, transaction.merchant ?? ""].join(" ")
      );
  }
}

/**
 * Longest regex we will compile. Bounds the damage a catastrophically
 * backtracking pattern can do — the router caps input at 200 chars, and this
 * is the matcher-side guard for rules already in the database.
 */
const MAX_REGEX_LENGTH = 200;

/** Regex rules are user input, so a bad pattern must not take down an import. */
function safeRegexTest(pattern: string, haystack: string): boolean {
  if (pattern.length > MAX_REGEX_LENGTH) return false;

  try {
    /*
     * User-authored rule patterns are the point of this feature. The pattern is
     * scoped to its author's own data, length-capped above, and any compile
     * error is swallowed below.
     */
    // eslint-disable-next-line security/detect-non-literal-regexp -- see above
    return new RegExp(pattern, "i").test(haystack);
  } catch {
    return false;
  }
}

export function ruleMatches(
  rule: MatchableRule,
  transaction: MatchableTransaction
): boolean {
  if (!rule.enabled) return false;

  const haystack = haystackFor(transaction, rule.matchField);
  if (haystack === null) return false;

  // Regex patterns are matched raw; the others are normalised like the haystack.
  const needle =
    rule.matchType === "regex" ? rule.pattern : normalize(rule.pattern);
  if (!needle) return false;

  switch (rule.matchType) {
    case "contains":
      return haystack.includes(needle);
    case "starts_with":
      return haystack.startsWith(needle);
    case "equals":
      return haystack === needle;
    case "regex":
      return safeRegexTest(needle, haystack);
  }
}

/**
 * Find the single best rule for a transaction.
 *
 * Ordering, most significant first:
 *   1. lower `priority` wins (built-ins sit at 10, user rules at 100)
 *   2. longer `pattern` wins — "amazon prime" should beat "amazon"
 *   3. `id` as a final tiebreak, so the result is stable across calls
 *
 * Returns null when nothing matches, which is the signal to fall back to AI.
 */
export function findMatchingRule(
  rules: MatchableRule[],
  transaction: MatchableTransaction
): RuleMatch | null {
  let best: MatchableRule | null = null;

  for (const rule of rules) {
    if (!ruleMatches(rule, transaction)) continue;

    if (best === null || isBetterMatch(rule, best)) {
      best = rule;
    }
  }

  return best ? { rule: best, categoryId: best.categoryId } : null;
}

function isBetterMatch(candidate: MatchableRule, incumbent: MatchableRule) {
  if (candidate.priority !== incumbent.priority) {
    return candidate.priority < incumbent.priority;
  }
  if (candidate.pattern.length !== incumbent.pattern.length) {
    return candidate.pattern.length > incumbent.pattern.length;
  }
  return candidate.id < incumbent.id;
}

export interface RuleApplicationResult<T> {
  /** Transactions a rule claimed, paired with the category it resolved to. */
  matched: { transaction: T; categoryId: string; ruleId: string }[];
  /** Transactions no rule claimed — these are what AI should classify. */
  unmatched: T[];
}

/**
 * Partition a batch into rule-categorised and needs-AI groups.
 *
 * Splitting rather than classifying in place is deliberate: the caller sends
 * only `unmatched` to the AI, which is where the cost saving comes from.
 */
export function applyRules<T extends MatchableTransaction>(
  rules: MatchableRule[],
  batch: T[]
): RuleApplicationResult<T> {
  const enabled = rules.filter((r) => r.enabled);
  const matched: RuleApplicationResult<T>["matched"] = [];
  const unmatched: T[] = [];

  for (const transaction of batch) {
    const match = findMatchingRule(enabled, transaction);
    if (match) {
      matched.push({
        transaction,
        categoryId: match.categoryId,
        ruleId: match.rule.id,
      });
    } else {
      unmatched.push(transaction);
    }
  }

  return { matched, unmatched };
}
