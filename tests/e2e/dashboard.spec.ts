import { expect, test } from "@playwright/test";

test("overview page renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("body")).toContainText(/Ephor|No metric observations yet/i);
});
