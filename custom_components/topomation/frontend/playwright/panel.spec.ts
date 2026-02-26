import { expect, test } from "@playwright/test";

test("mock harness loads and renders tree rows", async ({ page }) => {
  await page.goto("/mock-harness.html");

  await expect(page.locator("topomation-panel")).toBeVisible();
  await expect(page.locator("ht-location-tree .tree-item").first()).toBeVisible();
});

test("inline rename opens editor on double-click", async ({ page }) => {
  await page.goto("/mock-harness.html");

  const kitchenName = page.locator("ht-location-tree [data-id='kitchen'] .location-name").first();
  await expect(kitchenName).toBeVisible();
  await kitchenName.dblclick();

  await expect(page.locator("ht-location-tree .location-name-input")).toHaveCount(1);
});

test("dispatching a move updates hierarchy without duplication", async ({ page }) => {
  await page.goto("/mock-harness.html");

  await page.evaluate(() => {
    const panel = document.querySelector("topomation-panel") as any;
    const tree = panel?.shadowRoot?.querySelector("ht-location-tree") as HTMLElement | null;
    if (!tree) throw new Error("ht-location-tree not found");
    tree.dispatchEvent(
      new CustomEvent("location-moved", {
        detail: { locationId: "kitchen", newParentId: "second-floor", newIndex: 0 },
        bubbles: true,
        composed: true,
      })
    );
  });

  await expect
    .poll(async () => {
      return await page.evaluate(async () => {
        const res = await (window as any).mockHass.hass.callWS({
          type: "topomation/locations/list",
        });
        return res.locations.find((l: any) => l.id === "kitchen")?.parent_id;
      });
    })
    .toBe("second-floor");

  await expect(
    page.locator("ht-location-tree .tree-item[data-id='kitchen']")
  ).toHaveCount(1);
});

test("moving HA-backed area to root clears floor parent", async ({ page }) => {
  await page.goto("/mock-harness.html");

  await page.evaluate(() => {
    const panel = document.querySelector("topomation-panel") as any;
    const tree = panel?.shadowRoot?.querySelector("ht-location-tree") as HTMLElement | null;
    if (!tree) throw new Error("ht-location-tree not found");
    tree.dispatchEvent(
      new CustomEvent("location-moved", {
        detail: { locationId: "kitchen", newParentId: null, newIndex: 0 },
        bubbles: true,
        composed: true,
      })
    );
  });

  await expect
    .poll(async () => {
      return await page.evaluate(async () => {
        const res = await (window as any).mockHass.hass.callWS({
          type: "topomation/locations/list",
        });
        return res.locations.find((l: any) => l.id === "kitchen")?.parent_id;
      });
    })
    .toBe(null);
});

test("floor can move to root or building, but not to grounds", async ({ page }) => {
  await page.goto("/mock-harness.html");

  const moveLocation = async (params: { locationId: string; newParentId: string | null; newIndex?: number }) => {
    await page.evaluate(
      ({ locationId, newParentId, newIndex }) => {
        const panel = document.querySelector("topomation-panel") as any;
        const tree = panel?.shadowRoot?.querySelector("ht-location-tree") as HTMLElement | null;
        if (!tree) throw new Error("ht-location-tree not found");
        tree.dispatchEvent(
          new CustomEvent("location-moved", {
            detail: { locationId, newParentId, newIndex: newIndex ?? 0 },
            bubbles: true,
            composed: true,
          })
        );
      },
      params
    );
  };

  const getParent = async (id: string) => {
    return await page.evaluate(async (locId) => {
      const res = await (window as any).mockHass.hass.callWS({
        type: "topomation/locations/list",
      });
      return res.locations.find((l: any) => l.id === locId)?.parent_id ?? null;
    }, id);
  };

  // Move from building wrapper to root.
  await moveLocation({
    locationId: "second-floor",
    newParentId: null,
    newIndex: 0,
  });
  await expect.poll(() => getParent("second-floor")).toBe(null);

  // Invalid: floors cannot move under grounds.
  await moveLocation({
    locationId: "second-floor",
    newParentId: "grounds",
    newIndex: 0,
  });
  await expect.poll(() => getParent("second-floor")).toBe(null);

  // Move back under building -> allowed.
  await moveLocation({
    locationId: "second-floor",
    newParentId: "main-building",
    newIndex: 0,
  });
  await expect.poll(() => getParent("second-floor")).toBe("main-building");
});

test("event log toggle shows and hides event log panel", async ({ page }) => {
  await page.goto("/mock-harness.html");

  const panel = page.locator("topomation-panel");
  await expect(panel).toBeVisible();

  const eventLogButton = panel.locator('button:has-text("Event Log")');
  await expect(eventLogButton).toBeVisible();

  await eventLogButton.click();
  await expect(panel.locator(".event-log")).toBeVisible();
  await expect(panel.locator(".event-log-header")).toContainText("Runtime Event Log");

  await panel.locator('button:has-text("Hide Log")').click();
  await expect(panel.locator(".event-log")).not.toBeVisible();
});

test("selecting location shows occupancy inspector with area sensors", async ({ page }) => {
  await page.goto("/mock-harness.html");

  await page.locator("ht-location-tree [data-id='kitchen']").first().click();

  const inspector = page.locator("ht-location-inspector");
  await expect(inspector).toBeVisible();
  await expect(inspector).toContainText("Kitchen");
  await expect(inspector).toContainText("Detection");
  await expect(inspector.locator(".candidate-list").first()).toBeVisible();
});

test("actions tab uses inline device list instead of Add Rule dialog", async ({ page }) => {
  await page.goto("/mock-harness.html");

  await page.locator("ht-location-tree [data-id='kitchen']").first().click();

  const inspector = page.locator("ht-location-inspector");
  await expect(inspector).toBeVisible();

  await page.getByRole("button", { name: "On Occupied" }).click();
  await expect(inspector).toContainText("Kitchen Main Light");
  await expect(inspector.getByRole("button", { name: "+ Add Rule" })).toHaveCount(0);
  await expect(page.getByText("New Home Assistant Automation")).not.toBeVisible();
});

test("inline include toggle creates and removes managed automation rules", async ({ page }) => {
  await page.goto("/mock-harness.html");

  await page.locator("ht-location-tree [data-id='kitchen']").first().click();
  await page.getByRole("button", { name: "On Occupied" }).click();

  const row = page
    .locator("ht-location-inspector .action-device-row", { hasText: "Kitchen Main Light" })
    .first();
  const toggle = row.locator('input[type="checkbox"]').first();

  await expect(row).toBeVisible();
  await expect(toggle).not.toBeChecked();
  await toggle.check();

  await expect
    .poll(async () =>
      page.evaluate(async () => {
        const mock = (window as any).mockHass;
        const entries = await mock.hass.callWS({ type: "config/entity_registry/list" });
        return entries.filter(
          (entry: any) =>
            entry?.domain === "automation" &&
            typeof entry?.unique_id === "string" &&
            entry.unique_id.startsWith("topomation_")
        ).length;
      })
    )
    .toBe(1);

  await toggle.uncheck();

  await expect
    .poll(async () =>
      page.evaluate(async () => {
        const mock = (window as any).mockHass;
        const entries = await mock.hass.callWS({ type: "config/entity_registry/list" });
        return entries.filter(
          (entry: any) =>
            entry?.domain === "automation" &&
            typeof entry?.unique_id === "string" &&
            entry.unique_id.startsWith("topomation_")
        ).length;
      })
    )
    .toBe(0);
});

test("inline action service selector controls created automation action", async ({ page }) => {
  await page.goto("/mock-harness.html");

  await page.locator("ht-location-tree [data-id='kitchen']").first().click();
  await page.getByRole("button", { name: "On Occupied" }).click();

  const row = page
    .locator("ht-location-inspector .action-device-row", { hasText: "Kitchen Main Light" })
    .first();
  const serviceSelect = row.locator("select.action-service-select");
  const toggle = row.locator('input[type="checkbox"]').first();

  await expect(row).toBeVisible();
  await serviceSelect.selectOption("turn_off");
  await toggle.check();

  await expect
    .poll(async () =>
      page.evaluate(async () => {
        const mock = (window as any).mockHass;
        const entries = await mock.hass.callWS({ type: "config/entity_registry/list" });
        const rule = entries.find(
          (entry: any) =>
            entry?.domain === "automation" &&
            typeof entry?.unique_id === "string" &&
            entry.unique_id.startsWith("topomation_kitchen_occupied")
        );
        if (!rule?.entity_id) return null;
        const configResp = await mock.hass.callWS({
          type: "automation/config",
          entity_id: rule.entity_id,
        });
        return configResp?.config?.actions?.[0]?.action || null;
      })
    )
    .toBe("light.turn_off");
});

test("inline actions support all common device types", async ({ page }) => {
  await page.goto("/mock-harness.html");

  await page.evaluate(() => {
    const mock = (window as any).mockHass;
    Object.assign(mock.hass.states, {
      "light.kitchen_basic": {
        entity_id: "light.kitchen_basic",
        state: "off",
        attributes: {
          friendly_name: "Kitchen Basic Light",
          area_id: "kitchen",
          supported_color_modes: ["onoff"],
        },
      },
      "light.kitchen_dimmer": {
        entity_id: "light.kitchen_dimmer",
        state: "off",
        attributes: {
          friendly_name: "Kitchen Dimmer",
          area_id: "kitchen",
          supported_color_modes: ["brightness"],
        },
      },
      "light.kitchen_accent": {
        entity_id: "light.kitchen_accent",
        state: "off",
        attributes: {
          friendly_name: "Kitchen Accent",
          area_id: "kitchen",
          supported_color_modes: ["rgb", "brightness"],
        },
      },
      "fan.kitchen_fan": {
        entity_id: "fan.kitchen_fan",
        state: "off",
        attributes: {
          friendly_name: "Kitchen Fan",
          area_id: "kitchen",
        },
      },
      "media_player.kitchen_receiver": {
        entity_id: "media_player.kitchen_receiver",
        state: "paused",
        attributes: {
          friendly_name: "Kitchen Receiver",
          area_id: "kitchen",
        },
      },
      "media_player.kitchen_tv": {
        entity_id: "media_player.kitchen_tv",
        state: "paused",
        attributes: {
          friendly_name: "Kitchen TV",
          area_id: "kitchen",
          device_class: "tv",
        },
      },
    });
    const panel = document.querySelector("topomation-panel") as any;
    panel.hass = mock.getReactiveHass();
  });

  await page.locator("ht-location-tree [data-id='kitchen']").first().click();
  await page.getByRole("button", { name: "On Occupied" }).click();

  const cases = [
    {
      name: "Kitchen Basic Light",
      entityId: "light.kitchen_basic",
      action: "light.turn_off",
      options: ["turn_on", "turn_off", "toggle"],
      select: "turn_off",
    },
    {
      name: "Kitchen Dimmer",
      entityId: "light.kitchen_dimmer",
      action: "light.turn_off",
      options: ["turn_on", "turn_off", "toggle"],
      select: "turn_off",
    },
    {
      name: "Kitchen Accent",
      entityId: "light.kitchen_accent",
      action: "light.turn_off",
      options: ["turn_on", "turn_off", "toggle"],
      select: "turn_off",
    },
    {
      name: "Kitchen Fan",
      entityId: "fan.kitchen_fan",
      action: "fan.turn_off",
      options: ["turn_on", "turn_off", "toggle"],
      select: "turn_off",
    },
    {
      name: "Kitchen Receiver",
      entityId: "media_player.kitchen_receiver",
      action: "media_player.media_stop",
      options: ["media_stop", "turn_off"],
      select: "media_stop",
    },
    {
      name: "Kitchen TV",
      entityId: "media_player.kitchen_tv",
      action: "media_player.media_stop",
      options: ["media_stop", "turn_off"],
      select: "media_stop",
    },
  ];

  for (const entry of cases) {
    const row = page
      .locator("ht-location-inspector .action-device-row", { hasText: entry.name })
      .first();
    const serviceSelect = row.locator("select.action-service-select");
    const toggle = row.locator('input[type="checkbox"]').first();

    await expect(row).toBeVisible();
    await expect
      .poll(async () =>
        serviceSelect.evaluate((el) =>
          Array.from((el as HTMLSelectElement).options).map((opt) => opt.value)
        )
      )
      .toEqual(entry.options);

    await serviceSelect.selectOption(entry.select);
    await toggle.check();

    await expect
      .poll(async () =>
        page.evaluate(
          async ({ targetEntityId, expectedAction }) => {
            const mock = (window as any).mockHass;
            const entries = await mock.hass.callWS({ type: "config/entity_registry/list" });
            const topomationAutomations = entries.filter(
              (entry: any) =>
                entry?.domain === "automation" &&
                typeof entry?.unique_id === "string" &&
                entry.unique_id.startsWith("topomation_kitchen_occupied")
            );
            const configs = await Promise.all(
              topomationAutomations.map(async (entry: any) => {
                const configResp = await mock.hass.callWS({
                  type: "automation/config",
                  entity_id: entry.entity_id,
                });
                return configResp?.config;
              })
            );
            return configs.some(
              (config: any) =>
                config?.actions?.[0]?.target?.entity_id === targetEntityId &&
                config?.actions?.[0]?.action === expectedAction
            );
          },
          { targetEntityId: entry.entityId, expectedAction: entry.action }
        )
      )
      .toBe(true);
  }
});

test("light occupied/vacant mappings are not inverted", async ({ page }) => {
  await page.goto("/mock-harness.html");

  await page.locator("ht-location-tree [data-id='kitchen']").first().click();

  const getMatchingConfigs = async (prefix: string) =>
    page.evaluate(async (uniquePrefix) => {
      const mock = (window as any).mockHass;
      const entries = await mock.hass.callWS({ type: "config/entity_registry/list" });
      const matches = entries.filter(
        (entry: any) =>
          entry?.domain === "automation" &&
          typeof entry?.unique_id === "string" &&
          entry.unique_id.startsWith(uniquePrefix)
      );
      const configs = await Promise.all(
        matches.map(async (entry: any) => {
          const configResp = await mock.hass.callWS({
            type: "automation/config",
            entity_id: entry.entity_id,
          });
          return configResp?.config;
        })
      );
      return configs;
    }, prefix);

  // Occupied -> turn_on
  await page.getByRole("button", { name: "On Occupied" }).click();
  const occupiedRow = page
    .locator("ht-location-inspector .action-device-row", { hasText: "Kitchen Main Light" })
    .first();
  await occupiedRow.locator("select.action-service-select").selectOption("turn_on");
  await occupiedRow.locator('input[type="checkbox"]').first().check();

  await expect
    .poll(async () => {
      const configs = await getMatchingConfigs("topomation_kitchen_occupied");
      return configs.some(
        (config: any) =>
          config?.triggers?.[0]?.to === "on" &&
          config?.actions?.[0]?.action === "light.turn_on" &&
          config?.actions?.[0]?.target?.entity_id === "light.kitchen_main"
      );
    })
    .toBe(true);

  // Vacant -> turn_off
  await page.getByRole("button", { name: "On Vacant" }).click();
  const vacantRow = page
    .locator("ht-location-inspector .action-device-row", { hasText: "Kitchen Main Light" })
    .first();
  await vacantRow.locator("select.action-service-select").selectOption("turn_off");
  await vacantRow.locator('input[type="checkbox"]').first().check();

  await expect
    .poll(async () => {
      const configs = await getMatchingConfigs("topomation_kitchen_vacant");
      return configs.some(
        (config: any) =>
          config?.triggers?.[0]?.to === "off" &&
          config?.actions?.[0]?.action === "light.turn_off" &&
          config?.actions?.[0]?.target?.entity_id === "light.kitchen_main"
      );
    })
    .toBe(true);
});

test("action row prefers enabled rule service when duplicate managed rules exist", async ({ page }) => {
  await page.goto("/mock-harness.html");

  await page.evaluate(async () => {
    const mock = (window as any).mockHass;
    const description =
      'Managed by Topomation.\n[topomation] {"version":1,"location_id":"kitchen","trigger_type":"occupied"}';

    await mock.hass.callApi("post", "config/automation/config/topomation_kitchen_occupied_a", {
      alias: "A Occupied Kitchen Light On",
      description,
      triggers: [{ trigger: "state", entity_id: "binary_sensor.kitchen_occupancy", to: "on" }],
      conditions: [],
      actions: [{ action: "light.turn_on", target: { entity_id: "light.kitchen_main" } }],
      mode: "single",
    });

    await mock.hass.callApi("post", "config/automation/config/topomation_kitchen_occupied_b", {
      alias: "B Occupied Kitchen Light Off",
      description,
      triggers: [{ trigger: "state", entity_id: "binary_sensor.kitchen_occupancy", to: "on" }],
      conditions: [],
      actions: [{ action: "light.turn_off", target: { entity_id: "light.kitchen_main" } }],
      mode: "single",
    });

    const entries = await mock.hass.callWS({ type: "config/entity_registry/list" });
    const automationToDisable = entries.find(
      (entry: any) => entry?.unique_id === "topomation_kitchen_occupied_a"
    );
    const automationToEnable = entries.find(
      (entry: any) => entry?.unique_id === "topomation_kitchen_occupied_b"
    );
    if (!automationToDisable?.entity_id) {
      throw new Error("Failed to resolve automation entity for duplicate-rule regression setup");
    }
    if (!automationToEnable?.entity_id) {
      throw new Error("Failed to resolve second automation entity for duplicate-rule regression setup");
    }

    // Keep mock state object in sync so listTopomationActionRules can resolve enabled/disabled.
    mock.hass.states[automationToDisable.entity_id] = {
      entity_id: automationToDisable.entity_id,
      state: "off",
      attributes: { friendly_name: "A Occupied Kitchen Light On" },
    };
    mock.hass.states[automationToEnable.entity_id] = {
      entity_id: automationToEnable.entity_id,
      state: "on",
      attributes: { friendly_name: "B Occupied Kitchen Light Off" },
    };
  });

  await page.locator("ht-location-tree [data-id='kitchen']").first().click();
  await page.getByRole("button", { name: "On Occupied" }).click();

  const duplicateRuleStates = await page.evaluate(async () => {
    const mock = (window as any).mockHass;
    const entries = await mock.hass.callWS({ type: "config/entity_registry/list" });
    const byId = new Map(entries.map((entry: any) => [entry.unique_id, entry]));
    const a = byId.get("topomation_kitchen_occupied_a");
    const b = byId.get("topomation_kitchen_occupied_b");
    return {
      a: a ? mock.hass.states[a.entity_id]?.state : null,
      b: b ? mock.hass.states[b.entity_id]?.state : null,
    };
  });
  expect(duplicateRuleStates).toEqual({ a: "off", b: "on" });

  const inspectorRuleSummary = await page.evaluate(() => {
    const panel = document.querySelector("topomation-panel") as any;
    const inspector = panel?.shadowRoot?.querySelector("ht-location-inspector") as any;
    return (inspector?._actionRules || []).map((rule: any) => ({
      id: rule.id,
      action_service: rule.action_service,
      action_entity_id: rule.action_entity_id,
      trigger_type: rule.trigger_type,
      enabled: rule.enabled,
    }));
  });
  expect(inspectorRuleSummary).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: "topomation_kitchen_occupied_a",
        action_service: "turn_on",
        action_entity_id: "light.kitchen_main",
        trigger_type: "occupied",
        enabled: false,
      }),
      expect.objectContaining({
        id: "topomation_kitchen_occupied_b",
        action_service: "turn_off",
        action_entity_id: "light.kitchen_main",
        trigger_type: "occupied",
        enabled: true,
      }),
    ])
  );

  const selectedService = await page.evaluate(() => {
    const panel = document.querySelector("topomation-panel") as any;
    const inspector = panel?.shadowRoot?.querySelector("ht-location-inspector") as any;
    return inspector?._selectedManagedActionService("light.kitchen_main", "occupied");
  });
  expect(selectedService).toBe("turn_off");
});

test("integration-owned building shows explicit source composer guidance", async ({ page }) => {
  await page.goto("/mock-harness.html");

  await page.locator("ht-location-tree [data-id='main-building']").first().click();

  const inspector = page.locator("ht-location-inspector");
  await expect(inspector).toBeVisible();
  await expect(inspector).toContainText("Main Building");
  await expect(inspector).toContainText("integration-owned");
  await expect(inspector.locator('[data-testid="external-source-area-select"]')).toBeVisible();
  await expect(inspector.locator('[data-testid="add-external-source-inline"]')).toBeVisible();
});

test("panel header shows read-only lifecycle guidance", async ({ page }) => {
  await page.goto("/mock-harness.html");

  const panel = page.locator("topomation-panel");
  await expect(panel).toBeVisible();
  await expect(panel.locator(".panel-left .header-subtitle").first()).toContainText(
    "Organize buildings, grounds, floors, areas, and subareas"
  );
});

test("left manager header title remains Topology across routes", async ({ page }) => {
  await page.goto("/mock-harness.html");

  const panel = page.locator("topomation-panel");
  const headerTitle = panel.locator(".panel-left .header-title").first();
  await expect(panel).toBeVisible();

  const setPanelPath = async (path: string) => {
    await page.evaluate((nextPath) => {
      const panelEl = document.querySelector("topomation-panel") as any;
      if (!panelEl) throw new Error("topomation-panel not found");
      panelEl.panel = undefined;
      panelEl.route = { path: nextPath };
      panelEl.requestUpdate?.();
    }, path);
  };

  await setPanelPath("/topomation");
  await expect(headerTitle).toHaveText("Topology");

  await setPanelPath("/topomation-occupancy");
  await expect(headerTitle).toHaveText("Topology");

  await setPanelPath("/topomation-actions");
  await expect(headerTitle).toHaveText("Topology");
});
