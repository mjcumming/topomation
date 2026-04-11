import { expect, test } from "@playwright/test";
import WebSocket from "ws";

const LIVE_HARNESS_PATH = process.env.LIVE_HARNESS_PATH || "/live-harness.html";

/** Use real panel at /topomation (e.g. production) when set; otherwise use live harness. */
const LIVE_PANEL_PATH = process.env.LIVE_PANEL_PATH || "";

function isRealPanel(): boolean {
  return LIVE_PANEL_PATH === "/topomation" || LIVE_PANEL_PATH === "topomation";
}

async function openLiveHarness(page: any): Promise<void> {
  const token = process.env.HA_TOKEN || process.env.HA_TOKEN_LOCAL;
  const baseUrl = (process.env.HA_URL || process.env.HA_URL_LOCAL)?.replace(/\/+$/, "");
  if (!token || !baseUrl) {
    throw new Error("HA_URL/HA_TOKEN must be set for live Playwright tests");
  }

  if (isRealPanel()) {
    const panelPath = LIVE_PANEL_PATH.startsWith("/") ? LIVE_PANEL_PATH : `/${LIVE_PANEL_PATH}`;
    await page.addInitScript(
      ({ t }: { t: string }) => {
        (window as any).externalApp = {
          getExternalAuth(options: { callback?: string; force?: boolean }) {
            const callbackName =
              options && typeof options.callback === "string" ? options.callback : "";
            const callback =
              (callbackName && typeof (window as any)[callbackName] === "function"
                ? (window as any)[callbackName]
                : undefined) ||
              (typeof (window as any).externalAuthSetToken === "function"
                ? (window as any).externalAuthSetToken
                : undefined);
            if (typeof callback !== "function") {
              return;
            }
            callback(true, {
              access_token: t,
              expires_in: 86400,
            });
          },
          revokeExternalAuth(options: { callback?: string }) {
            const callbackName =
              options && typeof options.callback === "string" ? options.callback : "";
            const callback =
              (callbackName && typeof (window as any)[callbackName] === "function"
                ? (window as any)[callbackName]
                : undefined) ||
              (typeof (window as any).externalAuthRevokeToken === "function"
                ? (window as any).externalAuthRevokeToken
                : undefined);
            if (typeof callback !== "function") {
              return;
            }
            callback(true);
          },
        };
        try {
          localStorage.setItem("hassTokens", JSON.stringify({ default: t }));
          sessionStorage.setItem("hassTokens", JSON.stringify({ default: t }));
        } catch {
          // ignore
        }
      },
      { t: token }
    );
    await page.goto(`${baseUrl}${panelPath}?external_auth=1`, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    await expect(page.locator("topomation-panel")).toBeVisible({ timeout: 15000 });
    await expect(page.locator("ht-location-inspector")).toBeVisible({ timeout: 5000 });
    return;
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

  const separator = LIVE_HARNESS_PATH.includes("?") ? "&" : "?";
  const harnessUrl =
    `${LIVE_HARNESS_PATH}${separator}` +
    `baseUrl=${encodeURIComponent(baseUrl)}&token=${encodeURIComponent(token)}`;
  await page.goto(harnessUrl);
  await expect(page.getByTestId("live-harness-status")).toHaveAttribute("data-state", "ready");
  await expect(page.locator("topomation-panel")).toBeVisible();
}

async function selectLightingLocation(page: any): Promise<{ id: string; lightIds: string[] }> {
  if (isRealPanel()) {
    const tree = page.locator("ht-location-tree");
    const inspector = page.locator("ht-location-inspector");
    const items = tree.locator(".tree-item[data-id]");
    const count = await items.count();
    for (let i = 0; i < count; i++) {
      const item = items.nth(i);
      const dataId = await item.getAttribute("data-id");
      if (!dataId) continue;
      await item.click();
      await inspector.getByRole("button", { name: "Lighting" }).click();
      await expect(inspector.locator('[data-testid="actions-rules-section"]')).toBeVisible({ timeout: 3000 });
      const lightRows = inspector.locator(".dusk-light-action-row");
      const lightCount = await lightRows.count();
      if (lightCount >= 2) {
        const lightIds: string[] = [];
        for (let j = 0; j < lightCount; j++) {
          lightIds.push(`light.${j}`);
        }
        return { id: dataId, lightIds };
      }
    }
    throw new Error("No location with at least two light entities was found in the tree");
  }

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

async function listLocations(): Promise<any[]> {
  const response = await callHaWs({
    type: "topomation/locations/list",
  });
  return Array.isArray(response?.locations) ? response.locations : [];
}

async function expandTreeAncestors(page: any, locationId: string): Promise<void> {
  if (!isRealPanel()) return;
  const locations = await listLocations();
  const byId = new Map(locations.map((location) => [String(location.id), location]));
  const ancestorIds: string[] = [];
  let parentId = byId.get(locationId)?.parent_id ?? null;
  while (typeof parentId === "string" && parentId) {
    ancestorIds.push(parentId);
    parentId = byId.get(parentId)?.parent_id ?? null;
  }
  await page.evaluate((ids: string[]) => {
    const panel = document.querySelector("topomation-panel") as any;
    const tree = panel?.shadowRoot?.querySelector("ht-location-tree") as any;
    if (!tree) throw new Error("ht-location-tree not found");
    const next = new Set<string>(Array.from(tree._expandedIds || []));
    for (const id of ids) {
      next.add(String(id));
    }
    tree._expandedIds = next;
    tree.requestUpdate?.();
  }, ancestorIds);
}

async function selectLocationById(page: any, locationId: string): Promise<void> {
  if (isRealPanel()) {
    await expandTreeAncestors(page, locationId);
    const treeRow = page.locator(`ht-location-tree .tree-item[data-id="${locationId}"]`).first();
    await expect(treeRow).toBeVisible({ timeout: 5000 });
    await treeRow.click();
    return;
  }

  await page.evaluate(async (targetLocationId) => {
    const harness = (window as any).topomationLiveHarness;
    await harness.waitForReady();
    await harness.selectLocation(targetLocationId);
  }, locationId);
}

async function findOccupancyGroupCandidate(): Promise<{
  floorId: string;
  memberIds: [string, string];
  originalConfigs: Record<string, Record<string, unknown>>;
}> {
  const locations = await listLocations();
  const byId = new Map(locations.map((location) => [String(location.id), location]));
  const managedShadowIds = new Set<string>();
  for (const location of locations) {
    const meta = ((location?.modules?._meta || {}) as Record<string, unknown>);
    const shadowAreaId =
      typeof meta.shadow_area_id === "string" ? meta.shadow_area_id.trim() : "";
    const locationType =
      typeof meta.type === "string" ? meta.type.trim().toLowerCase() : "";
    if (shadowAreaId && ["floor", "building", "grounds"].includes(locationType)) {
      managedShadowIds.add(shadowAreaId);
    }
  }

  const isManagedShadowLocation = (location: any): boolean => {
    const meta = ((location?.modules?._meta || {}) as Record<string, unknown>);
    const role = typeof meta.role === "string" ? meta.role.trim().toLowerCase() : "";
    const shadowForLocationId =
      typeof meta.shadow_for_location_id === "string" ? meta.shadow_for_location_id.trim() : "";
    return managedShadowIds.has(String(location?.id || "")) || role === "managed_shadow" || Boolean(shadowForLocationId);
  };

  const byParent = new Map<string | null, any[]>();
  for (const location of locations) {
    const key = location.parent_id ?? null;
    if (!byParent.has(key)) {
      byParent.set(key, []);
    }
    byParent.get(key)!.push(location);
  }

  for (const location of locations) {
    const locationType = String(location?.modules?._meta?.type || "");
    if (locationType !== "floor") continue;
    const eligibleChildAreas = (byParent.get(location.id) || []).filter((candidate) => {
      if (String(candidate?.modules?._meta?.type || "") !== "area") {
        return false;
      }
      if (isManagedShadowLocation(candidate)) {
        return false;
      }
      const currentGroupId = candidate?.modules?.occupancy?.occupancy_group_id;
      return !(typeof currentGroupId === "string" && currentGroupId.trim().length > 0);
    });
    if (eligibleChildAreas.length < 2) continue;

    const members = eligibleChildAreas.slice(0, 2).map((item) => String(item.id)) as [string, string];
    return {
      floorId: String(location.id),
      memberIds: members,
      originalConfigs: Object.fromEntries(
        members.map((memberId) => {
          const member = byId.get(memberId);
          return [memberId, JSON.parse(JSON.stringify(member?.modules?.occupancy || {}))];
        })
      ),
    };
  }

  throw new Error("No live floor with two eligible child areas was found");
}

async function setOccupancyConfig(
  locationId: string,
  config: Record<string, unknown>
): Promise<void> {
  await callHaWs({
    type: "topomation/locations/set_module_config",
    location_id: locationId,
    module_id: "occupancy",
    config,
  });
}

async function openLightingTab(page: any): Promise<void> {
  const inspector = page.locator("ht-location-inspector");
  await expect(inspector).toBeVisible();
  await inspector.getByRole("button", { name: "Lighting" }).click();
  await expect(inspector.locator('[data-testid="actions-rules-section"]')).toBeVisible();
}

async function openDetectionTab(page: any): Promise<void> {
  const inspector = page.locator("ht-location-inspector");
  await expect(inspector).toBeVisible();
  const occupancyGroupsTab = inspector.getByRole("button", { name: "Occupancy Groups" });
  if (await occupancyGroupsTab.count()) {
    await occupancyGroupsTab.click();
    return;
  }
  await inspector.getByRole("button", { name: "Occupancy" }).click();
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

async function callTopomationService(service: string, serviceData: Record<string, unknown>): Promise<void> {
  const { baseUrl, token } = liveHaConfig();
  const response = await fetch(`${baseUrl}/api/services/topomation/${service}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(serviceData),
  });
  if (!response.ok) {
    throw new Error(`Topomation service ${service} failed: ${response.status} ${await response.text()}`);
  }
}

test("live automation lighting workflow matches contracted lifecycle controls", async ({ page }) => {
  await openLiveHarness(page);
  const location = await selectLightingLocation(page);

  const inspector = page.locator("ht-location-inspector");
  await expect(inspector.getByRole("button", { name: "Occupancy" })).toBeVisible();
  await expect(inspector.getByRole("button", { name: "Ambient" })).toBeVisible();
  await expect(inspector.getByRole("button", { name: "Lighting" })).toBeVisible();
  await expect(inspector.getByRole("button", { name: "Appliances" })).toBeVisible();
  await expect(inspector.getByRole("button", { name: "Media" })).toBeVisible();
  await expect(inspector.getByRole("button", { name: "HVAC" })).toBeVisible();

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
    await expect(inspector.getByTestId("action-rule-add")).toHaveCount(0);
    await expect(draftRule.getByRole("button", { name: "Save rule" })).toBeVisible();
    await expect(draftRule.getByRole("button", { name: "Remove rule" })).toBeVisible();
    await expect(draftRule.getByRole("button", { name: "Delete rule" })).toHaveCount(0);

    const firstSituation = draftRule.locator(".lighting-situation-card").first();
    await expect(firstSituation).toBeVisible();
    await expect(firstSituation).toContainText("Room becomes occupied");
    await expect(firstSituation).toContainText("It is dark");

    const firstTwoLightRows = draftRule.locator(".dusk-light-action-row");
    await expect(firstTwoLightRows).toHaveCount(Math.max(2, location.lightIds.length));
    await firstTwoLightRows.nth(0).locator('[data-testid*="-device-include-0"]').check();
    await firstTwoLightRows.nth(1).locator('[data-testid*="-device-include-1"]').check();
    await firstTwoLightRows.nth(0).getByText("Only if off", { exact: true }).click();

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
    expect(Array.isArray(createdRule.actions)).toBeTruthy();
    expect(createdRule.actions[0]?.only_if_off).toBe(true);

    await expect(draftRule.getByRole("button", { name: "Save rule" })).toHaveCount(0);
    await expect(draftRule.getByRole("button", { name: "Update rule" })).toHaveCount(0);
    await expect(draftRule.getByRole("button", { name: "Discard edits" })).toHaveCount(0);
    await expect(draftRule.getByRole("button", { name: "Delete rule" })).toBeVisible();

    await page.reload();
    if (isRealPanel()) {
      await expect(page.locator("topomation-panel")).toBeVisible({ timeout: 15000 });
      await page.locator(`ht-location-tree .tree-item[data-id="${location.id}"]`).click();
      await openLightingTab(page);
    } else {
      await expect(page.getByTestId("live-harness-status")).toHaveAttribute("data-state", "ready");
      await page.evaluate(async (locationId) => {
        const harness = (window as any).topomationLiveHarness;
        await harness.waitForReady();
        await harness.selectLocation(locationId);
      }, location.id);
      await openLightingTab(page);
    }

    const persistedRule = inspector.locator(`[data-testid="action-rule-${createdRuleId}"]`);
    await expect(persistedRule).toBeVisible();
    await expect(persistedRule.getByRole("button", { name: "Delete rule" })).toBeVisible();
    await expect(persistedRule.getByRole("button", { name: "Update rule" })).toHaveCount(0);
    await expect(persistedRule.getByRole("button", { name: "Discard edits" })).toHaveCount(0);

    const persistedSituation = persistedRule.locator(".lighting-situation-card").first();
    const brightRequirement = persistedSituation.locator(".choice-pill", {
      hasText: "It is bright",
    });
    await brightRequirement.click();
    await expect(persistedRule.getByRole("button", { name: "Update rule" })).toBeVisible();
    await expect(persistedRule.getByRole("button", { name: "Discard edits" })).toBeVisible();
    await expect(persistedRule.getByRole("button", { name: "Delete rule" })).toBeVisible();

    await persistedRule.getByRole("button", { name: "Discard edits" }).click();
    await expect(persistedRule.getByRole("button", { name: "Update rule" })).toHaveCount(0);
    await expect(persistedRule.getByRole("button", { name: "Discard edits" })).toHaveCount(0);
    await expect(persistedRule.getByRole("button", { name: "Delete rule" })).toBeVisible();
    await expect(
      persistedSituation
        .locator(".lighting-situation-row")
        .nth(1)
        .locator(".choice-pill.active")
        .filter({ hasText: "It is dark" })
    ).toHaveCount(1);

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

test("live detection explainability reflects trigger activation and contributor removal", async ({ page }) => {
  await openLiveHarness(page);
  const location = await selectLightingLocation(page);

  const inspector = page.locator("ht-location-inspector");
  const explainability = page.locator("ht-room-explainability").getByTestId("room-explainability-panel");
  const currentStatePanel = explainability.locator(".occupancy-explainability-panel").first();
  const activeContributorsPanel = explainability.locator(".occupancy-explainability-panel").nth(1);
  await openDetectionTab(page);

  await expect(explainability).toBeVisible();
  await expect(explainability).toContainText("Occupancy Explainability");
  await expect(inspector.getByTestId("adjacency-advanced-toggle")).toHaveCount(0);
  await expect(inspector.getByText("Advanced Occupancy Relationships")).toHaveCount(0);

  const sourceId = `live_explainability_test_${Date.now()}`;
  await callTopomationService("clear", {
    location_id: location.id,
    source_id: sourceId,
    trailing_timeout: 0,
  });
  await callTopomationService("vacate_area", {
    location_id: location.id,
    source_id: sourceId,
    include_locked: true,
  });
  await expect(currentStatePanel).toContainText("Vacant", { timeout: 10000 });
  await expect(activeContributorsPanel).toContainText("No active contributors", { timeout: 10000 });

  await callTopomationService("trigger", {
    location_id: location.id,
    source_id: sourceId,
    timeout: 300,
  });
  await expect(currentStatePanel).toContainText("Occupied", { timeout: 20000 });
  await expect(activeContributorsPanel).toContainText(sourceId, { timeout: 20000 });

  await callTopomationService("clear", {
    location_id: location.id,
    source_id: sourceId,
    trailing_timeout: 0,
  });
  await expect(activeContributorsPanel).not.toContainText(sourceId, { timeout: 10000 });
});

test("live floor occupancy groups save shared occupancy_group_id membership", async ({ page }) => {
  await openLiveHarness(page);
  const candidate = await findOccupancyGroupCandidate();
  await selectLocationById(page, candidate.floorId);

  const inspector = page.locator("ht-location-inspector");

  const groupsSection = inspector.getByTestId("occupancy-groups-section");
  const firstMember = inspector.getByTestId(`occupancy-group-create-location-${candidate.memberIds[0]}`);
  const secondMember = inspector.getByTestId(`occupancy-group-create-location-${candidate.memberIds[1]}`);
  const createButton = inspector.getByTestId("occupancy-group-create-button");
  await expect(groupsSection).toBeVisible();
  await expect(firstMember).toBeVisible();
  await expect(secondMember).toBeVisible();

  try {
    await firstMember.check();
    await secondMember.check();
    await expect(createButton).toBeEnabled();
    await createButton.click();
    await expect(inspector.getByTestId("detection-save-button")).toHaveCount(0);

    await expect
      .poll(async () => {
        const locations = await listLocations();
        const current = locations.find((location) => location.id === candidate.memberIds[0]);
        const peer = locations.find((location) => location.id === candidate.memberIds[1]);
        const currentGroup = typeof current?.modules?.occupancy?.occupancy_group_id === "string"
          ? current.modules.occupancy.occupancy_group_id
          : null;
        const peerGroup = typeof peer?.modules?.occupancy?.occupancy_group_id === "string"
          ? peer.modules.occupancy.occupancy_group_id
          : null;
        return Boolean(currentGroup && currentGroup === peerGroup);
      })
      .toBe(true);
  } finally {
    for (const memberId of candidate.memberIds) {
      await setOccupancyConfig(memberId, candidate.originalConfigs[memberId]);
    }
  }
});

test("live panel reloads cleanly after leaving the browser and returning", async ({ page }) => {
  await openLiveHarness(page);
  const location = await selectLightingLocation(page);
  await openDetectionTab(page);

  await expect(page.locator("topomation-panel")).toBeVisible();
  await page.goto("about:blank");
  await page.goBack({ waitUntil: "domcontentloaded" });

  if (isRealPanel()) {
    await expect(page.locator("topomation-panel")).toBeVisible({ timeout: 15000 });
    await selectLocationById(page, location.id);
  } else {
    await expect(page.getByTestId("live-harness-status")).toHaveAttribute("data-state", "ready");
    await selectLocationById(page, location.id);
  }

  await expect(page.locator("topomation-panel")).toBeVisible();
  await expect(page.locator("ht-location-tree .tree-item").first()).toBeVisible();
  await expect(page.locator("ht-location-inspector")).toBeVisible();
});

test("live occupancy add-source dialog opens from the simplified inspector shell", async ({ page }) => {
  await openLiveHarness(page);
  await selectLightingLocation(page);

  const inspector = page.locator("ht-location-inspector");
  await openDetectionTab(page);

  await expect(inspector.getByRole("button", { name: "Configure" })).toHaveCount(0);
  await expect(inspector.getByRole("button", { name: "Assign Devices" })).toHaveCount(0);

  const addSourceButton = inspector.getByTestId("open-external-source-dialog");
  await expect(addSourceButton).toBeVisible();
  await addSourceButton.click();

  const dialog = page.getByTestId("external-source-dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("Add Source");
  await expect(dialog.getByTestId("external-source-area-select")).toBeVisible();
  await expect(dialog.getByTestId("external-source-entity-select")).toBeVisible();

  await dialog.getByTestId("close-external-source-dialog").click();
  await expect(dialog).toHaveCount(0);
});

test("live occupancy inspector keeps the hero shell outside the scroll body", async ({ page }) => {
  await openLiveHarness(page);
  await selectLightingLocation(page);
  await openDetectionTab(page);

  const inspector = page.locator("ht-location-inspector");
  const inspectorTop = inspector.locator(".inspector-top");
  const inspectorBody = inspector.locator(".inspector-body");

  await expect(inspectorTop).toBeVisible();
  await expect(inspectorBody).toBeVisible();

  const before = await inspectorTop.boundingBox();
  expect(before).not.toBeNull();

  const bodyMetrics = await inspectorBody.evaluate((element) => {
    const node = element as HTMLElement;
    const overflowY = getComputedStyle(node).overflowY;
    const maxScroll = Math.max(0, node.scrollHeight - node.clientHeight);
    if (maxScroll > 0) {
      node.scrollTop = Math.min(320, maxScroll);
    }
    return {
      overflowY,
      scrollTop: node.scrollTop,
      canScroll: maxScroll > 0,
    };
  });

  expect(bodyMetrics.overflowY).toBe("auto");
  if (bodyMetrics.canScroll) {
    expect(bodyMetrics.scrollTop).toBeGreaterThan(0);
  }

  const after = await inspectorTop.boundingBox();
  expect(after).not.toBeNull();
  expect(Math.abs((after?.y ?? 0) - (before?.y ?? 0))).toBeLessThanOrEqual(1);
});
