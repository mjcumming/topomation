import type { Location, LocationType } from "./types";

export type ParentType = LocationType | "root";

export function getLocationType(loc: Location): LocationType {
  const metaType = (loc.modules?._meta?.type as LocationType | undefined) ?? "area";
  return metaType;
}

/**
 * Returns allowed parent types for a given location type.
 * Used by the Location Dialog to filter the parent dropdown.
 */
export function getAllowedParentTypes(childType: LocationType): ParentType[] {
  // UI hierarchy rules:
  // Floor: top-level only (under explicit root if present, otherwise root/null).
  // Area: can be under root, floor, or area.
  if (childType === "floor") {
    return ["root"];
  }
  return ["root", "floor", "area"];
}

export function isParentAllowed(childType: LocationType, parentType: ParentType): boolean {
  return getAllowedParentTypes(childType).includes(parentType);
}

/**
 * Validates if a move is physically possible and logically sound.
 * 1. Basic tree integrity (no self-parenting, no cycles)
 * 2. Floor cannot be child of another Floor.
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

  const childType = getLocationType(movedLoc);

  // Floors are top-level only:
  // - if explicit root exists (e.g. "House"), floor parent must be that root
  // - otherwise floor parent must be root/null
  if (childType === "floor") {
    const explicitRoot = locations.find((l) => l.is_explicit_root);
    if (explicitRoot) return newParentId === explicitRoot.id;
    return newParentId === null;
  }

  const parentType: ParentType =
    newParentId === null ? "root" : getLocationType(byId.get(newParentId) ?? ({} as Location));

  return isParentAllowed(childType, parentType);
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
