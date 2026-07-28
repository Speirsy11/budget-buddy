// Type-only import: this module is exported from the package's client-safe
// entry point, and a value import from @finance/db would pull the Postgres
// driver into the browser bundle.
import type { AccountType } from "@finance/db";

/**
 * Which account types reduce net worth.
 *
 * Deliberately duplicated from the schema rather than imported, for the
 * bundling reason above. `TYPE_LABELS` below is a `Record<AccountType, string>`,
 * so adding a type to the schema fails to compile here until it is handled —
 * that is the guard against this list going stale.
 */
const LIABILITY_TYPES = new Set<AccountType>([
  "credit_card",
  "loan",
  "mortgage",
]);

function isLiabilityType(type: AccountType): boolean {
  return LIABILITY_TYPES.has(type);
}

/**
 * Net worth calculations.
 *
 * Liability balances arrive as positive magnitudes (£500 owed is `500`), which
 * keeps balance editing unambiguous. Everything here is responsible for
 * applying the sign, so no caller has to remember the convention.
 */

export interface NetWorthAccount {
  id: string;
  name: string;
  type: AccountType;
  currentBalance: number;
  includeInNetWorth: boolean;
  isActive: boolean;
  creditLimit?: number | null;
}

export interface AccountGroup {
  type: AccountType;
  label: string;
  total: number;
  accounts: NetWorthAccount[];
}

export interface NetWorthBreakdown {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  assetGroups: AccountGroup[];
  liabilityGroups: AccountGroup[];
  /** Accounts deliberately excluded, surfaced so the number is explainable. */
  excludedCount: number;
}

const TYPE_LABELS: Record<AccountType, string> = {
  checking: "Current accounts",
  savings: "Savings",
  cash: "Cash",
  investment: "Investments",
  pension: "Pensions",
  property: "Property",
  credit_card: "Credit cards",
  loan: "Loans",
  mortgage: "Mortgages",
};

export function accountTypeLabel(type: AccountType): string {
  // Map lookup rather than index access: `type` is a closed union, but the
  // linter cannot tell that from a bracket expression.
  return TYPE_LABEL_BY_TYPE.get(type) ?? type;
}

const TYPE_LABEL_BY_TYPE = new Map<AccountType, string>(
  Object.entries(TYPE_LABELS) as [AccountType, string][]
);

/** Only active accounts the user has opted into count towards net worth. */
function countsTowardsNetWorth(account: NetWorthAccount): boolean {
  return account.isActive && account.includeInNetWorth;
}

export function calculateNetWorth(
  accounts: NetWorthAccount[]
): NetWorthBreakdown {
  const included = accounts.filter(countsTowardsNetWorth);
  const excludedCount = accounts.length - included.length;

  const assets = included.filter((a) => !isLiabilityType(a.type));
  const liabilities = included.filter((a) => isLiabilityType(a.type));

  const totalAssets = assets.reduce((sum, a) => sum + a.currentBalance, 0);
  const totalLiabilities = liabilities.reduce(
    (sum, a) => sum + a.currentBalance,
    0
  );

  return {
    netWorth: totalAssets - totalLiabilities,
    totalAssets,
    totalLiabilities,
    assetGroups: groupByType(assets),
    liabilityGroups: groupByType(liabilities),
    excludedCount,
  };
}

function groupByType(accounts: NetWorthAccount[]): AccountGroup[] {
  const byType = new Map<AccountType, NetWorthAccount[]>();

  for (const account of accounts) {
    const group = byType.get(account.type) ?? [];
    group.push(account);
    byType.set(account.type, group);
  }

  return [...byType.entries()]
    .map(([type, group]) => ({
      type,
      label: accountTypeLabel(type),
      total: group.reduce((sum, a) => sum + a.currentBalance, 0),
      accounts: [...group].sort((a, b) => b.currentBalance - a.currentBalance),
    }))
    .sort((a, b) => b.total - a.total);
}

export interface BalanceSnapshot {
  accountId: string;
  balance: number;
  recordedAt: Date;
}

export interface NetWorthPoint {
  date: Date;
  netWorth: number;
  assets: number;
  liabilities: number;
}

/**
 * Reconstruct net worth at each of a series of dates.
 *
 * For every date we take each account's most recent snapshot at or before that
 * date — the "last known balance" — rather than only accounts snapshotted that
 * day. Without that, a month where only one account was updated would show net
 * worth collapsing to that single account.
 *
 * Accounts with no snapshot yet at a given date contribute nothing, which is
 * correct: they did not exist as far as the record goes.
 */
export function buildNetWorthHistory(
  accounts: NetWorthAccount[],
  snapshots: BalanceSnapshot[],
  dates: Date[]
): NetWorthPoint[] {
  const included = accounts.filter(countsTowardsNetWorth);
  const accountById = new Map(included.map((a) => [a.id, a]));

  const byAccount = new Map<string, BalanceSnapshot[]>();
  for (const snapshot of snapshots) {
    if (!accountById.has(snapshot.accountId)) continue;
    const list = byAccount.get(snapshot.accountId) ?? [];
    list.push(snapshot);
    byAccount.set(snapshot.accountId, list);
  }

  for (const list of byAccount.values()) {
    list.sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime());
  }

  return [...dates]
    .sort((a, b) => a.getTime() - b.getTime())
    .map((date) => {
      let assets = 0;
      let liabilities = 0;

      for (const [accountId, list] of byAccount) {
        const account = accountById.get(accountId);
        if (!account) continue;

        const balance = balanceAsOf(list, date);
        if (balance === null) continue;

        if (isLiabilityType(account.type)) liabilities += balance;
        else assets += balance;
      }

      return { date, netWorth: assets - liabilities, assets, liabilities };
    });
}

/** Most recent snapshot value at or before `date`, or null if none exists. */
function balanceAsOf(
  sortedSnapshots: BalanceSnapshot[],
  date: Date
): number | null {
  let result: number | null = null;

  for (const snapshot of sortedSnapshots) {
    if (snapshot.recordedAt.getTime() > date.getTime()) break;
    result = snapshot.balance;
  }

  return result;
}

/** Month-end dates for the last `months` months, oldest first. */
export function monthEndDates(months: number, referenceDate = new Date()) {
  const dates: Date[] = [];

  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const date = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth() - offset + 1,
      0,
      23,
      59,
      59
    );
    // The current month is only complete up to today.
    dates.push(offset === 0 ? referenceDate : date);
  }

  return dates;
}

export interface NetWorthChange {
  absolute: number;
  /** Null when the starting point is zero — percentage change is undefined. */
  percent: number | null;
}

export function netWorthChange(history: NetWorthPoint[]): NetWorthChange {
  const first = history.at(0);
  const last = history.at(-1);
  if (!first || !last) return { absolute: 0, percent: null };

  const absolute = last.netWorth - first.netWorth;
  const percent =
    first.netWorth === 0 ? null : (absolute / Math.abs(first.netWorth)) * 100;

  return { absolute, percent };
}

/**
 * Credit utilisation, as a percentage of the limit.
 * Returns null when no limit is set, rather than implying 0%.
 */
export function creditUtilisation(account: NetWorthAccount): number | null {
  if (account.type !== "credit_card") return null;
  if (!account.creditLimit || account.creditLimit <= 0) return null;
  return (account.currentBalance / account.creditLimit) * 100;
}
