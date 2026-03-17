/**
 * Browser regression for tree DnD explicit drop zones (C-011, ADR-HA-039).
 * The pointer-band math itself is unit-tested in ht-location-tree.test.ts.
 * Here we verify that each resolved zone intent produces the correct persisted move.
 */
import { expect, test } from "@playwright/test";

async function expandTreeNodes(page: any, ids: string[]): Promise<void> {
  await page.evaluate((expandIds: string[]) => {
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

async function getLocations(page: any): Promise<any[]> {
  return await page.evaluate(async () => {
    const res = await (window as any).mockHass.hass.callWS({ type: "topomation/locations/list" });
    return res.locations;
  });
}

async function simulateZoneDrop(
  page: any,
  draggedId: string,
  relatedId: string,
  zone: "before" | "inside" | "after"
): Promise<void> {
  await page.evaluate(
    ({ draggedId: sourceId, relatedId: targetId, zone: dropZone }) => {
      const panel = document.querySelector("topomation-panel") as any;
      const tree = panel?.shadowRoot?.querySelector("ht-location-tree") as any;
      const row = tree?.shadowRoot?.querySelector(`.tree-item[data-id='${sourceId}']`) as HTMLElement | null;
      if (!tree) throw new Error("ht-location-tree not found");
      if (!row) throw new Error(`tree row not found for ${sourceId}`);
      tree._activeDropTarget = { relatedId: targetId, zone: dropZone };
      tree._handleDragEnd({ item: row });
    },
    { draggedId, relatedId, zone }
  );
}

test.describe("Tree DnD explicit zones", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/mock-harness.html");
    await expect(page.locator("topomation-panel")).toBeVisible();
    await expandTreeNodes(page, ["main-building", "main-floor"]);
  });

  test("inside zone reparents as child", async ({ page }) => {
    await expect(page.locator("ht-location-tree .tree-item[data-id='bathroom']").first()).toBeVisible();
    await expect(page.locator("ht-location-tree .tree-item[data-id='second-floor']").first()).toBeVisible();
    await simulateZoneDrop(page, "bathroom", "second-floor", "inside");

    await expect
      .poll(async () => {
        const locations = await getLocations(page);
        return locations.find((l: any) => l.id === "bathroom")?.parent_id;
      })
      .toBe("second-floor");
  });

  test("before zone inserts as previous sibling", async ({ page }) => {
    await expect(page.locator("ht-location-tree .tree-item[data-id='bathroom']").first()).toBeVisible();
    await expect(page.locator("ht-location-tree .tree-item[data-id='living-room']").first()).toBeVisible();
    await simulateZoneDrop(page, "bathroom", "living-room", "before");

    await expect
      .poll(async () => {
        const locations = await getLocations(page);
        const bathroom = locations.find((l: any) => l.id === "bathroom");
        const siblings = locations.filter((l: any) => l.parent_id === "main-floor");
        const order = siblings.sort((a: any, b: any) => {
          const ai = locations.indexOf(a);
          const bi = locations.indexOf(b);
          return ai - bi;
        });
        const idx = order.findIndex((l: any) => l.id === "bathroom");
        const livingIdx = order.findIndex((l: any) => l.id === "living-room");
        return bathroom?.parent_id === "main-floor" && idx >= 0 && livingIdx >= 0 && idx < livingIdx;
      })
      .toBe(true);
  });

  test("after zone inserts as next sibling", async ({ page }) => {
    await expect(page.locator("ht-location-tree .tree-item[data-id='kitchen']").first()).toBeVisible();
    await expect(page.locator("ht-location-tree .tree-item[data-id='living-room']").first()).toBeVisible();
    await simulateZoneDrop(page, "kitchen", "living-room", "after");

    await expect
      .poll(async () => {
        const locations = await getLocations(page);
        const kitchen = locations.find((l: any) => l.id === "kitchen");
        if (kitchen?.parent_id !== "main-floor") return false;
        const mainFloorChildren = locations.filter((l: any) => l.parent_id === "main-floor");
        const order = mainFloorChildren.map((loc: any) => locations.findIndex((l: any) => l.id === loc.id));
        const kitchenOrderIdx = locations.findIndex((l: any) => l.id === "kitchen");
        const livingOrderIdx = locations.findIndex((l: any) => l.id === "living-room");
        return kitchenOrderIdx > livingOrderIdx;
      })
      .toBe(true);
  });
});
