import { pgTable, text, timestamp, real, index } from "drizzle-orm/pg-core";
import { users } from "./users";
import { accounts } from "./accounts";

export const goalStatuses = ["active", "achieved", "archived"] as const;
export type GoalStatus = (typeof goalStatuses)[number];

export const goals = pgTable(
  "goals",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    targetAmount: real("target_amount").notNull(),
    /**
     * Manually tracked progress. Ignored when `linkedAccountId` is set, in
     * which case the linked account's balance is the source of truth — keeping
     * two numbers in sync by hand is how they drift apart.
     */
    currentAmount: real("current_amount").notNull().default(0),
    /** Optional. Without it there is a target but no schedule to be behind on. */
    targetDate: timestamp("target_date"),
    linkedAccountId: text("linked_account_id").references(() => accounts.id, {
      onDelete: "set null",
    }),
    icon: text("icon"),
    color: text("color"),
    status: text("status").$type<GoalStatus>().notNull().default("active"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("goals_user_id_idx").on(table.userId),
    index("goals_status_idx").on(table.status),
  ]
);

export type Goal = typeof goals.$inferSelect;
export type NewGoal = typeof goals.$inferInsert;
