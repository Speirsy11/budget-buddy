import { describe, it, expect } from "vitest";
import { calculateGoalProgress, summarizeGoals, type GoalInput } from "./goals";

const NOW = new Date("2026-07-28T12:00:00");

function goal(overrides: Partial<GoalInput> = {}): GoalInput {
  return {
    id: "goal-1",
    name: "Emergency fund",
    targetAmount: 6000,
    currentAmount: 1500,
    createdAt: new Date("2026-04-28T12:00:00"), // 3 months before NOW
    status: "active",
    ...overrides,
  };
}

describe("calculateGoalProgress", () => {
  it("reports remaining amount and percentage", () => {
    const result = calculateGoalProgress(goal(), NOW);

    expect(result.remaining).toBe(4500);
    expect(result.percentComplete).toBeCloseTo(25, 5);
    expect(result.isAchieved).toBe(false);
  });

  it("clamps an overfunded goal to 100 percent", () => {
    const result = calculateGoalProgress(
      goal({ currentAmount: 8000, targetAmount: 6000 }),
      NOW
    );

    expect(result.percentComplete).toBe(100);
    expect(result.remaining).toBe(0);
    expect(result.isAchieved).toBe(true);
    expect(result.pace).toBe("achieved");
  });

  it("derives the monthly contribution needed to arrive on time", () => {
    // £4,500 left over roughly 6 months.
    const result = calculateGoalProgress(
      goal({ targetDate: new Date("2027-01-28T12:00:00") }),
      NOW
    );

    expect(result.monthsRemaining).toBeCloseTo(6, 0);
    // Months are averaged at 30.44 days, so six calendar months is a shade
    // over six — roughly £745 rather than exactly £750.
    expect(result.requiredMonthlyContribution).toBeGreaterThan(700);
    expect(result.requiredMonthlyContribution).toBeLessThan(800);
  });

  it("measures the rate achieved so far", () => {
    // £1,500 saved across 3 months.
    const result = calculateGoalProgress(goal(), NOW);
    expect(result.currentMonthlyRate).toBeCloseTo(500, -1);
  });

  it("calls a goal on track when the projection beats the deadline", () => {
    // Saving £500/month with £4,500 to go needs ~9 months; deadline is 12.
    const result = calculateGoalProgress(
      goal({ targetDate: new Date("2027-07-28T12:00:00") }),
      NOW
    );

    expect(result.pace).toBe("on_track");
  });

  it("calls a goal behind when the projection misses the deadline", () => {
    // ~9 months of saving needed, but only 2 months left.
    const result = calculateGoalProgress(
      goal({ targetDate: new Date("2026-09-28T12:00:00") }),
      NOW
    );

    expect(result.pace).toBe("behind");
  });

  it("treats saving nothing as behind rather than on track", () => {
    const result = calculateGoalProgress(
      goal({
        currentAmount: 0,
        targetDate: new Date("2027-01-28T12:00:00"),
      }),
      NOW
    );

    expect(result.projectedCompletionDate).toBeNull();
    expect(result.pace).toBe("behind");
  });

  it("reports no deadline when no target date is set", () => {
    const result = calculateGoalProgress(goal({ targetDate: null }), NOW);

    expect(result.pace).toBe("no_deadline");
    expect(result.monthsRemaining).toBeNull();
    expect(result.requiredMonthlyContribution).toBeNull();
  });

  it("returns a negative months-remaining once the date has passed", () => {
    const result = calculateGoalProgress(
      goal({ targetDate: new Date("2026-05-28T12:00:00") }),
      NOW
    );

    expect(result.monthsRemaining).toBeLessThan(0);
    // No sensible monthly figure can hit a date already gone.
    expect(result.requiredMonthlyContribution).toBeNull();
    expect(result.pace).toBe("behind");
  });

  it("does not report a required contribution for an already-funded goal", () => {
    const result = calculateGoalProgress(
      goal({
        currentAmount: 6000,
        targetDate: new Date("2027-01-28T12:00:00"),
      }),
      NOW
    );

    expect(result.requiredMonthlyContribution).toBeNull();
  });

  it("avoids an absurd rate for a goal created moments ago", () => {
    const result = calculateGoalProgress(
      goal({
        currentAmount: 1000,
        createdAt: new Date("2026-07-27T12:00:00"), // yesterday
      }),
      NOW
    );

    // Floored at half a month, so at most 2x the balance rather than ~30x.
    expect(result.currentMonthlyRate).toBeLessThanOrEqual(2000);
  });

  it("handles a zero target without dividing by zero", () => {
    const result = calculateGoalProgress(
      goal({ targetAmount: 0, currentAmount: 0 }),
      NOW
    );

    expect(result.percentComplete).toBe(0);
    expect(Number.isFinite(result.currentMonthlyRate)).toBe(true);
  });
});

describe("summarizeGoals", () => {
  const progressFor = (goals: GoalInput[]) =>
    goals.map((g) => calculateGoalProgress(g, NOW));

  it("totals targets and savings across goals", () => {
    const summary = summarizeGoals(
      progressFor([
        goal({ id: "a", targetAmount: 6000, currentAmount: 1500 }),
        goal({ id: "b", targetAmount: 2000, currentAmount: 500 }),
      ])
    );

    expect(summary.totalTarget).toBe(8000);
    expect(summary.totalSaved).toBe(2000);
    expect(summary.activeCount).toBe(2);
  });

  it("separates achieved goals from active ones", () => {
    const summary = summarizeGoals(
      progressFor([
        goal({ id: "a", targetAmount: 1000, currentAmount: 1000 }),
        goal({ id: "b", targetAmount: 5000, currentAmount: 100 }),
      ])
    );

    expect(summary.achievedCount).toBe(1);
    expect(summary.activeCount).toBe(1);
  });

  it("sums the monthly commitment across deadlines", () => {
    const summary = summarizeGoals(
      progressFor([
        goal({
          id: "a",
          targetAmount: 1200,
          currentAmount: 0,
          targetDate: new Date("2026-09-28T12:00:00"),
        }),
        goal({
          id: "b",
          targetAmount: 600,
          currentAmount: 0,
          targetDate: new Date("2026-09-28T12:00:00"),
        }),
      ])
    );

    expect(summary.totalRequiredMonthly).toBeGreaterThan(0);
  });

  it("counts how many goals are behind", () => {
    const summary = summarizeGoals(
      progressFor([
        goal({
          id: "a",
          currentAmount: 0,
          targetDate: new Date("2026-08-28T12:00:00"),
        }),
      ])
    );

    expect(summary.behindCount).toBe(1);
  });

  it("returns zeroes for no goals", () => {
    expect(summarizeGoals([])).toMatchObject({
      activeCount: 0,
      achievedCount: 0,
      totalTarget: 0,
      totalSaved: 0,
    });
  });
});
