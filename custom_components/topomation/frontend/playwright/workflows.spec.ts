import { expect, test } from "@playwright/test";

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
}

async function openLightingTab(page: any): Promise<void> {
  const inspector = page.locator("ht-location-inspector");
  await expect(inspector).toBeVisible();
  await inspector.getByRole("button", { name: "Lighting" }).click();
}

async function openActionsTab(page: any): Promise<void> {
  const inspector = page.locator("ht-location-inspector");
  await expect(inspector).toBeVisible();
  await inspector.getByRole("button", { name: "Media" }).click();
}

async function listLocations(page: any): Promise<any[]> {
  return await page.evaluate(async () => {
    const mock = (window as any).mockHass;
    const result = await mock.hass.callWS({ type: "topomation/locations/list" });
    return result.locations;
  });
}

async function kitchenManagedRules(page: any): Promise<any[]> {
  return await page.evaluate(async () => {
    const mock = (window as any).mockHass;
    const result = await mock.hass.callWS({
      type: "topomation/actions/rules/list",
      location_id: "kitchen",
    });
    return result.rules || [];
  });
}

async function configureLocationDialog(
  page: any,
  patch: { name?: string; type?: string; parent_id?: string | null }
): Promise<void> {
  await page.evaluate((next) => {
    const panel = document.querySelector("topomation-panel") as any;
    const dialog = panel?.shadowRoot?.querySelector("ht-location-dialog") as any;
    if (!dialog) throw new Error("ht-location-dialog not found");

    const parentId =
      next.parent_id === null || next.parent_id === undefined
        ? undefined
        : String(next.parent_id);
    const merged = {
      ...(dialog._config || {}),
      ...(next.name !== undefined ? { name: next.name } : {}),
      ...(next.type !== undefined ? { type: next.type } : {}),
      ...(next.parent_id !== undefined ? { parent_id: parentId } : {}),
    };

    dialog._config = merged;
    dialog.requestUpdate();

    const form = dialog.shadowRoot?.querySelector("ha-form") as any;
    if (form) {
      form.data = merged;
      form.requestUpdate?.();
      form.dispatchEvent(
        new CustomEvent("value-changed", {
          detail: { value: merged },
          bubbles: true,
          composed: true,
        })
      );
    }
  }, patch);
}

async function submitLocationDialog(page: any): Promise<void> {
  await page.evaluate(async () => {
    const panel = document.querySelector("topomation-panel") as any;
    const dialog = panel?.shadowRoot?.querySelector("ht-location-dialog") as any;
    if (!dialog) throw new Error("ht-location-dialog not found");
    await dialog._handleSubmit();
  });
}

test("create structure dialog saves a new root-level building", async ({ page }) => {
  await page.goto("/mock-harness.html");

  await page.getByRole("button", { name: "+ Add Structure" }).click();
  await expect(page.locator("ht-location-dialog [data-testid='location-dialog']")).toBeVisible();

  await configureLocationDialog(page, {
    name: "Automation Studio",
    type: "building",
    parent_id: null,
  });
  await submitLocationDialog(page);

  await expect
    .poll(async () => {
      const locations = await listLocations(page);
      return locations.some(
        (location) =>
          location.id === "building_automation_studio" &&
          location.name === "Automation Studio" &&
          location.parent_id === null
      );
    })
    .toBe(true);
});

test("edit location dialog persists renamed location", async ({ page }) => {
  await page.goto("/mock-harness.html");

  await page.evaluate(() => {
    const panel = document.querySelector("topomation-panel") as any;
    const tree = panel?.shadowRoot?.querySelector("ht-location-tree") as HTMLElement | null;
    if (!tree) throw new Error("ht-location-tree not found");

    tree.dispatchEvent(
      new CustomEvent("location-edit", {
        detail: { locationId: "kitchen" },
        bubbles: true,
        composed: true,
      })
    );
  });

  await expect(page.locator("ht-location-dialog [data-testid='location-dialog']")).toBeVisible();
  await configureLocationDialog(page, { name: "Kitchen Prime" });
  await submitLocationDialog(page);

  await expect
    .poll(async () => {
      const locations = await listLocations(page);
      return locations.find((location) => location.id === "kitchen")?.name ?? "";
    })
    .toBe("Kitchen Prime");
});

test("location delete workflow updates topology", async ({ page }) => {
  await page.goto("/mock-harness.html");
  await expect
    .poll(async () => {
      const locations = await listLocations(page);
      return locations.some((location) => location.id === "pantry");
    })
    .toBe(true);

  await page.evaluate(() => {
    const panel = document.querySelector("topomation-panel") as any;
    const tree = panel?.shadowRoot?.querySelector("ht-location-tree") as HTMLElement | null;
    if (!panel) throw new Error("topomation-panel not found");
    if (!tree) throw new Error("ht-location-tree not found");

    tree.dispatchEvent(
      new CustomEvent("location-delete", {
        detail: {
          location: {
            id: "pantry",
            name: "Pantry",
            parent_id: "kitchen",
          },
        },
        bubbles: true,
        composed: true,
      })
    );
  });

  await expect
    .poll(async () => {
      const locations = await listLocations(page);
      return locations.some((location) => location.id === "pantry");
    })
    .toBe(false);
});

test("detection workflow persists occupancy source configuration", async ({ page }) => {
  await page.goto("/mock-harness.html");

  await selectKitchen(page);

  const motionSourceRow = page
    .locator("ht-location-inspector .source-card", { hasText: "Kitchen Motion" })
    .first();
  await expect(motionSourceRow).toBeVisible();

  await motionSourceRow.locator("input.source-enable-input").check();
  await page.getByTestId("detection-draft-toolbar").getByTestId("detection-save-button").click();

  await expect
    .poll(async () => {
      const locations = await listLocations(page);
      const kitchen = locations.find((location) => location.id === "kitchen");
      const sources = kitchen?.modules?.occupancy?.occupancy_sources || [];
      return sources.some((source: any) => source.entity_id === "binary_sensor.kitchen_motion");
    })
    .toBe(true);
});

test("automation tabs do not expose tab-level startup controls", async ({ page }) => {
  await page.goto("/mock-harness.html");

  await selectKitchen(page);
  await openLightingTab(page);
  await expect(page.getByTestId("startup-reapply-lighting")).toHaveCount(0);

  await openActionsTab(page);
  await expect(page.getByTestId("startup-reapply-media")).toHaveCount(0);
  await page.locator("ht-location-inspector").getByRole("button", { name: "HVAC" }).click();
  await expect(page.getByTestId("startup-reapply-hvac")).toHaveCount(0);
});

test("lighting media and appliances tabs each save managed rules", async ({ page }) => {
  await page.goto("/mock-harness.html");

  await page.evaluate(async () => {
    const mock = (window as any).mockHass;
    Object.assign(mock.hass.states, {
      "fan.kitchen_bathroom_exhaust": {
        entity_id: "fan.kitchen_bathroom_exhaust",
        state: "off",
        attributes: {
          friendly_name: "Kitchen Bathroom Exhaust",
          area_id: "kitchen",
        },
      },
    });
    await mock.hass.callWS({
      type: "topomation/locations/assign_entity",
      target_location_id: "kitchen",
      entity_id: "fan.kitchen_bathroom_exhaust",
    });

    const panel = document.querySelector("topomation-panel") as any;
    panel.hass = mock.getReactiveHass();
    panel.requestUpdate?.();
  });

  await selectKitchen(page);

  const inspector = page.locator("ht-location-inspector");

  await openLightingTab(page);
  await inspector.getByRole("button", { name: "Add rule" }).click();
  const lightingRule = inspector.locator(".dusk-block-row[data-testid^='action-rule-']").last();
  await expect(lightingRule).toBeVisible();
  await lightingRule.getByRole("button", { name: "Room becomes occupied" }).click();
  await lightingRule.getByRole("button", { name: "Save rule" }).click();
  await expect
    .poll(async () => {
      const rules = await kitchenManagedRules(page);
      return rules.some(
        (rule) =>
          typeof rule?.action_entity_id === "string" &&
          rule.action_entity_id.startsWith("light.")
      );
    })
    .toBe(true);

  await openActionsTab(page);
  await inspector.getByRole("button", { name: "Add rule" }).click();
  const mediaRule = inspector.locator(".dusk-block-row[data-testid^='action-rule-']").last();
  await expect(mediaRule).toBeVisible();
  await mediaRule
    .locator('input[type="radio"][name^="media-target-"][value="media_player.kitchen_speaker"]')
    .check();
  await mediaRule.locator('input[type="radio"][name^="media-cmd-"][value="media_pause"]').check();
  await mediaRule.getByRole("button", { name: "Save rule" }).click();
  await expect
    .poll(async () => {
      const rules = await kitchenManagedRules(page);
      return rules.some(
        (rule) =>
          rule?.action_entity_id === "media_player.kitchen_speaker" &&
          rule?.action_service === "media_pause"
      );
    })
    .toBe(true);

  await inspector.getByRole("button", { name: "Appliances" }).click();
  await inspector.getByRole("button", { name: "Add rule" }).click();
  const appliancesRule = inspector.locator(".dusk-block-row[data-testid^='action-rule-']").last();
  await expect(appliancesRule).toBeVisible();
  await appliancesRule
    .locator('input[type="radio"][name^="appl-equip-target-"][value="fan.kitchen_bathroom_exhaust"]')
    .check();
  await appliancesRule.locator('input[type="radio"][name^="appl-equip-cmd-"][value="turn_on"]').check();
  await appliancesRule.getByRole("button", { name: "Save rule" }).click();
  await expect
    .poll(async () => {
      const rules = await kitchenManagedRules(page);
      return rules.some(
        (rule) =>
          rule?.action_entity_id === "fan.kitchen_bathroom_exhaust" &&
          rule?.action_service === "turn_on"
      );
    })
    .toBe(true);
});
