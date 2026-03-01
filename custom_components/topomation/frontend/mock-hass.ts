// @ts-nocheck
import type { HomeAssistant, Location } from "./types";

type MockArea = { area_id: string; name: string; icon?: string; floor_id?: string | null };

export const MOCK_AREAS: Record<string, MockArea> = {
  kitchen: {
    area_id: "kitchen",
    name: "Kitchen",
    icon: "mdi:silverware-fork-knife",
    floor_id: "main_floor",
  },
  living_room: { area_id: "living_room", name: "Living Room", icon: "mdi:sofa", floor_id: "main_floor" },
  bathroom: { area_id: "bathroom", name: "Bathroom", icon: "mdi:shower", floor_id: "main_floor" },
  primary_bedroom: {
    area_id: "primary_bedroom",
    name: "Primary Bedroom",
    icon: "mdi:bed",
    floor_id: "second_floor",
  },
  guest_bedroom: {
    area_id: "guest_bedroom",
    name: "Guest Bedroom",
    icon: "mdi:bed",
    floor_id: "second_floor",
  },
  garage: { area_id: "garage", name: "Garage", icon: "mdi:garage", floor_id: "basement" },
  patio: { area_id: "patio", name: "Patio", icon: "mdi:patio-heater", floor_id: null },
  driveway: { area_id: "driveway", name: "Driveway", icon: "mdi:road-variant", floor_id: null },
};

export const MOCK_FLOORS: Record<string, { floor_id: string; name: string; icon?: string }> = {
  main_floor: { floor_id: "main_floor", name: "Main Floor", icon: "mdi:layers" },
  second_floor: { floor_id: "second_floor", name: "Second Floor", icon: "mdi:layers" },
  basement: { floor_id: "basement", name: "Basement", icon: "mdi:layers" },
};

export const MOCK_LOCATIONS: Location[] = [
  // Integration-owned roots for multi-structure properties.
  {
    id: "main-building",
    name: "Main Building",
    parent_id: null,
    is_explicit_root: false,
    origin: "integration",
    entity_ids: ["alarm_control_panel.main_house"],
    modules: { _meta: { type: "building" } },
  },
  {
    id: "grounds",
    name: "Grounds",
    parent_id: null,
    is_explicit_root: false,
    origin: "integration",
    entity_ids: [],
    modules: { _meta: { type: "grounds" } },
  },
  // Floors under building wrapper.
  {
    id: "main-floor",
    name: "Main Floor",
    parent_id: "main-building",
    is_explicit_root: false,
    ha_floor_id: "main_floor",
    origin: "integration",
    entity_ids: [],
    modules: { _meta: { type: "floor" } },
  },
  {
    id: "second-floor",
    name: "Second Floor",
    parent_id: "main-building",
    is_explicit_root: false,
    ha_floor_id: "second_floor",
    origin: "integration",
    entity_ids: [],
    modules: { _meta: { type: "floor" } },
  },
  {
    id: "basement",
    name: "Basement",
    parent_id: "main-building",
    is_explicit_root: false,
    ha_floor_id: "basement",
    origin: "integration",
    entity_ids: [],
    modules: { _meta: { type: "floor" } },
  },
  // HA-imported Areas
  {
    id: "kitchen",
    name: "Kitchen",
    parent_id: "main-floor",
    is_explicit_root: false,
    ha_area_id: "kitchen",
    origin: "ha",
    entity_ids: [
      "light.kitchen_main",
      "binary_sensor.kitchen_motion",
      "binary_sensor.kitchen_door",
      "media_player.kitchen_speaker",
    ],
    modules: {
      _meta: { type: "area", category: "kitchen", ha_floor_id: "main_floor" },
      occupancy: { enabled: true, default_timeout: 300 },
    },
  },
  {
    id: "living-room",
    name: "Living Room",
    parent_id: "main-floor",
    is_explicit_root: false,
    ha_area_id: "living_room",
    origin: "ha",
    entity_ids: [
      "light.living_room",
      "media_player.tv",
      "binary_sensor.living_room_presence",
      "device_tracker.alex_phone",
    ],
    modules: {
      _meta: { type: "area", category: "living", ha_floor_id: "main_floor" },
      occupancy: { enabled: true, default_timeout: 600 },
    },
  },
  {
    id: "bathroom",
    name: "Bathroom",
    parent_id: "main-floor",
    is_explicit_root: false,
    ha_area_id: "bathroom",
    origin: "ha",
    entity_ids: [
      "fan.bathroom_exhaust",
      "light.bathroom_main",
    ],
    modules: {
      _meta: { type: "area", category: "bathroom", ha_floor_id: "main_floor" },
      occupancy: { enabled: true, default_timeout: 300 },
    },
  },
  {
    id: "primary-bedroom",
    name: "Primary Bedroom",
    parent_id: "second-floor",
    is_explicit_root: false,
    ha_area_id: "primary_bedroom",
    origin: "ha",
    entity_ids: ["binary_sensor.bedroom_motion"],
    modules: {
      _meta: { type: "area", category: "bedroom", ha_floor_id: "second_floor" },
      occupancy: { enabled: true, default_timeout: 600 },
    },
  },
  {
    id: "garage",
    name: "Garage",
    parent_id: "basement",
    is_explicit_root: false,
    ha_area_id: "garage",
    origin: "ha",
    entity_ids: ["binary_sensor.garage_motion"],
    modules: {
      _meta: { type: "area", category: "garage", ha_floor_id: "basement" },
      occupancy: { enabled: true, default_timeout: 300 },
    },
  },
  {
    id: "patio",
    name: "Patio",
    parent_id: "grounds",
    is_explicit_root: false,
    ha_area_id: "patio",
    origin: "ha",
    entity_ids: ["light.patio_string"],
    modules: {
      _meta: { type: "area", category: "outdoor" },
      occupancy: { enabled: true, default_timeout: 300 },
    },
  },
  {
    id: "driveway",
    name: "Driveway",
    parent_id: "grounds",
    is_explicit_root: false,
    ha_area_id: "driveway",
    origin: "ha",
    entity_ids: ["binary_sensor.driveway_motion"],
    modules: {
      _meta: { type: "area", category: "outdoor" },
      occupancy: { enabled: true, default_timeout: 120 },
    },
  },
  // Deep nesting under an HA-backed area.
  {
    id: "pantry",
    name: "Pantry",
    parent_id: "kitchen",
    is_explicit_root: false,
    origin: "integration",
    entity_ids: [
      "binary_sensor.pantry_motion",
      "binary_sensor.pantry_door",
      "light.pantry_light",
      "sensor.pantry_temperature",
    ],
    modules: { _meta: { type: "subarea" } },
  },
  {
    id: "pantry-shelf",
    name: "Pantry Shelf",
    parent_id: "pantry",
    is_explicit_root: false,
    origin: "integration",
    entity_ids: [],
    modules: { _meta: { type: "subarea" } },
  },
  {
    id: "pantry-shelf-top",
    name: "Top Shelf",
    parent_id: "pantry-shelf",
    is_explicit_root: false,
    origin: "integration",
    entity_ids: [],
    modules: { _meta: { type: "subarea" } },
  },
];

export const MOCK_STATES: Record<string, any> = {
  "light.kitchen_main": {
    entity_id: "light.kitchen_main",
    state: "on",
    attributes: {
      friendly_name: "Kitchen Main Light",
      area_id: "kitchen",
      brightness: 170,
      rgb_color: [255, 180, 120],
      supported_color_modes: ["rgb", "brightness"],
    },
  },
  "light.living_room": {
    entity_id: "light.living_room",
    state: "off",
    attributes: { friendly_name: "Living Room Light", area_id: "living_room" },
  },
  "binary_sensor.kitchen_motion": {
    entity_id: "binary_sensor.kitchen_motion",
    state: "off",
    attributes: { friendly_name: "Kitchen Motion", device_class: "motion", area_id: "kitchen" },
  },
  "binary_sensor.kitchen_door": {
    entity_id: "binary_sensor.kitchen_door",
    state: "off",
    attributes: { friendly_name: "Kitchen Door", device_class: "door", area_id: "kitchen" },
  },
  "media_player.kitchen_speaker": {
    entity_id: "media_player.kitchen_speaker",
    state: "paused",
    attributes: {
      friendly_name: "Kitchen Speaker",
      volume_level: 0.2,
      is_volume_muted: false,
      area_id: "kitchen",
    },
  },
  "media_player.tv": {
    entity_id: "media_player.tv",
    state: "paused",
    attributes: {
      friendly_name: "Living Room TV",
      volume_level: 0.35,
      is_volume_muted: false,
      area_id: "living_room",
    },
  },
  "fan.bathroom_exhaust": {
    entity_id: "fan.bathroom_exhaust",
    state: "off",
    attributes: {
      friendly_name: "Bathroom Exhaust Fan",
      area_id: "bathroom",
    },
  },
  "light.bathroom_main": {
    entity_id: "light.bathroom_main",
    state: "off",
    attributes: {
      friendly_name: "Bathroom Main Light",
      area_id: "bathroom",
    },
  },
  "binary_sensor.living_room_presence": {
    entity_id: "binary_sensor.living_room_presence",
    state: "off",
    attributes: {
      friendly_name: "Living Room Presence",
      device_class: "presence",
      area_id: "living_room",
    },
  },
  "device_tracker.alex_phone": {
    entity_id: "device_tracker.alex_phone",
    state: "home",
    attributes: {
      friendly_name: "Alex Phone",
      source_type: "router",
      area_id: "living_room",
    },
  },
  "alarm_control_panel.main_house": {
    entity_id: "alarm_control_panel.main_house",
    state: "disarmed",
    attributes: {
      friendly_name: "Main House Security",
      supported_features: 0,
    },
  },
  "binary_sensor.pantry_motion": {
    entity_id: "binary_sensor.pantry_motion",
    state: "off",
    attributes: {
      friendly_name: "Pantry Motion",
      device_class: "motion",
      area_id: "pantry",
    },
  },
  "binary_sensor.pantry_door": {
    entity_id: "binary_sensor.pantry_door",
    state: "off",
    attributes: {
      friendly_name: "Pantry Door",
      device_class: "door",
      area_id: "pantry",
    },
  },
  "light.pantry_light": {
    entity_id: "light.pantry_light",
    state: "off",
    attributes: {
      friendly_name: "Pantry Light",
      area_id: "pantry",
    },
  },
  "sensor.pantry_temperature": {
    entity_id: "sensor.pantry_temperature",
    state: "68",
    attributes: {
      friendly_name: "Pantry Temperature",
      unit_of_measurement: "°F",
      device_class: "temperature",
      area_id: "pantry",
    },
  },
  "binary_sensor.garage_motion": {
    entity_id: "binary_sensor.garage_motion",
    state: "off",
    attributes: {
      friendly_name: "Garage Motion",
      device_class: "motion",
      area_id: "garage",
    },
  },
  "binary_sensor.bedroom_motion": {
    entity_id: "binary_sensor.bedroom_motion",
    state: "off",
    attributes: {
      friendly_name: "Primary Bedroom Motion",
      device_class: "motion",
      area_id: "primary_bedroom",
    },
  },
  "binary_sensor.driveway_motion": {
    entity_id: "binary_sensor.driveway_motion",
    state: "off",
    attributes: {
      friendly_name: "Driveway Motion",
      device_class: "motion",
      area_id: "driveway",
    },
  },
  "light.patio_string": {
    entity_id: "light.patio_string",
    state: "off",
    attributes: {
      friendly_name: "Patio String Lights",
      area_id: "patio",
      brightness: 200,
      supported_color_modes: ["brightness"],
    },
  },
  "binary_sensor.main_floor_occupancy": {
    entity_id: "binary_sensor.main_floor_occupancy",
    state: "off",
    attributes: {
      friendly_name: "Main Floor Occupancy",
      device_class: "occupancy",
      location_id: "main-floor",
    },
  },
  "binary_sensor.kitchen_occupancy": {
    entity_id: "binary_sensor.kitchen_occupancy",
    state: "off",
    attributes: {
      friendly_name: "Kitchen Occupancy",
      device_class: "occupancy",
      location_id: "kitchen",
    },
  },
  "binary_sensor.living_room_occupancy": {
    entity_id: "binary_sensor.living_room_occupancy",
    state: "off",
    attributes: {
      friendly_name: "Living Room Occupancy",
      device_class: "occupancy",
      location_id: "living-room",
    },
  },
};

export class MockConnection {
  private _listeners: Map<string, Set<any>> = new Map();
  subscribeEvents(callback: any, eventType?: string): () => void {
    const type = eventType || "*";
    if (!this._listeners.has(type)) this._listeners.set(type, new Set());
    this._listeners.get(type)!.add(callback);
    return () => this._listeners.get(type)?.delete(callback);
  }
  fireEvent(eventType: string, data: any): void {
    const event = { event_type: eventType, data, time_fired: new Date().toISOString() };
    this._listeners.get(eventType)?.forEach((cb) => cb(event));
    this._listeners.get("*")?.forEach((cb) => cb(event));
  }
}

function cloneLocation(loc: Location): Location {
  return {
    ...loc,
    entity_ids: [...(loc.entity_ids || [])],
    modules: JSON.parse(JSON.stringify(loc.modules || {})),
  };
}

function slugify(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return slug || "item";
}

const TOPOMATION_METADATA_PREFIX = "[topomation]";
const TOPOMATION_AUTOMATION_ID_PREFIX = "topomation_";

function parseTopomationMetadata(
  description: unknown
): { location_id: string; trigger_type: "occupied" | "vacant"; require_dark?: boolean } | null {
  if (typeof description !== "string" || !description.includes(TOPOMATION_METADATA_PREFIX)) {
    return null;
  }

  for (const line of description.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith(TOPOMATION_METADATA_PREFIX)) continue;
    const payload = trimmed.slice(TOPOMATION_METADATA_PREFIX.length).trim();
    if (!payload) return null;

    try {
      const parsed = JSON.parse(payload) as {
        location_id?: unknown;
        trigger_type?: unknown;
        require_dark?: unknown;
      };
      if (
        typeof parsed.location_id === "string" &&
        (parsed.trigger_type === "occupied" || parsed.trigger_type === "vacant")
      ) {
        return {
          location_id: parsed.location_id,
          trigger_type: parsed.trigger_type,
          require_dark:
            typeof parsed.require_dark === "boolean" ? parsed.require_dark : undefined,
        };
      }
    } catch {
      return null;
    }
  }

  return null;
}

function extractActionSummary(config: Record<string, any>): {
  action_entity_id?: string;
  action_service?: string;
} {
  const actionBlock = config?.actions ?? config?.action;
  const firstAction = Array.isArray(actionBlock) ? actionBlock[0] : actionBlock;
  if (!firstAction || typeof firstAction !== "object") return {};

  const rawService = typeof firstAction.action === "string" ? firstAction.action : "";
  const actionService = rawService.includes(".") ? rawService.split(".").slice(1).join(".") : rawService;
  const targetEntityId = firstAction?.target?.entity_id;
  if (typeof targetEntityId === "string") {
    return {
      action_entity_id: targetEntityId,
      action_service: actionService || undefined,
    };
  }
  return { action_service: actionService || undefined };
}

function hasDarkCondition(config: Record<string, any>): boolean {
  const conditions = config?.conditions ?? config?.condition;
  const stack = Array.isArray(conditions) ? [...conditions] : conditions ? [conditions] : [];
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
    if (Array.isArray(condition.conditions)) {
      stack.push(...condition.conditions);
    }
  }
  return false;
}

type EventualConsistencyOptions = {
  list_stale_reads_after_module_config?: number;
  apply_delay_ms?: number;
  emit_apply_event?: boolean;
};

type PersistedAutomationEntry = {
  entity_id: string;
  unique_id: string;
  domain: string;
  platform: string;
  labels: string[];
  categories: Record<string, string>;
};

type PersistedMockSnapshot = {
  locations?: Location[];
  automation_configs?: Record<string, Record<string, any>>;
  automation_entries?: PersistedAutomationEntry[];
};

function cloneLocations(list: Location[]): Location[] {
  return list.map((loc) => cloneLocation(loc));
}

export function createMockHass(options: any = {}): any {
  const connection = new MockConnection();
  const persistenceKey =
    typeof options.persistence_key === "string" ? options.persistence_key.trim() : "";
  const persistenceAvailable =
    persistenceKey.length > 0 &&
    typeof window !== "undefined" &&
    !!window.localStorage;

  let persistedSnapshot: PersistedMockSnapshot | undefined;
  if (persistenceAvailable) {
    try {
      const raw = window.localStorage.getItem(persistenceKey);
      if (raw) persistedSnapshot = JSON.parse(raw);
    } catch (err) {
      console.warn("[MockHass] Failed to load persisted snapshot", err);
    }
  }

  const initialLocations =
    Array.isArray(persistedSnapshot?.locations) && persistedSnapshot!.locations.length > 0
      ? persistedSnapshot!.locations
      : options.locations || MOCK_LOCATIONS;
  let locations = cloneLocations(initialLocations);
  let states = { ...(options.states || MOCK_STATES) };
  let areas: Record<string, MockArea> = { ...(options.areas || MOCK_AREAS) };
  let currentTheme = options.theme || "light";
  const eventualConsistency: EventualConsistencyOptions = {
    list_stale_reads_after_module_config: Number(
      options?.eventual_consistency?.list_stale_reads_after_module_config ?? 0
    ),
    apply_delay_ms: Number(options?.eventual_consistency?.apply_delay_ms ?? 0),
    emit_apply_event: Boolean(options?.eventual_consistency?.emit_apply_event),
  };
  let pendingModuleConfigApply:
    | {
        nextLocations: Location[];
        staleReadsRemaining: number;
        applyAt: number;
        emitApplyEvent: boolean;
      }
    | undefined;
  const config = {
    location_name: "Demo Property",
    latitude: 47.6062,
    longitude: -122.3321,
    time_zone: "America/Los_Angeles",
    country: "US",
    ...(options.config || {}),
  };

  const labelRegistry: Array<{ label_id: string; name: string; icon?: string }> = [];
  const categoryRegistry: Record<string, Array<{ category_id: string; name: string; icon?: string }>> = {
    automation: [],
  };
  const persistedAutomationConfigs =
    persistedSnapshot?.automation_configs &&
    typeof persistedSnapshot.automation_configs === "object"
      ? persistedSnapshot.automation_configs
      : {};
  const automationConfigsById: Record<string, Record<string, any>> = {
    ...persistedAutomationConfigs,
    ...(options.automation_configs || {}),
  };
  const automationEntryByConfigId = new Map<
    string,
    {
      entity_id: string;
      unique_id: string;
      domain: string;
      platform: string;
      labels: string[];
      categories: Record<string, string>;
    }
  >();
  const persistedAutomationEntries = Array.isArray(persistedSnapshot?.automation_entries)
    ? persistedSnapshot.automation_entries
    : [];
  for (const entry of persistedAutomationEntries) {
    if (
      !entry ||
      typeof entry.unique_id !== "string" ||
      typeof entry.entity_id !== "string"
    ) {
      continue;
    }
    automationEntryByConfigId.set(entry.unique_id, {
      entity_id: entry.entity_id,
      unique_id: entry.unique_id,
      domain: entry.domain || "automation",
      platform: entry.platform || "automation",
      labels: Array.isArray(entry.labels) ? [...entry.labels] : [],
      categories:
        entry.categories && typeof entry.categories === "object"
          ? { ...entry.categories }
          : {},
    });
  }
  if (automationEntryByConfigId.size > 0) {
    const nextStates = { ...states };
    for (const entry of automationEntryByConfigId.values()) {
      if (nextStates[entry.entity_id]) continue;
      nextStates[entry.entity_id] = {
        entity_id: entry.entity_id,
        state: "on",
        attributes: {
          friendly_name:
            automationConfigsById[entry.unique_id]?.alias || entry.unique_id,
        },
      };
    }
    states = nextStates;
  }

  const findAutomationEntryByEntityId = (entityId: string) => {
    for (const entry of automationEntryByConfigId.values()) {
      if (entry.entity_id === entityId) return entry;
    }
    return undefined;
  };

  const findAutomationConfigIdByEntityId = (entityId: string) => {
    for (const [configId, entry] of automationEntryByConfigId.entries()) {
      if (entry.entity_id === entityId) return configId;
    }
    return undefined;
  };

  const listManagedActionRules = (locationId: string) =>
    Array.from(automationEntryByConfigId.entries())
      .map(([configId, entry]) => {
        const config = automationConfigsById[configId];
        if (!config || typeof config !== "object") return undefined;

        const metadata = parseTopomationMetadata(config.description);
        if (!metadata || metadata.location_id !== locationId) return undefined;

        const summary = extractActionSummary(config);
        const stateObj = states[entry.entity_id];
        const enabled = stateObj ? stateObj.state !== "off" : true;

        return {
          id: configId,
          entity_id: entry.entity_id,
          name: String(config.alias || entry.entity_id),
          trigger_type: metadata.trigger_type,
          action_entity_id: summary.action_entity_id,
          action_service: summary.action_service,
          require_dark:
            typeof metadata.require_dark === "boolean"
              ? metadata.require_dark
              : hasDarkCondition(config),
          enabled,
        };
      })
      .filter(Boolean)
      .sort((left, right) =>
        String(left?.name || "").localeCompare(String(right?.name || ""))
      ) as Array<Record<string, any>>;

  const persistSnapshot = () => {
    if (!persistenceAvailable) return;
    try {
      const snapshot: PersistedMockSnapshot = {
        locations: cloneLocations(locations),
        automation_configs: JSON.parse(JSON.stringify(automationConfigsById)),
        automation_entries: Array.from(automationEntryByConfigId.values()).map((entry) => ({
          entity_id: entry.entity_id,
          unique_id: entry.unique_id,
          domain: entry.domain,
          platform: entry.platform,
          labels: [...entry.labels],
          categories: { ...entry.categories },
        })),
      };
      window.localStorage.setItem(persistenceKey, JSON.stringify(snapshot));
    } catch (err) {
      console.warn("[MockHass] Failed to persist snapshot", err);
    }
  };

  const applyPendingModuleConfigIfReady = (consumeRead = false): boolean => {
    if (!pendingModuleConfigApply) return false;

    const now = Date.now();
    if (now < pendingModuleConfigApply.applyAt) {
      return false;
    }

    if (consumeRead && pendingModuleConfigApply.staleReadsRemaining > 0) {
      pendingModuleConfigApply.staleReadsRemaining -= 1;
      return false;
    }

    locations = cloneLocations(pendingModuleConfigApply.nextLocations);
    const emitApplyEvent = pendingModuleConfigApply.emitApplyEvent;
    pendingModuleConfigApply = undefined;
    persistSnapshot();
    if (emitApplyEvent) {
      connection.fireEvent("topomation_updated", { reason: "module_config_consistent" });
    }
    return true;
  };

  const flushPendingModuleConfig = () => {
    applyPendingModuleConfigIfReady(false);
  };

  if (persistenceAvailable && !persistedSnapshot?.locations) {
    persistSnapshot();
  }

  const callWS = async (request: any): Promise<any> => {
    if (request.type === "topomation/locations/list") {
      applyPendingModuleConfigIfReady(true);
      return { locations: cloneLocations(locations) };
    }
    flushPendingModuleConfig();
    if (request.type === "topomation/actions/rules/list") {
      const locationId = String(request.location_id || "").trim();
      if (!locationId) {
        throw new Error("invalid_payload: location_id is required");
      }
      return { rules: listManagedActionRules(locationId) };
    }
    if (request.type === "topomation/actions/rules/create") {
      const locationId = String(request.location_id || "").trim();
      const triggerType = request.trigger_type === "vacant" ? "vacant" : "occupied";
      const actionEntityId = String(request.action_entity_id || "").trim();
      const actionService = String(request.action_service || "").trim() || "turn_off";
      const alias = String(request.name || "Topomation managed rule").trim() || "Topomation managed rule";
      if (!locationId || !actionEntityId) {
        throw new Error("invalid_payload: location_id and action_entity_id are required");
      }

      const occupancyEntityId = Object.keys(states).find((entityId) => {
        if (!entityId.startsWith("binary_sensor.")) return false;
        const attrs = states[entityId]?.attributes || {};
        return attrs.device_class === "occupancy" && attrs.location_id === locationId;
      });
      if (!occupancyEntityId) {
        throw new Error(`No occupancy binary sensor found for location '${locationId}'`);
      }

      const random = Math.floor(Math.random() * 1_000_000)
        .toString(36)
        .padStart(4, "0");
      const configId = `${TOPOMATION_AUTOMATION_ID_PREFIX}${slugify(locationId)}_${triggerType}_${Date.now()}_${random}`;
      const requireDark = Boolean(request.require_dark);
      const actionDomain = actionEntityId.includes(".") ? actionEntityId.split(".", 1)[0] : "homeassistant";
      const triggerState = triggerType === "occupied" ? "on" : "off";

      const configPayload = {
        id: configId,
        alias,
        description:
          "Managed by Topomation.\n" +
          `${TOPOMATION_METADATA_PREFIX} ${JSON.stringify({
            version: 2,
            location_id: locationId,
            trigger_type: triggerType,
            require_dark: requireDark,
          })}`,
        triggers: [
          {
            trigger: "state",
            entity_id: occupancyEntityId,
            to: triggerState,
          },
        ],
        conditions: requireDark
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
            action: `${actionDomain}.${actionService}`,
            target: {
              entity_id: actionEntityId,
            },
          },
        ],
        mode: "single",
      };
      automationConfigsById[configId] = configPayload;

      const entry = {
        entity_id: `automation.${slugify(alias)}`,
        unique_id: configId,
        domain: "automation",
        platform: "automation",
        labels: [],
        categories: {},
      };
      automationEntryByConfigId.set(configId, entry);
      states = {
        ...states,
        [entry.entity_id]: {
          entity_id: entry.entity_id,
          state: "on",
          attributes: {
            friendly_name: alias,
            id: configId,
          },
        },
      };
      connection.fireEvent("state_changed", {
        entity_id: entry.entity_id,
        new_state: states[entry.entity_id],
      });
      persistSnapshot();

      return {
        rule: {
          id: configId,
          entity_id: entry.entity_id,
          name: alias,
          trigger_type: triggerType,
          action_entity_id: actionEntityId,
          action_service: actionService,
          require_dark: requireDark,
          enabled: true,
        },
      };
    }
    if (request.type === "topomation/actions/rules/delete") {
      const automationId = String(request.automation_id || "").trim();
      const entityId = String(request.entity_id || "").trim();
      const configId = automationId || (entityId ? findAutomationConfigIdByEntityId(entityId) : undefined);
      if (!configId) {
        throw new Error("invalid_payload: automation_id or entity_id is required");
      }

      const entry = automationEntryByConfigId.get(configId);
      delete automationConfigsById[configId];
      automationEntryByConfigId.delete(configId);
      if (entry) {
        const nextStates = { ...states };
        delete nextStates[entry.entity_id];
        states = nextStates;
        connection.fireEvent("state_changed", {
          entity_id: entry.entity_id,
          new_state: null,
        });
      }
      persistSnapshot();
      return { success: true };
    }
    if (request.type === "topomation/actions/rules/set_enabled") {
      const entityId = String(request.entity_id || "").trim();
      if (!entityId || !states[entityId]) {
        throw new Error(`Entity not found: ${entityId}`);
      }
      states = {
        ...states,
        [entityId]: {
          ...states[entityId],
          state: request.enabled ? "on" : "off",
        },
      };
      connection.fireEvent("state_changed", {
        entity_id: entityId,
        new_state: states[entityId],
      });
      persistSnapshot();
      return { success: true };
    }
    if (request.type === "config/entity_registry/list") {
      const stateEntries = Object.keys(states).map((entityId) => ({
        entity_id: entityId,
        area_id: states[entityId]?.attributes?.area_id ?? null,
        device_id: null,
      }));
      const automationEntries = Array.from(automationEntryByConfigId.values()).map((entry) => ({
        entity_id: entry.entity_id,
        unique_id: entry.unique_id,
        domain: "automation",
        platform: "automation",
        area_id: null,
        device_id: null,
        labels: [...entry.labels],
        categories: { ...entry.categories },
      }));
      return [...stateEntries, ...automationEntries];
    }
    if (request.type === "config/device_registry/list") {
      return [];
    }
    if (request.type === "automation/config") {
      const entry = findAutomationEntryByEntityId(String(request.entity_id || ""));
      if (!entry) {
        throw new Error(`Automation entity not found: ${request.entity_id}`);
      }
      return {
        config: automationConfigsById[entry.unique_id] || null,
      };
    }
    if (request.type === "config/label_registry/list") {
      return labelRegistry.map((label) => ({
        ...label,
        description: null,
        color: null,
        created_at: Date.now() / 1000,
        modified_at: Date.now() / 1000,
      }));
    }
    if (request.type === "config/label_registry/create") {
      const name = String(request.name || "").trim();
      if (!name) throw new Error("invalid_info: label name is required");
      const existing = labelRegistry.find((label) => label.name === name);
      if (existing) {
        return {
          ...existing,
          description: null,
          color: null,
          created_at: Date.now() / 1000,
          modified_at: Date.now() / 1000,
        };
      }
      const next = {
        label_id: `label_${slugify(name)}_${labelRegistry.length + 1}`,
        name,
        icon: typeof request.icon === "string" ? request.icon : undefined,
      };
      labelRegistry.push(next);
      return {
        ...next,
        description: null,
        color: null,
        created_at: Date.now() / 1000,
        modified_at: Date.now() / 1000,
      };
    }
    if (request.type === "config/category_registry/list") {
      const scope = String(request.scope || "automation");
      const categories = categoryRegistry[scope] || [];
      return categories.map((category) => ({
        ...category,
        created_at: Date.now() / 1000,
        modified_at: Date.now() / 1000,
      }));
    }
    if (request.type === "config/category_registry/create") {
      const scope = String(request.scope || "automation");
      const name = String(request.name || "").trim();
      if (!scope || !name) throw new Error("invalid_info: scope and name are required");
      if (!categoryRegistry[scope]) categoryRegistry[scope] = [];
      const existing = categoryRegistry[scope].find((category) => category.name === name);
      if (existing) {
        return {
          ...existing,
          created_at: Date.now() / 1000,
          modified_at: Date.now() / 1000,
        };
      }
      const next = {
        category_id: `category_${slugify(scope)}_${slugify(name)}_${categoryRegistry[scope].length + 1}`,
        name,
        icon: typeof request.icon === "string" ? request.icon : undefined,
      };
      categoryRegistry[scope].push(next);
      return {
        ...next,
        created_at: Date.now() / 1000,
        modified_at: Date.now() / 1000,
      };
    }
      if (request.type === "config/entity_registry/update") {
      const entry = findAutomationEntryByEntityId(String(request.entity_id || ""));
      if (!entry) {
        throw new Error(`Entity not found: ${request.entity_id}`);
      }

      if (Array.isArray(request.labels)) {
        entry.labels = request.labels.map((label: any) => String(label)).filter(Boolean);
      }
        if (request.categories && typeof request.categories === "object") {
          entry.categories = {
            ...entry.categories,
            ...request.categories,
          };
        }
        persistSnapshot();
        return { ...entry };
      }
    if (
      request.type === "call_service" &&
      request.domain === "automation" &&
      (request.service === "turn_on" || request.service === "turn_off")
    ) {
      const entityId = String(request?.service_data?.entity_id || "");
      if (states[entityId]) {
        states = {
          ...states,
          [entityId]: {
            ...states[entityId],
            state: request.service === "turn_on" ? "on" : "off",
          },
        };
        connection.fireEvent("state_changed", {
          entity_id: entityId,
          new_state: states[entityId],
        });
      }
      return { success: true };
    }
    if (request.type === "topomation/locations/create") {
      const rawType = String(request?.meta?.type || "").trim().toLowerCase();
      if (!["floor", "area", "building", "grounds", "subarea"].includes(rawType)) {
        throw new Error("invalid_type: Unsupported location type.");
      }

      const getType = (loc: any): string =>
        String(loc?.modules?._meta?.type || "area").trim().toLowerCase();

      let parentId = request.parent_id ?? null;
      if (parentId !== null && !locations.some((loc) => loc.id === parentId)) {
        throw new Error(`parent_not_found: Parent location '${parentId}' not found.`);
      }

      const parent = parentId ? locations.find((loc) => loc.id === parentId) : undefined;
      if ((rawType === "building" || rawType === "grounds") && parentId !== null) {
        throw new Error(`invalid_parent: ${rawType} locations must be root-level.`);
      }

      if (rawType === "floor" && parentId !== null && getType(parent) !== "building") {
        throw new Error("invalid_parent: Floor parent must be root-level or Building.");
      }

      const toSlug = (value: string): string => {
        const slug = value
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_+|_+$/g, "");
        return slug || "location";
      };

      const stem = `${rawType}_${toSlug(String(request?.name || ""))}`;
      let nextId = stem;
      let suffix = 2;
      while (locations.some((loc) => loc.id === nextId)) {
        nextId = `${stem}_${suffix}`;
        suffix += 1;
      }

      const location = {
        id: nextId,
        name: String(request?.name || "New Location"),
        parent_id: parentId,
        is_explicit_root: false,
        entity_ids: [],
        modules: {
          _meta: {
            ...(request?.meta || {}),
            type: rawType,
            sync_source: "topology",
            sync_enabled: true,
          },
        },
      };

      locations = [...locations, location];
      persistSnapshot();
      connection.fireEvent("topomation_updated", { reason: "create", location_id: nextId });
      return { success: true, location: cloneLocation(location as Location) };
    }
    if (request.type === "topomation/locations/update") {
      const target = locations.find((l) => l.id === request.location_id);
      if (!target) {
        throw new Error(`not_found: Location ${request.location_id} not found.`);
      }

      const changes = request?.changes || {};
      const getType = (loc: any): string =>
        String(loc?.modules?._meta?.type || "area").trim().toLowerCase();

      let newParentId = target.parent_id;
      if (Object.prototype.hasOwnProperty.call(changes, "parent_id")) {
        newParentId = changes.parent_id ?? null;
        if (newParentId !== null && !locations.some((loc) => loc.id === newParentId)) {
          throw new Error(`parent_not_found: Parent location '${newParentId}' not found.`);
        }
        const parent = newParentId ? locations.find((loc) => loc.id === newParentId) : undefined;
        if ((getType(target) === "building" || getType(target) === "grounds") && newParentId !== null) {
          throw new Error("invalid_parent: Building/Grounds must be root-level.");
        }
        if (getType(target) === "floor" && newParentId !== null && getType(parent) !== "building") {
          throw new Error("invalid_parent: Floor parent must be root-level or Building.");
        }
      }

      locations = locations.map((loc) => {
        if (loc.id !== request.location_id) return loc;
        return {
          ...loc,
          name: typeof changes.name === "string" && changes.name.trim() ? changes.name.trim() : loc.name,
          parent_id: newParentId,
        };
      });
      persistSnapshot();
      connection.fireEvent("topomation_updated", { reason: "update", location_id: request.location_id });
      return { success: true };
    }
    if (request.type === "topomation/locations/reorder") {
      const location = locations.find(loc => loc.id === request.location_id);
      if (!location) {
        throw new Error(`Location not found: ${request.location_id}`);
      }

      const getType = (loc: any): string =>
        String(loc?.modules?._meta?.type || "area").trim().toLowerCase();
      const newParentId = request.new_parent_id ?? null;
      const parent = newParentId ? locations.find((loc) => loc.id === newParentId) : undefined;
      if (newParentId !== null && !parent) {
        throw new Error(`parent_not_found: Parent location '${newParentId}' not found.`);
      }
      const locationType = getType(location);
      if ((locationType === "building" || locationType === "grounds") && newParentId !== null) {
        throw new Error("invalid_parent: Building/Grounds must be root-level.");
      }
      if (locationType === "floor" && newParentId !== null && getType(parent) !== "building") {
        throw new Error("invalid_parent: Floor parent must be root-level or Building.");
      }

      // 1. Identify the entire subtree (parent + all recursive children)
      const subtreeIds = new Set<string>();
      const collect = (pid: string) => {
        subtreeIds.add(pid);
        locations.filter(l => l.parent_id === pid).forEach(child => collect(child.id));
      };
      collect(location.id);

      // 2. Remove the subtree from the current list
      const movedItems = locations
        .filter((l) => subtreeIds.has(l.id))
        .map((l) => cloneLocation(l));
      const remainingItems = locations
        .filter((l) => !subtreeIds.has(l.id))
        .map((l) => cloneLocation(l));

      // 3. Update the ACTUAL dragged root item's parent (not array index 0).
      const movedRoot = movedItems.find((l) => l.id === location.id);
      if (!movedRoot) {
        throw new Error(`Moved root not found in subtree: ${location.id}`);
      }
      movedRoot.parent_id = newParentId;

      // Keep subtree list in deterministic root-first depth-first order.
      const movedOrder = new Map<string, number>();
      movedItems.forEach((l, idx) => movedOrder.set(l.id, idx));
      const movedByParent = new Map<string | null, any[]>();
      for (const item of movedItems) {
        const key = item.parent_id ?? null;
        if (!movedByParent.has(key)) movedByParent.set(key, []);
        movedByParent.get(key)!.push(item);
      }
      for (const children of movedByParent.values()) {
        children.sort((a, b) => (movedOrder.get(a.id) ?? 0) - (movedOrder.get(b.id) ?? 0));
      }
      const orderedMovedItems: any[] = [];
      const appendSubtree = (rootId: string) => {
        const root = movedItems.find((l) => l.id === rootId);
        if (!root) return;
        orderedMovedItems.push(root);
        const kids = movedByParent.get(rootId) || [];
        for (const child of kids) appendSubtree(child.id);
      };
      appendSubtree(location.id);

      // 4. Find the new absolute insertion index in the remaining list
      // If index is provided, we insert after that many items under the same parent
      const siblings = remainingItems.filter(l => l.parent_id === newParentId);
      const insertIndex = request.new_index ?? siblings.length;

      let absoluteIdx = remainingItems.length;
      if (siblings.length > 0 && insertIndex < siblings.length) {
        const targetSibling = siblings[insertIndex];
        absoluteIdx = remainingItems.indexOf(targetSibling);
      } else if (siblings.length > 0) {
        // Insert after last sibling and its children
        const lastSibling = siblings[siblings.length - 1];
        let lastChildIdx = remainingItems.indexOf(lastSibling);
        // Find last child of this sibling
        const findLast = (pid: string) => {
          remainingItems.filter(l => l.parent_id === pid).forEach(c => {
            const idx = remainingItems.indexOf(c);
            if (idx > lastChildIdx) lastChildIdx = idx;
            findLast(c.id);
          });
        };
        findLast(lastSibling.id);
        absoluteIdx = lastChildIdx + 1;
      }

      // 5. Reassemble the list
      const nextLocations = [
        ...remainingItems.slice(0, absoluteIdx),
        ...orderedMovedItems,
        ...remainingItems.slice(absoluteIdx)
      ];

      const byId = new Map(nextLocations.map((loc) => [loc.id, loc]));
      const nearestFloorId = (startParentId: string | null): string | null => {
        let cursor = startParentId;
        const seen = new Set<string>();
        while (cursor && !seen.has(cursor)) {
          seen.add(cursor);
          const current = byId.get(cursor);
          if (!current) return null;

          const currentMeta = current.modules?._meta || {};
          if (currentMeta?.type === "floor") {
            return String(current.ha_floor_id || currentMeta.ha_floor_id || "").trim() || null;
          }

          if (currentMeta?.ha_floor_id) {
            return String(currentMeta.ha_floor_id);
          }

          cursor = current.parent_id ?? null;
        }
        return null;
      };

      const movedHaAreas = orderedMovedItems.filter((loc) => !!loc.ha_area_id);

      // Update mocked HA area floor assignments to match topology move result.
      for (const moved of movedHaAreas) {
        const floorId = nearestFloorId(moved.parent_id ?? null);
        const area = areas[moved.ha_area_id];
        if (area) {
          areas[moved.ha_area_id] = { ...area, floor_id: floorId ?? null };
        }
        moved.modules = moved.modules || {};
        moved.modules._meta = moved.modules._meta || {};
        if (floorId) {
          moved.modules._meta.ha_floor_id = floorId;
        } else {
          delete moved.modules._meta.ha_floor_id;
        }
      }

      locations = nextLocations;
      persistSnapshot();

      console.log(`[MockHass] Moved subtree ${location.name} to parent ${newParentId}`);
      connection.fireEvent("topomation_updated", { reason: "reorder" });
      return { success: true, ha_floor_id: movedRoot.modules?._meta?.ha_floor_id ?? null };
    }
    if (request.type === "topomation/locations/assign_entity") {
      const entityId = String(request?.entity_id || "").trim();
      const targetLocationId = request?.target_location_id
        ? String(request.target_location_id).trim()
        : "";
      if (!entityId) {
        throw new Error("invalid_entity: entity_id is required");
      }
      const target = locations.find((loc) => loc.id === targetLocationId);
      if (!target) {
        throw new Error(`target_not_found: Target location '${targetLocationId}' not found.`);
      }

      const previousLocationIds: string[] = [];
      const nextLocations = locations.map((loc) => {
        const currentIds = Array.isArray(loc.entity_ids) ? [...loc.entity_ids] : [];
        if (currentIds.includes(entityId)) {
          previousLocationIds.push(loc.id);
        }
        return {
          ...loc,
          entity_ids: currentIds.filter((id) => id !== entityId),
        };
      });

      const targetIndex = nextLocations.findIndex((loc) => loc.id === targetLocationId);
      if (targetIndex >= 0 && !nextLocations[targetIndex].entity_ids.includes(entityId)) {
        nextLocations[targetIndex] = {
          ...nextLocations[targetIndex],
          entity_ids: [...nextLocations[targetIndex].entity_ids, entityId],
        };
      }
      locations = nextLocations;

      if (target.ha_area_id && states[entityId]) {
        states = {
          ...states,
          [entityId]: {
            ...states[entityId],
            attributes: {
              ...(states[entityId]?.attributes || {}),
              area_id: target.ha_area_id,
            },
          },
        };
      }

      persistSnapshot();
      connection.fireEvent("topomation_updated", {
        reason: "assign_entity",
        location_id: targetLocationId,
        entity_id: entityId,
      });
      return {
        success: true,
        entity_id: entityId,
        previous_location_ids: previousLocationIds,
        target_location_id: targetLocationId,
        ha_area_id: target.ha_area_id ?? null,
      };
    }
    if (request.type === "topomation/locations/delete") {
      const locationId = String(request?.location_id || "");
      const target = locations.find((loc) => loc.id === locationId);
      if (!target) {
        throw new Error(`not_found: Location ${locationId} not found.`);
      }
      if (target.is_explicit_root) {
        throw new Error("operation_not_supported: Cannot delete the Home root location.");
      }

      const getType = (loc: any): string =>
        String(loc?.modules?._meta?.type || "area").trim().toLowerCase();

      const isHaBacked = !!target.ha_area_id || !!target.modules?._meta?.ha_floor_id;
      if (isHaBacked) {
        throw new Error(
          "operation_not_supported: Delete HA-backed floor/area wrappers in Home Assistant Settings. Topology delete is available for integration-owned locations only."
        );
      }

      const parentId = target.parent_id ?? null;
      const directChildren = locations.filter((loc) => loc.parent_id === locationId);
      for (const child of directChildren) {
        const childType = getType(child);
        const parent = parentId ? locations.find((loc) => loc.id === parentId) : undefined;
        if ((childType === "building" || childType === "grounds") && parentId !== null) {
          throw new Error("invalid_parent: Building/Grounds must be root-level.");
        }
        if (childType === "floor" && parentId !== null && getType(parent) !== "building") {
          throw new Error("invalid_parent: Floor parent must be root-level or Building.");
        }
      }

      // Reparent direct children one level up, preserving their own subtrees.
      locations = locations.map((loc) =>
        loc.parent_id === locationId ? { ...loc, parent_id: parentId } : loc
      );

      const deletedIds = [locationId];
      locations = locations.filter((loc) => loc.id !== locationId);
      persistSnapshot();
      connection.fireEvent("topomation_updated", { reason: "delete", location_id: locationId });
      return { success: true, deleted_ids: deletedIds, reparented_ids: directChildren.map((c) => c.id) };
    }
    if (request.type === "topomation/locations/set_module_config") {
      const target = locations.find((l) => l.id === request.location_id);
      if (!target) {
        throw new Error(`Location not found: ${request.location_id}`);
      }

      if (
        request.module_id === "occupancy" &&
        target.modules?._meta?.type === "floor" &&
        (request.config?.occupancy_sources || []).length > 0
      ) {
        throw new Error("Floor locations cannot have occupancy sources");
      }

      const updatedLocations = locations.map((loc) => {
        if (loc.id !== request.location_id) return loc;
        return {
          ...loc,
          modules: {
            ...(loc.modules || {}),
            [request.module_id]: JSON.parse(JSON.stringify(request.config || {})),
          },
        };
      });

      const staleReads = Math.max(
        0,
        Number(eventualConsistency.list_stale_reads_after_module_config || 0)
      );
      const applyDelayMs = Math.max(0, Number(eventualConsistency.apply_delay_ms || 0));
      const shouldLag = staleReads > 0 || applyDelayMs > 0;

      if (shouldLag) {
        pendingModuleConfigApply = {
          nextLocations: cloneLocations(updatedLocations),
          staleReadsRemaining: staleReads,
          applyAt: Date.now() + applyDelayMs,
          emitApplyEvent: Boolean(eventualConsistency.emit_apply_event),
        };
      } else {
        locations = updatedLocations;
        persistSnapshot();
      }

      connection.fireEvent("topomation_updated", {
        reason: "set_module_config",
        location_id: request.location_id,
        module_id: request.module_id,
      });
      return { success: true };
    }
    return {};
  };

  const callApi = async (
    method: string,
    endpoint: string,
    parameters?: Record<string, any>
  ): Promise<any> => {
    const normalizedMethod = String(method || "get").toLowerCase();
    const normalizedEndpoint = String(endpoint || "").replace(/^\/+/, "");
    const automationPrefix = "config/automation/config/";

    if (normalizedEndpoint.startsWith(automationPrefix)) {
      const configId = decodeURIComponent(normalizedEndpoint.slice(automationPrefix.length));
      if (!configId) {
        throw new Error("Invalid automation ID");
      }

      if (normalizedMethod === "post") {
        const configPayload = {
          ...(parameters || {}),
          id: configId,
        };
        automationConfigsById[configId] = configPayload;

        let entry = automationEntryByConfigId.get(configId);
        if (!entry) {
          const alias = String(configPayload.alias || configId);
          const entityId = `automation.${slugify(alias)}`;
          entry = {
            entity_id: entityId,
            unique_id: configId,
            domain: "automation",
            platform: "automation",
            labels: [],
            categories: {},
          };
          automationEntryByConfigId.set(configId, entry);
        }

        states = {
          ...states,
          [entry.entity_id]: {
            entity_id: entry.entity_id,
            state: "on",
            attributes: {
              friendly_name: configPayload.alias || configId,
            },
          },
        };
        connection.fireEvent("state_changed", {
          entity_id: entry.entity_id,
          new_state: states[entry.entity_id],
        });
        persistSnapshot();
        return { result: "ok" };
      }

      if (normalizedMethod === "delete") {
        const entry = automationEntryByConfigId.get(configId);
        delete automationConfigsById[configId];
        if (entry) {
          automationEntryByConfigId.delete(configId);
          const nextStates = { ...states };
          delete nextStates[entry.entity_id];
          states = nextStates;
          connection.fireEvent("state_changed", {
            entity_id: entry.entity_id,
            new_state: null,
          });
        }
        persistSnapshot();
        return { result: "ok" };
      }
    }

    throw new Error(`Unsupported mock API request: ${method} ${endpoint}`);
  };

  const buildHass = () => {
    const hass: any = {
      callWS,
      callApi,
      callService: async () => {},
      connection,
      config,
      localize: (key: string) => key,
    };

    // Expose live references so tests and harness code always observe
    // the current in-memory state after internal map replacements.
    Object.defineProperties(hass, {
      states: {
        enumerable: true,
        get: () => states,
        set: (next: Record<string, any>) => {
          states = next;
        },
      },
      areas: {
        enumerable: true,
        get: () => areas,
      },
      floors: {
        enumerable: true,
        get: () => MOCK_FLOORS,
      },
      themes: {
        enumerable: true,
        get: () => ({ darkMode: currentTheme === "dark", theme: currentTheme }),
      },
    });

    return hass;
  };

  return {
    hass: buildHass(),
    connection,
    updateState: (id, s) => {
      if (!states[id]) return;
      states[id].state = s;
      connection.fireEvent("state_changed", { entity_id: id, new_state: states[id] });
    },
    setTheme: (t) => {
      currentTheme = t;
      document.documentElement.setAttribute("data-theme", t);
    },
    getReactiveHass: () => buildHass(),
    getLocations: () => cloneLocations(locations),
    clearPersistence: () => {
      if (!persistenceAvailable) return;
      window.localStorage.removeItem(persistenceKey);
    },
  };
}
