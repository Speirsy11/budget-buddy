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

/**
 * Small deterministic PRNG (mulberry32) seeded from a string.
 *
 * Seeding has to be reproducible — re-running should not silently reshuffle
 * every historical transaction — but the output still has to look irregular,
 * which Math.sin-based noise does not.
 */
function makeRandom(seed) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i += 1) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomInt(random, min, max) {
  return min + Math.floor(random() * (max - min + 1));
}

function roundMoney(value) {
  return Math.round(value * 100) / 100;
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

  /*
   * Discretionary spending: several irregular visits a month, not one charge
   * on a fixed day.
   *
   * This matters beyond looking plausible. The recurring-payment detector
   * groups by merchant and looks for a consistent gap between charges, so a
   * supermarket billed once a month on the 7th is, correctly, indistinguishable
   * from a subscription. Real grocery shopping is 3-6 visits at irregular
   * intervals for varying amounts, which is what stops it being detected.
   */
  const discretionary = [
    {
      minPerMonth: 3,
      maxPerMonth: 6,
      minAmount: 18,
      maxAmount: 96,
      description: "Tesco Extra",
      merchant: "Tesco",
      category: "groceries",
      score: 1,
    },
    {
      minPerMonth: 2,
      maxPerMonth: 5,
      minAmount: 9,
      maxAmount: 58,
      description: "Sainsbury's Local",
      merchant: "Sainsbury's",
      category: "groceries",
      score: 1,
    },
    {
      minPerMonth: 1,
      maxPerMonth: 3,
      minAmount: 24,
      maxAmount: 89,
      description: "Waitrose",
      merchant: "Waitrose",
      category: "groceries",
      score: 1,
    },
    {
      minPerMonth: 4,
      maxPerMonth: 11,
      minAmount: 2.6,
      maxAmount: 14.5,
      description: "Pret A Manger",
      merchant: "Pret A Manger",
      category: "dining",
      score: 0,
    },
    {
      minPerMonth: 1,
      maxPerMonth: 5,
      minAmount: 16,
      maxAmount: 74,
      description: "Deliveroo",
      merchant: "Deliveroo",
      category: "dining",
      score: 0,
    },
    {
      minPerMonth: 0,
      maxPerMonth: 3,
      minAmount: 22,
      maxAmount: 68,
      description: "The Crown Pub",
      merchant: "The Crown",
      category: "dining",
      score: 0,
    },
    {
      minPerMonth: 1,
      maxPerMonth: 3,
      minAmount: 42,
      maxAmount: 95,
      description: "BP Fuel",
      merchant: "BP",
      category: "transport",
      score: 1,
    },
    {
      minPerMonth: 0,
      maxPerMonth: 4,
      minAmount: 4.2,
      maxAmount: 28,
      description: "Uber Trip",
      merchant: "Uber",
      category: "transport",
      score: 1,
    },
    {
      minPerMonth: 0,
      maxPerMonth: 2,
      minAmount: 8,
      maxAmount: 46,
      description: "Boots Pharmacy",
      merchant: "Boots",
      category: "health",
      score: 1,
    },
    {
      minPerMonth: 0,
      maxPerMonth: 2,
      minAmount: 18,
      maxAmount: 140,
      description: "Zara",
      merchant: "Zara",
      category: "shopping",
      score: 0,
    },
    {
      minPerMonth: 0,
      maxPerMonth: 3,
      minAmount: 6.5,
      maxAmount: 82,
      description: "Amazon Marketplace",
      merchant: "Amazon",
      category: "shopping",
      score: 0,
    },
    {
      minPerMonth: 0,
      maxPerMonth: 2,
      minAmount: 11,
      maxAmount: 38,
      description: "Vue Cinema",
      merchant: "Vue",
      category: "entertainment",
      score: 0,
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

    for (const tx of recurring) {
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

    for (const tx of discretionary) {
      // Seeded per merchant and month: stable across runs, but the visit count,
      // days and amounts all differ month to month, so no cadence emerges.
      const random = makeRandom(`${SEED_PREFIX}|${tx.merchant}|${monthLabel}`);
      const visits = randomInt(random, tx.minPerMonth, tx.maxPerMonth);
      const daysThisMonth = daysInMonth(year, monthIndex);
      const usedDays = new Set();

      for (let visit = 0; visit < visits; visit += 1) {
        let day = randomInt(random, 1, daysThisMonth);
        // Two charges at the same merchant on one day happen, but a run of
        // them looks like a data error rather than a shopping trip.
        let attempts = 0;
        while (usedDays.has(day) && attempts < 4) {
          day = randomInt(random, 1, daysThisMonth);
          attempts += 1;
        }
        usedDays.add(day);

        // Skip anything dated in the future — a statement cannot contain it.
        const date = makeDate(
          year,
          monthIndex,
          day,
          8 + randomInt(random, 0, 13),
          randomInt(random, 0, 59)
        );
        if (date.getTime() > Date.now()) continue;

        const index = sequence++;
        rows.push({
          id: `${SEED_PREFIX}-tx-${monthLabel}-${String(index).padStart(4, "0")}`,
          user_id: userId,
          amount: -roundMoney(
            tx.minAmount + random() * (tx.maxAmount - tx.minAmount)
          ),
          date,
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


/**
 * Accounts, with a balance recorded each month so the net-worth chart has a
 * trend rather than a single point.
 *
 * Liability balances are stored as positive magnitudes owed — the schema's
 * convention — and the mortgage amortises while the savings grow, so net worth
 * climbs steadily rather than sitting flat.
 */
function buildAccounts(userId, months) {
  const current = monthStart(new Date());
  const templates = [
    {
      slug: "current",
      name: "Monzo Current Account",
      type: "checking",
      institution: "Monzo",
      startBalance: 1850,
      monthlyDelta: 45,
    },
    {
      slug: "savings",
      name: "Chase Saver",
      type: "savings",
      institution: "Chase",
      startBalance: 6200,
      monthlyDelta: 420,
    },
    {
      slug: "isa",
      name: "Vanguard Stocks & Shares ISA",
      type: "investment",
      institution: "Vanguard",
      startBalance: 14100,
      monthlyDelta: 610,
    },
    {
      slug: "credit",
      name: "Amex Gold",
      type: "credit_card",
      institution: "American Express",
      startBalance: 1240,
      monthlyDelta: -35,
      creditLimit: 6000,
    },
    {
      slug: "mortgage",
      name: "Nationwide Mortgage",
      type: "mortgage",
      institution: "Nationwide",
      startBalance: 214500,
      monthlyDelta: -640,
    },
  ];

  const accounts = [];
  const snapshots = [];

  for (const template of templates) {
    const id = `${SEED_PREFIX}-account-${template.slug}`;
    const random = makeRandom(`${SEED_PREFIX}|account|${template.slug}`);

    let balance = template.startBalance;
    for (let monthOffset = months - 1; monthOffset >= 0; monthOffset -= 1) {
      const monthDate = addMonths(current, -monthOffset);
      // A little jitter so the line is not suspiciously straight.
      const jitter = 1 + (random() - 0.5) * 0.04;
      balance = Math.max(0, roundMoney(balance * jitter));

      snapshots.push({
        id: `${SEED_PREFIX}-snapshot-${template.slug}-${monthOffset}`,
        account_id: id,
        user_id: userId,
        balance,
        recorded_at: makeDate(
          monthDate.getFullYear(),
          monthDate.getMonth(),
          28,
          12,
          0
        ),
      });

      balance = roundMoney(balance + template.monthlyDelta);
    }

    accounts.push({
      id,
      user_id: userId,
      name: template.name,
      type: template.type,
      institution_name: template.institution,
      currency: "GBP",
      current_balance: balance,
      credit_limit: template.creditLimit ?? null,
      include_in_net_worth: true,
      is_active: true,
      bank_connection_id: null,
    });
  }

  // Snapshots dated in the future would be invented history.
  const usable = snapshots.filter((s) => s.recorded_at.getTime() <= Date.now());
  return { accounts, snapshots: usable };
}

/** A couple of goals: one tracking a real account, one tracked by hand. */
function buildGoals(userId) {
  const targetDate = addMonths(monthStart(new Date()), 9);

  return [
    {
      id: `${SEED_PREFIX}-goal-emergency`,
      user_id: userId,
      name: "Emergency fund",
      target_amount: 12000,
      current_amount: 0, // linked: progress comes from the account balance
      target_date: targetDate,
      linked_account_id: `${SEED_PREFIX}-account-savings`,
      icon: "ShieldCheck",
      color: "#22c55e",
      status: "active",
    },
    {
      id: `${SEED_PREFIX}-goal-japan`,
      user_id: userId,
      name: "Trip to Japan",
      target_amount: 3500,
      current_amount: 1150,
      target_date: addMonths(monthStart(new Date()), 6),
      linked_account_id: null,
      icon: "Plane",
      color: "#14b8a6",
      status: "active",
    },
  ];
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
  const { accounts, snapshots } = buildAccounts(options.userId, options.months);
  const goals = buildGoals(options.userId);

  try {
    await sql.begin(async (tx) => {
      if (options.reset) {
        await tx`delete from transactions where user_id = ${options.userId} and (id like ${`${SEED_PREFIX}-%`} or external_id like ${`${SEED_PREFIX}-%`})`;
        await tx`delete from budgets where user_id = ${options.userId} and id like ${`${SEED_PREFIX}-%`}`;
        await tx`delete from budget_allocations where user_id = ${options.userId} and id like ${`${SEED_PREFIX}-%`}`;
        await tx`delete from goals where user_id = ${options.userId} and id like ${`${SEED_PREFIX}-%`}`;
        await tx`delete from account_balance_snapshots where user_id = ${options.userId} and id like ${`${SEED_PREFIX}-%`}`;
        await tx`delete from accounts where user_id = ${options.userId} and id like ${`${SEED_PREFIX}-%`}`;
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

      await tx`insert into accounts ${tx(accounts)} on conflict (id) do update set name = excluded.name, type = excluded.type, institution_name = excluded.institution_name, current_balance = excluded.current_balance, credit_limit = excluded.credit_limit, include_in_net_worth = excluded.include_in_net_worth, is_active = excluded.is_active, updated_at = now()`;
      await tx`insert into account_balance_snapshots ${tx(snapshots)} on conflict (id) do update set balance = excluded.balance, recorded_at = excluded.recorded_at`;
      await tx`insert into goals ${tx(goals)} on conflict (id) do update set name = excluded.name, target_amount = excluded.target_amount, current_amount = excluded.current_amount, target_date = excluded.target_date, linked_account_id = excluded.linked_account_id, status = excluded.status, updated_at = now()`;
    });

    console.log(`Seeded Budget Buddy demo data for ${options.userId}`);
    console.log(`  categories: ${categories.length}`);
    console.log(`  transactions: ${transactions.length}`);
    console.log(`  budgets: ${budgets.length}`);
    console.log(`  allocations: ${allocations.length}`);
    console.log(`  accounts: ${accounts.length} (${snapshots.length} balance snapshots)`);
    console.log(`  goals: ${goals.length}`);
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
