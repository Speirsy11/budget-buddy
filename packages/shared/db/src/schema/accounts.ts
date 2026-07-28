import {
  pgTable,
  text,
  timestamp,
  real,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { bankConnections } from "./bank-connections";

/**
 * Account types, split by whether a positive balance helps or hurts net worth.
 *
 * Liability balances are stored as positive numbers representing what is owed —
 * £500 on a credit card is `500`, not `-500`. Net worth subtracts them. Storing
 * the sign in the data instead would make every balance edit a chance to get it
 * backwards.
 */
export const assetAccountTypes = [
  "checking",
  "savings",
  "cash",
  "investment",
  "pension",
  "property",
] as const;

export const liabilityAccountTypes = [
  "credit_card",
  "loan",
  "mortgage",
] as const;

export const accountTypes = [
  ...assetAccountTypes,
  ...liabilityAccountTypes,
] as const;

export type AccountType = (typeof accountTypes)[number];
export type AssetAccountType = (typeof assetAccountTypes)[number];
export type LiabilityAccountType = (typeof liabilityAccountTypes)[number];

export function isLiabilityType(type: AccountType): boolean {
  return (liabilityAccountTypes as readonly string[]).includes(type);
}

export const accounts = pgTable(
  "accounts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    type: text("type").$type<AccountType>().notNull(),
    institutionName: text("institution_name"),
    /** ISO 4217. Single-currency for now, but stored so totals can validate. */
    currency: text("currency").notNull().default("GBP"),
    /** Always the magnitude; see the note on liabilities above. */
    currentBalance: real("current_balance").notNull().default(0),
    /** Credit cards only — lets the UI show headroom and utilisation. */
    creditLimit: real("credit_limit"),
    /** Lets someone track an account without it skewing net worth. */
    includeInNetWorth: boolean("include_in_net_worth").notNull().default(true),
    /** Closed accounts stay for history but drop out of totals. */
    isActive: boolean("is_active").notNull().default(true),
    /** Set when the account came from an open-banking sync rather than by hand. */
    bankConnectionId: text("bank_connection_id").references(
      () => bankConnections.id,
      { onDelete: "set null" }
    ),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("accounts_user_id_idx").on(table.userId),
    index("accounts_type_idx").on(table.type),
  ]
);

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;

/**
 * Point-in-time balances, appended whenever an account balance changes.
 *
 * Net worth history cannot be reconstructed from transactions alone — opening
 * balances, investment growth and property revaluations never appear as
 * transactions — so it is recorded explicitly.
 */
export const accountBalanceSnapshots = pgTable(
  "account_balance_snapshots",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    accountId: text("account_id")
      .references(() => accounts.id, { onDelete: "cascade" })
      .notNull(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    balance: real("balance").notNull(),
    recordedAt: timestamp("recorded_at").defaultNow().notNull(),
  },
  (table) => [
    index("account_balance_snapshots_account_id_idx").on(table.accountId),
    index("account_balance_snapshots_user_id_idx").on(table.userId),
    index("account_balance_snapshots_recorded_at_idx").on(table.recordedAt),
  ]
);

export type AccountBalanceSnapshot =
  typeof accountBalanceSnapshots.$inferSelect;
export type NewAccountBalanceSnapshot =
  typeof accountBalanceSnapshots.$inferInsert;
