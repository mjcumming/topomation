// @ts-nocheck
import type { HomeAssistant, Location, LocationMeta } from "./types";

export const MOCK_AREAS: Record<string, { area_id: string; name: string; icon?: string }> = {
  kitchen: { area_id: "kitchen", name: "Kitchen", icon: "mdi:silverware-fork-knife" },
  living_room: { area_id: "living_room", name: "Living Room", icon: "mdi:sofa" },
  bathroom: { area_id: "bathroom", name: "Bathroom", icon: "mdi:shower" },
  primary_bedroom: { area_id: "primary_bedroom", name: "Primary Bedroom", icon: "mdi:bed" },
  guest_bedroom: { area_id: "guest_bedroom", name: "Guest Bedroom", icon: "mdi:bed" },
  garage: { area_id: "garage", name: "Garage", icon: "mdi:garage" },
};

export const MOCK_FLOORS: Record<string, { floor_id: string; name: string; icon?: string }> = {
  main_floor: { floor_id: "main_floor", name: "Main Floor", icon: "mdi:layers" },
  second_floor: { floor_id: "second_floor", name: "Second Floor", icon: "mdi:layers" },
  basement: { floor_id: "basement", name: "Basement", icon: "mdi:layers" },
};

export const MOCK_LOCATIONS: Location[] = [
  // Floors at top level (no synthetic House root)
  {
    id: "main-floor",
    name: "Main Floor",
    parent_id: null,
    is_explicit_root: false,
    ha_floor_id: "main_floor",
    origin: "integration",
    entity_ids: [],
    modules: { _meta: { type: "floor" } },
  },
  {
    id: "second-floor",
    name: "Second Floor",
    parent_id: null,
    is_explicit_root: false,
    ha_floor_id: "second_floor",
    origin: "integration",
    entity_ids: [],
    modules: { _meta: { type: "floor" } },
  },
  {
    id: "basement",
    name: "Basement",
    parent_id: null,
    is_explicit_root: false,
    ha_floor_id: "basement",
    origin: "integration",
    entity_ids: [],
    modules: { _meta: { type: "floor" } },
  },
  // Rooms under Main Floor (HA-imported Areas)
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
    modules: { _meta: { type: "area", category: "kitchen" }, occupancy: { enabled: true, default_timeout: 300 } },
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
    modules: { _meta: { type: "area", category: "living" }, occupancy: { enabled: true, default_timeout: 600 } },
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
    modules: { _meta: { type: "area", category: "bathroom" }, occupancy: { enabled: true, default_timeout: 300 } },
  },
  // Deep Nesting (Area inside Area)
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
    modules: { _meta: { type: "area" } },
  },
  {
    id: "pantry-shelf",
    name: "Pantry Shelf",
    parent_id: "pantry",
    is_explicit_root: false,
    origin: "integration",
    entity_ids: [],
    modules: { _meta: { type: "area" } },
  },
  {
    id: "pantry-shelf-top",
    name: "Top Shelf",
    parent_id: "pantry-shelf",
    is_explicit_root: false,
    origin: "integration",
    entity_ids: [],
    modules: { _meta: { type: "area" } },
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

export function createMockHass(options: any = {}): any {
  const connection = new MockConnection();
  let locations = options.locations
    ? options.locations.map((l: Location) => cloneLocation(l))
    : MOCK_LOCATIONS.map((l) => cloneLocation(l));
  let states = { ...(options.states || MOCK_STATES) };
  let areas = { ...(options.areas || MOCK_AREAS) };
  let currentTheme = options.theme || "light";

  const callWS = async (request: any): Promise<any> => {
    if (request.type === "home_topology/locations/list") return { locations: [...locations] };
    if (request.type === "home_topology/locations/create") {
      const slug = request.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const baseId = slug || `loc-${Date.now()}`;
      let finalId = baseId;
      let counter = 1;
      while (locations.some(l => l.id === finalId)) {
        finalId = `${baseId}-${counter++}`;
      }

      const newLoc = {
        id: finalId,
        name: request.name,
        parent_id: request.parent_id || null,
        // Build-phase model: no synthetic explicit root in mock data.
        is_explicit_root: false,
        origin: "integration",
        entity_ids: [],
        modules: { _meta: { type: request.meta?.type || "area" } }
      };
      locations = [...locations, newLoc];
      connection.fireEvent("home_topology_updated", { reason: "create" });
      return { success: true, location: newLoc };
    }
    if (request.type === "home_topology/locations/update") {
      locations = locations.map(l => l.id === request.location_id ? { ...l, ...request.changes } : l);
      connection.fireEvent("home_topology_updated", { reason: "update" });
      return { success: true };
    }
    if (request.type === "home_topology/locations/reorder") {
      const location = locations.find(loc => loc.id === request.location_id);
      if (!location) {
        throw new Error(`Location not found: ${request.location_id}`);
      }

      const newParentId = request.new_parent_id ?? null;

      // 1. Identify the entire subtree (parent + all recursive children)
      const subtreeIds = new Set<string>();
      const collect = (pid: string) => {
        subtreeIds.add(pid);
        locations.filter(l => l.parent_id === pid).forEach(child => collect(child.id));
      };
      collect(location.id);

      // 2. Remove the subtree from the current list
      const movedItems = locations.filter(l => subtreeIds.has(l.id));
      const remainingItems = locations.filter(l => !subtreeIds.has(l.id));

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
      locations = [
        ...remainingItems.slice(0, absoluteIdx),
        ...orderedMovedItems,
        ...remainingItems.slice(absoluteIdx)
      ];

      console.log(`[MockHass] Moved subtree ${location.name} to parent ${newParentId}`);
      connection.fireEvent("home_topology_updated", { reason: "reorder" });
      return { success: true };
    }
    if (request.type === "home_topology/locations/delete") {
      locations = locations.filter(l => l.id !== request.location_id);
      connection.fireEvent("home_topology_updated", { reason: "delete" });
      return { success: true };
    }
    if (request.type === "home_topology/locations/set_module_config") {
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

      locations = locations.map((loc) => {
        if (loc.id !== request.location_id) return loc;
        return {
          ...loc,
          modules: {
            ...(loc.modules || {}),
            [request.module_id]: JSON.parse(JSON.stringify(request.config || {})),
          },
        };
      });

      connection.fireEvent("home_topology_updated", {
        reason: "set_module_config",
        location_id: request.location_id,
        module_id: request.module_id,
      });
      return { success: true };
    }
    return {};
  };

  const buildHass = () => ({
    callWS,
    callService: async () => {},
    connection,
    states,
    areas,
    floors: MOCK_FLOORS,
    localize: (key: string) => key,
    themes: { darkMode: currentTheme === "dark", theme: currentTheme },
  });

  return {
    hass: buildHass(),
    connection,
    updateState: (id, s) => { states[id].state = s; connection.fireEvent("state_changed", { entity_id: id, new_state: states[id] }); },
    setTheme: (t) => { currentTheme = t; document.documentElement.setAttribute("data-theme", t); },
    getReactiveHass: () => ({ ...buildHass() }),
  };
}
