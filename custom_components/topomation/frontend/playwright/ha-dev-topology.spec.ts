import { expect, test } from "@playwright/test";
import { openHaDevPanel } from "./ha-dev-auth";

test("ha-dev panel loads from real Home Assistant route", async ({ page }) => {
  await openHaDevPanel(page);
  await expect(page.locator("ht-location-tree .tree-item").first()).toBeVisible();
  await expect(page.locator("ht-location-inspector")).toBeVisible();
});
