import { describe, expect, it } from "vitest";
import type { Location } from "../types";
import { canMoveLocation } from "../hierarchy-rules";

function loc(overrides: Partial<Location>): Location {
  return {
    id: "id",
    name: "Name",
    parent_id: null,
    is_explicit_root: false,
    entity_ids: [],
    modules: { _meta: { type: "area" } },
    ...overrides,
  };
}

describe("hierarchy-rules", () => {
  it("allows moving an area under a floor", () => {
    const locations = [
      loc({ id: "floor", name: "Main Floor", parent_id: null, modules: { _meta: { type: "floor" } } }),
      loc({ id: "area", name: "Kitchen", parent_id: null, modules: { _meta: { type: "area" } } }),
    ];

    expect(
      canMoveLocation({ locations, locationId: "area", newParentId: "floor" })
    ).toBe(true);
  });

  it("blocks moving a node under explicit Home root", () => {
    const locations = [
      loc({
        id: "home",
        name: "Home",
        parent_id: null,
        is_explicit_root: true,
        modules: { _meta: { type: "building" } },
      }),
      loc({ id: "area", name: "Kitchen", parent_id: null, modules: { _meta: { type: "area" } } }),
    ];

    expect(
      canMoveLocation({ locations, locationId: "area", newParentId: "home" })
    ).toBe(false);
  });

  it("blocks moving a floor under an area", () => {
    const locations = [
      loc({ id: "floor", name: "Main Floor", parent_id: null, modules: { _meta: { type: "floor" } } }),
      loc({ id: "area", name: "Kitchen", parent_id: null, modules: { _meta: { type: "area" } } }),
    ];

    expect(
      canMoveLocation({ locations, locationId: "floor", newParentId: "area" })
    ).toBe(false);
  });

  it("blocks moving a floor under another floor", () => {
    const locations = [
      loc({ id: "floor1", name: "Main Floor", parent_id: null, modules: { _meta: { type: "floor" } } }),
      loc({ id: "floor2", name: "Second Floor", parent_id: null, modules: { _meta: { type: "floor" } } }),
    ];

    expect(
      canMoveLocation({ locations, locationId: "floor2", newParentId: "floor1" })
    ).toBe(false);
  });

  it("allows moving a floor under a building", () => {
    const locations = [
      loc({ id: "building", name: "Main Building", parent_id: null, modules: { _meta: { type: "building" } } }),
      loc({ id: "floor", name: "Main Floor", parent_id: null, modules: { _meta: { type: "floor" } } }),
    ];

    expect(
      canMoveLocation({ locations, locationId: "floor", newParentId: "building" })
    ).toBe(true);
  });

  it("allows keeping a floor at root", () => {
    const locations = [
      loc({ id: "floor", name: "Main Floor", parent_id: null, modules: { _meta: { type: "floor" } } }),
    ];

    expect(
      canMoveLocation({ locations, locationId: "floor", newParentId: null })
    ).toBe(true);
  });

  it("blocks moving a floor under grounds", () => {
    const locations = [
      loc({ id: "grounds", name: "Grounds", parent_id: null, modules: { _meta: { type: "grounds" } } }),
      loc({ id: "floor", name: "Main Floor", parent_id: null, modules: { _meta: { type: "floor" } } }),
    ];

    expect(
      canMoveLocation({ locations, locationId: "floor", newParentId: "grounds" })
    ).toBe(false);
  });

  it("blocks reparenting a location that has children", () => {
    const locations = [
      loc({ id: "building_a", name: "Building A", parent_id: null, modules: { _meta: { type: "building" } } }),
      loc({ id: "building_b", name: "Building B", parent_id: null, modules: { _meta: { type: "building" } } }),
      loc({ id: "floor_a", name: "Floor A", parent_id: "building_a", modules: { _meta: { type: "floor" } } }),
      loc({ id: "area_a", name: "Area A", parent_id: "floor_a", modules: { _meta: { type: "area" } } }),
    ];

    expect(
      canMoveLocation({ locations, locationId: "floor_a", newParentId: "building_b" })
    ).toBe(false);
  });

  it("blocks moving a building under a floor (root-only type)", () => {
    const locations = [
      loc({ id: "building", name: "Main Building", parent_id: null, modules: { _meta: { type: "building" } } }),
      loc({ id: "floor", name: "Main Floor", parent_id: null, modules: { _meta: { type: "floor" } } }),
    ];

    expect(
      canMoveLocation({ locations, locationId: "building", newParentId: "floor" })
    ).toBe(false);
  });

  it("allows keeping a building at root", () => {
    const locations = [
      loc({ id: "building", name: "Main Building", parent_id: null, modules: { _meta: { type: "building" } } }),
    ];

    expect(
      canMoveLocation({ locations, locationId: "building", newParentId: null })
    ).toBe(true);
  });

  it("blocks moving grounds under an area (root-only type)", () => {
    const locations = [
      loc({ id: "grounds", name: "Grounds", parent_id: null, modules: { _meta: { type: "grounds" } } }),
      loc({ id: "area", name: "Kitchen", parent_id: null, modules: { _meta: { type: "area" } } }),
    ];

    expect(
      canMoveLocation({ locations, locationId: "grounds", newParentId: "area" })
    ).toBe(false);
  });

  it("allows moving a subarea under an area", () => {
    const locations = [
      loc({ id: "area", name: "Kitchen", parent_id: null, modules: { _meta: { type: "area" } } }),
      loc({ id: "subarea", name: "Pantry", parent_id: null, modules: { _meta: { type: "subarea" } } }),
    ];

    expect(
      canMoveLocation({ locations, locationId: "subarea", newParentId: "area" })
    ).toBe(true);
  });

  it("allows moving an area under a building", () => {
    const locations = [
      loc({ id: "building", name: "Main Building", parent_id: null, modules: { _meta: { type: "building" } } }),
      loc({ id: "area", name: "Kitchen", parent_id: null, modules: { _meta: { type: "area" } } }),
    ];

    expect(
      canMoveLocation({ locations, locationId: "area", newParentId: "building" })
    ).toBe(true);
  });

  it("allows moving an area under another area (nesting)", () => {
    const locations = [
      loc({ id: "room", name: "Living Room", parent_id: null, modules: { _meta: { type: "area" } } }),
      loc({ id: "zone", name: "Reading Nook", parent_id: null, modules: { _meta: { type: "area" } } }),
    ];

    expect(
      canMoveLocation({ locations, locationId: "zone", newParentId: "room" })
    ).toBe(true);
  });

  it("allows moving an HA-backed area to root (no floor)", () => {
    const locations = [
      loc({ id: "floor", name: "Main Floor", parent_id: null, modules: { _meta: { type: "floor" } } }),
      loc({
        id: "area",
        name: "Kitchen",
        parent_id: "floor",
        ha_area_id: "kitchen",
        modules: { _meta: { type: "area", ha_floor_id: "main_floor" } as any },
      }),
    ];

    expect(
      canMoveLocation({ locations, locationId: "area", newParentId: null })
    ).toBe(true);
  });

  it("blocks moving a node into its own descendant (cycle prevention)", () => {
    const locations = [
      loc({ id: "room", name: "Kitchen", parent_id: null, modules: { _meta: { type: "area" } } }),
      loc({ id: "zone", name: "Pantry", parent_id: "room", modules: { _meta: { type: "area" } } }),
    ];

    expect(
      canMoveLocation({ locations, locationId: "room", newParentId: "zone" })
    ).toBe(false);
  });

  it("treats legacy room type as area for hierarchy checks", () => {
    const locations = [
      loc({ id: "legacy_room", name: "Legacy Room", parent_id: null, modules: { _meta: { type: "room" } as any } }),
      loc({ id: "area", name: "Area", parent_id: null, modules: { _meta: { type: "area" } } }),
    ];

    expect(
      canMoveLocation({ locations, locationId: "legacy_room", newParentId: "area" })
    ).toBe(true);
  });
});
