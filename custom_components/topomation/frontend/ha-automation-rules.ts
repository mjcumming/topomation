import type { HomeAssistant, Location } from "./types";

export type ActionTriggerType = "occupied" | "vacant";

export interface TopomationActionRule {
  id: string;
  entity_id: string;
  name: string;
  trigger_type: ActionTriggerType;
  action_entity_id?: string;
  action_service?: string;
  require_dark: boolean;
  enabled: boolean;
}

interface TopomationRuleMetadata {
  version: number;
  location_id: string;
  trigger_type: ActionTriggerType;
  require_dark?: boolean;
}

interface AutomationRegistryEntry {
  entity_id: string;
  unique_id?: string;
  domain?: string;
  platform?: string;
  labels?: string[];
  categories?: Record<string, string>;
}

interface AutomationRegistryListResult {
  entries: AutomationRegistryEntry[];
  usedStateFallback: boolean;
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
          require_dark: typeof parsed.require_dark === "boolean" ? parsed.require_dark : undefined,
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

function hasSunDarkCondition(config: Record<string, any>): boolean {
  const root = config?.conditions ?? config?.condition;
  const stack = Array.isArray(root) ? [...root] : root ? [root] : [];

  while (stack.length > 0) {
    const condition = stack.pop();
    if (!condition || typeof condition !== "object") continue;

    if (
      condition.condition === "state" &&
      condition.entity_id === "sun.sun" &&
      condition.state === "below_horizon"
    ) {
      return true;
    }

    const nested = condition.conditions;
    if (Array.isArray(nested)) {
      stack.push(...nested);
    }
  }

  return false;
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
): Promise<AutomationRegistryListResult> {
  try {
    const entries = await hass.callWS<any[]>({ type: "config/entity_registry/list" });
    if (!Array.isArray(entries)) {
      return {
        entries: [],
        usedStateFallback: false,
      };
    }

    return {
      entries: entries.filter((entry) => {
        if (!entry || typeof entry.entity_id !== "string") return false;
        const domain =
          typeof entry.domain === "string"
            ? entry.domain
            : String(entry.entity_id).split(".", 1)[0];
        return domain === "automation";
      }) as AutomationRegistryEntry[],
      usedStateFallback: false,
    };
  } catch (err) {
    // Some installs/users cannot access entity registry commands from custom panels.
    // Fall back to automation entities currently in hass.states so managed actions still work.
    console.debug("[ha-automation-rules] entity_registry list unavailable; falling back to hass.states", err);
    return {
      entries: Object.keys(hass.states || {})
        .filter((entityId) => entityId.startsWith("automation."))
        .map((entity_id) => ({ entity_id })),
      usedStateFallback: true,
    };
  }
}

async function waitForAutomationRegistryEntry(
  hass: HomeAssistant,
  automationId: string,
  maxAttempts = 20,
  waitMs = 250
): Promise<AutomationRegistryEntry | undefined> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const registryResult = await listAutomationRegistryEntries(hass);
    const entries = registryResult.entries;
    const entry = entries.find((candidate) => candidate.unique_id === automationId);
    if (entry) {
      return entry;
    }

    if (attempt === maxAttempts - 1) {
      const resolved = await findAutomationRegistryEntryByConfigId(hass, entries, automationId);
      if (resolved) {
        return resolved;
      }
    }

    await new Promise((resolve) => window.setTimeout(resolve, waitMs));
  }
  return undefined;
}

function resolveAutomationConfigId(
  entry: AutomationRegistryEntry,
  config: Record<string, any>
): string | undefined {
  const configId = typeof config?.id === "string" ? config.id.trim() : "";
  if (configId) return configId;

  const uniqueId = typeof entry.unique_id === "string" ? entry.unique_id.trim() : "";
  if (uniqueId) return uniqueId;

  return undefined;
}

function looksLikeTopomationAutomationEntry(entry: AutomationRegistryEntry): boolean {
  const uniqueId = typeof entry.unique_id === "string" ? entry.unique_id.trim().toLowerCase() : "";
  if (uniqueId.startsWith(TOPOMATION_AUTOMATION_ID_PREFIX)) {
    return true;
  }

  const labels = Array.isArray(entry.labels) ? entry.labels : [];
  if (
    labels.some(
      (label) =>
        typeof label === "string" &&
        label.toLowerCase().includes("topomation")
    )
  ) {
    return true;
  }

  const categoryValues = Object.values(entry.categories || {});
  if (
    categoryValues.some(
      (value) =>
        typeof value === "string" &&
        value.toLowerCase().includes("topomation")
    )
  ) {
    return true;
  }

  return false;
}

function hasTopomationAutomationState(hass: HomeAssistant): boolean {
  return Object.entries(hass.states || {}).some(([entityId, stateObj]) => {
    if (!entityId.startsWith("automation.")) return false;
    const rawId = stateObj?.attributes?.id;
    return (
      typeof rawId === "string" &&
      rawId.trim().toLowerCase().startsWith(TOPOMATION_AUTOMATION_ID_PREFIX)
    );
  });
}

function readErrorMessage(err: unknown): string {
  if (typeof err === "string" && err.trim()) return err.trim();
  if (err instanceof Error && err.message.trim()) return err.message.trim();
  if (err && typeof err === "object" && "message" in err) {
    const maybeMessage = (err as { message?: unknown }).message;
    if (typeof maybeMessage === "string" && maybeMessage.trim()) {
      return maybeMessage.trim();
    }
  }
  return "unknown automation/config error";
}

async function findAutomationRegistryEntryByConfigId(
  hass: HomeAssistant,
  entries: AutomationRegistryEntry[],
  automationId: string
): Promise<AutomationRegistryEntry | undefined> {
  const normalizedId = String(automationId || "").trim();
  if (!normalizedId) return undefined;

  const loaded = await Promise.all(
    entries
      .filter((entry) => typeof entry.entity_id === "string" && entry.entity_id.length > 0)
      .map(async (entry) => {
        try {
          const response = await hass.callWS<{ config?: Record<string, any> }>({
            type: "automation/config",
            entity_id: entry.entity_id,
          });
          const config = response?.config;
          if (!config || typeof config !== "object") {
            return undefined;
          }

          const configId = resolveAutomationConfigId(entry, config);
          if (configId !== normalizedId) {
            return undefined;
          }
          return entry;
        } catch {
          return undefined;
        }
      })
  );

  return loaded.find((entry): entry is AutomationRegistryEntry => !!entry);
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
  const registryResult = await listAutomationRegistryEntries(hass);
  const registryEntries = registryResult.entries;
  const likelyTopomationEntries = registryEntries.filter(looksLikeTopomationAutomationEntry);
  const candidates =
    likelyTopomationEntries.length > 0 ? likelyTopomationEntries : registryEntries;
  const failedAutomationConfigReads: Array<{ entity_id: string; error: unknown }> = [];

  const loaded = await Promise.all(
    candidates.map(async (entry) => {
      if (!entry.entity_id) return undefined;

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

        const configId = resolveAutomationConfigId(entry, config);
        const summary = extractActionSummary(config);
        const stateObj = hass.states?.[entry.entity_id];
        const enabled = stateObj ? stateObj.state !== "off" : true;
        const name =
          (typeof config.alias === "string" && config.alias.trim()) ||
          stateObj?.attributes?.friendly_name ||
          entry.entity_id;

        return {
          id: configId || entry.entity_id,
          entity_id: entry.entity_id,
          name,
          trigger_type: metadata.trigger_type,
          action_entity_id: summary.action_entity_id,
          action_service: summary.action_service,
          require_dark:
            typeof metadata.require_dark === "boolean"
              ? metadata.require_dark
              : hasSunDarkCondition(config),
          enabled,
        } satisfies TopomationActionRule;
      } catch (err) {
        failedAutomationConfigReads.push({
          entity_id: entry.entity_id,
          error: err,
        });
        console.debug("[ha-automation-rules] failed to read automation config", entry.entity_id, err);
        return undefined;
      }
    })
  );

  const resolvedRules = loaded
    .filter((rule): rule is TopomationActionRule => !!rule)
    .sort((a, b) => a.name.localeCompare(b.name));

  const allCandidateReadsFailed =
    candidates.length > 0 &&
    failedAutomationConfigReads.length === candidates.length;
  const hasTopomationHint =
    likelyTopomationEntries.length > 0 || hasTopomationAutomationState(hass);

  if (
    resolvedRules.length === 0 &&
    allCandidateReadsFailed &&
    hasTopomationHint
  ) {
    const firstFailure = failedAutomationConfigReads[0];
    const reason = firstFailure ? readErrorMessage(firstFailure.error) : "unknown reason";
    throw new Error(`Unable to read Topomation automation configs: ${reason}`);
  }

  return resolvedRules;
}

export async function createTopomationActionRule(
  hass: HomeAssistant,
  args: {
    location: Location;
    name: string;
    trigger_type: ActionTriggerType;
    action_entity_id: string;
    action_service: string;
    require_dark?: boolean;
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
    version: 2,
    location_id: args.location.id,
    trigger_type: args.trigger_type,
    require_dark: Boolean(args.require_dark),
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
    conditions: args.require_dark
      ? [
          {
            condition: "state",
            entity_id: "sun.sun",
            state: "below_horizon",
          },
        ]
      : [],
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
    require_dark: Boolean(args.require_dark),
    enabled: true,
  };
}

export async function deleteTopomationActionRule(
  hass: HomeAssistant,
  ruleOrAutomationId: string | Pick<TopomationActionRule, "id" | "entity_id">
): Promise<void> {
  const automationId =
    typeof ruleOrAutomationId === "string" ? ruleOrAutomationId : ruleOrAutomationId.id;
  try {
    await callAutomationConfigApi<{ result: string }>(hass, "delete", automationId);
    return;
  } catch (err) {
    if (typeof ruleOrAutomationId === "string") {
      throw err;
    }

    try {
      const response = await hass.callWS<{ config?: Record<string, any> }>({
        type: "automation/config",
        entity_id: ruleOrAutomationId.entity_id,
      });
      const config = response?.config;
      if (!config || typeof config !== "object") {
        throw err;
      }
      const fallbackId = resolveAutomationConfigId(
        {
          entity_id: ruleOrAutomationId.entity_id,
        },
        config
      );
      if (!fallbackId || fallbackId === automationId) {
        throw err;
      }

      await callAutomationConfigApi<{ result: string }>(hass, "delete", fallbackId);
    } catch {
      throw err;
    }
  }
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
