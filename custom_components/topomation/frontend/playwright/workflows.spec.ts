import { expect, test } from "@playwright/test";

async function listLocations(page: any): Promise<any[]> {
  return await page.evaluate(async () => {
    const mock = (window as any).mockHass;
    const result = await mock.hass.callWS({ type: "topomation/locations/list" });
    return result.locations;
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

test("detection workflow saves occupancy source configuration", async ({ page }) => {
  await page.goto("/mock-harness.html");

  await page.locator("ht-location-tree [data-id='kitchen']").first().click();

  const motionSourceRow = page
    .locator("ht-location-inspector .source-card", { hasText: "Kitchen Motion" })
    .first();
  await expect(motionSourceRow).toBeVisible();

  await motionSourceRow.locator("input.source-enable-input").check();
  await page
    .locator("ht-location-inspector .sources-actions .button.button-primary", { hasText: "Save" })
    .click();

  await expect
    .poll(async () => {
      const locations = await listLocations(page);
      const kitchen = locations.find((location) => location.id === "kitchen");
      const sources = kitchen?.modules?.occupancy?.occupancy_sources || [];
      return sources.some((source: any) => source.entity_id === "binary_sensor.kitchen_motion");
    })
    .toBe(true);
});

test("startup reapply toggle saves automation module config", async ({ page }) => {
  await page.goto("/mock-harness.html");

  await page.locator("ht-location-tree [data-id='kitchen']").first().click();
  const startupToggle = page.locator(
    "ht-location-inspector .startup-inline-toggle input[type='checkbox']"
  );

  await expect(startupToggle).toBeVisible();
  await startupToggle.check();

  await expect
    .poll(async () => {
      const locations = await listLocations(page);
      const kitchen = locations.find((location) => location.id === "kitchen");
      return Boolean(kitchen?.modules?.automation?.reapply_last_state_on_startup);
    })
    .toBe(true);
});

test("event log respects subtree/all scope and captures integration events", async ({ page }) => {
  await page.goto("/mock-harness.html");

  await page.locator("ht-location-tree [data-id='kitchen']").first().click();
  await page.getByRole("button", { name: "Event Log" }).click();
  await expect(page.locator(".event-log")).toBeVisible();

  await page.evaluate(() => {
    const mock = (window as any).mockHass;
    const current = mock.hass.states["binary_sensor.garage_motion"];
    mock.connection.fireEvent("state_changed", {
      entity_id: "binary_sensor.garage_motion",
      old_state: { ...current, state: "off" },
      new_state: { ...current, state: "on" },
    });
  });

  await expect
    .poll(async () =>
      page.evaluate(() => {
        const panel = document.querySelector("topomation-panel") as any;
        return (panel?._eventLogEntries || []).some(
          (entry: any) =>
            entry.message === "state_changed" &&
            entry.data?.entityId === "binary_sensor.garage_motion"
        );
      })
    )
    .toBe(false);

  await page.locator(".event-log .event-log-header-actions .button").first().click();

  await page.evaluate(() => {
    const mock = (window as any).mockHass;
    const current = mock.hass.states["binary_sensor.garage_motion"];
    mock.connection.fireEvent("state_changed", {
      entity_id: "binary_sensor.garage_motion",
      old_state: { ...current, state: "off" },
      new_state: { ...current, state: "on" },
    });
    mock.connection.fireEvent("topomation_actions_summary", {
      location_id: "kitchen",
      trigger_type: "vacant",
      succeeded: 2,
      failed: 0,
    });
  });

  await expect
    .poll(async () =>
      page.evaluate(() => {
        const panel = document.querySelector("topomation-panel") as any;
        const entries = panel?._eventLogEntries || [];
        const hasGarageState = entries.some(
          (entry: any) =>
            entry.message === "state_changed" &&
            entry.data?.entityId === "binary_sensor.garage_motion"
        );
        const hasActionsSummary = entries.some(
          (entry: any) => entry.message === "topomation_actions_summary"
        );
        return hasGarageState && hasActionsSummary;
      })
    )
    .toBe(true);
});
