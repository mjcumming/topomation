/**
 * Explicit drop-zone model and resolver for tree DnD (C-011, ADR-HA-039).
 * No pointer/heuristic; intent = zone hovered.
 */
import type { Location } from "./types";

export type DropZone = "before" | "inside" | "after" | "outdent";

export interface FlatTreeNode {
  location: Location;
  depth: number;
  hasChildren: boolean;
  isExpanded: boolean;
}

const OUTDENT_STRIP_WIDTH_PX = 24;

function collectSubtreeIds(flatNodes: FlatTreeNode[], rootId: string): Set<string> {
  const ids = new Set<string>([rootId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const node of flatNodes) {
      const pid = node.location.parent_id;
      if (pid && ids.has(pid) && !ids.has(node.location.id)) {
        ids.add(node.location.id);
        changed = true;
      }
    }
  }
  return ids;
}

export function buildFlatTree(
  locations: Location[],
  expandedIds: Set<string>
): FlatTreeNode[] {
  const byId = new Map(locations.map((loc) => [loc.id, loc]));
  const byParent = new Map<string | null, Location[]>();

  const normalizedParentId = (loc: Location): string | null => {
    const parentId = loc.parent_id;
    if (!parentId) return null;
    if (parentId === loc.id) return null;
    if (!byId.has(parentId)) return null;
    return parentId;
  };

  for (const loc of locations) {
    const key = normalizedParentId(loc);
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(loc);
  }

  const result: FlatTreeNode[] = [];
  const visited = new Set<string>();
  const structurallyReachable = new Set<string>();

  const roots = byParent.get(null) || [];
  const structuralStack = [...roots];
  while (structuralStack.length) {
    const current = structuralStack.pop()!;
    if (structurallyReachable.has(current.id)) continue;
    structurallyReachable.add(current.id);
    for (const child of byParent.get(current.id) || []) {
      structuralStack.push(child);
    }
  }

  function traverse(parentId: string | null, depth: number): void {
    const children = byParent.get(parentId) || [];
    for (const loc of children) {
      if (visited.has(loc.id)) continue;
      visited.add(loc.id);
      const locChildren = byParent.get(loc.id) || [];
      const hasChildren = locChildren.length > 0;
      const isExpanded = expandedIds.has(loc.id);
      result.push({ location: loc, depth, hasChildren, isExpanded });
      if (isExpanded && hasChildren) traverse(loc.id, depth + 1);
    }
  }

  traverse(null, 0);

  // Best-effort safety: render structurally unreachable/cyclic nodes as roots
  // instead of hiding them. Do NOT re-add nodes hidden only by collapsed state.
  for (const loc of locations) {
    if (structurallyReachable.has(loc.id) || visited.has(loc.id)) continue;
    visited.add(loc.id);
    const locChildren = byParent.get(loc.id) || [];
    const hasChildren = locChildren.length > 0;
    const isExpanded = expandedIds.has(loc.id);
    result.push({ location: loc, depth: 0, hasChildren, isExpanded });
    if (isExpanded && hasChildren) traverse(loc.id, 1);
  }

  return result;
}

export function zoneFromPointerInRow(
  rowRect: DOMRect,
  clientX: number,
  clientY: number,
  isCurrentParentRow: boolean
): DropZone {
  if (isCurrentParentRow) {
    const leftEdge = rowRect.left;
    if (clientX >= leftEdge && clientX < leftEdge + OUTDENT_STRIP_WIDTH_PX) return "outdent";
  }
  const relY = clientY - rowRect.top;
  const third = rowRect.height / 3;
  if (relY < third) return "before";
  if (relY < 2 * third) return "inside";
  return "after";
}

export function resolveDropTargetFromZone(
  flatNodes: FlatTreeNode[],
  draggedId: string,
  currentParentId: string | null,
  relatedId: string,
  zone: DropZone
): { parentId: string | null; siblingIndex: number } {
  const subtreeIds = collectSubtreeIds(flatNodes, draggedId);
  const filtered = flatNodes.filter((n) => !subtreeIds.has(n.location.id));
  const relatedNode = filtered.find((n) => n.location.id === relatedId);
  if (!relatedNode) return { parentId: currentParentId, siblingIndex: 0 };

  const parentId =
    zone === "inside" ? relatedId : relatedNode.location.parent_id;
  const siblings = filtered.filter((n) => n.location.parent_id === parentId);
  const relatedSiblingIndex = siblings.findIndex((n) => n.location.id === relatedId);

  if (zone === "inside") return { parentId: relatedId, siblingIndex: siblings.length };
  if (zone === "before") return { parentId, siblingIndex: relatedSiblingIndex >= 0 ? relatedSiblingIndex : 0 };
  if (zone === "after") return { parentId, siblingIndex: Math.min(relatedSiblingIndex >= 0 ? relatedSiblingIndex + 1 : siblings.length, siblings.length) };
  return { parentId, siblingIndex: relatedSiblingIndex >= 0 ? relatedSiblingIndex : 0 };
}
