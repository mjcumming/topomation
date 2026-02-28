import { describe, expect, it } from "vitest";
import type { Location } from "../types";
import { buildFlatTree, zoneFromPointerInRow, resolveDropTargetFromZone } from "../tree-dnd-zones";

const deepTreeLocations: Location[] = [
  { id: "house", name: "House", parent_id: null, is_explicit_root: true, ha_area_id: null, entity_ids: [], modules: { _meta: { type: "area" } } },
  { id: "main-floor", name: "Main Floor", parent_id: "house", is_explicit_root: false, ha_area_id: null, entity_ids: [], modules: { _meta: { type: "floor" } } },
  { id: "kitchen", name: "Kitchen", parent_id: "main-floor", is_explicit_root: false, ha_area_id: null, entity_ids: [], modules: { _meta: { type: "area" } } },
  { id: "living-room", name: "Living Room", parent_id: "main-floor", is_explicit_root: false, ha_area_id: null, entity_ids: [], modules: { _meta: { type: "area" } } },
  { id: "pantry", name: "Pantry", parent_id: "main-floor", is_explicit_root: false, ha_area_id: null, entity_ids: [], modules: { _meta: { type: "area" } } },
  { id: "pantry-shelf", name: "Shelf", parent_id: "pantry", is_explicit_root: false, ha_area_id: null, entity_ids: [], modules: { _meta: { type: "area" } } },
  { id: "top-shelf", name: "Top Shelf", parent_id: "pantry-shelf", is_explicit_root: false, ha_area_id: null, entity_ids: [], modules: { _meta: { type: "area" } } },
];

const floorTree: Location[] = [
  { id: "building", name: "Building", parent_id: null, is_explicit_root: false, ha_area_id: null, entity_ids: [], modules: { _meta: { type: "building" } } },
  { id: "ground-floor", name: "Ground Floor", parent_id: "building", is_explicit_root: false, ha_area_id: null, entity_ids: [], modules: { _meta: { type: "floor" } } },
  { id: "second-floor", name: "Second Floor", parent_id: "building", is_explicit_root: false, ha_area_id: null, entity_ids: [], modules: { _meta: { type: "floor" } } },
];

describe("resolveDropTargetFromZone", () => {
  it("before related row gives sibling under same parent", () => {
    const flatNodes = buildFlatTree(deepTreeLocations, new Set(["house", "main-floor", "kitchen", "pantry", "pantry-shelf"]));
    const result = resolveDropTargetFromZone(flatNodes, "top-shelf", "pantry-shelf", "living-room", "before");
    expect(result.parentId).toBe("main-floor");
    expect(result.siblingIndex).toBe(1);
  });

  it("inside zone makes related row the new parent", () => {
    const flatNodes = buildFlatTree(deepTreeLocations, new Set(["house", "main-floor", "kitchen", "pantry", "pantry-shelf"]));
    const result = resolveDropTargetFromZone(flatNodes, "top-shelf", "pantry-shelf", "living-room", "inside");
    expect(result.parentId).toBe("living-room");
    expect(result.siblingIndex).toBe(0);
  });

  it("after zone gives next sibling index", () => {
    const flatNodes = buildFlatTree(deepTreeLocations, new Set(["house", "main-floor", "kitchen", "pantry", "pantry-shelf"]));
    const result = resolveDropTargetFromZone(flatNodes, "top-shelf", "pantry-shelf", "living-room", "after");
    expect(result.parentId).toBe("main-floor");
    expect(result.siblingIndex).toBe(2);
  });

  it("outdent zone on current parent row moves to grandparent", () => {
    const movedTree: Location[] = [
      ...deepTreeLocations.filter((l) => l.id !== "top-shelf"),
      { id: "top-shelf", name: "Top Shelf", parent_id: "living-room", is_explicit_root: false, ha_area_id: null, entity_ids: [], modules: { _meta: { type: "area" } } },
    ];
    const flatNodes = buildFlatTree(movedTree, new Set(["house", "main-floor", "kitchen", "pantry", "pantry-shelf", "living-room"]));
    const result = resolveDropTargetFromZone(flatNodes, "top-shelf", "living-room", "living-room", "outdent");
    expect(result.parentId).toBe("main-floor");
  });

  it("inside zone on current parent row keeps as child", () => {
    const movedTree: Location[] = [
      ...deepTreeLocations.filter((l) => l.id !== "top-shelf"),
      { id: "top-shelf", name: "Top Shelf", parent_id: "living-room", is_explicit_root: false, ha_area_id: null, entity_ids: [], modules: { _meta: { type: "area" } } },
    ];
    const flatNodes = buildFlatTree(movedTree, new Set(["house", "main-floor", "kitchen", "pantry", "pantry-shelf", "living-room"]));
    const result = resolveDropTargetFromZone(flatNodes, "top-shelf", "living-room", "living-room", "inside");
    expect(result.parentId).toBe("living-room");
    expect(result.siblingIndex).toBe(0);
  });

  it("floor before another floor keeps parent building", () => {
    const flatNodes = buildFlatTree(floorTree, new Set(["building", "ground-floor", "second-floor"]));
    const result = resolveDropTargetFromZone(flatNodes, "second-floor", "building", "ground-floor", "before");
    expect(result.parentId).toBe("building");
  });
});

describe("zoneFromPointerInRow", () => {
  it("returns before/inside/after by Y third", () => {
    const row = new DOMRect(0, 0, 100, 30);
    expect(zoneFromPointerInRow(row, 50, 5, false)).toBe("before");
    expect(zoneFromPointerInRow(row, 50, 15, false)).toBe("inside");
    expect(zoneFromPointerInRow(row, 50, 25, false)).toBe("after");
  });

  it("returns outdent when over current parent left strip", () => {
    const row = new DOMRect(100, 0, 200, 36);
    expect(zoneFromPointerInRow(row, 110, 18, true)).toBe("outdent");
    expect(zoneFromPointerInRow(row, 130, 18, true)).toBe("inside");
  });
});

describe("buildFlatTree safety", () => {
  it("shows missing-parent nodes as root-level instead of dropping them", () => {
    const withOrphan: Location[] = [
      { id: "floor", name: "Floor", parent_id: null, is_explicit_root: false, ha_area_id: null, entity_ids: [], modules: { _meta: { type: "floor" } } },
      { id: "orphan", name: "Orphan", parent_id: "missing-parent", is_explicit_root: false, ha_area_id: null, entity_ids: [], modules: { _meta: { type: "area" } } },
    ];
    const flat = buildFlatTree(withOrphan, new Set(["floor", "orphan"]));
    const byId = new Map(flat.map((node) => [node.location.id, node]));
    expect(byId.get("orphan")?.depth).toBe(0);
  });

  it("breaks self-parent loops by rendering node at root", () => {
    const selfParent: Location[] = [
      { id: "self", name: "Self", parent_id: "self", is_explicit_root: false, ha_area_id: null, entity_ids: [], modules: { _meta: { type: "area" } } },
    ];
    const flat = buildFlatTree(selfParent, new Set(["self"]));
    expect(flat.length).toBe(1);
    expect(flat[0].location.id).toBe("self");
    expect(flat[0].depth).toBe(0);
  });
});
