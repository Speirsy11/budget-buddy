import { defineConfig } from "vitest/config";
import { TEST_DATABASE_URL } from "./test/integration/test-db";

// Separate config for database-backed router integration tests. Kept out of
// the default `pnpm test:run` suite so unit tests stay fast and DB-free;
// run these with `pnpm test:integration` against a local/CI Postgres.
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["packages/**/*.integration.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**"],
    globalSetup: ["./test/integration/global-setup.ts"],
    // Run integration files serially: they share one test database.
    fileParallelism: false,
    // Database setup and sequential mutations can exceed Vitest's 5s default
    // on shared CI runners.
    testTimeout: 15_000,
    env: {
      DATABASE_URL: TEST_DATABASE_URL,
      // Use the deterministic keyword-based mock classifier instead of OpenAI.
      MOCK_FUNCTIONALITY: "true",
    },
  },
});
