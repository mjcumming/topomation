import { expect, test } from "@playwright/test";

/** Count rename inputs inside ht-location-tree (nested open shadow roots). */
async function shadowLocationNameInputCount(page: any): Promise<number> {
  return await page.evaluate(() => {
    const panel = document.querySelector("topomation-panel") as Element | null;
    const tree = panel?.shadowRoot?.querySelector("ht-location-tree") as Element | null;
    const root = tree?.shadowRoot;
    if (!root) return 0;
    return root.querySelectorAll(".location-name-input").length;
  });
}

async function expandTreeNodes(page: any, ids: string[]): Promise<void> {
  await page.evaluate(async (expandIds: string[]) => {
    const panel = document.querySelector("topomation-panel") as any;
    const tree = panel?.shadowRoot?.querySelector("ht-location-tree") as any;
    if (!tree) throw new Error("ht-location-tree not found");
    const next = new Set<string>(Array.from(tree._expandedIds || []));
    for (const id of expandIds) {
      next.add(String(id));
    }
    tree._expandedIds = next;
    tree.requestUpdate?.();
    await tree.updateComplete;
  }, ids);
}

async function selectKitchen(page: any): Promise<void> {
  await expandTreeNodes(page, ["main-building", "main-floor"]);
  const kitchenRow = page.locator("ht-location-tree [data-id='kitchen']").first();
  await expect(kitchenRow).toBeVisible();
  await kitchenRow.click();
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

async function ensureLightingRuleExists(page: any): Promise<void> {
  const inspector = page.locator("ht-location-inspector");
  const rows = inspector.locator(".dusk-block-row");
  if ((await rows.count()) > 0) return;
  await inspector.getByTestId("action-rule-add").click();
  await expect(rows.first()).toBeVisible();
}

async function kitchenTopomationActionSummaries(page: any): Promise<
  Array<{
    id: string;
    trigger_type: string;
    trigger_to: string | null;
    ambient_condition: string;
    action: string | null;
    action_entity_id: string | null;
    has_dark_condition: boolean;
    time_after: string | null;
    time_before: string | null;
  }>
> {
  return await page.evaluate(async () => {
    const metadataPrefix = "[topomation]";
    const mock = (window as any).mockHass;
    const entries = await mock.hass.callWS({ type: "config/entity_registry/list" });
    const automations = entries.filter(
      (entry: any) =>
        entry?.domain === "automation" &&
        typeof entry?.unique_id === "string" &&
        entry.unique_id.startsWith("topomation_")
    );

    const results: Array<Record<string, any>> = [];
    for (const entry of automations) {
      if (!entry?.entity_id) continue;
      const configResp = await mock.hass.callWS({
        type: "automation/config",
        entity_id: entry.entity_id,
      });
      const config = configResp?.config || {};
      const description = typeof config?.description === "string" ? config.description : "";
      const metadataLine = description
        .split(/\r?\n/)
        .map((line: string) => line.trim())
        .find((line: string) => line.startsWith(metadataPrefix));
      if (!metadataLine) continue;

      let metadata: any = null;
      try {
        metadata = JSON.parse(metadataLine.slice(metadataPrefix.length).trim());
      } catch (_err) {
        metadata = null;
      }
      if (!metadata || metadata.location_id !== "kitchen") continue;

      const conditions = Array.isArray(config.conditions) ? config.conditions : [];
      const timeCondition = conditions.find(
        (condition: any) => condition?.condition === "time"
      );
      const hasDarkCondition = conditions.some(
        (condition: any) =>
          condition?.condition === "state" &&
          condition?.entity_id === "sun.sun" &&
          condition?.state === "below_horizon"
      );

      results.push({
        id: entry.unique_id,
        trigger_type: metadata.trigger_type || "",
        trigger_to: config?.triggers?.[0]?.to ?? null,
        ambient_condition: metadata.ambient_condition || "any",
        action: config?.actions?.[0]?.action ?? null,
        action_entity_id: config?.actions?.[0]?.target?.entity_id ?? null,
        has_dark_condition: hasDarkCondition,
        time_after: timeCondition?.after ?? null,
        time_before: timeCondition?.before ?? null,
      });
    }
    return results;
  });
}

test("mock harness loads and renders tree rows", async ({ page }) => {
  await page.goto("/mock-harness.html");

  await expect(page.locator("topomation-panel")).toBeVisible();
  await expect(page.locator("ht-location-tree .tree-item").first()).toBeVisible();
});

test("inline rename opens editor on double-click", async ({ page }) => {
  await page.goto("/mock-harness.html");
  await expect(page.locator("topomation-panel")).toBeVisible();
  await expandTreeNodes(page, ["main-building", "main-floor"]);

  const kitchenName = page.locator("ht-location-tree [data-id='kitchen'] .location-name").first();
  await expect(kitchenName).toBeVisible();
  // Headless CI is occasionally flaky on synthetic dblclick(); spaced clicks match user intent.
  await kitchenName.click({ clickCount: 2, delay: 60 });

  await expect.poll(() => shadowLocationNameInputCount(page)).toBe(1);
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

  await expandTreeNodes(page, ["main-building", "second-floor"]);
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

test("main workspace does not expose a separate event log affordance", async ({ page }) => {
  await page.goto("/mock-harness.html");

  const panel = page.locator("topomation-panel");
  await expect(panel).toBeVisible();
  await expect(panel.getByRole("button", { name: "Event Log" })).toHaveCount(0);
  await expect(panel.locator(".event-log")).toHaveCount(0);
});

test("selecting location shows occupancy inspector with area sensors", async ({ page }) => {
  await page.goto("/mock-harness.html");
  await selectKitchen(page);

  const inspector = page.locator("ht-location-inspector");
  await expect(inspector).toBeVisible();
  await expect(inspector).toContainText("Kitchen");
  await expect(inspector).toContainText("Occupancy");
  await expect(inspector.locator(".candidate-list").first()).toBeVisible();
});

test("lighting tab contract: clickable rule title, footer lifecycle controls, add-rule hidden during draft", async ({ page }) => {
  await page.goto("/mock-harness.html");
  await selectKitchen(page);
  await openLightingTab(page);
  await ensureLightingRuleExists(page);

  const inspector = page.locator("ht-location-inspector");
  const firstRule = inspector.locator(".dusk-block-row").first();

  await expect(inspector.locator(".section-title", { hasText: "Lighting Rules" })).toHaveCount(1);
  const titleButton = firstRule.locator(".dusk-block-title-button");
  await expect(titleButton).toBeVisible();
  await titleButton.click();
  await expect(firstRule.locator("input.dusk-block-title-input")).toBeVisible();
  await expect(firstRule.locator(".dusk-block-footer").getByRole("button", { name: "Save rule" })).toBeVisible();
  await expect(firstRule.locator(".dusk-block-footer").getByRole("button", { name: "Remove rule" })).toBeVisible();
  await expect(firstRule.locator(".dusk-block-footer").getByRole("button", { name: "Delete rule" })).toHaveCount(0);
  await expect(inspector.getByTestId("action-rule-add")).toHaveCount(0);
  await expect(inspector.getByTestId("startup-reapply-lighting")).toHaveCount(0);
});

test("lighting tab contract: trigger conditions include dark/bright and time window reveals begin/end", async ({
  page,
}) => {
  await page.goto("/mock-harness.html");
  await selectKitchen(page);
  await openLightingTab(page);
  await ensureLightingRuleExists(page);

  const inspector = page.locator("ht-location-inspector");
  const firstRule = inspector.locator(".dusk-block-row").first();
  const occupancyTriggerGroup = firstRule.locator(".lighting-situation-card").first();
  await expect(occupancyTriggerGroup).toBeVisible();
  await occupancyTriggerGroup.getByRole("button", { name: "Room becomes occupied" }).click();
  const brightRequirement = occupancyTriggerGroup.locator(".choice-pill", {
    hasText: "It is bright",
  });
  await brightRequirement.click();
  await expect(brightRequirement).toHaveClass(/active/);

  const timeToggle = firstRule.locator(".dusk-inline-heading-row .choice-pill", {
    hasText: "Limit to a time range",
  });
  await expect(timeToggle).toBeVisible();
  await timeToggle.click();
  await expect(firstRule.locator("input[type='time']")).toHaveCount(2);
});

test("media tab renders rule editor", async ({ page }) => {
  await page.goto("/mock-harness.html");
  await selectKitchen(page);

  const inspector = page.locator("ht-location-inspector");
  await expect(inspector.getByRole("button", { name: "Occupancy" })).toBeVisible();
  await expect(inspector.getByRole("button", { name: "Ambient" })).toBeVisible();
  await expect(inspector.getByRole("button", { name: "Lighting" })).toBeVisible();
  await expect(inspector.getByRole("button", { name: "Appliances" })).toBeVisible();
  await expect(inspector.getByRole("button", { name: "Media" })).toBeVisible();
  await expect(inspector.getByRole("button", { name: "HVAC" })).toBeVisible();
  await openActionsTab(page);

  await expect(inspector).toContainText("Media Rules");
  await expect(inspector.getByRole("button", { name: "Add rule" })).toBeVisible();
  await expect(inspector.getByRole("button", { name: "On Occupied" })).toHaveCount(0);
  await expect(inspector.getByRole("button", { name: "On Vacant" })).toHaveCount(0);
});

test("actions rule add/save/delete persists managed automations", async ({ page }) => {
  await page.goto("/mock-harness.html");
  await selectKitchen(page);
  await openActionsTab(page);

  const inspector = page.locator("ht-location-inspector");
  await inspector.getByRole("button", { name: "Add rule" }).click();
  const rule = inspector
    .locator(".dusk-block-row[data-testid^='action-rule-']")
    .first();
  await expect(rule).toBeVisible();

  await rule.locator('input[type="radio"][value="on_occupied"]').check();
  await rule
    .locator('input[type="radio"][name^="media-target-"][value="media_player.kitchen_speaker"]')
    .check();
  await rule.locator('input[type="radio"][name^="media-cmd-"][value="media_pause"]').check();
  await rule.getByRole("button", { name: "Save rule" }).click();

  await expect
    .poll(async () => {
      const summaries = await kitchenTopomationActionSummaries(page);
      return summaries.some(
        (summary) =>
          summary.trigger_type === "on_occupied" &&
          summary.trigger_to === "on" &&
          summary.action === "media_player.media_pause" &&
          summary.action_entity_id === "media_player.kitchen_speaker"
      );
    })
    .toBe(true);

  await rule.getByRole("button", { name: "Delete rule" }).click();
  await expect.poll(async () => (await kitchenTopomationActionSummaries(page)).length).toBe(0);
});

test("media rule time settings persist without ambient controls", async ({ page }) => {
  await page.goto("/mock-harness.html");
  await selectKitchen(page);
  await openActionsTab(page);

  const inspector = page.locator("ht-location-inspector");
  await inspector.getByRole("button", { name: "Add rule" }).click();
  const rule = inspector
    .locator(".dusk-block-row[data-testid^='action-rule-']")
    .first();
  await expect(rule).toBeVisible();

  await rule.locator('input[type="radio"][value="on_occupied"]').check();
  await rule
    .locator('input[type="radio"][name^="media-target-"][value="media_player.kitchen_speaker"]')
    .check();
  await rule.locator('input[type="radio"][name^="media-cmd-"][value="media_play"]').check();
  await expect(rule.locator(".dusk-conditions .config-row", { hasText: "Ambient must be" })).toHaveCount(0);

  await rule.getByRole("button", { name: "Limit to a time range" }).click();
  await expect(rule.locator("input[type='time']")).toHaveCount(2);
  const startInput = rule.locator(".dusk-time-field", { hasText: "Begin" }).locator("input[type='time']");
  const endInput = rule.locator(".dusk-time-field", { hasText: "End" }).locator("input[type='time']");
  await startInput.fill("21:30");
  await startInput.dispatchEvent("change");
  await endInput.fill("23:45");
  await endInput.dispatchEvent("change");

  await rule.getByRole("button", { name: "Save rule" }).click();

  await expect
    .poll(async () => {
      const summaries = await kitchenTopomationActionSummaries(page);
      return summaries.some(
        (summary) =>
          summary.trigger_type === "on_occupied" &&
          summary.ambient_condition === "any" &&
          !summary.has_dark_condition &&
          String(summary.time_after || "").startsWith("21:30") &&
          String(summary.time_before || "").startsWith("23:45")
      );
    })
    .toBe(true);
});

test("media rule service options align to media player controls", async ({ page }) => {
  await page.goto("/mock-harness.html");

  await page.evaluate(async () => {
    const mock = (window as any).mockHass;
    Object.assign(mock.hass.states, {
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
      "cover.kitchen_shade": {
        entity_id: "cover.kitchen_shade",
        state: "open",
        attributes: {
          friendly_name: "Kitchen Shade",
          area_id: "kitchen",
        },
      },
    });
    await mock.hass.callWS({
      type: "topomation/locations/assign_entity",
      target_location_id: "kitchen",
      entity_id: "fan.kitchen_fan",
    });
    await mock.hass.callWS({
      type: "topomation/locations/assign_entity",
      target_location_id: "kitchen",
      entity_id: "media_player.kitchen_receiver",
    });
    await mock.hass.callWS({
      type: "topomation/locations/assign_entity",
      target_location_id: "kitchen",
      entity_id: "cover.kitchen_shade",
    });
    const panel = document.querySelector("topomation-panel") as any;
    panel.hass = mock.getReactiveHass();
  });

  await selectKitchen(page);
  await openActionsTab(page);
  const inspector = page.locator("ht-location-inspector");
  await inspector.getByRole("button", { name: "Add rule" }).click();
  const rule = inspector
    .locator(".dusk-block-row[data-testid^='action-rule-']")
    .first();
  await expect(rule).toBeVisible();

  await rule
    .locator('input[type="radio"][name^="media-target-"][value="media_player.kitchen_receiver"]')
    .check();
  const expectedActions = [
    "media_play",
    "turn_on",
    "volume_mute:false",
    "volume_set",
    "volume_mute:true",
    "media_pause",
    "media_play_pause",
    "turn_off",
    "media_stop",
  ];
  await expect
    .poll(async () => {
      const values = await rule.locator('input[type="radio"][name^="media-cmd-"]').evaluateAll((els) =>
        els.map((el) => (el as HTMLInputElement).value)
      );
      const a = new Set(values);
      const b = new Set(expectedActions);
      return a.size === b.size && expectedActions.every((v) => a.has(v));
    })
    .toBe(true);
});

test("on occupied/on vacant triggers map to on/off occupancy state transitions", async ({ page }) => {
  await page.goto("/mock-harness.html");
  await selectKitchen(page);
  await openActionsTab(page);

  const inspector = page.locator("ht-location-inspector");
  const deleteButtons = inspector.getByRole("button", { name: "Delete rule" });
  while ((await deleteButtons.count()) > 0) {
    await deleteButtons.first().click();
  }
  const removeButtons = inspector.getByRole("button", { name: "Remove rule" });
  while ((await removeButtons.count()) > 0) {
    await removeButtons.first().click();
  }
  await expect.poll(async () => (await kitchenTopomationActionSummaries(page)).length).toBe(0);

  await inspector.getByRole("button", { name: "Add rule" }).click();
  const occupiedRule = inspector
    .locator(".dusk-block-row[data-testid^='action-rule-']")
    .last();
  await occupiedRule.locator('input[type="radio"][value="on_occupied"]').check();
  await occupiedRule
    .locator('input[type="radio"][name^="media-target-"][value="media_player.kitchen_speaker"]')
    .check();
  await occupiedRule.locator('input[type="radio"][name^="media-cmd-"][value="media_play"]').check();
  const saveOccupiedRule = occupiedRule.getByRole("button", { name: "Save rule" });
  await saveOccupiedRule.scrollIntoViewIfNeeded();
  await saveOccupiedRule.evaluate((button) => (button as HTMLButtonElement).click());
  await expect
    .poll(async () => {
      const summaries = await kitchenTopomationActionSummaries(page);
      return summaries.some(
        (summary) =>
          summary.trigger_type === "on_occupied" &&
          summary.trigger_to === "on" &&
          summary.action === "media_player.media_play"
      );
    })
    .toBe(true);

  await inspector.getByRole("button", { name: "Add rule" }).click();
  const vacantRule = inspector
    .locator(".dusk-block-row[data-testid^='action-rule-']")
    .last();
  await vacantRule.locator('input[type="radio"][value="on_vacant"]').check();
  await vacantRule
    .locator('input[type="radio"][name^="media-target-"][value="media_player.kitchen_speaker"]')
    .check();
  await vacantRule.locator('input[type="radio"][name^="media-cmd-"][value="media_stop"]').check();
  const saveVacantRule = vacantRule.getByRole("button", { name: "Save rule" });
  await saveVacantRule.scrollIntoViewIfNeeded();
  await saveVacantRule.evaluate((button) => (button as HTMLButtonElement).click());
  await expect
    .poll(async () => {
      const summaries = await kitchenTopomationActionSummaries(page);
      const hasOccupied = summaries.some(
        (summary) =>
          summary.trigger_type === "on_occupied" &&
          summary.trigger_to === "on" &&
          summary.action === "media_player.media_play"
      );
      const hasVacant = summaries.some(
        (summary) =>
          summary.trigger_type === "on_vacant" &&
          summary.trigger_to === "off" &&
          summary.action === "media_player.media_stop"
      );
      return hasOccupied && hasVacant;
    })
    .toBe(true);
});

test("integration-owned building shows derived occupancy guidance", async ({ page }) => {
  await page.goto("/mock-harness.html");

  await page.locator("ht-location-tree [data-id='main-building']").first().click();

  const inspector = page.locator("ht-location-inspector");
  await expect(inspector).toBeVisible();
  await expect(inspector).toContainText("Main Building");
  await expect(inspector).toContainText("Derived Occupancy");
  await expect(inspector).toContainText("Building occupancy is derived from child locations");
  await expect(inspector.getByTestId("open-external-source-dialog")).toHaveCount(0);
  await expect(inspector.getByRole("button", { name: "Ambient" })).toBeVisible();
});

test("occupancy inspector keeps the hero shell outside the scroll body", async ({ page }) => {
  await page.goto("/mock-harness.html");
  await selectKitchen(page);

  const inspector = page.locator("ht-location-inspector");
  const inspectorTop = inspector.locator(".inspector-top");
  const inspectorBody = inspector.locator(".inspector-body");

  await expect(inspectorTop).toBeVisible();
  await expect(inspectorBody).toBeVisible();

  const before = await inspectorTop.boundingBox();
  expect(before).not.toBeNull();

  const bodyMetrics = await inspectorBody.evaluate((element) => {
    const node = element as HTMLElement;
    node.scrollTop = Math.max(0, Math.min(320, node.scrollHeight));
    return {
      overflowY: getComputedStyle(node).overflowY,
      scrollTop: node.scrollTop,
    };
  });

  expect(bodyMetrics.overflowY).toBe("auto");
  expect(bodyMetrics.scrollTop).toBeGreaterThan(0);

  const after = await inspectorTop.boundingBox();
  expect(after).not.toBeNull();
  expect(Math.abs((after?.y ?? 0) - (before?.y ?? 0))).toBeLessThanOrEqual(1);
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

  await setPanelPath("/topomation-media");
  await expect(headerTitle).toHaveText("Topology");
});
