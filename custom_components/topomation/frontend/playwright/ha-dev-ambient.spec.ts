import { expect, test } from "@playwright/test";
import { openHaDevPanel } from "./ha-dev-auth";

test("ha-dev ambient tab renders on real panel", async ({ page }) => {
  await openHaDevPanel(page);
  const inspector = page.locator("ht-location-inspector");
  await expect(inspector).toBeVisible({ timeout: 20_000 });
  await inspector.getByRole("button", { name: "Ambient" }).click();
  await expect(inspector).toContainText(/Lux|Ambient/i);
});
