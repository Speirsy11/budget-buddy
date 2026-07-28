import type { NecessityType } from "./schema/categories";

/**
 * The category set every new user starts with.
 *
 * Categories are per-user (not global) so people can rename and recolour them
 * without affecting anyone else. That means they have to be provisioned on
 * signup — see `ensureDefaultCategories` in @finance/transactions.
 *
 * `slug` is stable and used to build deterministic category IDs, so built-in
 * rules can reference a category without a lookup round-trip.
 */
export interface DefaultCategory {
  slug: string;
  name: string;
  icon: string;
  color: string;
  necessityType: NecessityType;
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  {
    slug: "income",
    name: "Income",
    icon: "Wallet",
    color: "#10b981",
    necessityType: "savings",
  },
  {
    slug: "rent",
    name: "Rent & Mortgage",
    icon: "Home",
    color: "#6366f1",
    necessityType: "need",
  },
  {
    slug: "bills",
    name: "Bills & Utilities",
    icon: "Zap",
    color: "#f59e0b",
    necessityType: "need",
  },
  {
    slug: "groceries",
    name: "Groceries",
    icon: "ShoppingCart",
    color: "#22c55e",
    necessityType: "need",
  },
  {
    slug: "transport",
    name: "Transport",
    icon: "Car",
    color: "#0ea5e9",
    necessityType: "need",
  },
  {
    slug: "health",
    name: "Health",
    icon: "HeartPulse",
    color: "#ef4444",
    necessityType: "need",
  },
  {
    slug: "dining",
    name: "Dining Out",
    icon: "UtensilsCrossed",
    color: "#f97316",
    necessityType: "want",
  },
  {
    slug: "entertainment",
    name: "Entertainment",
    icon: "Clapperboard",
    color: "#a855f7",
    necessityType: "want",
  },
  {
    slug: "shopping",
    name: "Shopping",
    icon: "ShoppingBag",
    color: "#ec4899",
    necessityType: "want",
  },
  {
    slug: "travel",
    name: "Travel",
    icon: "Plane",
    color: "#14b8a6",
    necessityType: "want",
  },
  {
    slug: "savings",
    name: "Savings & Investments",
    icon: "PiggyBank",
    color: "#3b82f6",
    necessityType: "savings",
  },
  {
    slug: "other",
    name: "Other",
    icon: "CircleDashed",
    color: "#94a3b8",
    necessityType: "want",
  },
];

/** Deterministic per-user category ID, so rules can reference it without a lookup. */
export function defaultCategoryId(userId: string, slug: string): string {
  return `cat-${userId}-${slug}`;
}

/**
 * Merchant patterns seeded as built-in rules for every new user.
 *
 * Skewed towards UK merchants because the app formats in GBP and the CSV
 * parsers target UK banks. Users can disable or edit any of these — they are
 * inserted as ordinary rows, not hardcoded behaviour.
 *
 * Priority 10 = built-in. User-authored rules default to 100, so anything a
 * user writes loses to a built-in only if they explicitly raise its priority.
 * Within the same priority, longer patterns win (see `matchRule`).
 */
export const BUILT_IN_RULES: { pattern: string; categorySlug: string }[] = [
  // Supermarkets
  { pattern: "tesco", categorySlug: "groceries" },
  { pattern: "sainsbury", categorySlug: "groceries" },
  { pattern: "asda", categorySlug: "groceries" },
  { pattern: "morrisons", categorySlug: "groceries" },
  { pattern: "aldi", categorySlug: "groceries" },
  { pattern: "lidl", categorySlug: "groceries" },
  { pattern: "waitrose", categorySlug: "groceries" },
  { pattern: "co-op", categorySlug: "groceries" },
  { pattern: "iceland", categorySlug: "groceries" },
  { pattern: "ocado", categorySlug: "groceries" },
  { pattern: "marks & spencer", categorySlug: "groceries" },
  { pattern: "m&s ", categorySlug: "groceries" },

  // Food delivery and eating out
  { pattern: "deliveroo", categorySlug: "dining" },
  { pattern: "uber eats", categorySlug: "dining" },
  { pattern: "just eat", categorySlug: "dining" },
  { pattern: "mcdonald", categorySlug: "dining" },
  { pattern: "greggs", categorySlug: "dining" },
  { pattern: "pret a manger", categorySlug: "dining" },
  { pattern: "costa coffee", categorySlug: "dining" },
  { pattern: "starbucks", categorySlug: "dining" },
  { pattern: "nando", categorySlug: "dining" },
  { pattern: "wagamama", categorySlug: "dining" },
  { pattern: "domino", categorySlug: "dining" },
  { pattern: "kfc", categorySlug: "dining" },
  { pattern: "subway", categorySlug: "dining" },

  // Transport
  { pattern: "tfl travel", categorySlug: "transport" },
  { pattern: "transport for london", categorySlug: "transport" },
  { pattern: "trainline", categorySlug: "transport" },
  { pattern: "national rail", categorySlug: "transport" },
  { pattern: "uber trip", categorySlug: "transport" },
  { pattern: "bolt.eu", categorySlug: "transport" },
  { pattern: "shell", categorySlug: "transport" },
  { pattern: "bp ", categorySlug: "transport" },
  { pattern: "esso", categorySlug: "transport" },
  { pattern: "dvla", categorySlug: "transport" },
  { pattern: "ringgo", categorySlug: "transport" },

  // Subscriptions and entertainment
  { pattern: "netflix", categorySlug: "entertainment" },
  { pattern: "spotify", categorySlug: "entertainment" },
  { pattern: "disney plus", categorySlug: "entertainment" },
  { pattern: "disney+", categorySlug: "entertainment" },
  { pattern: "amazon prime", categorySlug: "entertainment" },
  { pattern: "now tv", categorySlug: "entertainment" },
  { pattern: "apple.com/bill", categorySlug: "entertainment" },
  { pattern: "playstation", categorySlug: "entertainment" },
  { pattern: "xbox", categorySlug: "entertainment" },
  { pattern: "steam", categorySlug: "entertainment" },
  { pattern: "cineworld", categorySlug: "entertainment" },
  { pattern: "odeon", categorySlug: "entertainment" },

  // Bills and utilities
  { pattern: "british gas", categorySlug: "bills" },
  { pattern: "octopus energy", categorySlug: "bills" },
  { pattern: "edf energy", categorySlug: "bills" },
  { pattern: "eon next", categorySlug: "bills" },
  { pattern: "thames water", categorySlug: "bills" },
  { pattern: "council tax", categorySlug: "bills" },
  { pattern: "tv licence", categorySlug: "bills" },
  { pattern: "virgin media", categorySlug: "bills" },
  { pattern: "sky digital", categorySlug: "bills" },
  { pattern: "bt group", categorySlug: "bills" },
  { pattern: "vodafone", categorySlug: "bills" },
  { pattern: "ee limited", categorySlug: "bills" },
  { pattern: "three uk", categorySlug: "bills" },
  { pattern: "giffgaff", categorySlug: "bills" },

  // Health
  { pattern: "boots", categorySlug: "health" },
  { pattern: "superdrug", categorySlug: "health" },
  { pattern: "pharmacy", categorySlug: "health" },
  { pattern: "nuffield health", categorySlug: "health" },
  { pattern: "puregym", categorySlug: "health" },
  { pattern: "the gym group", categorySlug: "health" },
  { pattern: "bupa", categorySlug: "health" },

  // Shopping
  { pattern: "amazon", categorySlug: "shopping" },
  { pattern: "argos", categorySlug: "shopping" },
  { pattern: "john lewis", categorySlug: "shopping" },
  { pattern: "ikea", categorySlug: "shopping" },
  { pattern: "currys", categorySlug: "shopping" },
  { pattern: "asos", categorySlug: "shopping" },
  { pattern: "zara", categorySlug: "shopping" },
  { pattern: "primark", categorySlug: "shopping" },
  { pattern: "h&m", categorySlug: "shopping" },
  { pattern: "screwfix", categorySlug: "shopping" },
  { pattern: "b&q", categorySlug: "shopping" },

  // Travel
  { pattern: "booking.com", categorySlug: "travel" },
  { pattern: "airbnb", categorySlug: "travel" },
  { pattern: "ryanair", categorySlug: "travel" },
  { pattern: "easyjet", categorySlug: "travel" },
  { pattern: "british airways", categorySlug: "travel" },
  { pattern: "expedia", categorySlug: "travel" },
  { pattern: "premier inn", categorySlug: "travel" },
  { pattern: "travelodge", categorySlug: "travel" },

  // Rent and housing
  { pattern: "rent payment", categorySlug: "rent" },
  { pattern: "mortgage", categorySlug: "rent" },
  { pattern: "landlord", categorySlug: "rent" },

  // Savings and investments
  { pattern: "vanguard", categorySlug: "savings" },
  { pattern: "hargreaves lansdown", categorySlug: "savings" },
  { pattern: "moneybox", categorySlug: "savings" },
  { pattern: "nutmeg", categorySlug: "savings" },
  { pattern: "premium bonds", categorySlug: "savings" },
  { pattern: "ns&i", categorySlug: "savings" },

  // Income
  { pattern: "salary", categorySlug: "income" },
  { pattern: "payroll", categorySlug: "income" },
  { pattern: "hmrc", categorySlug: "income" },
];
