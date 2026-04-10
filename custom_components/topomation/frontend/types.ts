/**
 * TypeScript type definitions for Topomation frontend
 *
 * ARCHITECTURAL LAYERS:
 *
 * 1. KERNEL (home-topology core library):
 *    - Type-agnostic: only knows Location objects in a tree
 *    - No concept of "floor", "area", "building", "grounds"
 *    - Only enforces: valid tree structure (no cycles)
 *
 * 2. INTEGRATION LAYER (this UI):
 *    - Defines location semantics in modules._meta
 *    - Enforces hierarchy rules in UI
 *    - Maps Locations to HA Areas (one-to-one)
 *
 * 3. HOME ASSISTANT:
 *    - Areas: Flat list (no hierarchy), where entities live
 *    - Floors: Optional grouping for areas (may not be available)
 *    - Zones: GPS geofences (e.g., "home", "work"), NOT indoor topology
 */

export interface HomeAssistant {
  callWS<T>(request: Record<string, any>): Promise<T>;
  callApi?<T>(
    method: "get" | "post" | "put" | "delete" | string,
    endpoint: string,
    parameters?: Record<string, any>
  ): Promise<T>;
  connection: any;
  states: Record<string, any>;
  areas: Record<string, any>;
  floors: Record<string, any>;
  config?: {
    location_name?: string;
    latitude?: number;
    longitude?: number;
    time_zone?: string;
    country?: string;
    [key: string]: any;
  };
  localize: (key: string, ...args: any[]) => string;
}

export interface Location {
  id: string;
  name: string;
  parent_id: string | null;
  is_explicit_root: boolean;
  ha_area_id?: string;
  ha_floor_id?: string;
  origin?: "ha" | "integration"; // Track whether HA-imported or integration-created
  entity_ids: string[];
  modules: Record<string, any>; // Keep loose for mock/frontend (backend enforces shape)
}

export interface AdjacencyEdge {
  edge_id: string;
  from_location_id: string;
  to_location_id: string;
  directionality: "bidirectional" | "a_to_b" | "b_to_a";
  boundary_type: string;
  crossing_sources: string[];
  handoff_window_sec: number;
  priority: number;
}

export interface HandoffTrace {
  edge_id: string;
  from_location_id: string;
  to_location_id: string;
  trigger_entity_id: string;
  trigger_source_id: string;
  boundary_type: string;
  handoff_window_sec: number;
  status: string;
  timestamp: string;
}

export interface ModuleConfig {
  // Version/enabled are optional in mock data; real modules should set them.
  version?: number;
  enabled?: boolean;
  [key: string]: any;
}

export interface OccupancyConfig extends ModuleConfig {
  default_timeout: number;
  default_trailing_timeout?: number;
  occupancy_sources?: OccupancySource[];
  occupancy_group_id?: string | null;
  linked_locations?: string[];
  wiab?: WaspInBoxConfig;
}

export type WaspInBoxPreset = "off" | "enclosed_room" | "home_containment" | "hybrid";

export interface WaspInBoxConfig {
  preset?: WaspInBoxPreset;
  interior_entities?: string[];
  door_entities?: string[];
  exterior_door_entities?: string[];
  hold_timeout_sec?: number;
  release_timeout_sec?: number;
}

export interface AmbientConfig extends ModuleConfig {
  lux_sensor?: string | null;
  auto_discover?: boolean;
  inherit_from_parent?: boolean;
  dark_threshold?: number;
  bright_threshold?: number;
  fallback_to_sun?: boolean;
  assume_dark_on_error?: boolean;
}

export interface AmbientLightReading {
  lux?: number | null;
  source_sensor?: string | null;
  source_location?: string | null;
  is_inherited?: boolean;
  is_dark?: boolean;
  is_bright?: boolean;
  dark_threshold?: number;
  bright_threshold?: number;
  fallback_method?: string | null;
  timestamp?: string;
}

export interface OccupancySource {
  entity_id: string;
  source_id?: string;
  signal_key?: "playback" | "volume" | "mute" | "power" | "level" | "color";
  mode: "specific_states" | "any_change";
  on_event?: "trigger" | "none";
  on_timeout?: number | null;
  off_event?: "clear" | "none";
  off_trailing?: number | null;
}

// Alias for backward compatibility with entity config dialog
export type OccupancySourceConfig = OccupancySource;

export interface TopomationActionRule {
  id: string;
  entity_id: string;
  name: string;
  trigger_type: "on_occupied" | "on_vacant" | "on_dark" | "on_bright";
  trigger_types?: Array<"on_occupied" | "on_vacant" | "on_dark" | "on_bright">;
  rule_uuid?: string;
  actions?: Array<{
    entity_id: string;
    service: string;
    data?: Record<string, unknown>;
    only_if_off?: boolean;
  }>;
  action_entity_id?: string;
  action_service?: string;
  action_data?: Record<string, unknown>;
  ambient_condition?: "any" | "dark" | "bright";
  must_be_occupied?: boolean;
  time_condition_enabled?: boolean;
  start_time?: string;
  end_time?: string;
  run_on_startup?: boolean;
  // Legacy compatibility (older backend/frontend payloads)
  require_dark?: boolean;
  enabled: boolean;
}

/**
 * LocationMeta: Integration-layer metadata (NOT a kernel property)
 *
 * Stored in modules._meta to define location semantics for the UI layer.
 * The kernel (core library) is type-agnostic and has no concept of location classes.
 *
 * Used by integration for:
 * - Icon selection (type + category → icon)
 * - Hierarchy validation (root wrappers + area/subarea nesting)
 * - HA area mapping hints
 */
export interface LocationMeta {
  type: LocationType;
  category?: string;
  icon?: string;
  role?: "managed_shadow" | string;
  shadow_area_id?: string;
  shadow_for_location_id?: string;
}

export type LocationType =
  | "floor"
  | "area"
  | "building"
  | "grounds"
  | "subarea";

export interface LocationTreeState {
  locations: Location[];
  selectedId?: string;
  expandedIds: Set<string>;
}

export interface CreateLocationData {
  name: string;
  parent_id: string | null;
  type: LocationType;
  category?: string;
}

export interface UpdateLocationData {
  name?: string;
  parent_id?: string | null;
}

export interface TopomationPanelConfig {
  title?: string;
  entry_id?: string;
}
