import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const MIGRATIONS_DIR = path.join(
  REPO_ROOT,
  "packages",
  "shared",
  "db",
  "drizzle"
);

/**
 * Connection string for the throwaway integration-test database.
 * Defaults to a `finance_test` database on the local docker Postgres so
 * tests never touch development data. Override with TEST_DATABASE_URL.
 */
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5433/finance_test";

function adminConnectionString(): string {
  const url = new URL(TEST_DATABASE_URL);
  url.pathname = "/postgres"; // maintenance DB used to issue CREATE DATABASE
  return url.toString();
}

function testDatabaseName(): string {
  return new URL(TEST_DATABASE_URL).pathname.slice(1);
}

function readMigrationStatements(): string[] {
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const statements: string[] = [];
  for (const file of files) {
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
    for (const part of sql.split("--> statement-breakpoint")) {
      const trimmed = part.trim();
      if (trimmed.length > 0) statements.push(trimmed);
    }
  }
  return statements;
}

/**
 * Provision a clean test database: create it if needed, drop everything in
 * the public schema, then replay the generated Drizzle migrations. Idempotent
 * and safe to run before every integration test run.
 */
export async function provisionTestDatabase(): Promise<void> {
  const dbName = testDatabaseName();

  const admin = postgres(adminConnectionString(), { max: 1 });
  try {
    const existing = await admin`
      SELECT 1 FROM pg_database WHERE datname = ${dbName}
    `;
    if (existing.length === 0) {
      await admin.unsafe(`CREATE DATABASE "${dbName}"`);
    }
  } finally {
    await admin.end({ timeout: 5 });
  }

  const client = postgres(TEST_DATABASE_URL, { max: 1 });
  try {
    // Clean slate so re-runs are deterministic.
    await client.unsafe("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
    for (const statement of readMigrationStatements()) {
      await client.unsafe(statement);
    }
  } finally {
    await client.end({ timeout: 5 });
  }
}
