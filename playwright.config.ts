import { defineConfig, devices } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const port = process.env.PLAYWRIGHT_PORT ?? "4173";
const baseURL = `http://127.0.0.1:${port}`;
const rootEnvPath = resolve(process.cwd(), ".env");
const rootEnv = Object.fromEntries(
  (existsSync(rootEnvPath) ? readFileSync(rootEnvPath, "utf8") : "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const separator = line.indexOf("=");
      const key = line.slice(0, separator);
      const value = line.slice(separator + 1).replace(/^(['"])(.*)\1$/, "$2");
      return [key, value];
    })
);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 12"] },
    },
  ],
  webServer: {
    // Must match the bundler used by `pnpm dev` (apps/web uses --turbopack).
    // Mixing webpack and Turbopack output in the same .next directory produces
    // "Cannot find module '../chunks/ssr/[turbopack]_runtime.js'" on next boot.
    command: `pnpm --filter=@finance/web exec next dev --turbopack --port ${port}`,
    url: baseURL,
    env: {
      ...process.env,
      ...rootEnv,
    },
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
