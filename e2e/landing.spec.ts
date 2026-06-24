import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("should display the hero section", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: /master your money/i })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /start free trial/i })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /watch demo/i })
    ).toBeDisabled();
  });

  test("should display features section", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: /everything you need/i })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "AI Classification" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "50/30/20 Budget" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Easy Import" })
    ).toBeVisible();
  });

  test("should offer authentication actions", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("button", { name: "Sign In" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Get Started" })
    ).toBeVisible();
  });
});

test.describe("How it works", () => {
  test("should explain the transaction-to-insight flow", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Upload Your Transactions" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "AI Categorizes Everything" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Get Actionable Insights" })
    ).toBeVisible();
  });
});

test.describe("Responsive Design", () => {
  test("should be responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: /master your money/i })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /start free trial/i })
    ).toBeVisible();
  });
});
