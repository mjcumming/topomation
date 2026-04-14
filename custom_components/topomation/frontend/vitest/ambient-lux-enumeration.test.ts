import { describe, expect, it } from "vitest";
import { ambientLuxEnumerationHaAreaIds } from "../ambient-lux-enumeration";

describe("ambientLuxEnumerationHaAreaIds", () => {
  it("returns only core ids when not a structural host (no name-matched HA areas)", () => {
    expect(
      ambientLuxEnumerationHaAreaIds({
        coreHaAreaIds: ["kitchen_ha"],
        includeNameMatchedHomeAssistantAreas: false,
        hostDisplayName: "Kitchen",
        hassAreas: {
          queen: { area_id: "queen_ha", name: "Kitchen" },
        },
      })
    ).to.deep.equal(["kitchen_ha"]);
  });

  it("adds HA areas whose registry name matches the host display name (case-insensitive)", () => {
    const out = ambientLuxEnumerationHaAreaIds({
      coreHaAreaIds: ["shadow_internal"],
      includeNameMatchedHomeAssistantAreas: true,
      hostDisplayName: "Queen",
      hassAreas: {
        a: { area_id: "queen_native", name: "Queen" },
        b: { area_id: "basement_ha", name: "Basement" },
      },
    });
    expect(out.sort()).to.deep.equal(["queen_native", "shadow_internal"].sort());
  });

  it("matches when host name casing differs from HA area name", () => {
    expect(
      ambientLuxEnumerationHaAreaIds({
        coreHaAreaIds: [],
        includeNameMatchedHomeAssistantAreas: true,
        hostDisplayName: "queen",
        hassAreas: {
          x: { area_id: "area_1", name: "Queen" },
        },
      })
    ).to.deep.equal(["area_1"]);
  });

  it("does not add name-matched areas when host display name is blank", () => {
    expect(
      ambientLuxEnumerationHaAreaIds({
        coreHaAreaIds: ["only_core"],
        includeNameMatchedHomeAssistantAreas: true,
        hostDisplayName: "   ",
        hassAreas: {
          x: { area_id: "queen_ha", name: "Queen" },
        },
      })
    ).to.deep.equal(["only_core"]);
  });

  it("treats missing hass.areas like no name matches", () => {
    expect(
      ambientLuxEnumerationHaAreaIds({
        coreHaAreaIds: ["core"],
        includeNameMatchedHomeAssistantAreas: true,
        hostDisplayName: "Queen",
        hassAreas: undefined,
      })
    ).to.deep.equal(["core"]);
  });

  it("dedupes when core already contains a name-matched area id", () => {
    expect(
      ambientLuxEnumerationHaAreaIds({
        coreHaAreaIds: ["queen_ha", "shadow_ha"],
        includeNameMatchedHomeAssistantAreas: true,
        hostDisplayName: "Queen",
        hassAreas: {
          reg: { area_id: "queen_ha", name: "Queen" },
        },
      }).sort()
    ).to.deep.equal(["queen_ha", "shadow_ha"].sort());
  });

  it("ignores area entries with empty area_id or missing name", () => {
    expect(
      ambientLuxEnumerationHaAreaIds({
        coreHaAreaIds: [],
        includeNameMatchedHomeAssistantAreas: true,
        hostDisplayName: "Queen",
        hassAreas: {
          bad1: { area_id: "", name: "Queen" },
          bad2: { area_id: "x", name: "" },
          good: { area_id: "ok", name: "Queen" },
        },
      })
    ).to.deep.equal(["ok"]);
  });
});
