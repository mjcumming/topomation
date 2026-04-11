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

async function expandTreeNodes(page: any, ids: string[]): Promise<void> {
  await page.evaluate((expandIds) => {
    const panel = document.querySelector("topomation-panel") as any;
    const tree = panel?.shadowRoot?.querySelector("ht-location-tree") as any;
    if (!tree) throw new Error("ht-location-tree not found");
    const next = new Set<string>(Array.from(tree._expandedIds || []));
    for (const id of expandIds) {
      next.add(String(id));
    }
    tree._expandedIds = next;
    tree.requestUpdate?.();
  }, ids);
}

async function selectKitchen(page: any): Promise<void> {
  await expandTreeNodes(page, ["main-building", "main-floor"]);
  const kitchenRow = page.locator("ht-location-tree [data-id='kitchen']").first();
  await expect(kitchenRow).toBeVisible();
  await kitchenRow.click();
  await expect(page.locator("ht-location-inspector")).toBeVisible();
}

async function openActionsTab(
  page: any
): Promise<void> {
  const inspector = page.locator("ht-location-inspector");
  await expect(inspector).toBeVisible();
  await inspector.getByRole("button", { name: "Media" }).click();
}

async function openLightingTab(page: any): Promise<void> {
  const inspector = page.locator("ht-location-inspector");
  await expect(inspector).toBeVisible();
  await inspector.getByRole("button", { name: "Lighting" }).click();
}

async function addBasicKitchenActionRule(
  page: any
): Promise<void> {
  const inspector = page.locator("ht-location-inspector");
  await expect(inspector).toBeVisible();
  await inspector.getByRole("button", { name: "Add rule" }).click();
  const rule = inspector
    .locator(".dusk-block-row[data-testid^='action-rule-']")
    .first();
  await expect(rule).toBeVisible();
  await rule.locator('input[type="radio"][value="on_occupied"]').check();
  await rule.getByRole("combobox").nth(0).selectOption("media_player.kitchen_speaker");
  await rule.getByRole("combobox").nth(1).selectOption("media_pause");
  await rule.getByRole("button", { name: "Save rule" }).click();
}

async function kitchenManagedRuleCount(page: any): Promise<number> {
  return await page.evaluate(async () => {
    const mock = (window as any).mockHass;
    const entries = await mock.hass.callWS({ type: "config/entity_registry/list" });
    return entries.filter(
      (entry: any) =>
        entry?.domain === "automation" &&
        typeof entry?.unique_id === "string" &&
        entry.unique_id.startsWith("topomation_kitchen_")
      ).length;
  });
}

async function kitchenActionRuleCount(page: any): Promise<number> {
  return await page.evaluate(async () => {
    const mock = (window as any).mockHass;
    const response = await mock.hass.callWS({
      type: "topomation/actions/rules/list",
      location_id: "kitchen",
    });
    return Array.isArray(response?.rules) ? response.rules.length : 0;
  });
}

async function kitchenActionRules(page: any): Promise<any[]> {
  return await page.evaluate(async () => {
    const mock = (window as any).mockHass;
    const response = await mock.hass.callWS({
      type: "topomation/actions/rules/list",
      location_id: "kitchen",
    });
    return Array.isArray(response?.rules) ? response.rules : [];
  });
}

test.describe("Production profile smoke", () => {
  test.beforeEach(async ({ page }) => {
    await openProductionProfile(page);
  });

test("automation tabs omit startup controls and media add-rule survives reactive hass churn", async ({ page }) => {
    await selectKitchen(page);
    await openLightingTab(page);
    await expect(page.getByTestId("startup-reapply-lighting")).toHaveCount(0);

    await openActionsTab(page);
    await expect(page.getByTestId("startup-reapply-media")).toHaveCount(0);
    await page.locator("ht-location-inspector").getByRole("button", { name: "HVAC" }).click();
    await expect(page.getByTestId("startup-reapply-hvac")).toHaveCount(0);
    await openActionsTab(page);

    await page.evaluate(async () => {
      const panel = document.querySelector("topomation-panel") as any;
      const mock = (window as any).mockHass;
      for (let iteration = 0; iteration < 5; iteration += 1) {
        panel.hass = mock.getReactiveHass();
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      }
    });

    await addBasicKitchenActionRule(page);

    await expect
      .poll(async () => {
        const rules = await kitchenActionRules(page);
        return rules.some(
          (rule) =>
            rule?.action_entity_id === "media_player.kitchen_speaker" &&
            rule?.action_service === "media_pause"
        );
      })
      .toBe(true);
  });

  test("occupancy source update survives production-profile stale reloads", async ({ page }) => {
    await selectKitchen(page);

    const sourceRow = page
      .locator("ht-location-inspector .source-card", { hasText: "Kitchen Motion" })
      .first();
    const sourceToggle = sourceRow.locator("input.source-enable-input").first();

    await expect(sourceRow).toBeVisible();
    await sourceToggle.check();
    await page.getByTestId("detection-draft-toolbar").getByTestId("detection-save-button").click();

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


  test("managed action rule save survives delayed automation registry visibility", async ({ page }) => {
    await selectKitchen(page);
    await openActionsTab(page);
    const initialRuleCount = await page
      .locator("ht-location-inspector .dusk-block-row[data-testid^='action-rule-']")
      .count();

    // Simulate production lag where automation registry/config reads briefly
    // return stale data right after a create call.
    await page.evaluate(() => {
      const mock = (window as any).mockHass;
      const originalCallWs = mock.hass.callWS.bind(mock.hass);
      const originalCallApi = mock.hass.callApi.bind(mock.hass);
      let staleReadsRemaining = 4;
      let createdSincePatch = false;

      mock.hass.callApi = async (method: string, endpoint: string, parameters: any) => {
        const result = await originalCallApi(method, endpoint, parameters);
        if (
          String(method || "").toLowerCase() === "post" &&
          String(endpoint || "").startsWith("config/automation/config/topomation_kitchen_")
        ) {
          createdSincePatch = true;
        }
        return result;
      };

      mock.hass.callWS = async (request: any) => {
        if (
          createdSincePatch &&
          staleReadsRemaining > 0 &&
          (request?.type === "config/entity_registry/list" || request?.type === "automation/config")
        ) {
          staleReadsRemaining -= 1;
          if (request.type === "config/entity_registry/list") {
            return [];
          }
          throw new Error("automation registry stale");
        }
        return originalCallWs(request);
      };
    });

    await addBasicKitchenActionRule(page);

    await expect.poll(async () => await kitchenManagedRuleCount(page)).toBeGreaterThan(0);

    await page.reload();
    await expect(page.locator("topomation-panel")).toBeVisible();
    await selectKitchen(page);
    await openActionsTab(page);
    await expect(
      page.locator("ht-location-inspector .dusk-block-row[data-testid^='action-rule-']")
    ).toHaveCount(initialRuleCount + 1);
  });

  test("managed action rule save survives entity registry access failures", async ({ page }) => {
    await selectKitchen(page);
    await openActionsTab(page);
    const initialRuleCount = await page
      .locator("ht-location-inspector .dusk-block-row[data-testid^='action-rule-']")
      .count();

    await page.evaluate(() => {
      const mock = (window as any).mockHass;
      const originalCallWs = mock.hass.callWS.bind(mock.hass);
      mock.hass.callWS = async (request: any) => {
        if (request?.type === "config/entity_registry/list") {
          throw new Error("forbidden");
        }
        return originalCallWs(request);
      };
    });

    await addBasicKitchenActionRule(page);
    await expect.poll(async () => await kitchenActionRuleCount(page)).toBeGreaterThan(0);

    await page.reload();
    await expect(page.locator("topomation-panel")).toBeVisible();
    await selectKitchen(page);
    await openActionsTab(page);
    await expect(
      page.locator("ht-location-inspector .dusk-block-row[data-testid^='action-rule-']")
    ).toHaveCount(initialRuleCount + 1);
  });
});
