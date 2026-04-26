/// <reference types="mocha" />
import { expect } from "@open-wc/testing";
import { buildOccupancyExplanation, buildOccupancyReasonLine } from "./occupancy-reason";
import type { HomeAssistant, Location } from "./types";

function makeLocation(overrides: Partial<Location> & { id: string }): Location {
  return {
    name: overrides.id,
    parent_id: null,
    is_explicit_root: false,
    entity_ids: [],
    modules: { _meta: { type: "area" } },
    ...overrides,
  } as Location;
}

function makeHass(overrides: Partial<HomeAssistant> = {}): HomeAssistant {
  return {
    states: {},
    areas: {},
    floors: {},
    callWS: async () => ({}),
    callService: async () => ({}),
    connection: {} as any,
    config: {} as any,
    localize: (k: string) => k,
    ...overrides,
  } as HomeAssistant;
}

function runtimeState(
  locationId: string,
  state: "on" | "off",
  lastChanged: string,
  attributes: Record<string, any> = {}
): Record<string, any> {
  return {
    entity_id: `binary_sensor.topomation_occupancy_projection_${locationId}`,
    state,
    last_changed: lastChanged,
    last_updated: lastChanged,
    attributes: {
      device_class: "occupancy",
      location_id: locationId,
      ...attributes,
    },
  };
}

describe("buildOccupancyReasonLine", () => {
  const NOW = Date.parse("2026-04-23T12:00:00Z");
  const tMinus = (seconds: number) =>
    new Date(NOW - seconds * 1000).toISOString();

  it("returns 'Occupancy unknown' when status is unknown", () => {
    const location = makeLocation({ id: "kitchen" });
    const line = buildOccupancyReasonLine({
      location,
      locations: [location],
      hass: makeHass(),
      occupancyStates: {},
      occupancyTransitions: {},
      status: "unknown",
      nowMs: NOW,
    });
    expect(line).to.equal("Occupancy unknown");
  });

  it("names the active sensor when occupied by a direct source", () => {
    const location = makeLocation({
      id: "kitchen",
      modules: {
        _meta: { type: "area" },
        occupancy: {
          enabled: true,
          default_timeout: 300,
          occupancy_sources: [],
        },
      },
    });
    const hass = makeHass({
      states: {
        "binary_sensor.kitchen_motion": {
          entity_id: "binary_sensor.kitchen_motion",
          state: "on",
          attributes: { friendly_name: "Kitchen Motion" },
        },
      } as any,
    });

    const line = buildOccupancyReasonLine({
      location,
      locations: [location],
      hass,
      occupancyStates: { kitchen: true },
      occupancyTransitions: {},
      occupancyRuntimeStates: {
        kitchen: runtimeState("kitchen", "on", tMinus(120), {
          reason: "event:trigger",
          contributions: [
            {
              source_id: "binary_sensor.kitchen_motion",
              state: "active",
              updated_at: tMinus(120),
            },
          ],
        }),
      },
      status: "occupied",
      nowMs: NOW,
    });

    expect(line).to.include("Occupied");
    expect(line).to.include("Kitchen Motion");
    expect(line).to.include("2m");
  });

  it("renders linked occupancy as 'linked from <name>'", () => {
    const kitchen = makeLocation({
      id: "kitchen",
      modules: {
        _meta: { type: "area" },
        occupancy: { enabled: true, default_timeout: 300, occupancy_sources: [] },
      },
    });
    const dining = makeLocation({ id: "dining_room", name: "Dining Room" });

    const line = buildOccupancyReasonLine({
      location: kitchen,
      locations: [kitchen, dining],
      hass: makeHass(),
      occupancyStates: { kitchen: true, dining_room: true },
      occupancyTransitions: {},
      occupancyRuntimeStates: {
        kitchen: runtimeState("kitchen", "on", tMinus(480), {
          contributions: [
            {
              source_id: "linked:dining_room",
              state: "active",
              updated_at: tMinus(480),
            },
          ],
        }),
      },
      status: "occupied",
      nowMs: NOW,
    });

    expect(line).to.include("Occupied");
    expect(line).to.include("linked from Dining Room");
  });

  it("describes vacancy timeouts", () => {
    const location = makeLocation({ id: "kitchen" });
    const line = buildOccupancyReasonLine({
      location,
      locations: [location],
      hass: makeHass(),
      occupancyStates: { kitchen: false },
      occupancyTransitions: {},
      occupancyRuntimeStates: {
        kitchen: runtimeState("kitchen", "off", tMinus(600), {
          reason: "timeout",
          contributions: [],
        }),
      },
      status: "vacant",
      nowMs: NOW,
    });

    expect(line).to.equal("Vacant · timed out (10m)");
  });

  it("describes parent propagation vacancy", () => {
    const location = makeLocation({ id: "kitchen" });
    const line = buildOccupancyReasonLine({
      location,
      locations: [location],
      hass: makeHass(),
      occupancyStates: { kitchen: false },
      occupancyTransitions: {},
      occupancyRuntimeStates: {
        kitchen: runtimeState("kitchen", "off", tMinus(30), {
          reason: "propagation:parent",
          contributions: [],
        }),
      },
      status: "vacant",
      nowMs: NOW,
    });

    expect(line).to.include("parent location cleared");
  });

  it("uses the backend structural projection for occupied descendants", () => {
    const mainFloor = makeLocation({
      id: "main_floor",
      name: "Main Floor",
      modules: { _meta: { type: "floor" } },
    });
    const kitchen = makeLocation({
      id: "kitchen",
      name: "Kitchen",
      parent_id: "main_floor",
    });

    const line = buildOccupancyReasonLine({
      location: mainFloor,
      locations: [mainFloor, kitchen],
      hass: makeHass(),
      occupancyStates: { main_floor: true, kitchen: true },
      occupancyTransitions: {},
      occupancyRuntimeStates: {
        main_floor: runtimeState("main_floor", "on", tMinus(45), {
          contributions: [
            {
              source_id: "__child__:kitchen",
              state: "active",
              updated_at: tMinus(45),
            },
          ],
        }),
      },
      status: "occupied",
      nowMs: NOW,
    });

    expect(line).to.include("Occupied");
    expect(line).to.include("Kitchen is occupied");
  });

  it("falls back to 'Occupied' with no details when nothing is derivable", () => {
    const location = makeLocation({ id: "kitchen" });
    const line = buildOccupancyReasonLine({
      location,
      locations: [location],
      hass: makeHass(),
      occupancyStates: { kitchen: true },
      occupancyTransitions: {},
      status: "occupied",
      nowMs: NOW,
    });
    expect(line).to.equal("Occupied");
  });

  it("builds a human summary and click-away details for occupied sources", () => {
    const location = makeLocation({
      id: "kitchen",
      modules: {
        _meta: { type: "area" },
        occupancy: {
          enabled: true,
          default_timeout: 300,
          occupancy_sources: [],
        },
      },
    });
    const hass = makeHass({
      states: {
        "binary_sensor.kitchen_motion": {
          entity_id: "binary_sensor.kitchen_motion",
          state: "on",
          attributes: { friendly_name: "Kitchen Motion" },
        },
      } as any,
    });

    const explanation = buildOccupancyExplanation({
      location,
      locations: [location],
      hass,
      occupancyStates: { kitchen: true },
      occupancyTransitions: {},
      occupancyRuntimeStates: {
        kitchen: runtimeState("kitchen", "on", tMinus(60), {
          vacant_at: new Date(NOW + 240 * 1000).toISOString(),
          contributions: [
            {
              source_id: "binary_sensor.kitchen_motion",
              state: "active",
              updated_at: tMinus(60),
            },
          ],
        }),
      },
      status: "occupied",
      nowMs: NOW,
    });

    expect(explanation.summary).to.equal("Occupied because Kitchen Motion is active.");
    expect(explanation.details.join(" ")).to.include("Active source: Kitchen Motion");
    expect(explanation.details.join(" ")).to.include("hold timer expires in 4m");
  });

  it("builds a human vacancy summary", () => {
    const location = makeLocation({ id: "kitchen" });
    const explanation = buildOccupancyExplanation({
      location,
      locations: [location],
      hass: makeHass(),
      occupancyStates: { kitchen: false },
      occupancyTransitions: {},
      occupancyRuntimeStates: {
        kitchen: runtimeState("kitchen", "off", tMinus(30), {
          reason: "timeout",
        }),
      },
      status: "vacant",
      nowMs: NOW,
    });

    expect(explanation.summary).to.equal("Vacant because the hold timer expired.");
    expect(explanation.details.join(" ")).to.include("No active occupancy sources");
  });
});
