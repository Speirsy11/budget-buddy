import { provisionTestDatabase, TEST_DATABASE_URL } from "./test-db";

/**
 * Vitest global setup for router integration tests. Runs once before the
 * suite and provisions a clean test database. If Postgres is unreachable we
 * fail loudly with guidance rather than producing confusing query errors.
 */
export default async function setup() {
  try {
    await provisionTestDatabase();
  } catch (error) {
    throw new Error(
      `Could not provision the integration-test database (${TEST_DATABASE_URL}).\n` +
        `Start Postgres with \`pnpm infra:up\` (or set TEST_DATABASE_URL).\n` +
        `Original error: ${(error as Error).message}`
    );
  }
}
