import { expect, test } from "@playwright/test";

const PRODUCTION_PROFILE_URL = "/mock-harness.html?profile=production";
const PRODUCTION_PERSISTENCE_KEY = "topomation:harness:production";

async function openProductionProfile(page: any): Promise<void> {
  await page.goto("/mock-harness.html");
  await page.evaluate((storageKey) => {
    window.localStorage.removeItem(storageKey);
  }, PRODUCTION_PERSISTENCE_KEY);

  await page.goto(PRODUCTION_PROFILE_URL);
  await expect(page.locator("topomation-panel")).toBeVisible();
}

async function selectKitchen(page: any): Promise<void> {
  await page.locator("ht-location-tree [data-id='kitchen']").first().click();
  await expect(page.locator("ht-location-inspector")).toBeVisible();
}

async function kitchenReapplyFlag(page: any): Promise<boolean> {
  return await page.evaluate(async () => {
    const mock = (window as any).mockHass;
    const response = await mock.hass.callWS({ type: "topomation/locations/list" });
    const kitchen = response.locations.find((location: any) => location.id === "kitchen");
    return Boolean(kitchen?.modules?.automation?.reapply_last_state_on_startup);
  });
}

test.describe("Production profile smoke", () => {
  test.beforeEach(async ({ page }) => {
    await openProductionProfile(page);
  });

  test("startup toggle persists through eventual consistency and full reload", async ({ page }) => {
    await selectKitchen(page);

    const toggle = page.locator(
      "ht-location-inspector .startup-inline-toggle input[type='checkbox']"
    );
    await expect(toggle).toBeVisible();
    await toggle.check();

    await expect.poll(async () => await kitchenReapplyFlag(page)).toBe(true);

    await page.reload();
    await expect(page.locator("topomation-panel")).toBeVisible();
    await selectKitchen(page);

    const toggleAfterReload = page.locator(
      "ht-location-inspector .startup-inline-toggle input[type='checkbox']"
    );
    await expect(toggleAfterReload).toBeChecked();
  });

  test("occupancy source save survives production-profile stale reloads", async ({ page }) => {
    await selectKitchen(page);

    const sourceRow = page
      .locator("ht-location-inspector .source-card", { hasText: "Kitchen Motion" })
      .first();
    const sourceToggle = sourceRow.locator("input.source-enable-input").first();

    await expect(sourceRow).toBeVisible();
    await sourceToggle.check();
    await page
      .locator("ht-location-inspector .sources-actions .button.button-primary", {
        hasText: "Save",
      })
      .click();

    await expect
      .poll(async () => {
        return await page.evaluate(async () => {
          const mock = (window as any).mockHass;
          const response = await mock.hass.callWS({ type: "topomation/locations/list" });
          const kitchen = response.locations.find((location: any) => location.id === "kitchen");
          const sources = kitchen?.modules?.occupancy?.occupancy_sources || [];
          return sources.some((source: any) => source.entity_id === "binary_sensor.kitchen_motion");
        });
      })
      .toBe(true);

    await page.evaluate(async () => {
      await (window as any).reloadLocations();
    });

    const sourceAfterReload = page
      .locator("ht-location-inspector .source-card", { hasText: "Kitchen Motion" })
      .first()
      .locator("input.source-enable-input")
      .first();
    await expect(sourceAfterReload).toBeChecked();
  });

  test("state replay captures eventing paths used in production smoke profile", async ({ page }) => {
    await selectKitchen(page);

    await page.getByRole("button", { name: "Event Log" }).click();
    await expect(page.locator(".event-log")).toBeVisible();

    await page.evaluate(async () => {
      await (window as any).runProductionReplay();
    });

    await expect
      .poll(async () =>
        page.evaluate(() => {
          const panel = document.querySelector("topomation-panel") as any;
          const entries = panel?._eventLogEntries || [];
          const hasOccupancyChanged = entries.some(
            (entry: any) => entry.message === "topomation_occupancy_changed"
          );
          const hasActionsSummary = entries.some(
            (entry: any) => entry.message === "topomation_actions_summary"
          );
          const hasKitchenMotionState = entries.some(
            (entry: any) =>
              entry.message === "state_changed" &&
              entry.data?.entityId === "binary_sensor.kitchen_motion"
          );
          return hasOccupancyChanged && hasActionsSummary && hasKitchenMotionState;
        })
      )
      .toBe(true);
  });
});
