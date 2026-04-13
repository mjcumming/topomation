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
