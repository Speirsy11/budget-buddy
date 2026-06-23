#!/usr/bin/env node
/* global console */
/* eslint-disable no-console, security/detect-object-injection -- CLI seed script reads env keys and prints operator-facing output. */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import postgres from "postgres";

const DEFAULT_USER_ID = "user_budget_buddy_demo";
const BASE_SEED_PREFIX = "seed-budget-buddy";
let SEED_PREFIX = BASE_SEED_PREFIX;

function setSeedPrefix(userId) {
  const safeUserId = userId.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 48);
  SEED_PREFIX = `${BASE_SEED_PREFIX}-${safeUserId}`;
}

function loadDotenv(filePath) {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;

    let value = rawValue.trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

function parseArgs(argv) {
  const options = {
    reset: true,
    months: 8,
    userId:
      process.env.BUDGET_BUDDY_SEED_USER_ID ||
      process.env.CLERK_TEST_USER_ID ||
      DEFAULT_USER_ID,
    email: process.env.BUDGET_BUDDY_SEED_EMAIL || "demo@budgetbuddy.local",
    firstName: process.env.BUDGET_BUDDY_SEED_FIRST_NAME || "Charlie",
    lastName: process.env.BUDGET_BUDDY_SEED_LAST_NAME || "Demo",
  };

  for (const arg of argv) {
    if (arg === "--") continue;
    if (arg === "--help" || arg === "-h") options.help = true;
    else if (arg === "--no-reset") options.reset = false;
    else if (arg === "--reset") options.reset = true;
    else if (arg.startsWith("--user-id=")) options.userId = arg.slice(10);
    else if (arg.startsWith("--email=")) options.email = arg.slice(8);
    else if (arg.startsWith("--first-name=")) options.firstName = arg.slice(13);
    else if (arg.startsWith("--last-name=")) options.lastName = arg.slice(12);
    else if (arg.startsWith("--months=")) options.months = Number(arg.slice(9));
    else throw new Error(`Unknown argument: ${arg}`);
  }

  if (
    !Number.isInteger(options.months) ||
    options.months < 1 ||
    options.months > 24
  ) {
    throw new Error("--months must be an integer between 1 and 24");
  }

  return options;
}

function printHelp() {
  console.log(
    `Seed Budget Buddy with realistic demo data.\n\nUsage:\n  pnpm db:seed -- --user-id=<clerk_user_id> [options]\n\nOptions:\n  --user-id=<id>       Clerk user id to seed for. Defaults to ${DEFAULT_USER_ID}.\n                       To see data in the signed-in app, use your real Clerk user id.\n  --email=<email>      Email for the seeded user. Defaults to demo@budgetbuddy.local.\n  --first-name=<name>  First name for the seeded user. Defaults to Charlie.\n  --last-name=<name>   Last name for the seeded user. Defaults to Demo.\n  --months=<n>         Number of months of transaction history, 1-24. Defaults to 8.\n  --no-reset           Keep previous seeded rows and append another generated set.\n  --reset              Delete previous seeded rows for this user first. Default.\n  -h, --help           Show this help.\n\nEnvironment:\n  DATABASE_URL is required. The script loads .env automatically if present.\n  BUDGET_BUDDY_SEED_USER_ID can be used instead of --user-id.\n`
  );
}

function monthStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date, offset) {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1);
}

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function makeDate(year, monthIndex, day, hour = 12, minute = 0) {
  const safeDay = Math.min(day, daysInMonth(year, monthIndex));
  return new Date(year, monthIndex, safeDay, hour, minute, 0);
}

function amountWithNoise(base, monthOffset, index, variance = 0.08) {
  const wobble = Math.sin((monthOffset + 1) * (index + 2)) * variance;
  return Number((base * (1 + wobble)).toFixed(2));
}

function buildCategories(userId) {
  return [
    ["income", "Income", "💷", "#10b981", "savings"],
    ["rent", "Rent & Mortgage", "🏠", "#0ea5e9", "need"],
    ["groceries", "Groceries", "🛒", "#22c55e", "need"],
    ["bills", "Bills & Utilities", "💡", "#f59e0b", "need"],
    ["transport", "Transport", "🚆", "#6366f1", "need"],
    ["health", "Health", "💊", "#14b8a6", "need"],
    ["dining", "Dining Out", "🍜", "#f97316", "want"],
    ["shopping", "Shopping", "🛍️", "#ec4899", "want"],
    ["entertainment", "Entertainment", "🎮", "#8b5cf6", "want"],
    ["travel", "Travel", "✈️", "#06b6d4", "want"],
    ["savings", "Savings & Investments", "🐷", "#84cc16", "savings"],
  ].map(([slug, name, icon, color, necessityType]) => ({
    id: `${SEED_PREFIX}-cat-${slug}`,
    user_id: userId,
    name,
    icon,
    color,
    necessity_type: necessityType,
    is_system: false,
  }));
}

const categoryId = (slug) => `${SEED_PREFIX}-cat-${slug}`;

function buildTransactions(userId, bankConnectionId, months) {
  const current = monthStart(new Date());
  const rows = [];
  let sequence = 1;

  const recurring = [
    {
      day: 1,
      amount: 4250,
      description: "Acme Software Ltd Salary",
      merchant: "Acme Software Ltd",
      category: "income",
      score: 0.5,
    },
    {
      day: 1,
      amount: -1250,
      description: "City Apartments Rent",
      merchant: "City Apartments",
      category: "rent",
      score: 1,
    },
    {
      day: 2,
      amount: -145,
      description: "Octopus Energy",
      merchant: "Octopus Energy",
      category: "bills",
      score: 1,
    },
    {
      day: 3,
      amount: -38.99,
      description: "Vodafone Mobile",
      merchant: "Vodafone",
      category: "bills",
      score: 1,
    },
    {
      day: 4,
      amount: -28.5,
      description: "Trainline Season Top-up",
      merchant: "Trainline",
      category: "transport",
      score: 1,
    },
    {
      day: 5,
      amount: -15.99,
      description: "Netflix",
      merchant: "Netflix",
      category: "entertainment",
      score: 0,
    },
    {
      day: 6,
      amount: -9.99,
      description: "Spotify",
      merchant: "Spotify",
      category: "entertainment",
      score: 0,
    },
    {
      day: 8,
      amount: -500,
      description: "Vanguard ISA Contribution",
      merchant: "Vanguard",
      category: "savings",
      score: 0.5,
    },
  ];

  const variable = [
    {
      day: 7,
      amount: -72.45,
      description: "Tesco Extra",
      merchant: "Tesco",
      category: "groceries",
      score: 1,
    },
    {
      day: 10,
      amount: -46.2,
      description: "Sainsbury's Local",
      merchant: "Sainsbury's",
      category: "groceries",
      score: 1,
    },
    {
      day: 13,
      amount: -18.8,
      description: "Pret A Manger",
      merchant: "Pret A Manger",
      category: "dining",
      score: 0,
    },
    {
      day: 15,
      amount: -86.1,
      description: "BP Fuel",
      merchant: "BP",
      category: "transport",
      score: 1,
    },
    {
      day: 17,
      amount: -54.35,
      description: "Deliveroo",
      merchant: "Deliveroo",
      category: "dining",
      score: 0,
    },
    {
      day: 19,
      amount: -39.99,
      description: "Boots Pharmacy",
      merchant: "Boots",
      category: "health",
      score: 1,
    },
    {
      day: 21,
      amount: -92.0,
      description: "Zara",
      merchant: "Zara",
      category: "shopping",
      score: 0,
    },
    {
      day: 24,
      amount: -31.5,
      description: "Vue Cinema",
      merchant: "Vue",
      category: "entertainment",
      score: 0,
    },
    {
      day: 27,
      amount: -68.72,
      description: "Waitrose",
      merchant: "Waitrose",
      category: "groceries",
      score: 1,
    },
  ];

  const occasional = [
    {
      every: 2,
      day: 11,
      amount: -220,
      description: "Airbnb Weekend Away",
      merchant: "Airbnb",
      category: "travel",
      score: 0,
    },
    {
      every: 3,
      day: 22,
      amount: 125,
      description: "Marketplace Sale",
      merchant: "Facebook Marketplace",
      category: "income",
      score: 0.5,
    },
    {
      every: 4,
      day: 25,
      amount: -310,
      description: "Apple Store",
      merchant: "Apple",
      category: "shopping",
      score: 0,
    },
  ];

  for (let monthOffset = months - 1; monthOffset >= 0; monthOffset -= 1) {
    const monthDate = addMonths(current, -monthOffset);
    const year = monthDate.getFullYear();
    const monthIndex = monthDate.getMonth();
    const monthLabel = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;

    for (const tx of [...recurring, ...variable]) {
      const index = sequence++;
      rows.push({
        id: `${SEED_PREFIX}-tx-${monthLabel}-${String(index).padStart(4, "0")}`,
        user_id: userId,
        amount: amountWithNoise(
          tx.amount,
          monthOffset,
          index,
          tx.amount > 0 ? 0.02 : 0.1
        ),
        date: makeDate(year, monthIndex, tx.day, 9 + (index % 10), 15),
        description: tx.description,
        merchant: tx.merchant,
        category_id: categoryId(tx.category),
        necessity_score: tx.score,
        ai_classified: tx.category,
        notes: "Seeded demo transaction",
        bank_connection_id: bankConnectionId,
        external_id: `${SEED_PREFIX}-external-${monthLabel}-${String(index).padStart(4, "0")}`,
        source: "open_banking",
      });
    }

    for (const tx of occasional) {
      if (monthOffset % tx.every !== 0) continue;
      const index = sequence++;
      rows.push({
        id: `${SEED_PREFIX}-tx-${monthLabel}-${String(index).padStart(4, "0")}`,
        user_id: userId,
        amount: amountWithNoise(tx.amount, monthOffset, index, 0.12),
        date: makeDate(year, monthIndex, tx.day, 18, 30),
        description: tx.description,
        merchant: tx.merchant,
        category_id: categoryId(tx.category),
        necessity_score: tx.score,
        ai_classified: tx.category,
        notes: "Seeded demo transaction",
        bank_connection_id: bankConnectionId,
        external_id: `${SEED_PREFIX}-external-${monthLabel}-${String(index).padStart(4, "0")}`,
        source: tx.amount > 0 ? "manual" : "open_banking",
      });
    }
  }

  return rows.sort((a, b) => a.date.getTime() - b.date.getTime());
}

function buildBudgets(userId, months) {
  const current = monthStart(new Date());
  const budgets = [];
  const allocations = [];

  const budgetTemplates = [
    ["rent", "Rent & Mortgage", 1250],
    ["groceries", "Groceries", 420],
    ["bills", "Bills & Utilities", 260],
    ["transport", "Transport", 180],
    ["dining", "Dining Out", 260],
    ["shopping", "Shopping", 240],
    ["entertainment", "Entertainment", 130],
    ["travel", "Travel", 220],
    ["savings", "Savings & Investments", 850],
  ];

  for (let monthOffset = months - 1; monthOffset >= 0; monthOffset -= 1) {
    const monthDate = addMonths(current, -monthOffset);
    const month = monthDate.getMonth() + 1;
    const year = monthDate.getFullYear();
    const monthLabel = `${year}-${String(month).padStart(2, "0")}`;

    allocations.push({
      id: `${SEED_PREFIX}-allocation-${monthLabel}`,
      user_id: userId,
      total_income: 4250,
      needs_percent: 50,
      wants_percent: 30,
      savings_percent: 20,
      month,
      year,
    });

    for (const [slug, name, amount] of budgetTemplates) {
      budgets.push({
        id: `${SEED_PREFIX}-budget-${monthLabel}-${slug}`,
        user_id: userId,
        category_id: categoryId(slug),
        name,
        amount,
        period: "monthly",
        month,
        year,
      });
    }
  }

  return { budgets, allocations };
}

async function main() {
  loadDotenv(path.resolve(process.cwd(), ".env"));
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is required. Add it to .env or export it before running pnpm db:seed."
    );
  }

  const sql = postgres(process.env.DATABASE_URL, { max: 1 });
  setSeedPrefix(options.userId);

  const now = new Date();
  const bankConnectionId = `${SEED_PREFIX}-bank-main`;
  const categories = buildCategories(options.userId);
  const transactions = buildTransactions(
    options.userId,
    bankConnectionId,
    options.months
  );
  const { budgets, allocations } = buildBudgets(options.userId, options.months);

  try {
    await sql.begin(async (tx) => {
      if (options.reset) {
        await tx`delete from transactions where user_id = ${options.userId} and (id like ${`${SEED_PREFIX}-%`} or external_id like ${`${SEED_PREFIX}-%`})`;
        await tx`delete from budgets where user_id = ${options.userId} and id like ${`${SEED_PREFIX}-%`}`;
        await tx`delete from budget_allocations where user_id = ${options.userId} and id like ${`${SEED_PREFIX}-%`}`;
        await tx`delete from bank_connections where user_id = ${options.userId} and id like ${`${SEED_PREFIX}-%`}`;
        await tx`delete from categories where user_id = ${options.userId} and id like ${`${SEED_PREFIX}-%`}`;
      }

      await tx`
        insert into users (id, email, first_name, last_name, image_url, created_at, updated_at)
        values (${options.userId}, ${options.email}, ${options.firstName}, ${options.lastName}, null, ${now}, ${now})
        on conflict (id) do update set
          email = excluded.email,
          first_name = excluded.first_name,
          last_name = excluded.last_name,
          updated_at = excluded.updated_at
      `;

      await tx`insert into categories ${tx(categories)} on conflict (id) do update set name = excluded.name, icon = excluded.icon, color = excluded.color, necessity_type = excluded.necessity_type, is_system = excluded.is_system`;

      await tx`
        insert into bank_connections (id, user_id, plaid_item_id, plaid_access_token, institution_id, institution_name, account_ids, status, last_synced_at, consent_expires_at, cursor, created_at, updated_at)
        values (${bankConnectionId}, ${options.userId}, ${`${SEED_PREFIX}-plaid-item`}, ${`${SEED_PREFIX}-access-token`}, 'ins_109508', 'Monzo Demo Bank', ${tx.json(["demo-current-account", "demo-savings-account"])}, 'active', ${now}, ${addMonths(now, 3)}, ${`${SEED_PREFIX}-cursor`}, ${now}, ${now})
        on conflict (id) do update set
          status = excluded.status,
          last_synced_at = excluded.last_synced_at,
          consent_expires_at = excluded.consent_expires_at,
          updated_at = excluded.updated_at
      `;

      await tx`insert into budget_allocations ${tx(allocations)} on conflict (id) do update set total_income = excluded.total_income, needs_percent = excluded.needs_percent, wants_percent = excluded.wants_percent, savings_percent = excluded.savings_percent, updated_at = now()`;
      await tx`insert into budgets ${tx(budgets)} on conflict (id) do update set name = excluded.name, amount = excluded.amount, period = excluded.period, updated_at = now()`;
      await tx`insert into transactions ${tx(transactions)} on conflict (id) do update set amount = excluded.amount, date = excluded.date, description = excluded.description, merchant = excluded.merchant, category_id = excluded.category_id, necessity_score = excluded.necessity_score, ai_classified = excluded.ai_classified, notes = excluded.notes, bank_connection_id = excluded.bank_connection_id, external_id = excluded.external_id, source = excluded.source, updated_at = now()`;
    });

    console.log(`Seeded Budget Buddy demo data for ${options.userId}`);
    console.log(`  categories: ${categories.length}`);
    console.log(`  transactions: ${transactions.length}`);
    console.log(`  budgets: ${budgets.length}`);
    console.log(`  allocations: ${allocations.length}`);
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
