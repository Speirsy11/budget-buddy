/**
 * Budget threshold alerting.
 *
 * The rule that keeps this from being spam: alert only when an import moves a
 * category *across* a threshold it was not already past. Re-importing, or
 * adding one more coffee to a category that is already at 120%, sends nothing.
 */

/** Percentages at which someone wants to hear about it. */
export const ALERT_THRESHOLDS = [80, 100] as const;

export interface BudgetSpend {
  categoryId: string;
  categoryName: string;
  budgetAmount: number;
  /** Spend before the transactions being imported were applied. */
  spentBefore: number;
  /** Spend after. */
  spentAfter: number;
}

export interface BudgetAlert {
  categoryId: string;
  categoryName: string;
  budgetAmount: number;
  spentAmount: number;
  percentageUsed: number;
  thresholdCrossed: number;
}

/** Highest threshold at or below the given percentage, or null. */
function highestThresholdReached(percentage: number): number | null {
  let reached: number | null = null;
  for (const threshold of ALERT_THRESHOLDS) {
    if (percentage >= threshold) reached = threshold;
  }
  return reached;
}

/**
 * Work out which categories deserve an alert.
 *
 * Returns at most one alert per category — the highest newly crossed
 * threshold, so blowing straight past 80% to 110% sends "exceeded", not both.
 */
export function detectBudgetAlerts(spends: BudgetSpend[]): BudgetAlert[] {
  const alerts: BudgetAlert[] = [];

  for (const spend of spends) {
    if (spend.budgetAmount <= 0) continue;

    const percentBefore = (spend.spentBefore / spend.budgetAmount) * 100;
    const percentAfter = (spend.spentAfter / spend.budgetAmount) * 100;

    const before = highestThresholdReached(percentBefore);
    const after = highestThresholdReached(percentAfter);

    // Nothing new crossed.
    if (after === null || after === before) continue;
    if (before !== null && after <= before) continue;

    alerts.push({
      categoryId: spend.categoryId,
      categoryName: spend.categoryName,
      budgetAmount: spend.budgetAmount,
      spentAmount: spend.spentAfter,
      percentageUsed: percentAfter,
      thresholdCrossed: after,
    });
  }

  return alerts;
}
