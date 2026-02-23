/**
 * TypeScript type definitions for Home Topology frontend
 *
 * ARCHITECTURAL LAYERS:
 *
 * 1. KERNEL (home-topology core library):
 *    - Type-agnostic: only knows Location objects in a tree
 *    - No concept of "floor", "room", "building"
 *    - Only enforces: valid tree structure (no cycles)
 *
 * 2. INTEGRATION LAYER (this UI):
 *    - Defines types (floor/room/building/outdoor) in modules._meta
 *    - Enforces hierarchy rules in UI (floor→room, room terminal)
 *    - Maps Locations to HA Areas (one-to-one)
 *
 * 3. HOME ASSISTANT:
 *    - Areas: Flat list (no hierarchy), where entities live
 *    - Floors: Optional grouping for areas (may not be available)
 *    - Zones: GPS geofences (e.g., "home", "work"), NOT indoor topology
 */

export interface HomeAssistant {
  callWS<T>(request: Record<string, any>): Promise<T>;
  connection: any;
  states: Record<string, any>;
  areas: Record<string, any>;
  floors: Record<string, any>;
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
}

export interface OccupancySource {
  entity_id: string;
  mode: "specific_states" | "any_change";
  on_event?: "trigger" | "none";
  on_timeout?: number | null;
  off_event?: "clear" | "none";
  off_trailing?: number | null;
}

// Alias for backward compatibility with entity config dialog
export type OccupancySourceConfig = OccupancySource;

export interface AutomationConfig extends ModuleConfig {
  rules: AutomationRule[];
}

export interface AutomationRule {
  id: string;
  name: string;
  trigger_type: "occupied" | "vacant";
  action_entity_id: string;
  action_service: string;
}

/**
 * LocationMeta: Integration-layer metadata (NOT a kernel property)
 *
 * Stored in modules._meta to define location semantics for the UI layer.
 * The kernel (core library) is type-agnostic and has no concept of "floor" vs "room".
 *
 * Used by integration for:
 * - Icon selection (type + category → icon)
 * - Hierarchy validation (floor→room, room terminal, etc.)
 * - HA area mapping hints
 */
export interface LocationMeta {
  type: LocationType;
  category?: string;
  icon?: string;
}

export type LocationType =
  | "floor"
  | "area";

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

export interface HomeTopologyPanelConfig {
  title?: string;
}
