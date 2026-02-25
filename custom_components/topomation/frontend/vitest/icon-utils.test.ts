import { describe, expect, it } from "vitest";
import type { Location } from "../types";
import { getLocationIcon } from "../icon-utils";

function loc(overrides: Partial<Location>): Location {
  return {
    id: "id",
    name: "Name",
    parent_id: null,
    is_explicit_root: false,
    entity_ids: [],
    modules: { _meta: { type: "room" } },
    ...overrides,
  };
}

describe("icon-utils", () => {
  it("prefers explicit _meta.icon", () => {
    const kitchen = loc({
      name: "Kitchen",
      modules: { _meta: { type: "room", icon: "mdi:silverware-fork-knife" } },
    });
    expect(getLocationIcon(kitchen)).toBe("mdi:silverware-fork-knife");
  });

  it("falls back to category inference from name", () => {
    const kitchen = loc({
      name: "Kitchen",
      modules: { _meta: { type: "area" } },
    });
    expect(getLocationIcon(kitchen)).toBe("mdi:silverware-fork-knife");
  });

  it("falls back to type icon when no override or category match", () => {
    const unknown = loc({
      name: "Atrium",
      modules: { _meta: { type: "floor" } },
    });
    expect(getLocationIcon(unknown)).toBe("mdi:layers");
  });

  it("falls back to building icon for building nodes", () => {
    const building = loc({
      name: "Main Building",
      modules: { _meta: { type: "building" } as any },
    });
    expect(getLocationIcon(building)).toBe("mdi:office-building");
  });
});

