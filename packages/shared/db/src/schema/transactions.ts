import { pgTable, text, timestamp, real, index } from "drizzle-orm/pg-core";
import { users } from "./users";
import { categories } from "./categories";
import { bankConnections } from "./bank-connections";

export const transactionSource = ["csv", "open_banking", "manual"] as const;
export type TransactionSource = (typeof transactionSource)[number];

export const transactions = pgTable(
  "transactions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    amount: real("amount").notNull(),
    date: timestamp("date").notNull(),
    description: text("description").notNull(),
    merchant: text("merchant"),
    categoryId: text("category_id").references(() => categories.id),
    necessityScore: real("necessity_score"),
    aiClassified: text("ai_classified"), // AI-generated category suggestion
    notes: text("notes"),
    bankConnectionId: text("bank_connection_id").references(
      () => bankConnections.id,
      { onDelete: "set null" }
    ),
    externalId: text("external_id"), // Plaid transaction ID for deduplication
    source: text("source").$type<TransactionSource>().default("csv"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("transactions_user_id_idx").on(table.userId),
    index("transactions_date_idx").on(table.date),
    index("transactions_category_id_idx").on(table.categoryId),
    index("transactions_external_id_idx").on(table.externalId),
    index("transactions_bank_connection_id_idx").on(table.bankConnectionId),
  ]
);

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
