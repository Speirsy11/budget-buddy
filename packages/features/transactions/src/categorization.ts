import type { Category, NecessityType } from "@finance/db";

/**
 * Map a necessity type to the numeric score stored on a transaction.
 *
 * The analytics layer buckets on thresholds (>= 0.7 need, <= 0.3 want), so
 * these three values must stay outside that dead zone to classify cleanly.
 */
export function necessityScoreFor(necessityType: NecessityType): number {
  switch (necessityType) {
    case "need":
      return 1;
    case "savings":
      return 0.5;
    case "want":
      return 0;
  }
}

/**
 * Resolve a free-text category name (as returned by the AI classifier) to one
 * of the user's actual category rows.
 *
 * The classifier prompt lists its own category vocabulary, which does not
 * exactly match a user's renamed categories — so we match loosely: exact name
 * first, then a containment match in either direction ("Food & Groceries" from
 * the model should find a user's "Groceries").
 *
 * Returns null when nothing plausible matches, leaving the transaction
 * uncategorised rather than filing it somewhere wrong.
 */
export function resolveCategoryByName(
  userCategories: Category[],
  name: string | null | undefined
): Category | null {
  if (!name) return null;

  const needle = name.trim().toLowerCase();
  if (!needle) return null;

  const exact = userCategories.find(
    (category) => category.name.toLowerCase() === needle
  );
  if (exact) return exact;

  // Prefer the longest containment match so "Savings & Investments" beats
  // "Savings" when the model returns something verbose.
  const partial = userCategories
    .filter((category) => {
      const candidate = category.name.toLowerCase();
      return candidate.includes(needle) || needle.includes(candidate);
    })
    .sort((a, b) => b.name.length - a.name.length);

  return partial[0] ?? null;
}
