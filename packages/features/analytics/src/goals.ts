/**
 * Savings-goal progress and pacing.
 *
 * The interesting question is not "how far along am I" but "will I get there
 * in time, and what would it take" — so everything here works back from the
 * target date.
 */

export interface GoalInput {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: Date | null;
  status: string;
  createdAt: Date;
}

export type GoalPace = "achieved" | "on_track" | "behind" | "no_deadline";

export interface GoalProgress {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  remaining: number;
  /** 0–100, clamped: an overfunded goal reads as 100, not 130. */
  percentComplete: number;
  isAchieved: boolean;
  targetDate: Date | null;
  /** Null when there is no deadline. Negative once the date has passed. */
  monthsRemaining: number | null;
  /** What you would need to put aside each month from now to arrive on time. */
  requiredMonthlyContribution: number | null;
  /** Observed rate since the goal was created. */
  currentMonthlyRate: number;
  /** Where the current rate lands you, if it lands you anywhere. */
  projectedCompletionDate: Date | null;
  pace: GoalPace;
}

const DAY_MS = 86_400_000;
const DAYS_PER_MONTH = 30.44;

function monthsBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / DAY_MS / DAYS_PER_MONTH;
}

export function calculateGoalProgress(
  goal: GoalInput,
  referenceDate = new Date()
): GoalProgress {
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
  const isAchieved =
    goal.targetAmount > 0 && goal.currentAmount >= goal.targetAmount;

  const percentComplete =
    goal.targetAmount > 0
      ? Math.min(
          100,
          Math.max(0, (goal.currentAmount / goal.targetAmount) * 100)
        )
      : 0;

  const monthsRemaining = goal.targetDate
    ? monthsBetween(referenceDate, goal.targetDate)
    : null;

  // Only meaningful while there is still time and still something to save.
  const requiredMonthlyContribution =
    monthsRemaining !== null && monthsRemaining > 0 && remaining > 0
      ? remaining / monthsRemaining
      : null;

  // Rate so far, measured from when the goal was created. Guard the first
  // month so a goal created yesterday does not report an absurd rate.
  const monthsElapsed = Math.max(
    0.5,
    monthsBetween(goal.createdAt, referenceDate)
  );
  const currentMonthlyRate = goal.currentAmount / monthsElapsed;

  const projectedCompletionDate =
    !isAchieved && currentMonthlyRate > 0
      ? new Date(
          referenceDate.getTime() +
            (remaining / currentMonthlyRate) * DAYS_PER_MONTH * DAY_MS
        )
      : null;

  return {
    id: goal.id,
    name: goal.name,
    targetAmount: goal.targetAmount,
    currentAmount: goal.currentAmount,
    remaining,
    percentComplete,
    isAchieved,
    targetDate: goal.targetDate ?? null,
    monthsRemaining,
    requiredMonthlyContribution,
    currentMonthlyRate,
    projectedCompletionDate,
    pace: derivePace({
      isAchieved,
      targetDate: goal.targetDate ?? null,
      projectedCompletionDate,
    }),
  };
}

function derivePace({
  isAchieved,
  targetDate,
  projectedCompletionDate,
}: {
  isAchieved: boolean;
  targetDate: Date | null;
  projectedCompletionDate: Date | null;
}): GoalPace {
  if (isAchieved) return "achieved";
  if (!targetDate) return "no_deadline";
  // Saving nothing means never arriving, which is behind by definition.
  if (!projectedCompletionDate) return "behind";
  return projectedCompletionDate <= targetDate ? "on_track" : "behind";
}

export interface GoalsSummary {
  activeCount: number;
  achievedCount: number;
  totalTarget: number;
  totalSaved: number;
  /** Combined monthly commitment across every goal with a deadline. */
  totalRequiredMonthly: number;
  behindCount: number;
}

export function summarizeGoals(progress: GoalProgress[]): GoalsSummary {
  const active = progress.filter((g) => !g.isAchieved);

  return {
    activeCount: active.length,
    achievedCount: progress.filter((g) => g.isAchieved).length,
    totalTarget: progress.reduce((sum, g) => sum + g.targetAmount, 0),
    totalSaved: progress.reduce((sum, g) => sum + g.currentAmount, 0),
    totalRequiredMonthly: active.reduce(
      (sum, g) => sum + (g.requiredMonthlyContribution ?? 0),
      0
    ),
    behindCount: progress.filter((g) => g.pace === "behind").length,
  };
}
