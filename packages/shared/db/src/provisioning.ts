import { eq, and } from "drizzle-orm";
import { db } from "./index";
import { categories } from "./schema/categories";
import { categorizationRules } from "./schema/rules";
import {
  DEFAULT_CATEGORIES,
  BUILT_IN_RULES,
  defaultCategoryId,
} from "./defaults";

/** Built-in rules sit above user-authored ones (which default to 100). */
const BUILT_IN_RULE_PRIORITY = 10;

/**
 * Give a user the category set and starter rules they need to be useful on day
 * one. Idempotent, so it is safe to call on every sign-in.
 *
 * This lives in the db package rather than a feature package because both
 * @finance/auth (on signup) and @finance/transactions (on import) need it, and
 * features may not import one another.
 */
export async function ensureUserDefaults(userId: string): Promise<{
  categoriesCreated: number;
  rulesCreated: number;
}> {
  const categoriesCreated = await ensureDefaultCategories(userId);
  const rulesCreated = await ensureBuiltInRules(userId);
  return { categoriesCreated, rulesCreated };
}

/**
 * Create any missing default categories for a user.
 *
 * Existing users may already have categories under different IDs (the seed
 * script uses its own prefix). We match on name to avoid creating duplicates
 * that would split their spending history across two "Groceries".
 */
export async function ensureDefaultCategories(userId: string): Promise<number> {
  const existing = await db.query.categories.findMany({
    where: eq(categories.userId, userId),
  });

  const existingNames = new Set(
    existing.map((category) => category.name.toLowerCase())
  );

  const missing = DEFAULT_CATEGORIES.filter(
    (category) => !existingNames.has(category.name.toLowerCase())
  );

  if (missing.length === 0) return 0;

  await db
    .insert(categories)
    .values(
      missing.map((category) => ({
        id: defaultCategoryId(userId, category.slug),
        userId,
        name: category.name,
        icon: category.icon,
        color: category.color,
        necessityType: category.necessityType,
        isSystem: true,
      }))
    )
    .onConflictDoNothing();

  return missing.length;
}

/**
 * Seed the built-in merchant rules, resolving each to one of the user's own
 * categories by name.
 *
 * Rules whose target category does not exist are skipped rather than failing
 * the whole batch — a user who deleted "Travel" simply gets no travel rules.
 */
export async function ensureBuiltInRules(userId: string): Promise<number> {
  const existingBuiltIn = await db.query.categorizationRules.findMany({
    where: and(
      eq(categorizationRules.userId, userId),
      eq(categorizationRules.isBuiltIn, true)
    ),
  });

  // Already provisioned. We deliberately do not top up with newly added
  // built-ins, so a user who deleted a rule does not get it back on next login.
  if (existingBuiltIn.length > 0) return 0;

  const userCategories = await db.query.categories.findMany({
    where: eq(categories.userId, userId),
  });

  const categoryIdBySlug = new Map<string, string>();
  for (const defaultCategory of DEFAULT_CATEGORIES) {
    const match = userCategories.find(
      (category) =>
        category.name.toLowerCase() === defaultCategory.name.toLowerCase()
    );
    if (match) categoryIdBySlug.set(defaultCategory.slug, match.id);
  }

  const rows = BUILT_IN_RULES.flatMap((rule) => {
    const categoryId = categoryIdBySlug.get(rule.categorySlug);
    if (!categoryId) return [];

    return [
      {
        userId,
        name: `${rule.pattern} → ${rule.categorySlug}`,
        pattern: rule.pattern,
        matchType: "contains" as const,
        matchField: "any" as const,
        categoryId,
        priority: BUILT_IN_RULE_PRIORITY,
        enabled: true,
        isBuiltIn: true,
      },
    ];
  });

  if (rows.length === 0) return 0;

  await db.insert(categorizationRules).values(rows).onConflictDoNothing();

  return rows.length;
}
