import type { Location } from "./types";
import { getLocationType } from "./hierarchy-rules";

const MANAGED_SHADOW_ROLE = "managed_shadow";
const SHADOW_HOST_TYPES = new Set(["floor", "building", "grounds", "property"]);

const _meta = (location?: Location): Record<string, any> =>
  ((location?.modules?._meta || {}) as Record<string, any>);

const _normalizedMetaString = (meta: Record<string, any>, key: string): string => {
  const raw = meta[key];
  return typeof raw === "string" ? raw.trim() : "";
};

const _normalizedRole = (location?: Location): string =>
  _normalizedMetaString(_meta(location), "role").toLowerCase();

const _normalizedType = (location?: Location): string =>
  _normalizedMetaString(_meta(location), "type").toLowerCase();

export const managedShadowLocationIdSet = (locations: Location[] = []): Set<string> => {
  const ids = new Set<string>();
  for (const location of locations) {
    const meta = _meta(location);
    const shadowId = _normalizedMetaString(meta, "shadow_area_id");
    if (!shadowId) continue;
    if (!SHADOW_HOST_TYPES.has(_normalizedType(location))) continue;
    ids.add(shadowId);
  }
  return ids;
};

export const isSystemShadowLocation = (
  location?: Location,
  managedShadowIds?: Set<string>
): boolean => {
  if (!location) return false;
  if (managedShadowIds?.has(location.id)) {
    return true;
  }
  const meta = _meta(location);
  const role = _normalizedRole(location);
  if (role === MANAGED_SHADOW_ROLE) {
    return true;
  }
  if (_normalizedMetaString(meta, "shadow_for_location_id")) {
    return true;
  }
  return false;
};

export const managedShadowAreaIdForHost = (hostLocation?: Location): string => {
  if (!hostLocation) return "";
  const meta = _meta(hostLocation);
  return _normalizedMetaString(meta, "shadow_area_id");
};

/**
 * Topology location id used by Topomation occupancy `binary_sensor` entities
 * (`attributes.location_id`). For managed-shadow hosts (floor/building/grounds/property,
 * non–explicit-root), that id is the shadow `area_*` child, not the host row
 * (ADR-HA-077, ADR-HA-079).
 */
export function effectiveOccupancyTopologyId(
  location: Location | undefined,
  allLocations: readonly Location[] | undefined
): string {
  if (!location) return "";
  if (location.is_explicit_root) return location.id;

  const type = getLocationType(location);
  const isShadowHostType =
    type === "floor" || type === "building" || type === "grounds" || type === "property";
  if (!isShadowHostType) return location.id;

  const shadowId = managedShadowAreaIdForHost(location);
  if (!shadowId) return location.id;

  const list = allLocations || [];
  const shadow = list.find((candidate) => candidate.id === shadowId);
  if (!shadow) return location.id;

  return shadowId;
}

/** Rollup occupancy used by the topology tree dot and shadow-host toggle intent. */
export type RollupOccupancyStatus = "occupied" | "vacant" | "unknown";

/**
 * Merge each location's direct occupancy sensor state (when present) with
 * descendant rows, mirroring the tree's green/red dot semantics.
 *
 * Keys in ``occupancyStates`` are topology ids from HA ``binary_sensor`` attributes
 * (``location_id``), typically one row per sensor — not necessarily every location id.
 */
export function rollupOccupancyStatusByLocation(
  locations: readonly Location[],
  occupancyStates: Readonly<Record<string, boolean | undefined>>
): Record<string, RollupOccupancyStatus> {
  const statusByLocation: Record<string, RollupOccupancyStatus> = {};
  const byId = new Map(locations.map((loc) => [loc.id, loc]));
  const childrenByParent = new Map<string, string[]>();

  for (const loc of locations) {
    if (!loc.parent_id) continue;
    if (!childrenByParent.has(loc.parent_id)) {
      childrenByParent.set(loc.parent_id, []);
    }
    childrenByParent.get(loc.parent_id)!.push(loc.id);
  }

  const resolved = new Map<string, RollupOccupancyStatus>();

  const visit = (locationId: string): RollupOccupancyStatus => {
    const cached = resolved.get(locationId);
    if (cached) return cached;
    if (!byId.has(locationId)) return "unknown";

    const direct = occupancyStates?.[locationId];
    const own: RollupOccupancyStatus =
      direct === true ? "occupied" : direct === false ? "vacant" : "unknown";

    const childIds = childrenByParent.get(locationId) || [];
    if (!childIds.length) {
      resolved.set(locationId, own);
      return own;
    }

    const childStatuses = childIds.map((id) => visit(id));

    let merged: RollupOccupancyStatus;
    if (own === "occupied" || childStatuses.includes("occupied")) {
      merged = "occupied";
    } else if (own === "vacant") {
      merged = "vacant";
    } else if (childStatuses.length > 0 && childStatuses.every((s) => s === "vacant")) {
      merged = "vacant";
    } else {
      merged = "unknown";
    }

    resolved.set(locationId, merged);
    return merged;
  };

  for (const loc of locations) {
    statusByLocation[loc.id] = visit(loc.id);
  }

  return statusByLocation;
}

/**
 * True when this topology row is a structural host that uses a managed-shadow
 * occupancy entity (``_meta.shadow_area_id``), including when the shadow row is
 * omitted from ``allLocations`` (for example the panel's visible location list).
 */
export function isManagedShadowOccupancyHost(
  location: Location | undefined,
  _allLocations?: readonly Location[] | undefined
): boolean {
  if (!location || location.is_explicit_root) return false;
  const type = getLocationType(location);
  if (!SHADOW_HOST_TYPES.has(type)) return false;
  return Boolean(managedShadowAreaIdForHost(location));
}
