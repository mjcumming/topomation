import type { Location, LocationType } from "./types";

export type ParentType = LocationType | "root";

const LEGACY_LOCATION_TYPE_MAP: Record<string, LocationType> = {
  room: "area",
};

function normalizeLocationType(rawType: unknown): LocationType {
  const normalized = String(rawType ?? "area").trim().toLowerCase();
  const mapped = LEGACY_LOCATION_TYPE_MAP[normalized] ?? normalized;
  if (
    mapped === "floor" ||
    mapped === "area" ||
    mapped === "building" ||
    mapped === "grounds" ||
    mapped === "subarea" ||
    mapped === "property"
  ) {
    return mapped;
  }
  return "area";
}

export function getLocationType(loc: Location): LocationType {
  return normalizeLocationType(loc.modules?._meta?.type);
}

/**
 * Returns allowed parent types for a given location type.
 * Used by the Location Dialog to filter the parent dropdown.
 */
export function getAllowedParentTypes(childType: LocationType): ParentType[] {
  if (childType === "property") {
    return ["root"];
  }
  // Floors may be top-level or nested under a building or property.
  if (childType === "floor") {
    return ["root", "building", "property"];
  }
  // Building / grounds may be root-level or nested under a property (multi-root forest).
  if (childType === "building" || childType === "grounds") {
    return ["root", "property"];
  }
  if (childType === "subarea") {
    return ["root", "floor", "area", "subarea", "building", "grounds", "property"];
  }
  return ["root", "floor", "area", "building", "grounds", "property"];
}

export function isParentAllowed(childType: LocationType, parentType: ParentType): boolean {
  return getAllowedParentTypes(childType).includes(parentType);
}

/**
 * Validates if a move is physically possible and logically sound.
 * 1. Basic tree integrity (no self-parenting, no cycles)
 * 2. Type-level parent constraints:
 *    - floor -> root|building|property
 *    - building|grounds -> root|property
 *    - property -> root only
 */
export function canMoveLocation(params: {
  locations: Location[];
  locationId: string;
  newParentId: string | null;
}): boolean {
  const { locations, locationId, newParentId } = params;

  // Basic tree integrity
  if (newParentId === locationId) return false;
  if (newParentId && isDescendant(locations, locationId, newParentId)) return false;

  const byId = new Map(locations.map((l) => [l.id, l]));
  const movedLoc = byId.get(locationId);
  if (!movedLoc) return false;
  if (newParentId && !byId.get(newParentId)) return false;
  if (newParentId && byId.get(newParentId)?.is_explicit_root) return false;
  const childType = getLocationType(movedLoc);

  if (childType === "property") {
    return newParentId === null;
  }

  if (childType === "building" || childType === "grounds") {
    if (newParentId === null) return true;
    const parent = byId.get(newParentId);
    return parent ? getLocationType(parent) === "property" : false;
  }

  const parentType: ParentType =
    newParentId === null ? "root" : getLocationType(byId.get(newParentId) ?? ({} as Location));

  if (!isParentAllowed(childType, parentType)) {
    return false;
  }

  return true;
}

export function isDescendant(
  locations: Location[],
  ancestorId: string,
  candidateDescendantId: string
): boolean {
  if (ancestorId === candidateDescendantId) return false;
  const byId = new Map(locations.map((l) => [l.id, l]));
  let current = byId.get(candidateDescendantId);
  const guard = new Set<string>();
  while (current?.parent_id) {
    if (current.parent_id === ancestorId) return true;
    if (guard.has(current.parent_id)) return true; // cycle protection
    guard.add(current.parent_id);
    current = byId.get(current.parent_id);
  }
  return false;
}
