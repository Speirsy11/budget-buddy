import { pgTable, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { users } from "./users";

export const bankConnectionStatus = [
  "active",
  "error",
  "requires_reauth",
] as const;
export type BankConnectionStatus = (typeof bankConnectionStatus)[number];

export const bankConnections = pgTable(
  "bank_connections",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    plaidItemId: text("plaid_item_id").notNull().unique(),
    plaidAccessToken: text("plaid_access_token").notNull(),
    institutionId: text("institution_id"),
    institutionName: text("institution_name"),
    accountIds: jsonb("account_ids").$type<string[]>().default([]),
    status: text("status")
      .$type<BankConnectionStatus>()
      .notNull()
      .default("active"),
    lastSyncedAt: timestamp("last_synced_at"),
    consentExpiresAt: timestamp("consent_expires_at"),
    cursor: text("cursor"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("bank_connections_user_id_idx").on(table.userId),
    index("bank_connections_plaid_item_id_idx").on(table.plaidItemId),
  ]
);

export type BankConnection = typeof bankConnections.$inferSelect;
export type NewBankConnection = typeof bankConnections.$inferInsert;
