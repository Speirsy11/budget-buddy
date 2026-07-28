import { relations } from "drizzle-orm";
import { users } from "./schema/users";
import { transactions } from "./schema/transactions";
import { categories } from "./schema/categories";
import { budgets, budgetAllocations } from "./schema/budgets";
import { subscriptions } from "./schema/subscriptions";
import { bankConnections } from "./schema/bank-connections";
import { categorizationRules } from "./schema/rules";
import { accounts, accountBalanceSnapshots } from "./schema/accounts";

export const usersRelations = relations(users, ({ many }) => ({
  transactions: many(transactions),
  categories: many(categories),
  budgets: many(budgets),
  budgetAllocations: many(budgetAllocations),
  subscriptions: many(subscriptions),
  bankConnections: many(bankConnections),
  categorizationRules: many(categorizationRules),
  accounts: many(accounts),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
  bankConnection: one(bankConnections, {
    fields: [accounts.bankConnectionId],
    references: [bankConnections.id],
  }),
  transactions: many(transactions),
  balanceSnapshots: many(accountBalanceSnapshots),
}));

export const accountBalanceSnapshotsRelations = relations(
  accountBalanceSnapshots,
  ({ one }) => ({
    account: one(accounts, {
      fields: [accountBalanceSnapshots.accountId],
      references: [accounts.id],
    }),
    user: one(users, {
      fields: [accountBalanceSnapshots.userId],
      references: [users.id],
    }),
  })
);

export const categorizationRulesRelations = relations(
  categorizationRules,
  ({ one }) => ({
    user: one(users, {
      fields: [categorizationRules.userId],
      references: [users.id],
    }),
    category: one(categories, {
      fields: [categorizationRules.categoryId],
      references: [categories.id],
    }),
  })
);

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
  bankConnection: one(bankConnections, {
    fields: [transactions.bankConnectionId],
    references: [bankConnections.id],
  }),
  account: one(accounts, {
    fields: [transactions.accountId],
    references: [accounts.id],
  }),
}));

export const bankConnectionsRelations = relations(
  bankConnections,
  ({ one, many }) => ({
    user: one(users, {
      fields: [bankConnections.userId],
      references: [users.id],
    }),
    transactions: many(transactions),
  })
);

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, {
    fields: [categories.userId],
    references: [users.id],
  }),
  transactions: many(transactions),
  budgets: many(budgets),
  categorizationRules: many(categorizationRules),
}));

export const budgetsRelations = relations(budgets, ({ one }) => ({
  user: one(users, {
    fields: [budgets.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [budgets.categoryId],
    references: [categories.id],
  }),
}));

export const budgetAllocationsRelations = relations(
  budgetAllocations,
  ({ one }) => ({
    user: one(users, {
      fields: [budgetAllocations.userId],
      references: [users.id],
    }),
  })
);

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));
