import type { Location } from "./types";

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function parentKey(loc: Location): string {
  // Keep root vs unassigned distinct (matches existing rendering behavior).
  if (loc.parent_id === null) return loc.is_explicit_root ? "__root__" : "__unassigned__";
  return loc.parent_id;
}

/**
 * Reorders and/or reparents a location inside the single `locations[]` array.
 *
 * Important: the current UI uses `locations.filter(parent_id === X)` to render
 * children, so sibling ordering is derived from the order of the flat array.
 */
export function moveLocation(params: {
  locations: Location[];
  locationId: string;
  newParentId: string | null;
  newIndex: number;
}): Location[] {
  const { locations, locationId, newParentId, newIndex } = params;
  const idx = locations.findIndex((l) => l.id === locationId);
  if (idx === -1) return locations;

  const original = locations[idx];
  const updated: Location = {
    ...original,
    parent_id: newParentId,
    // Preserve explicit-root-ness only if it is still at root.
    is_explicit_root: newParentId === null ? original.is_explicit_root : false,
  };

  const without = locations.filter((l) => l.id !== locationId);

  // Build sibling list for the destination parent based on current ordering.
  const destKey = parentKey(updated);
  const destSiblings = without.filter((l) => parentKey(l) === destKey);

  const insertAt = clamp(newIndex, 0, destSiblings.length);

  // Find absolute insertion index in the flat list:
  // - If there are destination siblings, insert relative to them.
  // - Otherwise, insert after the last item belonging to the same parent group.
  let absoluteInsertIndex = without.length;

  if (destSiblings.length > 0) {
    const referenceSibling = destSiblings[insertAt] ?? destSiblings[destSiblings.length - 1];
    const refIdx = without.findIndex((l) => l.id === referenceSibling.id);
    absoluteInsertIndex = insertAt >= destSiblings.length ? refIdx + 1 : refIdx;
  } else {
    // Insert at end of the group.
    let lastIdx = -1;
    for (let i = 0; i < without.length; i++) {
      if (parentKey(without[i]) === destKey) lastIdx = i;
    }
    absoluteInsertIndex = lastIdx === -1 ? without.length : lastIdx + 1;
  }

  const next = [...without];
  next.splice(absoluteInsertIndex, 0, updated);
  return next;
}


