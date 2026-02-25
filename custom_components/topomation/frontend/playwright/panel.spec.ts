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

  const dragViaTreeHandler = async (params: {
    locationId: string;
    relatedId: string;
    willInsertAfter?: boolean;
    relatedLeft?: number;
    pointerX?: number;
  }) => {
    await page.evaluate(
      ({ locationId, relatedId, willInsertAfter, relatedLeft, pointerX }) => {
        const panel = document.querySelector("topomation-panel") as any;
        const tree = panel?.shadowRoot?.querySelector("ht-location-tree") as any;
        if (!tree) throw new Error("ht-location-tree not found");
        const rows = Array.from(
          tree.shadowRoot?.querySelectorAll(".tree-item[data-id]") || []
        ) as HTMLElement[];
        const oldIndex = rows.findIndex((row) => row.getAttribute("data-id") === locationId);
        const relatedIndex = rows.findIndex((row) => row.getAttribute("data-id") === relatedId);
        if (oldIndex < 0 || relatedIndex < 0) {
          throw new Error(`row not found: old=${oldIndex}, related=${relatedIndex}`);
        }

        tree._lastDropContext = {
          relatedId,
          willInsertAfter: willInsertAfter ?? true,
          relatedLeft: relatedLeft ?? 0,
          pointerX,
        };

        const item = document.createElement("div");
        item.setAttribute("data-id", locationId);
        tree._handleDragEnd({
          item,
          oldIndex,
          newIndex: relatedIndex + 1,
        });
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

  // Outdent from building to root.
  await dragViaTreeHandler({
    locationId: "second-floor",
    relatedId: "main-building",
    willInsertAfter: true,
  });
  await expect.poll(() => getParent("second-floor")).toBe(null);

  // Attempt invalid move under grounds (rightward child intent) -> should be rejected.
  await dragViaTreeHandler({
    locationId: "second-floor",
    relatedId: "grounds",
    willInsertAfter: true,
    relatedLeft: 100,
    pointerX: 200,
  });
  await expect.poll(() => getParent("second-floor")).toBe(null);

  // Move back under building (rightward child intent) -> allowed.
  await dragViaTreeHandler({
    locationId: "second-floor",
    relatedId: "main-building",
    willInsertAfter: true,
    relatedLeft: 100,
    pointerX: 200,
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
    "Manage locations and hierarchy here"
  );
});

test("manager header title follows route path for all menu views", async ({ page }) => {
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
  await expect(headerTitle).toHaveText("Topomation");

  await setPanelPath("/topomation-occupancy");
  await expect(headerTitle).toHaveText("Occupancy Manager");

  await setPanelPath("/topomation-actions");
  await expect(headerTitle).toHaveText("Actions Manager");
});
