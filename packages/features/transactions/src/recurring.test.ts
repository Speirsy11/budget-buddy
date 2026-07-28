import { describe, it, expect } from "vitest";
import {
  normalizeMerchantKey,
  matchCadence,
  toMonthlyCost,
  detectRecurringTransactions,
  summarizeRecurring,
  type RecurringInput,
} from "./recurring";

/** Build a run of charges every `intervalDays`, most recent last. */
function series(
  description: string,
  amount: number,
  startDate: string,
  count: number,
  intervalDays: number,
  overrides: Partial<RecurringInput> = {}
): RecurringInput[] {
  const start = new Date(startDate);
  return Array.from({ length: count }, (_, index) => ({
    id: `${description}-${index}`,
    amount,
    date: new Date(start.getTime() + index * intervalDays * 86_400_000),
    description,
    ...overrides,
  }));
}

/** Monthly charges on the same calendar day, so gaps vary 28–31 days. */
function monthlySeries(
  description: string,
  amount: number,
  startYear: number,
  startMonth: number,
  day: number,
  count: number
): RecurringInput[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `${description}-${index}`,
    amount,
    date: new Date(startYear, startMonth + index, day),
    description,
  }));
}

describe("normalizeMerchantKey", () => {
  it("collapses store numbers and locations to a stable key", () => {
    expect(normalizeMerchantKey("NETFLIX.COM 4392   AMSTERDAM NL")).toBe(
      normalizeMerchantKey("NETFLIX.COM 8871   AMSTERDAM NL")
    );
  });

  it("strips card and reference tails", () => {
    expect(normalizeMerchantKey("SPOTIFY REF 99887")).toBe(
      normalizeMerchantKey("SPOTIFY REF 12345")
    );
  });

  it("prefers the merchant field when present", () => {
    expect(normalizeMerchantKey("CARD PAYMENT 1234", "Netflix")).toBe(
      "netflix"
    );
  });

  it("keeps genuinely different merchants apart", () => {
    expect(normalizeMerchantKey("TESCO STORES")).not.toBe(
      normalizeMerchantKey("SAINSBURYS LOCAL")
    );
  });

  it("returns an empty key for input with no letters", () => {
    expect(normalizeMerchantKey("12345 6789")).toBe("");
  });
});

describe("matchCadence", () => {
  it.each([
    [7, "weekly"],
    [14, "fortnightly"],
    [28, "four_weekly"],
    [31, "monthly"],
    [91, "quarterly"],
    [365, "annual"],
  ])("maps a %i day gap to %s", (days, expected) => {
    expect(matchCadence(days)?.cadence).toBe(expected);
  });

  it("returns null for a gap matching no cadence", () => {
    expect(matchCadence(50)).toBeNull();
    expect(matchCadence(200)).toBeNull();
  });

  it("treats calendar-month drift as monthly", () => {
    // February to March is 28 days, which is also "four weekly" — the closer
    // match wins, and both are reported consistently.
    expect(matchCadence(30)?.cadence).toBe("monthly");
    expect(matchCadence(29)?.cadence).toBe("monthly");
  });
});

describe("toMonthlyCost", () => {
  it("leaves a monthly charge roughly unchanged", () => {
    expect(toMonthlyCost(10, "monthly")).toBeCloseTo(10, 1);
  });

  it("scales a weekly charge up", () => {
    expect(toMonthlyCost(10, "weekly")).toBeCloseTo(43.5, 0);
  });

  it("scales an annual charge down", () => {
    expect(toMonthlyCost(120, "annual")).toBeCloseTo(10, 0);
  });
});

describe("detectRecurringTransactions", () => {
  const referenceDate = new Date("2026-07-28");

  it("detects a monthly subscription across calendar-month drift", () => {
    const input = monthlySeries("NETFLIX.COM", -10.99, 2026, 0, 15, 6);
    const [found] = detectRecurringTransactions(input, { referenceDate });

    expect(found).toBeDefined();
    expect(found.cadence).toBe("monthly");
    expect(found.medianAmount).toBeCloseTo(10.99, 2);
    expect(found.occurrences).toBe(6);
    expect(found.isFixedAmount).toBe(true);
    expect(found.confidence).toBeGreaterThan(0.8);
  });

  it("ignores income", () => {
    const input = monthlySeries("ACME SALARY", 2500, 2026, 0, 28, 6);
    expect(detectRecurringTransactions(input, { referenceDate })).toEqual([]);
  });

  it("requires at least three occurrences", () => {
    const twice = series("GYM", -30, "2026-05-01", 2, 30);
    expect(detectRecurringTransactions(twice, { referenceDate })).toEqual([]);

    const thrice = series("GYM", -30, "2026-05-01", 3, 30);
    expect(detectRecurringTransactions(thrice, { referenceDate })).toHaveLength(
      1
    );
  });

  it("ignores irregular one-off spending at the same merchant", () => {
    const random: RecurringInput[] = [
      {
        id: "a",
        amount: -12,
        date: new Date("2026-01-03"),
        description: "PUB",
      },
      {
        id: "b",
        amount: -40,
        date: new Date("2026-01-19"),
        description: "PUB",
      },
      { id: "c", amount: -8, date: new Date("2026-03-02"), description: "PUB" },
      {
        id: "d",
        amount: -95,
        date: new Date("2026-06-21"),
        description: "PUB",
      },
    ];
    expect(detectRecurringTransactions(random, { referenceDate })).toEqual([]);
  });

  it("groups charges whose descriptions differ only by store number", () => {
    const input: RecurringInput[] = [
      {
        id: "1",
        amount: -9.99,
        date: new Date("2026-04-10"),
        description: "SPOTIFY P1A2B3",
      },
      {
        id: "2",
        amount: -9.99,
        date: new Date("2026-05-10"),
        description: "SPOTIFY P9Z8Y7",
      },
      {
        id: "3",
        amount: -9.99,
        date: new Date("2026-06-10"),
        description: "SPOTIFY P4X5W6",
      },
    ];

    const result = detectRecurringTransactions(input, { referenceDate });
    expect(result).toHaveLength(1);
    expect(result[0].occurrences).toBe(3);
  });

  it("flags a variable bill as recurring but not fixed", () => {
    const input: RecurringInput[] = [
      {
        id: "1",
        amount: -84.2,
        date: new Date("2026-04-01"),
        description: "OCTOPUS ENERGY",
      },
      {
        id: "2",
        amount: -112.5,
        date: new Date("2026-05-01"),
        description: "OCTOPUS ENERGY",
      },
      {
        id: "3",
        amount: -96.75,
        date: new Date("2026-06-01"),
        description: "OCTOPUS ENERGY",
      },
      {
        id: "4",
        amount: -103.1,
        date: new Date("2026-07-01"),
        description: "OCTOPUS ENERGY",
      },
    ];

    const [found] = detectRecurringTransactions(input, { referenceDate });
    expect(found.cadence).toBe("monthly");
    expect(found.isFixedAmount).toBe(false);
    expect(found.minAmount).toBeCloseTo(84.2, 1);
    expect(found.maxAmount).toBeCloseTo(112.5, 1);
  });

  it("predicts the next charge one cadence after the last", () => {
    const input = series("GYM MEMBERSHIP", -30, "2026-04-05", 4, 7);
    const [found] = detectRecurringTransactions(input, { referenceDate });

    const expectedNext = new Date(found.lastDate.getTime() + 7 * 86_400_000);
    expect(found.nextExpectedDate.toDateString()).toBe(
      expectedNext.toDateString()
    );
  });

  it("marks a lapsed subscription inactive", () => {
    // Last charge in January, reference date is late July.
    const input = monthlySeries("OLD SERVICE", -5, 2025, 9, 1, 4);
    const [found] = detectRecurringTransactions(input, { referenceDate });

    expect(found.isActive).toBe(false);
  });

  it("keeps a current subscription active", () => {
    const input = monthlySeries("CURRENT SERVICE", -5, 2026, 2, 10, 5);
    const [found] = detectRecurringTransactions(input, { referenceDate });

    expect(found.isActive).toBe(true);
  });

  it("sorts by monthly cost so the expensive ones surface first", () => {
    const input = [
      ...monthlySeries("CHEAP", -5, 2026, 1, 5, 5),
      ...monthlySeries("EXPENSIVE", -60, 2026, 1, 6, 5),
      ...monthlySeries("MIDDLE", -25, 2026, 1, 7, 5),
    ];

    const result = detectRecurringTransactions(input, { referenceDate });
    expect(result.map((s) => s.merchantName)).toEqual([
      "EXPENSIVE",
      "MIDDLE",
      "CHEAP",
    ]);
  });

  it("carries the most common category through", () => {
    const input = monthlySeries("NETFLIX", -10.99, 2026, 1, 5, 4).map(
      (t, index) => ({
        ...t,
        categoryId: index === 0 ? "cat-other" : "cat-entertainment",
      })
    );

    const [found] = detectRecurringTransactions(input, { referenceDate });
    expect(found.categoryId).toBe("cat-entertainment");
  });

  it("handles an empty history", () => {
    expect(detectRecurringTransactions([], { referenceDate })).toEqual([]);
  });

  it("ignores same-day duplicate charges", () => {
    const sameDay: RecurringInput[] = Array.from({ length: 4 }, (_, i) => ({
      id: `dup-${i}`,
      amount: -10,
      date: new Date("2026-05-01"),
      description: "SAME DAY",
    }));
    expect(detectRecurringTransactions(sameDay, { referenceDate })).toEqual([]);
  });
});

describe("summarizeRecurring", () => {
  const referenceDate = new Date("2026-07-28");

  it("totals only active series", () => {
    const input = [
      ...monthlySeries("ACTIVE", -20, 2026, 2, 10, 5),
      ...monthlySeries("LAPSED", -50, 2025, 5, 10, 4),
    ];

    const detected = detectRecurringTransactions(input, { referenceDate });
    const summary = summarizeRecurring(detected, { referenceDate });

    expect(summary.activeCount).toBe(1);
    expect(summary.totalMonthlyCost).toBeCloseTo(20, 0);
    expect(summary.inactive).toHaveLength(1);
  });

  it("derives annual cost from monthly", () => {
    const detected = detectRecurringTransactions(
      monthlySeries("THING", -10, 2026, 2, 10, 5),
      { referenceDate }
    );
    const summary = summarizeRecurring(detected, { referenceDate });

    expect(summary.totalAnnualCost).toBeCloseTo(
      summary.totalMonthlyCost * 12,
      5
    );
  });

  it("lists charges due inside the lookahead window", () => {
    const detected = detectRecurringTransactions(
      monthlySeries("SOON", -10, 2026, 2, 15, 5),
      { referenceDate }
    );
    const summary = summarizeRecurring(detected, {
      referenceDate,
      lookaheadDays: 30,
    });

    expect(summary.upcoming.length).toBeGreaterThan(0);
  });

  it("returns zeroes for an empty set", () => {
    const summary = summarizeRecurring([], { referenceDate });
    expect(summary).toMatchObject({
      activeCount: 0,
      totalMonthlyCost: 0,
      totalAnnualCost: 0,
    });
  });
});

describe("amount-spread rejection", () => {
  const referenceDate = new Date("2026-07-28");

  it("does not treat repeat supermarket shopping as a subscription", () => {
    // Regular enough in timing to look weekly, but the amounts range from a
    // top-up shop to a big weekly one — not something you can cancel.
    const amounts = [22.4, 71.8, 18.9, 64.2, 33.15, 88.4, 25.6, 59.9];
    const input = amounts.map((amount, index) => ({
      id: `tesco-${index}`,
      amount: -amount,
      date: new Date(2026, 5, 1 + index * 7),
      description: "TESCO EXTRA",
    }));

    expect(detectRecurringTransactions(input, { referenceDate })).toEqual([]);
  });

  it("still accepts a utility bill that drifts with usage", () => {
    // Seasonal variation, but nothing like a 4x swing.
    const amounts = [131.2, 148.6, 156.9, 139.4, 144.1, 151.3];
    const input = amounts.map((amount, index) => ({
      id: `energy-${index}`,
      amount: -amount,
      date: new Date(2026, index, 2),
      description: "OCTOPUS ENERGY",
    }));

    const [found] = detectRecurringTransactions(input, { referenceDate });
    expect(found).toBeDefined();
    expect(found.cadence).toBe("monthly");
    expect(found.isFixedAmount).toBe(false);
  });

  it("accepts a fixed subscription", () => {
    const input = Array.from({ length: 6 }, (_, index) => ({
      id: `netflix-${index}`,
      amount: -15.99,
      date: new Date(2026, index, 5),
      description: "NETFLIX.COM",
    }));

    const [found] = detectRecurringTransactions(input, { referenceDate });
    expect(found.isFixedAmount).toBe(true);
  });
});
