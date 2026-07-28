import { describe, it, expect } from "vitest";
import {
  calculateNetWorth,
  buildNetWorthHistory,
  monthEndDates,
  netWorthChange,
  creditUtilisation,
  accountTypeLabel,
  type NetWorthAccount,
} from "./net-worth";

function account(overrides: Partial<NetWorthAccount> = {}): NetWorthAccount {
  return {
    id: "acc-1",
    name: "Current account",
    type: "checking",
    currentBalance: 1000,
    includeInNetWorth: true,
    isActive: true,
    ...overrides,
  };
}

describe("calculateNetWorth", () => {
  it("subtracts liabilities from assets", () => {
    const result = calculateNetWorth([
      account({ id: "a", type: "checking", currentBalance: 2500 }),
      account({ id: "b", type: "savings", currentBalance: 10000 }),
      account({ id: "c", type: "credit_card", currentBalance: 750 }),
    ]);

    expect(result.totalAssets).toBe(12500);
    expect(result.totalLiabilities).toBe(750);
    expect(result.netWorth).toBe(11750);
  });

  it("treats a liability balance as a positive magnitude owed", () => {
    // £500 on a card must reduce net worth, not increase it.
    const result = calculateNetWorth([
      account({ id: "a", type: "checking", currentBalance: 1000 }),
      account({ id: "b", type: "credit_card", currentBalance: 500 }),
    ]);
    expect(result.netWorth).toBe(500);
  });

  it("can produce a negative net worth", () => {
    const result = calculateNetWorth([
      account({ id: "a", type: "checking", currentBalance: 500 }),
      account({ id: "b", type: "mortgage", currentBalance: 220000 }),
    ]);
    expect(result.netWorth).toBe(-219500);
  });

  it("excludes accounts opted out of net worth", () => {
    const result = calculateNetWorth([
      account({ id: "a", currentBalance: 1000 }),
      account({ id: "b", currentBalance: 5000, includeInNetWorth: false }),
    ]);

    expect(result.netWorth).toBe(1000);
    expect(result.excludedCount).toBe(1);
  });

  it("excludes closed accounts", () => {
    const result = calculateNetWorth([
      account({ id: "a", currentBalance: 1000 }),
      account({ id: "b", currentBalance: 5000, isActive: false }),
    ]);

    expect(result.netWorth).toBe(1000);
    expect(result.excludedCount).toBe(1);
  });

  it("groups accounts by type, largest group first", () => {
    const result = calculateNetWorth([
      account({ id: "a", type: "checking", currentBalance: 1000 }),
      account({ id: "b", type: "savings", currentBalance: 8000 }),
      account({ id: "c", type: "savings", currentBalance: 2000 }),
    ]);

    expect(result.assetGroups[0].type).toBe("savings");
    expect(result.assetGroups[0].total).toBe(10000);
    expect(result.assetGroups[0].accounts).toHaveLength(2);
    expect(result.assetGroups[1].type).toBe("checking");
  });

  it("returns zeroes for no accounts", () => {
    expect(calculateNetWorth([])).toMatchObject({
      netWorth: 0,
      totalAssets: 0,
      totalLiabilities: 0,
    });
  });
});

describe("buildNetWorthHistory", () => {
  const accounts = [
    account({ id: "current", type: "checking" }),
    account({ id: "card", type: "credit_card" }),
  ];

  it("carries the last known balance forward to later dates", () => {
    // Only the January snapshot exists; February must still see that balance
    // rather than treating the account as empty.
    const history = buildNetWorthHistory(
      accounts,
      [
        {
          accountId: "current",
          balance: 5000,
          recordedAt: new Date("2026-01-15"),
        },
      ],
      [new Date("2026-01-31"), new Date("2026-02-28")]
    );

    expect(history[0].netWorth).toBe(5000);
    expect(history[1].netWorth).toBe(5000);
  });

  it("uses the most recent snapshot at or before each date", () => {
    const history = buildNetWorthHistory(
      accounts,
      [
        {
          accountId: "current",
          balance: 5000,
          recordedAt: new Date("2026-01-15"),
        },
        {
          accountId: "current",
          balance: 7000,
          recordedAt: new Date("2026-02-10"),
        },
      ],
      [new Date("2026-01-31"), new Date("2026-02-28")]
    );

    expect(history[0].netWorth).toBe(5000);
    expect(history[1].netWorth).toBe(7000);
  });

  it("ignores snapshots recorded after the date being computed", () => {
    const history = buildNetWorthHistory(
      accounts,
      [
        {
          accountId: "current",
          balance: 9000,
          recordedAt: new Date("2026-06-01"),
        },
      ],
      [new Date("2026-01-31")]
    );

    expect(history[0].netWorth).toBe(0);
  });

  it("subtracts liability snapshots", () => {
    const history = buildNetWorthHistory(
      accounts,
      [
        {
          accountId: "current",
          balance: 5000,
          recordedAt: new Date("2026-01-01"),
        },
        {
          accountId: "card",
          balance: 1200,
          recordedAt: new Date("2026-01-02"),
        },
      ],
      [new Date("2026-01-31")]
    );

    expect(history[0].assets).toBe(5000);
    expect(history[0].liabilities).toBe(1200);
    expect(history[0].netWorth).toBe(3800);
  });

  it("ignores snapshots for excluded accounts", () => {
    const history = buildNetWorthHistory(
      [account({ id: "current", includeInNetWorth: false })],
      [
        {
          accountId: "current",
          balance: 5000,
          recordedAt: new Date("2026-01-01"),
        },
      ],
      [new Date("2026-01-31")]
    );

    expect(history[0].netWorth).toBe(0);
  });

  it("returns points in chronological order regardless of input order", () => {
    const history = buildNetWorthHistory(
      accounts,
      [
        {
          accountId: "current",
          balance: 100,
          recordedAt: new Date("2026-01-01"),
        },
      ],
      [new Date("2026-03-31"), new Date("2026-01-31"), new Date("2026-02-28")]
    );

    const times = history.map((p) => p.date.getTime());
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });
});

describe("monthEndDates", () => {
  it("returns one date per month, oldest first", () => {
    const dates = monthEndDates(3, new Date("2026-07-28T12:00:00"));
    expect(dates).toHaveLength(3);
    expect(dates[0].getMonth()).toBe(4); // May
    expect(dates[2].getMonth()).toBe(6); // July
  });

  it("uses today for the current month rather than a future month end", () => {
    const reference = new Date("2026-07-15T12:00:00");
    const dates = monthEndDates(2, reference);
    expect(dates.at(-1)?.getDate()).toBe(15);
  });
});

describe("netWorthChange", () => {
  const point = (netWorth: number, date: string) => ({
    date: new Date(date),
    netWorth,
    assets: netWorth,
    liabilities: 0,
  });

  it("reports absolute and percentage growth", () => {
    const change = netWorthChange([
      point(10000, "2026-01-31"),
      point(12500, "2026-02-28"),
    ]);

    expect(change.absolute).toBe(2500);
    expect(change.percent).toBeCloseTo(25, 5);
  });

  it("reports a decline as negative", () => {
    const change = netWorthChange([
      point(10000, "2026-01-31"),
      point(9000, "2026-02-28"),
    ]);
    expect(change.absolute).toBe(-1000);
  });

  it("returns a null percentage when starting from zero", () => {
    const change = netWorthChange([
      point(0, "2026-01-31"),
      point(500, "2026-02-28"),
    ]);

    expect(change.absolute).toBe(500);
    expect(change.percent).toBeNull();
  });

  it("handles an empty history", () => {
    expect(netWorthChange([])).toEqual({ absolute: 0, percent: null });
  });
});

describe("creditUtilisation", () => {
  it("reports usage against the limit", () => {
    expect(
      creditUtilisation(
        account({ type: "credit_card", currentBalance: 500, creditLimit: 2000 })
      )
    ).toBe(25);
  });

  it("returns null when no limit is set", () => {
    expect(
      creditUtilisation(account({ type: "credit_card", currentBalance: 500 }))
    ).toBeNull();
  });

  it("returns null for non-credit accounts", () => {
    expect(creditUtilisation(account({ type: "checking" }))).toBeNull();
  });
});

describe("accountTypeLabel", () => {
  it("gives human labels for each type", () => {
    expect(accountTypeLabel("checking")).toBe("Current accounts");
    expect(accountTypeLabel("credit_card")).toBe("Credit cards");
  });
});
