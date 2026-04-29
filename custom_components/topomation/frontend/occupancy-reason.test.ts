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

  it("treats indefinite active contributions as current holders", () => {
    const location = makeLocation({ id: "kitchen" });
    const hass = makeHass({
      states: {
        "binary_sensor.kitchen_presence": {
          entity_id: "binary_sensor.kitchen_presence",
          state: "on",
          attributes: { friendly_name: "Kitchen Presence" },
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
        kitchen: runtimeState("kitchen", "on", tMinus(90), {
          contributions: [
            {
              source_id: "binary_sensor.kitchen_presence",
              expires_at: null,
            },
          ],
        }),
      },
      status: "occupied",
      nowMs: NOW,
    });

    expect(explanation.summary).to.equal("Occupied because Kitchen Presence is active.");
    expect(explanation.details.join(" ")).to.include("Stays occupied until the active source clears");
  });

  it("uses structured group contribution provenance for occupied summaries", () => {
    const frontEntry = makeLocation({
      id: "front_entry",
      name: "Front Entry",
      modules: {
        _meta: { type: "area" },
        occupancy: { enabled: true, default_timeout: 300, occupancy_sources: [] },
      },
    });
    const kitchen = makeLocation({
      id: "kitchen",
      name: "Kitchen",
      modules: {
        _meta: { type: "area" },
        occupancy: {
          enabled: true,
          default_timeout: 300,
          occupancy_sources: [{ entity_id: "binary_sensor.kitchen_motion", mode: "specific_states" }],
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
      location: frontEntry,
      locations: [frontEntry, kitchen],
      hass,
      occupancyStates: { front_entry: true, kitchen: true },
      occupancyTransitions: {},
      occupancyRuntimeStates: {
        front_entry: runtimeState("front_entry", "on", tMinus(30), {
          explanation: {
            version: 1,
            basis: "occupancy_group",
            projected_from: {
              kind: "occupancy_group",
              group_id: "main_open_area",
              members: ["front_entry", "kitchen"],
            },
            held_by: [
              {
                kind: "source",
                source_id: "__group_member__:kitchen::binary_sensor.kitchen_motion",
                origin_location_id: "kitchen",
                origin_source_id: "binary_sensor.kitchen_motion",
                via_occupancy_group: "main_open_area",
                expires_at: null,
              },
            ],
            latest_transition: {
              event: "occupied",
              cause: "trigger",
              source_id: "__group_member__:kitchen::binary_sensor.kitchen_motion",
              origin_location_id: "kitchen",
              origin_source_id: "binary_sensor.kitchen_motion",
              changed_at: tMinus(30),
            },
          },
        }),
      },
      status: "occupied",
      nowMs: NOW,
    });

    expect(explanation.summary).to.equal("Occupied because Kitchen Motion in Kitchen is active.");
    expect(explanation.details.join(" ")).to.include("Active holder: Kitchen Motion in Kitchen");
    expect(explanation.details.join(" ")).to.include(
      "Latest event: Kitchen Motion in Kitchen reported activity"
    );
  });

  it("keeps raw occupancy group ids out of occupied summaries", () => {
    const basement = makeLocation({
      id: "floor_basement",
      name: "Basement",
      modules: { _meta: { type: "floor" } },
    });

    const explanation = buildOccupancyExplanation({
      location: basement,
      locations: [basement],
      hass: makeHass(),
      occupancyStates: { floor_basement: true },
      occupancyTransitions: {},
      occupancyRuntimeStates: {
        floor_basement: runtimeState("floor_basement", "on", tMinus(16), {
          contributions: [
            {
              source_id: "occupancy_group:floor_basement_group_mnx5tasf_41hvss",
              state: "active",
              expires_at: null,
              updated_at: tMinus(16),
            },
          ],
        }),
      },
      status: "occupied",
      nowMs: NOW,
    });

    expect(explanation.summary).to.equal("Occupied because the occupancy group is occupied.");
    expect(explanation.reasonLine).to.include("occupancy group");
    expect(explanation.summary).not.to.include("Mnx5tasf");
    expect(explanation.summary).not.to.include(":Floor");
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

  it("builds a human summary and structured details for occupied sources", () => {
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
    expect(explanation.detailSections[0].title).to.equal("Active source");
    expect(explanation.detailSections[0].items?.[0]).to.include("Kitchen Motion");
    expect(explanation.detailSections[1].title).to.equal("Next change");
  });

  it("keeps crowded active source details structured and capped", () => {
    const location = makeLocation({ id: "family_room" });
    const sourceIds = Array.from(
      { length: 6 },
      (_, index) => `binary_sensor.family_room_source_${index + 1}`
    );
    const hass = makeHass({
      states: Object.fromEntries(
        sourceIds.map((entityId, index) => [
          entityId,
          {
            entity_id: entityId,
            state: "on",
            attributes: { friendly_name: `Family Room Source ${index + 1}` },
          },
        ])
      ) as any,
    });

    const explanation = buildOccupancyExplanation({
      location,
      locations: [location],
      hass,
      occupancyStates: { family_room: true },
      occupancyTransitions: {},
      occupancyRuntimeStates: {
        family_room: runtimeState("family_room", "on", tMinus(30), {
          contributions: sourceIds.map((sourceId) => ({
            source_id: sourceId,
            state: "active",
            updated_at: tMinus(30),
          })),
        }),
      },
      status: "occupied",
      nowMs: NOW,
    });

    expect(explanation.details.join(" ")).to.include("+2 more");
    expect(explanation.detailSections[0].title).to.equal("Active sources");
    expect(explanation.detailSections[0].items).to.have.length(4);
    expect(explanation.detailSections[0].note).to.equal("+2 more active sources");
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
