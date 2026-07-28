import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk user ID
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  imageUrl: text("image_url"),
  /**
   * When the weekly summary was last successfully delivered.
   *
   * The cron route is a single request that emails every user in turn, so a
   * timeout part-way through means the scheduler retries the whole window.
   * Recording delivery per user makes that retry resume rather than resend.
   */
  lastWeeklySummaryAt: timestamp("last_weekly_summary_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
