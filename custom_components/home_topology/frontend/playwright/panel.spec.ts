import { expect, test } from "@playwright/test";

test("mock harness loads and renders the location tree", async ({ page }) => {
  await page.goto("/mock-harness.html");

  // Wait for panel and at least one tree node
  await expect(page.locator("home-topology-panel")).toBeVisible();
  await expect(page.locator("ht-location-tree .tree-node").first()).toBeVisible();
});

test("can create a new location via the dialog (mock hass)", async ({ page }) => {
  await page.goto("/mock-harness.html");

  await page.locator('[data-testid="new-location-button"]').click();

  // Assert that the panel handler actually flipped state (helps debug shadow DOM click issues)
  await expect
    .poll(async () => {
      return await page.evaluate(() => (window as any).panel?._locationDialogOpen);
    })
    .toBe(true);

  const dialogHost = page.locator("ht-location-dialog").first();
  await expect(dialogHost).toHaveCount(1);

  await expect
    .poll(async () => {
      return await dialogHost.evaluate((el) => (el as any).open);
    })
    .toBe(true);

  // Dialog should open (inside the dialog host's shadow DOM)
  const dialog = dialogHost.locator("ha-dialog");
  await expect
    .poll(async () => {
      return await dialog.evaluate((el) => (el as any).open);
    })
    .toBe(true);

  // Mock ha-form renders an input with aria-label="name"
  await dialog.locator('input[aria-label="name"]').fill("Playwright Room");
  // Ensure we're creating an HA Area-backed location
  await dialog.locator('select[aria-label="type"]').selectOption("area");
  // Optional HA Area icon (stored in HA Area Registry)
  await dialog.locator('input[aria-label="icon"]').fill("mdi:sofa");

  await expect
    .poll(async () => {
      return await dialogHost.evaluate((el) => (el as any)._config?.name);
    })
    .toBe("Playwright Room");

  await expect
    .poll(async () => {
      return await dialogHost.evaluate((el) => (el as any)._config?.type);
    })
    .toBeTruthy();

  await dialog.getByRole("button", { name: "Create" }).click();

  // New HA area should exist with the chosen icon
  const created = await page.evaluate(async () => {
    const res = await (window as any).mockHass.hass.callWS({ type: "home_topology/locations/list" });
    const loc = res.locations.find((l: any) => l.name === "Playwright Room");
    if (!loc) throw new Error("Created location not found");
    const area = (window as any).mockHass.hass.areas?.[loc.ha_area_id];
    return { locationId: loc.id, ha_area_id: loc.ha_area_id, area };
  });
  expect(created.ha_area_id).toBeTruthy();
  expect(created.area?.icon).toBe("mdi:sofa");

  // Backend mock should now contain the new location
  await expect
    .poll(async () => {
      return await page.evaluate(async () => {
        const res = await (window as any).mockHass.hass.callWS({
          type: "home_topology/locations/list",
        });
        return res.locations.map((l: any) => l.name);
      });
    })
    .toContain("Playwright Room");

  // Panel state should have reloaded locations (either via saved handler or home_topology_updated subscription)
  await expect
    .poll(async () => {
      return await page.evaluate(() => (window as any).panel?._locations?.map((l: any) => l.name) ?? []);
    })
    .toContain("Playwright Room");

  // UI should reflect the new node
  await expect(
    page.locator("ht-location-tree .tree-node", { hasText: "Playwright Room" })
  ).toBeVisible();
});

test("can rename a location via double click + Enter", async ({ page }) => {
  await page.goto("/mock-harness.html");

  const kitchenName = page
    .locator('ht-location-tree [data-location-id="kitchen"] [data-testid="location-name"]')
    .first();
  await expect(kitchenName).toBeVisible();

  await kitchenName.dblclick();

  const input = page.locator('ht-location-tree input.location-name-input[data-id="kitchen"]');
  await expect(input).toBeVisible();
  await input.fill("Kitchen Renamed");
  await input.press("Enter");

  // Some browsers/components keep the input focused; click outside to ensure blur completes
  await page.locator(".harness-main-header").click();

  await expect(
    page.locator('ht-location-tree [data-location-id="kitchen"] .location-name', {
      hasText: "Kitchen Renamed",
    })
  ).toBeVisible();
});

test("can rename the same area multiple times (no sticky edit lock)", async ({ page }) => {
  await page.goto("/mock-harness.html");

  const name = page
    .locator('ht-location-tree [data-location-id="living-room"] [data-testid="location-name"]')
    .first();
  await expect(name).toBeVisible();

  // First rename
  await name.dblclick();
  const input1 = page.locator('ht-location-tree input.location-name-input[data-id="living-room"]');
  await expect(input1).toBeVisible();
  await input1.fill("Living Room A");
  await input1.press("Enter");
  await page.locator(".harness-main-header").click();
  await expect(
    page.locator('ht-location-tree [data-location-id="living-room"] .location-name', { hasText: "Living Room A" })
  ).toBeVisible();

  // Second rename
  await page
    .locator('ht-location-tree [data-location-id="living-room"] [data-testid="location-name"]')
    .first()
    .dblclick();
  const input2 = page.locator('ht-location-tree input.location-name-input[data-id="living-room"]');
  await expect(input2).toBeVisible();
  await input2.fill("Living Room B");
  await input2.press("Enter");
  await page.locator(".harness-main-header").click();
  await expect(
    page.locator('ht-location-tree [data-location-id="living-room"] .location-name', { hasText: "Living Room B" })
  ).toBeVisible();
});

test("can drag-reorder siblings using SortableJS handle", async ({ page }) => {
  await page.goto("/mock-harness.html");

  const kitchenHandle = page
    .locator('ht-location-tree [data-location-id="kitchen"] [data-testid="drag-handle"]')
    .first();
  const livingNode = page.locator('ht-location-tree [data-location-id="living-room"] .tree-node').first();

  await expect(kitchenHandle).toBeVisible();
  await expect(livingNode).toBeVisible();

  const childrenSelector =
    'ht-location-tree .tree-children[data-location-id="main-floor"] > [data-location-id]';

  const start = await kitchenHandle.boundingBox();
  const target = await livingNode.boundingBox();
  expect(start).toBeTruthy();
  expect(target).toBeTruthy();

  // Drag kitchen above living-room
  await page.mouse.move(start!.x + start!.width / 2, start!.y + start!.height / 2);
  await page.mouse.down();
  await page.mouse.move(target!.x + target!.width / 2, target!.y + 5, { steps: 10 });
  await page.mouse.up();

  // Key regression check: no DOM duplication after a drag operation.
  const ids = await page.locator(childrenSelector).evaluateAll((els) =>
    els.map((el) => el.getAttribute("data-location-id"))
  );
  const nonNullIds = ids.filter(Boolean) as string[];
  expect(nonNullIds.length).toBeGreaterThan(0);
  expect(new Set(nonNullIds).size).toBe(nonNullIds.length);
});

test("stress: repeated real drags do not duplicate siblings", async ({ page }) => {
  await page.goto("/mock-harness.html");

  const childrenSelector =
    'ht-location-tree .tree-children[data-location-id="main-floor"] > [data-testid="sortable-item"][data-location-id]';

  const drag = async (fromId: string, toId: string) => {
    const fromHandle = page.locator(`ht-location-tree [data-location-id="${fromId}"] [data-testid="drag-handle"]`).first();
    const toNode = page.locator(`ht-location-tree [data-location-id="${toId}"] .tree-node`).first();
    await expect(fromHandle).toBeVisible();
    await expect(toNode).toBeVisible();
    const start = await fromHandle.boundingBox();
    const target = await toNode.boundingBox();
    expect(start).toBeTruthy();
    expect(target).toBeTruthy();
    await page.mouse.move(start!.x + start!.width / 2, start!.y + start!.height / 2);
    await page.mouse.down();
    await page.mouse.move(target!.x + target!.width / 2, target!.y + 5, { steps: 10 });
    await page.mouse.up();
  };

  for (let i = 0; i < 6; i++) {
    await drag("kitchen", "living-room");
    await drag("living-room", "kitchen");

    const ids = await page.locator(childrenSelector).evaluateAll((els) =>
      els.map((el) => el.getAttribute("data-location-id"))
    );
    const nonNullIds = ids.filter(Boolean) as string[];
    expect(new Set(nonNullIds).size).toBe(nonNullIds.length);
  }
});

test("drag across floor roots does not duplicate (main floor -> second floor)", async ({ page }) => {
  await page.goto("/mock-harness.html");

  // Drag Living Room from Main Floor to Second Floor (cross-container drag)
  const handle = page
    .locator('ht-location-tree [data-location-id="living-room"] [data-testid="drag-handle"]')
    .first();
  const secondFloorNode = page.locator('ht-location-tree [data-location-id="second-floor"] .tree-node').first();

  await expect(handle).toBeVisible();
  await expect(secondFloorNode).toBeVisible();

  // Ensure second floor is expanded to have an active drop container.
  const expand = page.locator('ht-location-tree [data-location-id="second-floor"] [data-testid="expand-icon"]').first();
  if ((await expand.count()) > 0) {
    await expand.click();
  }

  const start = await handle.boundingBox();
  const target = await secondFloorNode.boundingBox();
  expect(start).toBeTruthy();
  expect(target).toBeTruthy();

  await page.mouse.move(start!.x + start!.width / 2, start!.y + start!.height / 2);
  await page.mouse.down();
  await page.mouse.move(target!.x + target!.width / 2, target!.y + target!.height / 2, { steps: 12 });
  await page.mouse.up();

  // Must exist exactly once in the whole tree
  await expect(
    page.locator('ht-location-tree [data-testid="sortable-item"][data-location-id="living-room"]')
  ).toHaveCount(1);
});

test("drag to a different root node does not duplicate (main floor -> garage)", async ({ page }) => {
  await page.goto("/mock-harness.html");

  const handle = page
    .locator('ht-location-tree [data-location-id="kitchen"] [data-testid="drag-handle"]')
    .first();

  // Expand Garage (chevron may be hidden until hover; force click)
  const garageNode = page.locator('ht-location-tree [data-location-id="garage"] .tree-node').first();
  await expect(garageNode).toBeVisible();
  await garageNode.hover();
  const garageExpand = page.locator('ht-location-tree [data-location-id="garage"] [data-testid="expand-icon"]').first();
  if ((await garageExpand.count()) > 0) {
    await garageExpand.click({ force: true });
  }

  const garageChildren = page.locator('ht-location-tree .tree-children[data-location-id="garage"]').first();
  await expect(handle).toBeVisible();
  await expect(garageChildren).toBeVisible();

  const start = await handle.boundingBox();
  const target = await garageChildren.boundingBox();
  expect(start).toBeTruthy();
  expect(target).toBeTruthy();

  await page.mouse.move(start!.x + start!.width / 2, start!.y + start!.height / 2);
  await page.mouse.down();
  await page.mouse.move(target!.x + 10, target!.y + 10, { steps: 12 });
  await page.mouse.up();

  // Must exist exactly once in the whole tree
  await expect(
    page.locator('ht-location-tree [data-testid="sortable-item"][data-location-id="kitchen"]')
  ).toHaveCount(1);
});

test("stress: repeated move operations do not duplicate nodes (IDs remain unique)", async ({ page }) => {
  await page.goto("/mock-harness.html");

  // Perform a bunch of parent moves (this reproduces the 'after a few drags it duplicates' symptom)
  // using the same event path the tree triggers.
  const moves: Array<{ locationId: string; newParentId: string | null; newIndex: number }> = [
    { locationId: "living-room", newParentId: "second-floor", newIndex: 0 },
    { locationId: "living-room", newParentId: "main-floor", newIndex: 1 },
    { locationId: "primary-bedroom", newParentId: "main-floor", newIndex: 0 },
    { locationId: "primary-bedroom", newParentId: "second-floor", newIndex: 1 },
    { locationId: "dining-room", newParentId: "second-floor", newIndex: 0 },
    { locationId: "dining-room", newParentId: "main-floor", newIndex: 2 },
  ];

  for (let i = 0; i < 3; i++) {
    for (const m of moves) {
      await page.evaluate((detail) => {
        const panel = document.querySelector("home-topology-panel") as any;
        const tree = panel?.shadowRoot?.querySelector("ht-location-tree") as HTMLElement | null;
        if (!tree) throw new Error("ht-location-tree not found");
        tree.dispatchEvent(
          new CustomEvent("location-moved", {
            detail,
            bubbles: true,
            composed: true,
          })
        );
      }, m);

      // UI invariant: each locationId appears exactly once in the whole tree
      await expect(
        page.locator(`ht-location-tree [data-testid="sortable-item"][data-location-id="${m.locationId}"]`)
      ).toHaveCount(1);

      // UI invariant: the entire tree should have unique IDs
      const ids = await page
        .locator('ht-location-tree [data-testid="sortable-item"][data-location-id]')
        .evaluateAll((els) => els.map((el) => el.getAttribute("data-location-id")));
      const nonNullIds = ids.filter(Boolean) as string[];
      expect(new Set(nonNullIds).size).toBe(nonNullIds.length);

      // Backend invariant: mock list should also have unique IDs
      const backendIds = await page.evaluate(async () => {
        const res = await (window as any).mockHass.hass.callWS({ type: "home_topology/locations/list" });
        return res.locations.map((l: any) => l.id);
      });
      expect(new Set(backendIds).size).toBe(backendIds.length);
    }
  }
});

test("moving an area to root does not duplicate it (root promotion)", async ({ page }) => {
  await page.goto("/mock-harness.html");

  // Move Kitchen to root (null) via the same event path the tree emits.
  await page.evaluate(() => {
    const panel = document.querySelector("home-topology-panel") as any;
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

  // It should appear exactly once in the whole tree
  await expect(
    page.locator('ht-location-tree [data-testid="sortable-item"][data-location-id="kitchen"]')
  ).toHaveCount(1);

  // Backend should show it as explicit root
  await expect
    .poll(async () => {
      return await page.evaluate(async () => {
        const res = await (window as any).mockHass.hass.callWS({ type: "home_topology/locations/list" });
        const loc = res.locations.find((l: any) => l.id === "kitchen");
        return loc?.parent_id === null && !!loc?.is_explicit_root;
      });
    })
    .toBe(true);
});

test("can reparent into another parent (empty parents should not show drop placeholders)", async ({ page }) => {
  await page.goto("/mock-harness.html");

  // Create an empty floor under House (valid parent for rooms, but initially empty)
  await page.locator('[data-testid="new-location-button"]').click();
  const dialogHost = page.locator("ht-location-dialog").first();
  const dialog = dialogHost.locator("ha-dialog");
  await expect
    .poll(async () => {
      return await dialog.evaluate((el) => (el as any).open);
    })
    .toBe(true);

  await dialog.locator('input[aria-label="name"]').fill("Empty Floor");
  await dialog.locator('select[aria-label="type"]').selectOption("floor");
  // Parent selection is optional here; we just need an empty floor to test reparenting.
  await dialog.getByRole("button", { name: "Create" }).click();

  const floorNode = page.locator('ht-location-tree [data-testid="tree-node"]', { hasText: "Empty Floor" }).first();
  await expect(floorNode).toBeVisible();

  const floorId = await floorNode.evaluate((el) => el.getAttribute("data-location-id"));
  expect(floorId).toBeTruthy();

  // Empty nodes should not show the expand chevron or a "drop here" placeholder in normal view.
  // Note: the chevron element may exist (hidden) to allow discoverability on hover.
  await expect(
    page.locator(`ht-location-tree [data-location-id="${floorId}"] [data-testid="expand-icon"]`)
  ).toBeHidden();
  await expect(page.locator('ht-location-tree', { hasText: "Drop here" })).toHaveCount(0);

  // Cross-container drag via Sortable can be flaky in headless browsers. We still validate the
  // integration path by dispatching the same `location-moved` event the tree emits on drag end.
  await page.evaluate(() => {
    const panel = document.querySelector("home-topology-panel") as any;
    const tree = panel?.shadowRoot?.querySelector("ht-location-tree") as HTMLElement | null;
    if (!tree) throw new Error("ht-location-tree not found");
    tree.dispatchEvent(
      new CustomEvent("location-moved", {
        detail: { locationId: "dining-room", newParentId: "second-floor", newIndex: 0 },
        bubbles: true,
        composed: true,
      })
    );
  });

  // Assert it is now rendered under Second Floor
  await expect(
    page.locator(
      'ht-location-tree .tree-children[data-location-id="second-floor"] > [data-testid="sortable-item"][data-location-id="dining-room"]'
    )
  ).toHaveCount(1);
});

test("can delete a leaf location (confirm dialog)", async ({ page }) => {
  await page.goto("/mock-harness.html");

  // Auto-accept browser confirm()
  page.on("dialog", async (d) => {
    await d.accept();
  });

  // Delete a leaf node (Dining Room has no children in mock data)
  const diningDelete = page
    .locator('ht-location-tree [data-location-id="dining-room"] [data-testid="delete-button"]')
    .first();
  await expect(diningDelete).toBeVisible();
  await diningDelete.click();

  await expect(page.locator('ht-location-tree .tree-node', { hasText: "Dining Room" })).toHaveCount(0);
});

test("can add an occupancy source from area sensors with one click", async ({ page }) => {
  await page.goto("/mock-harness.html");

  // Select an area location first (source configuration is area-only).
  await page.evaluate(() => {
    const panel = (window as any).panel;
    panel._selectedId = "kitchen";
    panel.requestUpdate();
  });

  // Add directly from area sensor row
  const areaSensorRow = page
    .locator("ht-location-inspector .candidate-item", { hasText: "binary_sensor.kitchen_motion" })
    .first();
  await areaSensorRow.locator('[data-testid="use-area-source-button"]').click();

  // Backend should now include the source on the selected location
  await expect
    .poll(async () => {
      return await page.evaluate(async () => {
        const res = await (window as any).mockHass.hass.callWS({
          type: "home_topology/locations/list",
        });
        const kitchen = res.locations.find((l: any) => l.id === "kitchen");
        const sources = kitchen?.modules?.occupancy?.occupancy_sources ?? [];
        return sources.map((s: any) => s.entity_id);
      });
    })
    .toContain("binary_sensor.kitchen_motion");

  // Panel state should have reloaded
  await expect
    .poll(async () => {
      return await page.evaluate(() => {
        const kitchen = (window as any).panel?._locations?.find((l: any) => l.id === "kitchen");
        const sources = kitchen?.modules?.occupancy?.occupancy_sources ?? [];
        return sources.map((s: any) => s.entity_id);
      });
    })
    .toContain("binary_sensor.kitchen_motion");

  // Source should now appear in inspector list
  await expect(page.locator("ht-location-inspector .source-item", { hasText: "binary_sensor.kitchen_motion" })).toBeVisible();
});

test("can add an external occupancy source inline with area-first selection", async ({ page }) => {
  await page.goto("/mock-harness.html");

  await page.evaluate(() => {
    const panel = (window as any).panel;
    panel._selectedId = "pantry";
    panel.requestUpdate();
  });

  const addButton = page.locator('ht-location-inspector [data-testid="add-external-source-inline"]');
  await expect(addButton).toBeDisabled();

  await page.locator("ht-location-inspector").evaluate((el) => {
    (el as any)._externalAreaId = "kitchen";
    (el as any)._externalEntityId = "binary_sensor.kitchen_motion";
    (el as any).requestUpdate();
  });

  await expect(addButton).toBeEnabled();
  await addButton.click();

  await expect
    .poll(async () => {
      return await page.evaluate(async () => {
        const res = await (window as any).mockHass.hass.callWS({
          type: "home_topology/locations/list",
        });
        const pantry = res.locations.find((l: any) => l.id === "pantry");
        const sources = pantry?.modules?.occupancy?.occupancy_sources ?? [];
        return sources.map((s: any) => s.entity_id);
      });
    })
    .toContain("binary_sensor.kitchen_motion");
});

test("media source defaults to activity mode when added inline", async ({ page }) => {
  await page.goto("/mock-harness.html");

  await page.evaluate(() => {
    const panel = (window as any).panel;
    panel._selectedId = "living-room";
    panel.requestUpdate();
  });

  await page
    .locator('ht-location-inspector [data-testid="use-area-source-button"][data-entity-id="media_player.tv"]')
    .click();

  await expect
    .poll(async () => {
      return await page.evaluate(async () => {
        const res = await (window as any).mockHass.hass.callWS({
          type: "home_topology/locations/list",
        });
        const livingRoom = res.locations.find((l: any) => l.id === "living-room");
        const source = (livingRoom?.modules?.occupancy?.occupancy_sources || []).find(
          (s: any) => s.entity_id === "media_player.tv"
        );
        return source
          ? {
              mode: source.mode,
              on_timeout: source.on_timeout,
              off_event: source.off_event,
            }
          : null;
      });
    })
    .toEqual({
      mode: "any_change",
      on_timeout: 1800,
      off_event: "none",
    });
});
