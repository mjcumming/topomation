/**
 * TypeScript type definitions for Home Topology frontend
 */

export interface HomeAssistant {
  callWS<T>(request: Record<string, any>): Promise<T>;
  connection: any;
  states: Record<string, any>;
  areas: Record<string, any>;
  localize: (key: string, ...args: any[]) => string;
}

export interface Location {
  id: string;
  name: string;
  parent_id: string | null;
  is_explicit_root: boolean;
  ha_area_id?: string;
  entity_ids: string[];
  modules: Record<string, ModuleConfig>;
}

export interface ModuleConfig {
  version: number;
  enabled: boolean;
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

export interface LocationMeta {
  type: LocationType;
  category?: string;
  icon?: string;
}

export type LocationType =
  | "floor"
  | "room"
  | "zone"
  | "suite"
  | "outdoor"
  | "building";

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

