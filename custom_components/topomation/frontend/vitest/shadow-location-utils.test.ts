import { describe, expect, it } from "vitest";
import type { Location } from "../types";
import { effectiveOccupancyTopologyId } from "../shadow-location-utils";

const shadowChild: Location = {
  id: "area_shadow_1",
  name: "Queen [Topomation]",
  parent_id: "prop_queen",
  is_explicit_root: false,
  entity_ids: [],
  ha_area_id: "ha_area_uuid",
  modules: {
    _meta: { type: "area", role: "managed_shadow", shadow_for_location_id: "prop_queen" },
  },
};

const propertyHost: Location = {
  id: "prop_queen",
  name: "Queen",
  parent_id: null,
  is_explicit_root: false,
  entity_ids: [],
  modules: {
    _meta: { type: "property", shadow_area_id: "area_shadow_1" },
  },
};

describe("effectiveOccupancyTopologyId", () => {
  it("returns shadow child id for managed-shadow property host when shadow exists", () => {
    expect(effectiveOccupancyTopologyId(propertyHost, [propertyHost, shadowChild])).toBe("area_shadow_1");
  });

  it("returns host id when shadow metadata missing", () => {
    const hostNoShadow: Location = {
      ...propertyHost,
      modules: { _meta: { type: "property" } },
    };
    expect(effectiveOccupancyTopologyId(hostNoShadow, [hostNoShadow])).toBe("prop_queen");
  });

  it("returns host id when shadow row not in allLocations", () => {
    expect(effectiveOccupancyTopologyId(propertyHost, [propertyHost])).toBe("prop_queen");
  });

  it("returns room id for normal area (non-host)", () => {
    const room: Location = {
      id: "room_kitchen",
      name: "Kitchen",
      parent_id: "floor_1",
      is_explicit_root: false,
      entity_ids: [],
      modules: { _meta: { type: "area" } },
    };
    expect(effectiveOccupancyTopologyId(room, [room])).toBe("room_kitchen");
  });

  it("returns host id for explicit root even if typed as property", () => {
    const rootProp: Location = {
      ...propertyHost,
      is_explicit_root: true,
    };
    expect(effectiveOccupancyTopologyId(rootProp, [rootProp, shadowChild])).toBe("prop_queen");
  });
});
