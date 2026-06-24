import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["packages/**/*.test.{ts,tsx}", "apps/**/*.test.{ts,tsx}"],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      // DB-backed integration tests run via `pnpm test:integration`.
      "**/*.integration.test.ts",
    ],
    coverage: {
      reporter: ["text", "json", "html"],
      include: [
        "packages/features/analytics/src/calculations.ts",
        "packages/features/banking/src/components/sync-status.tsx",
        "packages/features/payments/src/checkout.ts",
        "packages/features/payments/src/webhooks.ts",
        "packages/features/transactions/src/classifier.ts",
        "packages/features/transactions/src/csv-parser.ts",
        "packages/features/transactions/src/components/category-badge.tsx",
        "packages/features/transactions/src/components/transaction-card.tsx",
        "packages/shared/ai/src/mock.ts",
        "packages/shared/api/src/rate-limit.ts",
        "packages/shared/api/src/tier-limits.ts",
      ],
      exclude: ["node_modules/", "dist/", "**/*.d.ts", "**/*.config.*"],
      thresholds: {
        statements: 75,
        branches: 75,
        functions: 75,
        lines: 75,
      },
    },
  },
});
