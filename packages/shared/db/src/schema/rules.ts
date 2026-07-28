import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { categories } from "./categories";

/**
 * How a rule's `pattern` is compared against a transaction.
 *
 * `contains` is the default because bank descriptions carry a lot of noise
 * ("TESCO STORES 3294 LONDON GB"), so anchored matches rarely fire.
 */
export const ruleMatchType = [
  "contains",
  "starts_with",
  "equals",
  "regex",
] as const;
export type RuleMatchType = (typeof ruleMatchType)[number];

/** Which transaction text the pattern is tested against. */
export const ruleMatchField = ["description", "merchant", "any"] as const;
export type RuleMatchField = (typeof ruleMatchField)[number];

export const categorizationRules = pgTable(
  "categorization_rules",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    /** Human-readable label, e.g. "Tesco -> Groceries". */
    name: text("name").notNull(),
    pattern: text("pattern").notNull(),
    matchType: text("match_type")
      .$type<RuleMatchType>()
      .notNull()
      .default("contains"),
    matchField: text("match_field")
      .$type<RuleMatchField>()
      .notNull()
      .default("any"),
    categoryId: text("category_id")
      .references(() => categories.id, { onDelete: "cascade" })
      .notNull(),
    /** Lower numbers win. Ties break on more specific (longer) patterns. */
    priority: integer("priority").notNull().default(100),
    enabled: boolean("enabled").notNull().default(true),
    /** Rules seeded from the built-in merchant list, vs. user-authored. */
    isBuiltIn: boolean("is_built_in").notNull().default(false),
    /** Incremented each time the rule categorises a transaction. */
    timesApplied: integer("times_applied").notNull().default(0),
    lastAppliedAt: timestamp("last_applied_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("categorization_rules_user_id_idx").on(table.userId),
    index("categorization_rules_category_id_idx").on(table.categoryId),
    index("categorization_rules_priority_idx").on(table.priority),
  ]
);

export type CategorizationRule = typeof categorizationRules.$inferSelect;
export type NewCategorizationRule = typeof categorizationRules.$inferInsert;
