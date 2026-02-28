/**
 * E2E regression for tree DnD explicit drop zones (C-011, ADR-HA-039).
 * Asserts that drop outcome matches the zone (before/inside/after) under the pointer.
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

test.describe("Tree DnD explicit zones", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/mock-harness.html");
    await expect(page.locator("topomation-panel")).toBeVisible();
    await expandTreeNodes(page, ["main-building", "main-floor"]);
  });

  test("drop on middle third of row (inside zone) reparents as child", async ({ page }) => {
    const dragHandle = page.locator("ht-location-tree .tree-item[data-id='bathroom'] .drag-handle").first();
    const targetRow = page.locator("ht-location-tree .tree-item[data-id='second-floor']").first();
    await expect(dragHandle).toBeVisible();
    await expect(targetRow).toBeVisible();

    const box = await targetRow.boundingBox();
    if (!box) throw new Error("target row has no bounding box");
    const targetPosition = { x: box.width / 2, y: box.height / 2 };

    await dragHandle.dragTo(targetRow, { targetPosition });
    await page.waitForTimeout(300);

    await expect
      .poll(async () => {
        const locations = await getLocations(page);
        return locations.find((l: any) => l.id === "bathroom")?.parent_id;
      })
      .toBe("second-floor");
  });

  test("drop on top third of row (before zone) inserts as previous sibling", async ({ page }) => {
    const dragHandle = page.locator("ht-location-tree .tree-item[data-id='bathroom'] .drag-handle").first();
    const targetRow = page.locator("ht-location-tree .tree-item[data-id='living-room']").first();
    await expect(dragHandle).toBeVisible();
    await expect(targetRow).toBeVisible();

    const box = await targetRow.boundingBox();
    if (!box) throw new Error("target row has no bounding box");
    const targetPosition = { x: box.width / 2, y: box.height / 6 };

    await dragHandle.dragTo(targetRow, { targetPosition });
    await page.waitForTimeout(300);

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

  test("drop on bottom third of row (after zone) inserts as next sibling", async ({ page }) => {
    const dragHandle = page.locator("ht-location-tree .tree-item[data-id='kitchen'] .drag-handle").first();
    const targetRow = page.locator("ht-location-tree .tree-item[data-id='living-room']").first();
    await expect(dragHandle).toBeVisible();
    await expect(targetRow).toBeVisible();

    const box = await targetRow.boundingBox();
    if (!box) throw new Error("target row has no bounding box");
    const targetPosition = { x: box.width / 2, y: (box.height * 5) / 6 };

    await dragHandle.dragTo(targetRow, { targetPosition });
    await page.waitForTimeout(300);

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
