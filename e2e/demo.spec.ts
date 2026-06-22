import { expect, test } from "@playwright/test";

test.describe("Public demo", () => {
  test("shows a complete financial dashboard without authentication", async ({
    page,
  }) => {
    await page.goto("/demo");

    await expect(page).toHaveURL(/\/demo$/);
    await expect(
      page.getByRole("heading", { name: "Dashboard" })
    ).toBeVisible();
    await expect(page.getByText("May 2026").first()).toBeVisible();

    for (const metric of [
      "Total Income",
      "Total Expenses",
      "Net Cash Flow",
      "Savings Rate",
    ]) {
      await expect(page.getByText(metric, { exact: true })).toBeVisible();
    }

    await expect(
      page.getByRole("heading", { name: "Recent Transactions" })
    ).toBeVisible();
    await expect(page.getByText("Tesco Extra")).toBeVisible();
    await expect(page.getByText("Salary", { exact: true })).toBeVisible();
  });
});
