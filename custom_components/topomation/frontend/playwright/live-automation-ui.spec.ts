import { expect, test } from "@playwright/test";
import WebSocket from "ws";

const LIVE_HARNESS_PATH = "/api/topomation/static/live-harness.html";

async function openLiveHarness(page: any): Promise<void> {
  const token = process.env.HA_TOKEN || process.env.HA_TOKEN_LOCAL;
  const baseUrl = process.env.HA_URL || process.env.HA_URL_LOCAL;
  if (!token || !baseUrl) {
    throw new Error("HA_URL/HA_TOKEN must be set for live Playwright tests");
  }

  await page.addInitScript(
    ({ injectedBaseUrl, injectedToken }) => {
      (window as any).__TOPOMATION_LIVE_HARNESS__ = {
        baseUrl: injectedBaseUrl,
        token: injectedToken,
        topomationView: "location",
      };
    },
    {
      injectedBaseUrl: baseUrl,
      injectedToken: token,
    }
  );

  await page.goto(LIVE_HARNESS_PATH);
  await expect(page.getByTestId("live-harness-status")).toHaveAttribute("data-state", "ready");
  await expect(page.locator("topomation-panel")).toBeVisible();
}

async function selectLightingLocation(page: any): Promise<{ id: string; lightIds: string[] }> {
  const selected = await page.evaluate(async () => {
    const harness = (window as any).topomationLiveHarness;
    await harness.waitForReady();
    const location = await harness.getSuitableLightingLocation();
    if (!location) {
      throw new Error("No live location with at least two light entities was found");
    }
    await harness.selectLocation(location.id);
    return {
      id: location.id,
      lightIds: (location.entity_ids || []).filter((entityId: string) => entityId.startsWith("light.")),
    };
  });
  return selected;
}

async function openLightingTab(page: any): Promise<void> {
  const inspector = page.locator("ht-location-inspector");
  await expect(inspector).toBeVisible();
  await inspector.getByRole("button", { name: "Lighting" }).click();
  await expect(inspector.locator('[data-testid="actions-rules-section"]')).toBeVisible();
}

function liveHaConfig(): { baseUrl: string; token: string } {
  const token = process.env.HA_TOKEN || process.env.HA_TOKEN_LOCAL;
  const baseUrl = process.env.HA_URL || process.env.HA_URL_LOCAL;
  if (!token || !baseUrl) {
    throw new Error("HA_URL/HA_TOKEN must be set for live Playwright tests");
  }
  return { baseUrl, token };
}

function websocketUrl(baseUrl: string): string {
  const url = new URL(baseUrl);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/api/websocket";
  url.search = "";
  url.hash = "";
  return url.toString();
}

async function callHaWs(message: Record<string, unknown>): Promise<any> {
  const { baseUrl, token } = liveHaConfig();
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(websocketUrl(baseUrl));
    let settled = false;

    const finishWithError = (error: unknown) => {
      if (settled) return;
      settled = true;
      try {
        socket.close();
      } catch {
        // ignore close failures while unwinding a rejected websocket call
      }
      reject(error instanceof Error ? error : new Error(String(error)));
    };

    const finishWithResult = (result: unknown) => {
      if (settled) return;
      settled = true;
      try {
        socket.close();
      } catch {
        // ignore close failures after a successful websocket call
      }
      resolve(result);
    };

    socket.on("message", (rawData) => {
      let payload: any;
      try {
        payload = JSON.parse(String(rawData));
      } catch (error) {
        finishWithError(error);
        return;
      }

      if (payload?.type === "auth_required") {
        socket.send(
          JSON.stringify({
            type: "auth",
            access_token: token,
          })
        );
        return;
      }

      if (payload?.type === "auth_ok") {
        socket.send(
          JSON.stringify({
            id: 1,
            ...message,
          })
        );
        return;
      }

      if (payload?.type === "auth_invalid") {
        finishWithError(new Error(payload?.message || "Home Assistant auth failed"));
        return;
      }

      if (payload?.id === 1) {
        if (payload.success === false) {
          finishWithError(new Error(payload?.error?.message || "Home Assistant websocket error"));
          return;
        }
        finishWithResult(payload.result);
      }
    });

    socket.on("error", (error) => {
      finishWithError(error);
    });

    socket.on("close", () => {
      if (!settled) {
        finishWithError(new Error("Home Assistant websocket closed unexpectedly"));
      }
    });
  });
}

async function listLocationRules(locationId: string): Promise<any[]> {
  const response = await callHaWs({
    type: "topomation/actions/rules/list",
    location_id: locationId,
  });
  return Array.isArray(response?.rules) ? response.rules : [];
}

async function waitForCreatedRule(
  page: any,
  locationId: string,
  existingRuleIds: Set<string>
): Promise<any> {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    const rules = await listLocationRules(locationId);
    const createdRule = rules.find((rule) => {
      const ruleId = String(rule?.id || "").trim();
      return (
        ruleId &&
        !existingRuleIds.has(ruleId) &&
        Array.isArray(rule?.actions) &&
        rule.actions.length >= 2
      );
    });
    if (createdRule) {
      return createdRule;
    }
    await page.waitForTimeout(250);
  }
  throw new Error("Timed out waiting for the newly created live lighting rule");
}

async function deleteRuleById(automationId: string): Promise<void> {
  await callHaWs({
    type: "topomation/actions/rules/delete",
    automation_id: automationId,
  });
}

test("live automation lighting workflow matches contracted lifecycle controls", async ({ page }) => {
  await openLiveHarness(page);
  const location = await selectLightingLocation(page);

  const inspector = page.locator("ht-location-inspector");
  await expect(inspector.getByRole("button", { name: "Detection" })).toBeVisible();
  await expect(inspector.getByRole("button", { name: "Ambient" })).toBeVisible();
  await expect(inspector.getByRole("button", { name: "Lighting" })).toBeVisible();
  await expect(inspector.getByRole("button", { name: "Media" })).toBeVisible();
  await expect(inspector.getByRole("button", { name: "HVAC" })).toBeVisible();
  await expect(inspector.getByRole("button", { name: "Appliances" })).toHaveCount(0);

  await openLightingTab(page);

  await expect(inspector.getByTestId("startup-reapply-lighting")).toHaveCount(0);
  await expect(inspector.getByTestId("lighting-rules-save")).toHaveCount(0);

  const existingRules = await listLocationRules(location.id);
  const existingRuleIds = new Set(existingRules.map((rule) => String(rule.id || "").trim()).filter(Boolean));
  let createdRuleId: string | undefined;
  let createdRuleDeleted = false;

  try {
    await inspector.getByRole("button", { name: "Add rule" }).click();
    const draftRule = inspector.locator(".dusk-block-row[data-testid^='action-rule-']").last();
    await expect(draftRule).toBeVisible();
    await expect(draftRule.locator("[data-testid$='-run-on-startup']")).toBeVisible();
    await expect(draftRule.getByRole("button", { name: "Save rule" })).toBeVisible();
    await expect(draftRule.getByRole("button", { name: "Remove rule" })).toBeVisible();
    await expect(draftRule.getByRole("button", { name: "Delete rule" })).toHaveCount(0);

    const triggerSelect = draftRule.locator(".dusk-rule-row", { hasText: "Trigger" }).locator("select");
    await triggerSelect.selectOption("on_dark");
    await expect(
      draftRule.locator(".dusk-conditions .config-row", { hasText: "Ambient must be" })
    ).toContainText("Must be dark");
    await expect(
      draftRule.locator(".dusk-conditions .config-row", { hasText: "Ambient must be" })
    ).toContainText("Set by trigger");

    await triggerSelect.selectOption("on_bright");
    await expect(
      draftRule.locator(".dusk-conditions .config-row", { hasText: "Ambient must be" })
    ).toContainText("Must be bright");
    await expect(
      draftRule.locator(".dusk-conditions .config-row", { hasText: "Ambient must be" })
    ).toContainText("Set by trigger");

    await triggerSelect.selectOption("on_occupied");
    await expect(
      draftRule.locator(".dusk-conditions .config-row", { hasText: "Must be occupied" })
    ).toContainText("Must be occupied");
    await expect(
      draftRule.locator(".dusk-conditions .config-row", { hasText: "Must be occupied" })
    ).toContainText("Set by trigger");

    await triggerSelect.selectOption("on_vacant");
    await expect(
      draftRule.locator(".dusk-conditions .config-row", { hasText: "Must be vacant" })
    ).toContainText("Must be vacant");
    await expect(
      draftRule.locator(".dusk-conditions .config-row", { hasText: "Must be vacant" })
    ).toContainText("Set by trigger");

    await triggerSelect.selectOption("on_occupied");

    const firstTwoLightRows = draftRule.locator(".dusk-light-action-row");
    await expect(firstTwoLightRows).toHaveCount(Math.max(2, location.lightIds.length));
    await firstTwoLightRows.nth(0).locator("input[type='checkbox']").check();
    await firstTwoLightRows.nth(1).locator("input[type='checkbox']").check();

    const firstSlider = firstTwoLightRows.nth(0).locator("input[type='range']").first();
    const secondSlider = firstTwoLightRows.nth(1).locator("input[type='range']").first();
    if ((await firstSlider.count()) > 0) {
      await firstSlider.fill("30");
    }
    if ((await secondSlider.count()) > 0) {
      await secondSlider.fill("45");
    }

    await draftRule.getByRole("button", { name: "Save rule" }).click();
    const createdRule = await waitForCreatedRule(page, location.id, existingRuleIds);
    createdRuleId = String(createdRule.id || "").trim();
    expect(createdRuleId).toBeTruthy();

    await expect(draftRule.getByRole("button", { name: "Save rule" })).toHaveCount(0);
    await expect(draftRule.getByRole("button", { name: "Update rule" })).toHaveCount(0);
    await expect(draftRule.getByRole("button", { name: "Discard edits" })).toHaveCount(0);
    await expect(draftRule.getByRole("button", { name: "Delete rule" })).toBeVisible();

    await page.reload();
    await expect(page.getByTestId("live-harness-status")).toHaveAttribute("data-state", "ready");
    await page.evaluate(async (locationId) => {
      const harness = (window as any).topomationLiveHarness;
      await harness.waitForReady();
      await harness.selectLocation(locationId);
    }, location.id);
    await openLightingTab(page);

    const persistedRule = inspector.locator(`[data-testid="action-rule-${createdRuleId}"]`);
    await expect(persistedRule).toBeVisible();
    await expect(persistedRule.getByRole("button", { name: "Delete rule" })).toBeVisible();
    await expect(persistedRule.getByRole("button", { name: "Update rule" })).toHaveCount(0);
    await expect(persistedRule.getByRole("button", { name: "Discard edits" })).toHaveCount(0);

    await persistedRule
      .locator(".dusk-rule-row", { hasText: "Trigger" })
      .locator("select")
      .selectOption("on_dark");
    await expect(persistedRule.getByRole("button", { name: "Update rule" })).toBeVisible();
    await expect(persistedRule.getByRole("button", { name: "Discard edits" })).toBeVisible();
    await expect(persistedRule.getByRole("button", { name: "Delete rule" })).toBeVisible();

    await persistedRule.getByRole("button", { name: "Discard edits" }).click();
    await expect(persistedRule.getByRole("button", { name: "Update rule" })).toHaveCount(0);
    await expect(persistedRule.getByRole("button", { name: "Discard edits" })).toHaveCount(0);
    await expect(persistedRule.getByRole("button", { name: "Delete rule" })).toBeVisible();

    const persistedSelectedCount = await persistedRule
      .locator(".dusk-light-action-row input[type='checkbox']:checked")
      .count();
    expect(persistedSelectedCount).toBeGreaterThanOrEqual(2);

    await persistedRule.getByRole("button", { name: "Delete rule" }).click();
    createdRuleDeleted = true;
    await expect(inspector.locator(`[data-testid="action-rule-${createdRuleId}"]`)).toHaveCount(0);
  } finally {
    if (createdRuleId && !createdRuleDeleted) {
      await deleteRuleById(createdRuleId);
    }
  }
});
