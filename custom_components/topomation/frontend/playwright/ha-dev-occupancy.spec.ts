import { expect, test } from "@playwright/test";
import { openHaDevPanel } from "./ha-dev-auth";

test("ha-dev occupancy tab renders on real panel", async ({ page }) => {
  await openHaDevPanel(page);
  const inspector = page.locator("ht-location-inspector");
  await expect(inspector).toBeVisible({ timeout: 20_000 });
  await inspector.getByRole("button", { name: /Occupancy|Occupancy Groups/ }).first().click();
  await expect(inspector).toBeVisible();
});
