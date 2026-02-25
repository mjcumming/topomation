import { describe, expect, it } from "vitest";
import type { Location } from "../types";
import { moveLocation } from "../tree-utils";

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

describe("tree-utils", () => {
  it("updates parent_id when moving", () => {
    const locations = [
      loc({ id: "floor", parent_id: null, modules: { _meta: { type: "floor" } } }),
      loc({ id: "area1", parent_id: "floor", name: "Area 1", modules: { _meta: { type: "area" } } }),
      loc({ id: "area2", parent_id: "floor", name: "Area 2", modules: { _meta: { type: "area" } } }),
    ];

    const next = moveLocation({ locations, locationId: "area1", newParentId: null, newIndex: 0 });
    const moved = next.find((l) => l.id === "area1")!;
    expect(moved.parent_id).toBeNull();
  });

  it("reorders among siblings by newIndex (flat-array ordering)", () => {
    const locations = [
      loc({ id: "floor", parent_id: null, modules: { _meta: { type: "floor" } } }),
      loc({ id: "area1", parent_id: "floor", name: "Area 1", modules: { _meta: { type: "area" } } }),
      loc({ id: "area2", parent_id: "floor", name: "Area 2", modules: { _meta: { type: "area" } } }),
      loc({ id: "area3", parent_id: "floor", name: "Area 3", modules: { _meta: { type: "area" } } }),
    ];

    // Move area3 to index 0 among floor's children
    const next = moveLocation({ locations, locationId: "area3", newParentId: "floor", newIndex: 0 });
    const children = next.filter((l) => l.parent_id === "floor").map((l) => l.id);
    expect(children[0]).toBe("area3");
  });
});


