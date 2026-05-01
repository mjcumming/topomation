import { expect, test } from "@playwright/test";
import WebSocket from "ws";
import { openHaDevPanel } from "./ha-dev-auth";

function haConfig(): { baseUrl: string; token: string } {
  const baseUrl = (process.env.HA_URL || "http://127.0.0.1:8123").replace(/\/+$/, "");
  const token = process.env.HA_TOKEN || "";
  if (!token) throw new Error("HA_TOKEN is required for HA dev Playwright tests");
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
  const { baseUrl, token } = haConfig();
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(websocketUrl(baseUrl));
    let settled = false;
    const fail = (error: unknown) => {
      if (settled) return;
      settled = true;
      try {
        socket.close();
      } catch {
        // ignore
      }
      reject(error instanceof Error ? error : new Error(String(error)));
    };
    const done = (result: unknown) => {
      if (settled) return;
      settled = true;
      try {
        socket.close();
      } catch {
        // ignore
      }
      resolve(result);
    };
    socket.on("message", (raw) => {
      const payload = JSON.parse(String(raw));
      if (payload.type === "auth_required") {
        socket.send(JSON.stringify({ type: "auth", access_token: token }));
        return;
      }
      if (payload.type === "auth_ok") {
        socket.send(JSON.stringify({ id: 1, ...message }));
        return;
      }
      if (payload.type === "auth_invalid") {
        fail(new Error(payload.message || "auth failed"));
        return;
      }
      if (payload.id === 1) {
        if (payload.success === false) {
          fail(new Error(payload.error?.message || "websocket command failed"));
          return;
        }
        done(payload.result);
      }
    });
    socket.on("error", fail);
    socket.on("close", () => {
      if (!settled) fail(new Error("websocket closed"));
    });
  });
}

async function callHaService(domain: string, service: string, data: Record<string, unknown>): Promise<void> {
  const { baseUrl, token } = haConfig();
  const response = await fetch(`${baseUrl}/api/services/${domain}/${service}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`${domain}.${service} failed: ${response.status} ${await response.text()}`);
  }
}

async function getState(entityId: string): Promise<any> {
  const { baseUrl, token } = haConfig();
  const response = await fetch(`${baseUrl}/api/states/${entityId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(`State ${entityId} failed: ${response.status}`);
  }
  return response.json();
}

async function waitForState(entityId: string, expected: string): Promise<void> {
  const deadline = Date.now() + 15_000;
  let last = "";
  while (Date.now() < deadline) {
    const state = await getState(entityId);
    last = String(state.state || "");
    if (last === expected) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`${entityId} did not reach ${expected}; last=${last}`);
}

async function openRealPanel(page: any): Promise<void> {
  await openHaDevPanel(page);
  await expect(page.locator("ht-location-inspector")).toBeVisible({ timeout: 10_000 });
}

async function devLocationByName(name: string): Promise<any> {
  const response = await callHaWs({ type: "topomation/locations/list" });
  const location = (response.locations || []).find((item: any) => item?.name === name);
  if (!location) throw new Error(`Location ${name} not found`);
  return location;
}

test("ha-dev regression_rule_run_payload: Run rule uses valid light service data", async ({ page }) => {
  const location = await devLocationByName("Driveway");
  const ruleUuid = `ha-dev-run-${Date.now()}`;
  let automationId = "";

  try {
    const created = await callHaWs({
      type: "topomation/actions/rules/create",
      location_id: location.id,
      name: "HA Dev Run Rule Payload",
      trigger_type: "on_dark",
      trigger_types: ["on_dark"],
      ambient_condition: "any",
      actions: [
        {
          entity_id: "light.driveway_test_light",
          service: "turn_on",
          data: { brightness_pct: 100 },
          only_if_off: true,
        },
      ],
      rule_uuid: ruleUuid,
      run_on_startup: true,
    });
    const rule = created.rule || created;
    automationId = String(rule.id || "");
    expect(automationId).toBeTruthy();

    await callHaService("light", "turn_off", { entity_id: "light.driveway_test_light" });
    await waitForState("light.driveway_test_light", "off");

    await openRealPanel(page);
    const row = page.locator(`ht-location-tree .tree-item[data-id="${location.id}"]`).first();
    await expect(row).toBeVisible({ timeout: 10_000 });
    await row.click();

    const inspector = page.locator("ht-location-inspector");
    await inspector.getByRole("button", { name: "Lighting" }).click();
    const ruleCard = inspector.locator(`[data-testid="action-rule-${automationId}"]`);
    await expect(ruleCard).toBeVisible({ timeout: 15_000 });
    await ruleCard.getByRole("button", { name: "Run rule" }).click();
    await waitForState("light.driveway_test_light", "on");

    await expect(page.getByText("Failed to run rule")).toHaveCount(0);
  } finally {
    if (automationId) {
      await callHaWs({ type: "topomation/actions/rules/delete", automation_id: automationId }).catch(() => undefined);
    }
  }
});
