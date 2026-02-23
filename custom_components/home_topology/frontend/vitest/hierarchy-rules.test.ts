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

  it("allows moving an area under another area (nesting)", () => {
    const locations = [
      loc({ id: "room", name: "Living Room", parent_id: null, modules: { _meta: { type: "area" } } }),
      loc({ id: "zone", name: "Reading Nook", parent_id: null, modules: { _meta: { type: "area" } } }),
    ];

    expect(
      canMoveLocation({ locations, locationId: "zone", newParentId: "room" })
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
});


