import { expect, test } from "@playwright/test";

test.describe("Mock Harness Smoke", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/mock-harness.html");
    await expect(page.locator("topomation-panel")).toBeVisible();
  });

  test("renders rootless hierarchy with building and grounds roots", async ({ page }) => {
    await expect(page.locator("ht-location-tree [data-id='house']")).toHaveCount(0);
    await expect(page.locator("ht-location-tree [data-id='main-building']")).toBeVisible();
    await expect(page.locator("ht-location-tree [data-id='grounds']")).toBeVisible();
    await expect(page.locator("ht-location-tree [data-id='main-floor']")).toBeVisible();
    await expect(page.locator("ht-location-tree [data-id='second-floor']")).toBeVisible();
  });

  test("tree exposes lock controls", async ({ page }) => {
    const lockButtons = page.locator("ht-location-tree .lock-btn");
    expect(await lockButtons.count()).toBeGreaterThan(0);
  });

  test("dragging an HA area across floors updates parent", async ({ page }) => {
    await page.evaluate(() => {
      const panel = document.querySelector("topomation-panel") as any;
      const tree = panel?.shadowRoot?.querySelector("ht-location-tree") as HTMLElement | null;
      if (!tree) throw new Error("ht-location-tree not found");
      tree.dispatchEvent(
        new CustomEvent("location-moved", {
          detail: { locationId: "living-room", newParentId: "second-floor", newIndex: 0 },
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
          return res.locations.find((l: any) => l.id === "living-room")?.parent_id;
        });
      })
      .toBe("second-floor");
  });
});
