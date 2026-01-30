import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("should display the hero section", async ({ page }) => {
    await page.goto("/");

    // Check main heading
    await expect(
      page.getByRole("heading", { name: /take control/i })
    ).toBeVisible();

    // Check CTA buttons
    await expect(
      page.getByRole("link", { name: /get started/i })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible();
  });

  test("should display features section", async ({ page }) => {
    await page.goto("/");

    // Scroll to features
    await page
      .getByRole("heading", { name: /features/i })
      .scrollIntoViewIfNeeded();

    // Check feature cards are visible
    await expect(page.getByText(/ai categorization/i)).toBeVisible();
    await expect(page.getByText(/50\/30\/20 budgeting/i)).toBeVisible();
    await expect(page.getByText(/easy import/i)).toBeVisible();
  });

  test("should navigate to sign up page", async ({ page }) => {
    await page.goto("/");

    await page
      .getByRole("link", { name: /get started/i })
      .first()
      .click();

    // Should navigate to sign up
    await expect(page).toHaveURL(/sign-up/);
  });

  test("should navigate to sign in page", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: /sign in/i }).click();

    // Should navigate to sign in
    await expect(page).toHaveURL(/sign-in/);
  });
});

test.describe("Navigation", () => {
  test("should scroll to sections when clicking nav links", async ({
    page,
  }) => {
    await page.goto("/");

    // Click on Features link
    await page
      .getByRole("link", { name: /features/i })
      .first()
      .click();

    // Features section should be in viewport
    const featuresSection = page.locator("#features");
    await expect(featuresSection).toBeInViewport();
  });
});

test.describe("Responsive Design", () => {
  test("should be responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Main content should be visible
    await expect(
      page.getByRole("heading", { name: /take control/i })
    ).toBeVisible();

    // CTA should be visible
    await expect(
      page.getByRole("link", { name: /get started/i }).first()
    ).toBeVisible();
  });
});
