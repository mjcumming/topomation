/// <reference types="mocha" />
import { expect } from "@open-wc/testing";
import { buildOccupancyReasonLine } from "./occupancy-reason";
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
        "binary_sensor.kitchen_occupancy": {
          entity_id: "binary_sensor.kitchen_occupancy",
          state: "on",
          last_changed: tMinus(120),
          attributes: {
            device_class: "occupancy",
            location_id: "kitchen",
            reason: "event:trigger",
            contributions: [
              {
                source_id: "binary_sensor.kitchen_motion",
                state: "active",
                updated_at: tMinus(120),
              },
            ],
          },
        },
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

    const hass = makeHass({
      states: {
        "binary_sensor.kitchen_occupancy": {
          entity_id: "binary_sensor.kitchen_occupancy",
          state: "on",
          last_changed: tMinus(480),
          attributes: {
            device_class: "occupancy",
            location_id: "kitchen",
            contributions: [
              {
                source_id: "linked:dining_room",
                state: "active",
                updated_at: tMinus(480),
              },
            ],
          },
        },
      } as any,
    });

    const line = buildOccupancyReasonLine({
      location: kitchen,
      locations: [kitchen, dining],
      hass,
      occupancyStates: { kitchen: true, dining_room: true },
      occupancyTransitions: {},
      status: "occupied",
      nowMs: NOW,
    });

    expect(line).to.include("Occupied");
    expect(line).to.include("linked from Dining Room");
  });

  it("describes vacancy timeouts", () => {
    const location = makeLocation({ id: "kitchen" });
    const hass = makeHass({
      states: {
        "binary_sensor.kitchen_occupancy": {
          entity_id: "binary_sensor.kitchen_occupancy",
          state: "off",
          last_changed: tMinus(600),
          attributes: {
            device_class: "occupancy",
            location_id: "kitchen",
            reason: "timeout",
            contributions: [],
          },
        },
      } as any,
    });

    const line = buildOccupancyReasonLine({
      location,
      locations: [location],
      hass,
      occupancyStates: { kitchen: false },
      occupancyTransitions: {},
      status: "vacant",
      nowMs: NOW,
    });

    expect(line).to.equal("Vacant · timed out (10m)");
  });

  it("describes parent propagation vacancy", () => {
    const location = makeLocation({ id: "kitchen" });
    const hass = makeHass({
      states: {
        "binary_sensor.kitchen_occupancy": {
          entity_id: "binary_sensor.kitchen_occupancy",
          state: "off",
          last_changed: tMinus(30),
          attributes: {
            device_class: "occupancy",
            location_id: "kitchen",
            reason: "propagation:parent",
            contributions: [],
          },
        },
      } as any,
    });

    const line = buildOccupancyReasonLine({
      location,
      locations: [location],
      hass,
      occupancyStates: { kitchen: false },
      occupancyTransitions: {},
      status: "vacant",
      nowMs: NOW,
    });

    expect(line).to.include("parent location cleared");
  });

  it("rolls up to an occupied descendant when the location has no direct state", () => {
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
      occupancyStates: { kitchen: true },
      occupancyTransitions: {},
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
});
