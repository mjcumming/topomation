import type { HomeAssistant, Location } from "./types";

export type ActionTriggerType = "occupied" | "vacant";

export interface TopomationActionRule {
  id: string;
  entity_id: string;
  name: string;
  trigger_type: ActionTriggerType;
  action_entity_id?: string;
  action_service?: string;
  enabled: boolean;
}

interface TopomationRuleMetadata {
  version: number;
  location_id: string;
  trigger_type: ActionTriggerType;
}

interface AutomationRegistryEntry {
  entity_id: string;
  unique_id?: string;
  domain?: string;
  platform?: string;
  labels?: string[];
  categories?: Record<string, string>;
}

const TOPOMATION_AUTOMATION_ID_PREFIX = "topomation_";
const TOPOMATION_METADATA_PREFIX = "[topomation]";

const TOPOMATION_LABEL_NAME = "Topomation";
const TOPOMATION_OCCUPIED_LABEL_NAME = "Topomation - On Occupied";
const TOPOMATION_VACANT_LABEL_NAME = "Topomation - On Vacant";
const TOPOMATION_CATEGORY_NAME = "Topomation";

function slugify(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return slug || "location";
}

function automationConfigEndpoint(automationId: string): string {
  return `config/automation/config/${encodeURIComponent(automationId)}`;
}

async function callAutomationConfigApi<T>(
  hass: HomeAssistant,
  method: "post" | "delete",
  automationId: string,
  body?: Record<string, unknown>
): Promise<T> {
  if (typeof hass.callApi === "function") {
    return hass.callApi<T>(method, automationConfigEndpoint(automationId), body);
  }

  const response = await fetch(`/api/${automationConfigEndpoint(automationId)}`, {
    method: method.toUpperCase(),
    credentials: "same-origin",
    headers:
      body !== undefined
        ? {
            "Content-Type": "application/json",
          }
        : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      (payload && typeof payload.message === "string" && payload.message) ||
        `Home Assistant automation API error (${response.status})`
    );
  }
  return payload as T;
}

function parseRuleMetadata(description: unknown): TopomationRuleMetadata | null {
  if (typeof description !== "string" || !description.includes(TOPOMATION_METADATA_PREFIX)) {
    return null;
  }

  const lines = description
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    if (!line.startsWith(TOPOMATION_METADATA_PREFIX)) continue;

    const jsonPayload = line.slice(TOPOMATION_METADATA_PREFIX.length).trim();
    if (!jsonPayload) return null;

    try {
      const parsed = JSON.parse(jsonPayload) as TopomationRuleMetadata;
      if (
        typeof parsed?.location_id === "string" &&
        (parsed?.trigger_type === "occupied" || parsed?.trigger_type === "vacant")
      ) {
        return {
          version: Number(parsed.version) || 1,
          location_id: parsed.location_id,
          trigger_type: parsed.trigger_type,
        };
      }
    } catch {
      return null;
    }
  }

  return null;
}

function metadataLine(metadata: TopomationRuleMetadata): string {
  return `${TOPOMATION_METADATA_PREFIX} ${JSON.stringify(metadata)}`;
}

function extractActionSummary(config: Record<string, any>): {
  action_entity_id?: string;
  action_service?: string;
} {
  const actionBlock = config?.actions ?? config?.action;
  const firstAction = Array.isArray(actionBlock) ? actionBlock[0] : actionBlock;
  if (!firstAction || typeof firstAction !== "object") {
    return {};
  }

  const rawService = typeof firstAction.action === "string" ? firstAction.action : "";
  const actionService = rawService.includes(".") ? rawService.split(".").slice(1).join(".") : rawService;

  const targetEntity = firstAction?.target?.entity_id;
  if (typeof targetEntity === "string") {
    return {
      action_entity_id: targetEntity,
      action_service: actionService || undefined,
    };
  }

  if (Array.isArray(targetEntity) && typeof targetEntity[0] === "string") {
    return {
      action_entity_id: targetEntity[0],
      action_service: actionService || undefined,
    };
  }

  const dataEntity = firstAction?.data?.entity_id;
  if (typeof dataEntity === "string") {
    return {
      action_entity_id: dataEntity,
      action_service: actionService || undefined,
    };
  }

  return {
    action_service: actionService || undefined,
  };
}

function findOccupancyEntityId(hass: HomeAssistant, locationId: string): string | undefined {
  const states = hass.states || {};
  for (const [entityId, stateObj] of Object.entries(states)) {
    if (!entityId.startsWith("binary_sensor.")) continue;
    const attrs = stateObj?.attributes || {};
    if (attrs.device_class !== "occupancy") continue;
    if (attrs.location_id !== locationId) continue;
    return entityId;
  }
  return undefined;
}

async function listAutomationRegistryEntries(
  hass: HomeAssistant
): Promise<AutomationRegistryEntry[]> {
  const entries = await hass.callWS<any[]>({ type: "config/entity_registry/list" });
  if (!Array.isArray(entries)) return [];

  return entries.filter((entry) => {
    if (!entry || typeof entry.entity_id !== "string") return false;
    const domain =
      typeof entry.domain === "string"
        ? entry.domain
        : String(entry.entity_id).split(".", 1)[0];
    return domain === "automation";
  }) as AutomationRegistryEntry[];
}

async function waitForAutomationRegistryEntry(
  hass: HomeAssistant,
  automationId: string,
  maxAttempts = 8,
  waitMs = 200
): Promise<AutomationRegistryEntry | undefined> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const entries = await listAutomationRegistryEntries(hass);
    const entry = entries.find((candidate) => candidate.unique_id === automationId);
    if (entry) {
      return entry;
    }

    await new Promise((resolve) => window.setTimeout(resolve, waitMs));
  }
  return undefined;
}

async function ensureLabelId(hass: HomeAssistant, labelName: string): Promise<string | undefined> {
  const labels = await hass.callWS<any[]>({ type: "config/label_registry/list" });
  const existing = Array.isArray(labels)
    ? labels.find((label) => label?.name === labelName && typeof label?.label_id === "string")
    : undefined;
  if (existing) {
    return existing.label_id;
  }

  try {
    const created = await hass.callWS<any>({
      type: "config/label_registry/create",
      name: labelName,
    });
    if (typeof created?.label_id === "string") {
      return created.label_id;
    }
  } catch (err) {
    console.debug("[ha-automation-rules] failed to create label", labelName, err);
  }

  return undefined;
}

async function ensureAutomationCategoryId(hass: HomeAssistant): Promise<string | undefined> {
  const categories = await hass.callWS<any[]>({
    type: "config/category_registry/list",
    scope: "automation",
  });

  const existing = Array.isArray(categories)
    ? categories.find(
        (category) =>
          category?.name === TOPOMATION_CATEGORY_NAME && typeof category?.category_id === "string"
      )
    : undefined;

  if (existing) {
    return existing.category_id;
  }

  try {
    const created = await hass.callWS<any>({
      type: "config/category_registry/create",
      scope: "automation",
      name: TOPOMATION_CATEGORY_NAME,
      icon: "mdi:home-automation",
    });
    if (typeof created?.category_id === "string") {
      return created.category_id;
    }
  } catch (err) {
    console.debug("[ha-automation-rules] failed to create automation category", err);
  }

  return undefined;
}

async function applyTopomationGrouping(
  hass: HomeAssistant,
  registryEntry: AutomationRegistryEntry,
  triggerType: ActionTriggerType
): Promise<void> {
  if (!registryEntry.entity_id) return;

  const primaryLabelId = await ensureLabelId(hass, TOPOMATION_LABEL_NAME);
  const triggerLabelName =
    triggerType === "occupied"
      ? TOPOMATION_OCCUPIED_LABEL_NAME
      : TOPOMATION_VACANT_LABEL_NAME;
  const triggerLabelId = await ensureLabelId(hass, triggerLabelName);
  const categoryId = await ensureAutomationCategoryId(hass);

  const nextLabels = new Set<string>(Array.isArray(registryEntry.labels) ? registryEntry.labels : []);
  if (primaryLabelId) nextLabels.add(primaryLabelId);
  if (triggerLabelId) nextLabels.add(triggerLabelId);

  const categories = {
    ...(registryEntry.categories || {}),
  } as Record<string, string>;
  if (categoryId) {
    categories.automation = categoryId;
  }

  try {
    await hass.callWS({
      type: "config/entity_registry/update",
      entity_id: registryEntry.entity_id,
      labels: Array.from(nextLabels),
      categories,
    });
  } catch (err) {
    console.debug("[ha-automation-rules] failed to assign labels/category", err);
  }
}

function buildAutomationId(location: Location, triggerType: ActionTriggerType): string {
  const timestamp = Date.now();
  const randomSuffix = Math.floor(Math.random() * 1_000_000)
    .toString(36)
    .padStart(4, "0");
  return `${TOPOMATION_AUTOMATION_ID_PREFIX}${slugify(location.id)}_${triggerType}_${timestamp}_${randomSuffix}`;
}

export async function listTopomationActionRules(
  hass: HomeAssistant,
  locationId: string
): Promise<TopomationActionRule[]> {
  const registryEntries = await listAutomationRegistryEntries(hass);
  const candidates = registryEntries.filter((entry) => {
    const uniqueId = typeof entry.unique_id === "string" ? entry.unique_id : "";
    return uniqueId.startsWith(TOPOMATION_AUTOMATION_ID_PREFIX);
  });

  const loaded = await Promise.all(
    candidates.map(async (entry) => {
      const uniqueId = String(entry.unique_id || "").trim();
      if (!entry.entity_id || !uniqueId) return undefined;

      try {
        const response = await hass.callWS<{ config?: Record<string, any> }>({
          type: "automation/config",
          entity_id: entry.entity_id,
        });

        const config = response?.config;
        if (!config || typeof config !== "object") {
          return undefined;
        }

        const metadata = parseRuleMetadata(config.description);
        if (!metadata || metadata.location_id !== locationId) {
          return undefined;
        }

        const summary = extractActionSummary(config);
        const stateObj = hass.states?.[entry.entity_id];
        const enabled = stateObj ? stateObj.state !== "off" : true;
        const name =
          (typeof config.alias === "string" && config.alias.trim()) ||
          stateObj?.attributes?.friendly_name ||
          entry.entity_id;

        return {
          id: uniqueId,
          entity_id: entry.entity_id,
          name,
          trigger_type: metadata.trigger_type,
          action_entity_id: summary.action_entity_id,
          action_service: summary.action_service,
          enabled,
        } satisfies TopomationActionRule;
      } catch (err) {
        console.debug("[ha-automation-rules] failed to read automation config", entry.entity_id, err);
        return undefined;
      }
    })
  );

  return loaded
    .filter((rule): rule is TopomationActionRule => !!rule)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function createTopomationActionRule(
  hass: HomeAssistant,
  args: {
    location: Location;
    name: string;
    trigger_type: ActionTriggerType;
    action_entity_id: string;
    action_service: string;
  }
): Promise<TopomationActionRule> {
  const occupancyEntityId = findOccupancyEntityId(hass, args.location.id);
  if (!occupancyEntityId) {
    throw new Error(
      `No occupancy binary sensor found for location \"${args.location.name}\" (${args.location.id})`
    );
  }

  const automationId = buildAutomationId(args.location, args.trigger_type);
  const triggerState = args.trigger_type === "occupied" ? "on" : "off";
  const actionDomain = args.action_entity_id.includes(".")
    ? args.action_entity_id.split(".", 1)[0]
    : "homeassistant";

  const metadata: TopomationRuleMetadata = {
    version: 1,
    location_id: args.location.id,
    trigger_type: args.trigger_type,
  };

  await callAutomationConfigApi<{ result: string }>(hass, "post", automationId, {
    alias: args.name,
    description: `Managed by Topomation.\n${metadataLine(metadata)}`,
    triggers: [
      {
        trigger: "state",
        entity_id: occupancyEntityId,
        to: triggerState,
      },
    ],
    conditions: [],
    actions: [
      {
        action: `${actionDomain}.${args.action_service}`,
        target: {
          entity_id: args.action_entity_id,
        },
      },
    ],
    mode: "single",
  });

  const entry = await waitForAutomationRegistryEntry(hass, automationId);
  if (entry) {
    await applyTopomationGrouping(hass, entry, args.trigger_type);
  }

  return {
    id: automationId,
    entity_id: entry?.entity_id || `automation.${automationId}`,
    name: args.name,
    trigger_type: args.trigger_type,
    action_entity_id: args.action_entity_id,
    action_service: args.action_service,
    enabled: true,
  };
}

export async function deleteTopomationActionRule(
  hass: HomeAssistant,
  automationId: string
): Promise<void> {
  await callAutomationConfigApi<{ result: string }>(hass, "delete", automationId);
}

export async function setTopomationActionRuleEnabled(
  hass: HomeAssistant,
  rule: TopomationActionRule,
  enabled: boolean
): Promise<void> {
  await hass.callWS({
    type: "call_service",
    domain: "automation",
    service: enabled ? "turn_on" : "turn_off",
    service_data: {
      entity_id: rule.entity_id,
    },
  });
}

export function ruleEditPath(rule: TopomationActionRule): string {
  return `/config/automation/edit/${encodeURIComponent(rule.id)}`;
}
