/// <reference types="mocha" />
import { fixture, html, expect, waitUntil } from "@open-wc/testing";
import "./ht-location-inspector";
import type { HomeAssistant, Location } from "./types";
import type { HtLocationInspector } from "./ht-location-inspector";

const baseLocation: Location = {
  id: "main-building",
  name: "Main Building",
  parent_id: null,
  is_explicit_root: false,
  entity_ids: [],
  modules: {
    _meta: { type: "building" },
    occupancy: {
      enabled: true,
      default_timeout: 300,
      default_trailing_timeout: 120,
      occupancy_sources: [],
    },
  },
};

describe("HtLocationInspector occupancy source composer", () => {
  it("renders source test buttons for configured sources and triggers services", async () => {
    const callWsRequests: Array<Record<string, any>> = [];
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>): Promise<T> => {
        callWsRequests.push(request);
        if (request.type === "config/entity_registry/list") return [] as T;
        if (request.type === "config/device_registry/list") return [] as T;
        if (request.type === "call_service") return { success: true } as T;
        if (request.type === "topomation/locations/set_module_config") {
          return { success: true } as T;
        }
        return {} as T;
      },
      connection: {},
      states: {
        "light.kitchen_ceiling": {
          entity_id: "light.kitchen_ceiling",
          state: "off",
          attributes: {
            friendly_name: "Kitchen Ceiling",
          },
        },
      },
      areas: {
        kitchen: { area_id: "kitchen", name: "Kitchen" },
      },
      floors: {},
      localize: (key: string) => key,
    };

    const location = structuredClone(baseLocation);
    location.id = "area_kitchen";
    location.name = "Kitchen";
    location.ha_area_id = "kitchen";
    location.modules._meta = { type: "area" };
    location.modules.occupancy = {
      enabled: true,
      default_timeout: 300,
      default_trailing_timeout: 120,
      occupancy_sources: [
        {
          entity_id: "light.kitchen_ceiling",
          source_id: "light.kitchen_ceiling",
          mode: "any_change",
          on_event: "trigger",
          on_timeout: 1800,
          off_event: "clear",
          off_trailing: 0,
        },
      ],
    };

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
      ></ht-location-inspector>
    `);

    await waitUntil(
      () => !!element.shadowRoot?.querySelector('[data-testid="source-test-on"]'),
      "source test buttons did not render"
    );

    const emitted: Array<Record<string, any>> = [];
    element.addEventListener("source-test", (event) => {
      emitted.push((event as CustomEvent).detail);
    });

    const testOn = element.shadowRoot!.querySelector(
      '[data-testid="source-test-on"]'
    ) as HTMLButtonElement;
    const testOff = element.shadowRoot!.querySelector(
      '[data-testid="source-test-off"]'
    ) as HTMLButtonElement;
    expect(testOn.disabled).to.equal(false);
    expect(testOff.disabled).to.equal(false);

    testOn.click();
    await element.updateComplete;
    testOff.click();
    await element.updateComplete;

    const triggerCall = callWsRequests.find(
      (request) =>
        request.type === "call_service" &&
        request.domain === "topomation" &&
        request.service === "trigger"
    );
    const clearCall = callWsRequests.find(
      (request) =>
        request.type === "call_service" &&
        request.domain === "topomation" &&
        request.service === "clear"
    );

    expect(triggerCall).to.exist;
    expect(triggerCall?.service_data?.location_id).to.equal("area_kitchen");
    expect(triggerCall?.service_data?.source_id).to.equal("light.kitchen_ceiling");

    expect(clearCall).to.exist;
    expect(clearCall?.service_data?.location_id).to.equal("area_kitchen");
    expect(clearCall?.service_data?.source_id).to.equal("light.kitchen_ceiling");
    expect(clearCall?.service_data?.trailing_timeout).to.equal(0);

    expect(emitted.map((detail) => detail.action)).to.deep.equal(["trigger", "clear"]);
  });

  it("disables source test buttons when behaviors are set to no change", async () => {
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>): Promise<T> => {
        if (request.type === "config/entity_registry/list") return [] as T;
        if (request.type === "config/device_registry/list") return [] as T;
        return {} as T;
      },
      connection: {},
      states: {
        "light.kitchen_ceiling": {
          entity_id: "light.kitchen_ceiling",
          state: "off",
          attributes: {
            friendly_name: "Kitchen Ceiling",
          },
        },
      },
      areas: {
        kitchen: { area_id: "kitchen", name: "Kitchen" },
      },
      floors: {},
      localize: (key: string) => key,
    };

    const location = structuredClone(baseLocation);
    location.id = "area_kitchen";
    location.name = "Kitchen";
    location.ha_area_id = "kitchen";
    location.modules._meta = { type: "area" };
    location.modules.occupancy = {
      enabled: true,
      default_timeout: 300,
      default_trailing_timeout: 120,
      occupancy_sources: [
        {
          entity_id: "light.kitchen_ceiling",
          source_id: "light.kitchen_ceiling",
          mode: "any_change",
          on_event: "none",
          on_timeout: 1800,
          off_event: "none",
          off_trailing: 0,
        },
      ],
    };

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
      ></ht-location-inspector>
    `);

    await waitUntil(
      () => !!element.shadowRoot?.querySelector('[data-testid="source-test-on"]'),
      "source test buttons did not render"
    );

    const testOn = element.shadowRoot!.querySelector(
      '[data-testid="source-test-on"]'
    ) as HTMLButtonElement;
    const testOff = element.shadowRoot!.querySelector(
      '[data-testid="source-test-off"]'
    ) as HTMLButtonElement;

    expect(testOn.disabled).to.equal(true);
    expect(testOff.disabled).to.equal(true);
  });

  it("renders light power editor when source_id is keyed but signal_key is missing", async () => {
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>): Promise<T> => {
        if (request.type === "config/entity_registry/list") return [] as T;
        if (request.type === "config/device_registry/list") return [] as T;
        return {} as T;
      },
      connection: {},
      states: {
        "light.office_lights": {
          entity_id: "light.office_lights",
          state: "off",
          attributes: {
            friendly_name: "Office Lights",
            supported_color_modes: ["brightness"],
          },
        },
      },
      areas: {
        office: { area_id: "office", name: "Office" },
      },
      floors: {},
      localize: (key: string) => key,
    };

    const location = structuredClone(baseLocation);
    location.id = "area_office";
    location.name = "Office";
    location.ha_area_id = "office";
    location.modules._meta = { type: "area" };
    location.entity_ids = ["light.office_lights"];
    location.modules.occupancy = {
      enabled: true,
      default_timeout: 300,
      default_trailing_timeout: 120,
      occupancy_sources: [
        {
          entity_id: "light.office_lights",
          source_id: "light.office_lights::power",
          mode: "any_change",
          on_event: "trigger",
          on_timeout: 1800,
          off_event: "none",
          off_trailing: 0,
        },
      ],
    };

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
      ></ht-location-inspector>
    `);
    await element.updateComplete;

    const cards = Array.from(element.shadowRoot!.querySelectorAll(".source-card"));
    const powerCard = cards.find((card) => (card.textContent || "").includes("Office Lights"));
    const cardsText = cards.map((card) => (card.textContent || "").trim()).join("\n");

    expect(powerCard).to.exist;
    expect(powerCard?.querySelector(".source-editor")).to.exist;
    expect(cardsText).to.not.include("Office Lights — Playback");
  });

  it("loads area entities from HA entity registry when state attributes lack area_id", async () => {
    const callWsCalls: string[] = [];
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>): Promise<T> => {
        callWsCalls.push(request.type);
        if (request.type === "config/entity_registry/list") {
          return [
            {
              entity_id: "binary_sensor.kitchen_motion",
              area_id: "kitchen",
              device_id: null,
            },
            {
              entity_id: "binary_sensor.driveway_motion",
              area_id: "driveway",
              device_id: null,
            },
          ] as T;
        }
        if (request.type === "config/device_registry/list") {
          return [] as T;
        }
        if (request.type === "topomation/locations/set_module_config") {
          return { success: true } as T;
        }
        return {} as T;
      },
      connection: {},
      states: {
        "binary_sensor.kitchen_motion": {
          entity_id: "binary_sensor.kitchen_motion",
          state: "off",
          attributes: {
            friendly_name: "Kitchen Motion",
            device_class: "motion",
          },
        },
        "binary_sensor.driveway_motion": {
          entity_id: "binary_sensor.driveway_motion",
          state: "off",
          attributes: {
            friendly_name: "Driveway Motion",
            device_class: "motion",
          },
        },
      },
      areas: {
        kitchen: { area_id: "kitchen", name: "Kitchen" },
        driveway: { area_id: "driveway", name: "Driveway" },
      },
      floors: {},
      localize: (key: string) => key,
    };

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${structuredClone(baseLocation)}
      ></ht-location-inspector>
    `);

    await waitUntil(
      () =>
        callWsCalls.includes("config/entity_registry/list") &&
        callWsCalls.includes("config/device_registry/list"),
      "registry lookups were not requested"
    );

    const areaSelect = element.shadowRoot!.querySelector(
      '[data-testid="external-source-area-select"]'
    ) as HTMLSelectElement;
    areaSelect.value = "kitchen";
    areaSelect.dispatchEvent(new Event("change"));
    await element.updateComplete;

    await waitUntil(() => {
      const entitySelect = element.shadowRoot!.querySelector(
        '[data-testid="external-source-entity-select"]'
      ) as HTMLSelectElement;
      return Array.from(entitySelect.options).some(
        (option) => option.value === "binary_sensor.kitchen_motion"
      );
    }, "kitchen entity option did not appear");

    const entitySelect = element.shadowRoot!.querySelector(
      '[data-testid="external-source-entity-select"]'
    ) as HTMLSelectElement;
    const optionValues = Array.from(entitySelect.options).map((option) => option.value);

    expect(optionValues).to.include("binary_sensor.kitchen_motion");
    expect(optionValues).to.not.include("binary_sensor.driveway_motion");
  });

  it("hides managed shadow areas from generic external source area options", async () => {
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>): Promise<T> => {
        if (request.type === "config/entity_registry/list") return [] as T;
        if (request.type === "config/device_registry/list") return [] as T;
        return {} as T;
      },
      connection: {},
      states: {},
      areas: {
        kitchen: { area_id: "kitchen", name: "Kitchen" },
        floor_shadow: { area_id: "floor_shadow", name: "Main Floor (System)" },
      },
      floors: {},
      localize: (key: string) => key,
    };

    const location = structuredClone(baseLocation);
    location.id = "virtual_zone";
    location.name = "Virtual Zone";
    location.ha_area_id = null;
    location.modules._meta = { type: "area" };

    const allLocations: Location[] = [
      location,
      {
        ...structuredClone(baseLocation),
        id: "area_floor_shadow",
        name: "Main Floor",
        parent_id: "floor_main",
        ha_area_id: "floor_shadow",
        modules: {
          _meta: {
            type: "area",
            role: "managed_shadow",
            shadow_for_location_id: "floor_main",
          },
        },
      },
      {
        ...structuredClone(baseLocation),
        id: "floor_main",
        name: "Main Floor",
        parent_id: null,
        modules: { _meta: { type: "floor" } },
      },
    ];

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
        .allLocations=${allLocations}
      ></ht-location-inspector>
    `);
    await element.updateComplete;

    const areaSelect = element.shadowRoot!.querySelector(
      '[data-testid="external-source-area-select"]'
    ) as HTMLSelectElement;
    const optionValues = Array.from(areaSelect.options).map((option) => option.value);

    expect(optionValues).to.include("__all__");
    expect(optionValues).to.include("kitchen");
    expect(optionValues).to.not.include("floor_shadow");
  });

  it("filters hidden/disabled/config entities from area entity options", async () => {
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>): Promise<T> => {
        if (request.type === "config/entity_registry/list") {
          return [
            {
              entity_id: "binary_sensor.kitchen_motion",
              area_id: "kitchen",
              device_id: null,
            },
            {
              entity_id: "switch.kitchen_hidden",
              area_id: "kitchen",
              device_id: null,
              hidden_by: "user",
            },
            {
              entity_id: "switch.kitchen_disabled",
              area_id: "kitchen",
              device_id: null,
              disabled_by: "integration",
            },
            {
              entity_id: "switch.kitchen_config",
              area_id: "kitchen",
              device_id: null,
              entity_category: "config",
            },
          ] as T;
        }
        if (request.type === "config/device_registry/list") {
          return [] as T;
        }
        if (request.type === "topomation/locations/set_module_config") {
          return { success: true } as T;
        }
        return {} as T;
      },
      connection: {},
      states: {
        "binary_sensor.kitchen_motion": {
          entity_id: "binary_sensor.kitchen_motion",
          state: "off",
          attributes: {
            friendly_name: "Kitchen Motion",
            device_class: "motion",
          },
        },
        "switch.kitchen_hidden": {
          entity_id: "switch.kitchen_hidden",
          state: "off",
          attributes: {
            friendly_name: "Kitchen Hidden",
          },
        },
        "switch.kitchen_disabled": {
          entity_id: "switch.kitchen_disabled",
          state: "off",
          attributes: {
            friendly_name: "Kitchen Disabled",
          },
        },
        "switch.kitchen_config": {
          entity_id: "switch.kitchen_config",
          state: "off",
          attributes: {
            friendly_name: "Kitchen Config",
          },
        },
      },
      areas: {
        kitchen: { area_id: "kitchen", name: "Kitchen" },
      },
      floors: {},
      localize: (key: string) => key,
    };

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${structuredClone(baseLocation)}
      ></ht-location-inspector>
    `);

    const areaSelect = element.shadowRoot!.querySelector(
      '[data-testid="external-source-area-select"]'
    ) as HTMLSelectElement;
    areaSelect.value = "kitchen";
    areaSelect.dispatchEvent(new Event("change"));
    await element.updateComplete;

    await waitUntil(() => {
      const entitySelect = element.shadowRoot!.querySelector(
        '[data-testid="external-source-entity-select"]'
      ) as HTMLSelectElement;
      return Array.from(entitySelect.options).some(
        (option) => option.value === "binary_sensor.kitchen_motion"
      );
    }, "normal kitchen entity option did not appear");

    const entitySelect = element.shadowRoot!.querySelector(
      '[data-testid="external-source-entity-select"]'
    ) as HTMLSelectElement;
    const optionValues = Array.from(entitySelect.options).map((option) => option.value);

    expect(optionValues).to.include("binary_sensor.kitchen_motion");
    expect(optionValues).to.not.include("switch.kitchen_hidden");
    expect(optionValues).to.not.include("switch.kitchen_disabled");
    expect(optionValues).to.not.include("switch.kitchen_config");
  });

  it("filters unsupported climate entities from area source options", async () => {
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>): Promise<T> => {
        if (request.type === "config/entity_registry/list") {
          return [
            {
              entity_id: "binary_sensor.kitchen_motion",
              area_id: "kitchen",
              device_id: null,
            },
            {
              entity_id: "climate.kitchen_hvac",
              area_id: "kitchen",
              device_id: null,
            },
          ] as T;
        }
        if (request.type === "config/device_registry/list") {
          return [] as T;
        }
        if (request.type === "topomation/locations/set_module_config") {
          return { success: true } as T;
        }
        return {} as T;
      },
      connection: {},
      states: {
        "binary_sensor.kitchen_motion": {
          entity_id: "binary_sensor.kitchen_motion",
          state: "off",
          attributes: {
            friendly_name: "Kitchen Motion",
            device_class: "motion",
          },
        },
        "climate.kitchen_hvac": {
          entity_id: "climate.kitchen_hvac",
          state: "auto",
          attributes: {
            friendly_name: "Kitchen HVAC",
            hvac_mode: "auto",
          },
        },
      },
      areas: {
        kitchen: { area_id: "kitchen", name: "Kitchen" },
      },
      floors: {},
      localize: (key: string) => key,
    };

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${structuredClone(baseLocation)}
      ></ht-location-inspector>
    `);

    const areaSelect = element.shadowRoot!.querySelector(
      '[data-testid="external-source-area-select"]'
    ) as HTMLSelectElement;
    areaSelect.value = "kitchen";
    areaSelect.dispatchEvent(new Event("change"));
    await element.updateComplete;

    await waitUntil(() => {
      const entitySelect = element.shadowRoot!.querySelector(
        '[data-testid="external-source-entity-select"]'
      ) as HTMLSelectElement;
      return Array.from(entitySelect.options).some(
        (option) => option.value === "binary_sensor.kitchen_motion"
      );
    }, "motion entity option did not appear");

    const entitySelect = element.shadowRoot!.querySelector(
      '[data-testid="external-source-entity-select"]'
    ) as HTMLSelectElement;
    const optionValues = Array.from(entitySelect.options).map((option) => option.value);

    expect(optionValues).to.include("binary_sensor.kitchen_motion");
    expect(optionValues).to.not.include("climate.kitchen_hvac");
  });

  it("persists selected external entity as occupancy source immediately", async () => {
    const sourceUpdates: Array<Record<string, any>> = [];
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>): Promise<T> => {
        if (request.type === "config/entity_registry/list") {
          return [
            {
              entity_id: "binary_sensor.kitchen_motion",
              area_id: "kitchen",
              device_id: null,
            },
          ] as T;
        }
        if (request.type === "config/device_registry/list") {
          return [] as T;
        }
        if (request.type === "topomation/locations/set_module_config") {
          sourceUpdates.push(request);
          return { success: true } as T;
        }
        return {} as T;
      },
      connection: {},
      states: {
        "binary_sensor.kitchen_motion": {
          entity_id: "binary_sensor.kitchen_motion",
          state: "off",
          attributes: {
            friendly_name: "Kitchen Motion",
            device_class: "motion",
          },
        },
      },
      areas: {
        kitchen: { area_id: "kitchen", name: "Kitchen" },
      },
      floors: {},
      localize: (key: string) => key,
    };

    const location = structuredClone(baseLocation);
    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
      ></ht-location-inspector>
    `);

    const areaSelect = element.shadowRoot!.querySelector(
      '[data-testid="external-source-area-select"]'
    ) as HTMLSelectElement;
    areaSelect.value = "kitchen";
    areaSelect.dispatchEvent(new Event("change"));
    await element.updateComplete;

    await waitUntil(() => {
      const entitySelect = element.shadowRoot!.querySelector(
        '[data-testid="external-source-entity-select"]'
      ) as HTMLSelectElement;
      return Array.from(entitySelect.options).some(
        (option) => option.value === "binary_sensor.kitchen_motion"
      );
    }, "kitchen entity option did not appear");

    const entitySelect = element.shadowRoot!.querySelector(
      '[data-testid="external-source-entity-select"]'
    ) as HTMLSelectElement;
    entitySelect.value = "binary_sensor.kitchen_motion";
    entitySelect.dispatchEvent(new Event("change"));
    await element.updateComplete;

    const addButton = element.shadowRoot!.querySelector(
      '[data-testid="add-external-source-inline"]'
    ) as HTMLButtonElement;
    expect(addButton.disabled).to.equal(false);
    addButton.click();
    await element.updateComplete;

    await waitUntil(
      () =>
        sourceUpdates.some((request) => {
          const sources = request?.config?.occupancy_sources;
          return Array.isArray(sources) && sources.length === 1;
        }),
      "source update was not persisted"
    );

    const persisted = sourceUpdates.find((request) => {
      const sources = request?.config?.occupancy_sources;
      return Array.isArray(sources) && sources.length === 1;
    });
    expect(persisted).to.not.equal(undefined);
    expect(persisted!.config.occupancy_sources[0].entity_id).to.equal("binary_sensor.kitchen_motion");
  });

  it("shows external occupancy-class entities but excludes Topomation occupancy outputs", async () => {
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>): Promise<T> => {
        if (request.type === "config/entity_registry/list") return [] as T;
        if (request.type === "config/device_registry/list") return [] as T;
        if (request.type === "topomation/locations/set_module_config") {
          return { success: true } as T;
        }
        return {} as T;
      },
      connection: {},
      states: {
        "binary_sensor.kitchen_occupancy": {
          entity_id: "binary_sensor.kitchen_occupancy",
          state: "unavailable",
          attributes: {
            friendly_name: "Kitchen Occupancy",
            device_class: "occupancy",
            location_id: "area_kitchen",
          },
        },
        "binary_sensor.camera_estimated_occupancy": {
          entity_id: "binary_sensor.camera_estimated_occupancy",
          state: "on",
          attributes: {
            friendly_name: "Camera Estimated Occupancy",
            device_class: "occupancy",
          },
        },
      },
      areas: {
        kitchen: { area_id: "kitchen", name: "Kitchen" },
      },
      floors: {},
      localize: (key: string) => key,
    };

    const location = structuredClone(baseLocation);
    location.id = "area_kitchen";
    location.name = "Kitchen";
    location.ha_area_id = "kitchen";
    location.modules._meta = { type: "area" };
    location.entity_ids = [
      "binary_sensor.kitchen_occupancy",
      "binary_sensor.camera_estimated_occupancy",
    ];

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
      ></ht-location-inspector>
    `);

    await waitUntil(
      () => !!element.shadowRoot?.querySelector(".card-section"),
      "inspector did not render"
    );

    const matchingCard = Array.from(element.shadowRoot!.querySelectorAll(".source-card")).find((row) =>
      (row.textContent || "").includes("Kitchen Occupancy")
    );
    expect(matchingCard).to.equal(undefined);
    const estimatedCard = Array.from(element.shadowRoot!.querySelectorAll(".source-card")).find((row) =>
      (row.textContent || "").includes("Camera Estimated Occupancy")
    );
    expect(estimatedCard).to.not.equal(undefined);
  });

  it("shows only core detection entities in area source candidates while keeping generic switches in Add Source", async () => {
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>): Promise<T> => {
        if (request.type === "config/entity_registry/list") {
          return [
            { entity_id: "light.mudroom_lights", area_id: "mudroom", device_id: null },
            { entity_id: "switch.mudroom_indicator", area_id: "mudroom", device_id: null },
            { entity_id: "switch.mudroom_light_relay", area_id: "mudroom", device_id: null },
            { entity_id: "fan.mudroom_exhaust", area_id: "mudroom", device_id: null },
            { entity_id: "media_player.mudroom_speaker", area_id: "mudroom", device_id: null },
            { entity_id: "binary_sensor.mudroom_motion", area_id: "mudroom", device_id: null },
            { entity_id: "binary_sensor.mudroom_glass_vibration", area_id: "mudroom", device_id: null },
            { entity_id: "binary_sensor.mudroom_alarm_sound", area_id: "mudroom", device_id: null },
            { entity_id: "binary_sensor.mudroom_camera_person", area_id: "mudroom", device_id: null },
            { entity_id: "binary_sensor.mudroom_occupancy", area_id: "mudroom", device_id: null },
            { entity_id: "climate.mudroom", area_id: "mudroom", device_id: null },
            { entity_id: "vacuum.main_floor", area_id: "mudroom", device_id: null },
          ] as T;
        }
        if (request.type === "config/device_registry/list") return [] as T;
        if (request.type === "topomation/locations/set_module_config") {
          return { success: true } as T;
        }
        return {} as T;
      },
      connection: {},
      states: {
        "light.mudroom_lights": {
          entity_id: "light.mudroom_lights",
          state: "on",
          attributes: {
            friendly_name: "Mudroom Lights",
            area_id: "mudroom",
            supported_color_modes: ["brightness"],
          },
        },
        "switch.mudroom_indicator": {
          entity_id: "switch.mudroom_indicator",
          state: "on",
          attributes: {
            friendly_name: "All Lights KeypadLinc Indicator",
            area_id: "mudroom",
            device_class: "switch",
          },
        },
        "switch.mudroom_light_relay": {
          entity_id: "switch.mudroom_light_relay",
          state: "off",
          attributes: {
            friendly_name: "Mudroom Relay Light",
            area_id: "mudroom",
            device_class: "light",
          },
        },
        "fan.mudroom_exhaust": {
          entity_id: "fan.mudroom_exhaust",
          state: "off",
          attributes: {
            friendly_name: "Mudroom Exhaust",
            area_id: "mudroom",
          },
        },
        "media_player.mudroom_speaker": {
          entity_id: "media_player.mudroom_speaker",
          state: "off",
          attributes: {
            friendly_name: "Mudroom Speaker",
            area_id: "mudroom",
          },
        },
        "binary_sensor.mudroom_motion": {
          entity_id: "binary_sensor.mudroom_motion",
          state: "off",
          attributes: {
            friendly_name: "Mudroom Motion",
            area_id: "mudroom",
            device_class: "motion",
          },
        },
        "binary_sensor.mudroom_glass_vibration": {
          entity_id: "binary_sensor.mudroom_glass_vibration",
          state: "off",
          attributes: {
            friendly_name: "Mudroom Glass Vibration",
            area_id: "mudroom",
            device_class: "vibration",
          },
        },
        "binary_sensor.mudroom_alarm_sound": {
          entity_id: "binary_sensor.mudroom_alarm_sound",
          state: "off",
          attributes: {
            friendly_name: "Mudroom Alarm Sound",
            area_id: "mudroom",
            device_class: "sound",
          },
        },
        "binary_sensor.mudroom_camera_person": {
          entity_id: "binary_sensor.mudroom_camera_person",
          state: "off",
          attributes: {
            friendly_name: "Mudroom Camera Person",
            area_id: "mudroom",
          },
        },
        "binary_sensor.mudroom_occupancy": {
          entity_id: "binary_sensor.mudroom_occupancy",
          state: "off",
          attributes: {
            friendly_name: "Mudroom Occupancy",
            area_id: "mudroom",
            device_class: "occupancy",
            location_id: "area_mudroom",
          },
        },
        "climate.mudroom": {
          entity_id: "climate.mudroom",
          state: "auto",
          attributes: {
            friendly_name: "Mudroom Heat",
            area_id: "mudroom",
          },
        },
        "vacuum.main_floor": {
          entity_id: "vacuum.main_floor",
          state: "idle",
          attributes: {
            friendly_name: "Main Floor Vacuum",
            area_id: "mudroom",
          },
        },
      },
      areas: {
        mudroom: { area_id: "mudroom", name: "Mudroom" },
      },
      floors: {},
      localize: (key: string) => key,
    };

    const location = structuredClone(baseLocation);
    location.id = "area_mudroom";
    location.name = "Mudroom";
    location.ha_area_id = "mudroom";
    location.modules._meta = { type: "area" };
    location.entity_ids = [
      "light.mudroom_lights",
      "switch.mudroom_indicator",
      "switch.mudroom_light_relay",
      "fan.mudroom_exhaust",
      "media_player.mudroom_speaker",
      "binary_sensor.mudroom_motion",
      "binary_sensor.mudroom_glass_vibration",
      "binary_sensor.mudroom_alarm_sound",
      "binary_sensor.mudroom_camera_person",
      "binary_sensor.mudroom_occupancy",
      "climate.mudroom",
      "vacuum.main_floor",
    ];

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
      ></ht-location-inspector>
    `);
    await element.updateComplete;

    const cardsText = Array.from(element.shadowRoot!.querySelectorAll(".source-card"))
      .map((card) => (card.textContent || "").trim())
      .join("\n");
    const mudroomLightCards = Array.from(element.shadowRoot!.querySelectorAll(".source-card")).filter((card) =>
      (card.textContent || "").includes("Mudroom Lights")
    );
    const mudroomSpeakerCards = Array.from(element.shadowRoot!.querySelectorAll(".source-card")).filter((card) =>
      (card.textContent || "").includes("Mudroom Speaker")
    );

    expect(cardsText).to.include("Mudroom Lights");
    expect(mudroomLightCards).to.have.length(1);
    expect(mudroomSpeakerCards).to.have.length(1);
    const mudroomLightCardText = mudroomLightCards[0]?.textContent || "";
    const mudroomSpeakerCardText = mudroomSpeakerCards[0]?.textContent || "";
    expect(mudroomLightCardText).to.include("Activity triggers");
    expect(mudroomLightCardText).to.include("Power changes");
    expect(mudroomLightCardText).to.include("Brightness changes");
    expect(mudroomSpeakerCardText).to.include("Activity triggers");
    expect(mudroomSpeakerCardText).to.include("Playback");
    expect(mudroomSpeakerCardText).to.include("Volume changes");
    expect(mudroomSpeakerCardText).to.include("Mute changes");
    expect(cardsText).to.include("Mudroom Relay Light");
    expect(cardsText).to.include("Mudroom Exhaust");
    expect(cardsText).to.not.include("Mudroom Speaker — Playback");
    expect(cardsText).to.not.include("Mudroom Speaker — Volume changes");
    expect(cardsText).to.not.include("Mudroom Speaker — Mute changes");
    expect(cardsText).to.include("Mudroom Motion");
    expect(cardsText).to.include("Mudroom Glass Vibration");
    expect(cardsText).to.include("Mudroom Alarm Sound");
    expect(cardsText).to.include("Mudroom Camera Person");
    expect(cardsText).to.not.include("All Lights KeypadLinc Indicator");
    expect(cardsText).to.not.include("Mudroom Occupancy");
    expect(cardsText).to.not.include("Mudroom Heat");
    expect(cardsText).to.not.include("Main Floor Vacuum");

    const areaSelect = element.shadowRoot!.querySelector(
      '[data-testid="external-source-area-select"]'
    ) as HTMLSelectElement;
    areaSelect.value = "__all__";
    areaSelect.dispatchEvent(new Event("change"));
    await element.updateComplete;

    await waitUntil(() => {
      const entitySelect = element.shadowRoot!.querySelector(
        '[data-testid="external-source-entity-select"]'
      ) as HTMLSelectElement;
      return Array.from(entitySelect.options).some(
        (option) => option.value === "switch.mudroom_indicator"
      );
    }, "generic switch option did not appear in Add Source picker");

    const entitySelect = element.shadowRoot!.querySelector(
      '[data-testid="external-source-entity-select"]'
    ) as HTMLSelectElement;
    const optionValues = Array.from(entitySelect.options).map((option) => option.value);
    expect(optionValues).to.include("switch.mudroom_indicator");
    expect(optionValues).to.not.include("binary_sensor.mudroom_occupancy");
  });

  it("renders Detection/Ambient/On Occupied/On Vacant tabs", async () => {
    const hass: HomeAssistant = {
      callWS: async <T>() => [] as T,
      connection: {},
      states: {},
      areas: {},
      floors: {},
      localize: (key: string) => key,
    };

    const location = structuredClone(baseLocation);

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
      ></ht-location-inspector>
    `);

    const tabLabels = Array.from(element.shadowRoot!.querySelectorAll(".tab"))
      .map((el) => (el.textContent || "").trim())
      .filter(Boolean);

    expect(tabLabels).to.include("Detection");
    expect(tabLabels).to.include("Ambient");
    expect(tabLabels).to.include("On Occupied");
    expect(tabLabels).to.include("On Vacant");
  });

  it("groups legacy light power source with level source in one card", async () => {
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>) => {
        if (request.type === "config/entity_registry/list") return [] as T;
        if (request.type === "config/device_registry/list") return [] as T;
        return [] as T;
      },
      connection: {},
      states: {
        "light.mike_closet_light": {
          entity_id: "light.mike_closet_light",
          state: "off",
          attributes: {
            friendly_name: "Mike Closet Light",
            area_id: "mike_closet",
            brightness: 120,
            supported_color_modes: ["brightness"],
          },
        },
      },
      areas: {
        mike_closet: { area_id: "mike_closet", name: "Mike Closet" },
      },
      floors: {},
      localize: (key: string) => key,
    };

    const location = structuredClone(baseLocation);
    location.id = "area_mike_closet";
    location.name = "Mike Closet";
    location.ha_area_id = "mike_closet";
    location.modules._meta = { type: "area" };
    location.entity_ids = ["light.mike_closet_light"];
    location.modules.occupancy = {
      enabled: true,
      default_timeout: 300,
      default_trailing_timeout: 120,
      occupancy_sources: [
        // Legacy power source without explicit signal_key/source_id suffix.
        {
          entity_id: "light.mike_closet_light",
          source_id: "light.mike_closet_light",
          mode: "any_change",
          on_event: "trigger",
          on_timeout: 900,
          off_event: "none",
          off_trailing: 0,
        },
        {
          entity_id: "light.mike_closet_light",
          source_id: "light.mike_closet_light::level",
          signal_key: "level",
          mode: "any_change",
          on_event: "trigger",
          on_timeout: 900,
          off_event: "none",
          off_trailing: 0,
        },
      ],
    };

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
      ></ht-location-inspector>
    `);
    await element.updateComplete;

    const lightCards = Array.from(element.shadowRoot!.querySelectorAll(".source-card")).filter((card) =>
      (card.textContent || "").includes("Mike Closet Light")
    );
    expect(lightCards).to.have.length(1);
    expect((lightCards[0].textContent || "")).to.include("Activity triggers");
    expect((lightCards[0].textContent || "")).to.include("Power changes");
    expect((lightCards[0].textContent || "")).to.include("Brightness changes");
  });

  it("renders header occupancy/lock status and lock diagnostics", async () => {
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>) => {
        if (request.type === "config/entity_registry/list") return [] as T;
        if (request.type === "config/device_registry/list") return [] as T;
        return [] as T;
      },
      connection: {},
      states: {
        "binary_sensor.occupancy_area_kitchen": {
          entity_id: "binary_sensor.occupancy_area_kitchen",
          state: "on",
          attributes: {
            device_class: "occupancy",
            location_id: "area_kitchen",
            is_locked: true,
            locked_by: ["party_mode"],
            lock_modes: ["block_vacant"],
            direct_locks: [
              {
                source_id: "party_mode",
                mode: "block_vacant",
                scope: "subtree",
              },
            ],
            contributions: [{ source_id: "__lock_hold__:area_kitchen", expires_at: null }],
          },
        },
      },
      areas: {},
      floors: {},
      localize: (key: string) => key,
    };

    const location = structuredClone(baseLocation);
    location.id = "area_kitchen";
    location.name = "Kitchen";
    location.modules._meta = { type: "area" };

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
      ></ht-location-inspector>
    `);
    await element.updateComplete;

    const vacantAtText = (
      element.shadowRoot!.querySelector('[data-testid="header-vacant-at"]')?.textContent || ""
    ).trim();
    const lockStatusText = (
      element.shadowRoot!.querySelector('[data-testid="header-lock-status"]')?.textContent || ""
    ).trim();
    const lockModesText = element.shadowRoot!.textContent || "";
    const lockDirectiveText = (
      element.shadowRoot!.querySelector(".lock-directive")?.textContent || ""
    ).trim();

    expect(vacantAtText).to.equal("Vacant at No timeout scheduled");
    expect(lockStatusText).to.equal("Locked");
    expect(lockModesText).to.include("Block vacant");
    expect(lockDirectiveText).to.include("Subtree");
  });

  it("keeps vacancy reason out of the header status row", async () => {
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>) => {
        if (request.type === "config/entity_registry/list") return [] as T;
        if (request.type === "config/device_registry/list") return [] as T;
        return [] as T;
      },
      connection: {},
      states: {
        "binary_sensor.occupancy_area_kitchen": {
          entity_id: "binary_sensor.occupancy_area_kitchen",
          state: "off",
          attributes: {
            device_class: "occupancy",
            location_id: "area_kitchen",
            reason: "timeout",
          },
        },
      },
      areas: {},
      floors: {},
      localize: (key: string) => key,
    };

    const location = structuredClone(baseLocation);
    location.id = "area_kitchen";
    location.name = "Kitchen";
    location.modules._meta = { type: "area" };

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
      ></ht-location-inspector>
    `);
    await element.updateComplete;

    expect(element.shadowRoot!.querySelector('[data-testid="header-vacancy-reason"]')).to.not.exist;
  });

  it("shows vacant status while suppressing event-driven reason text in the header", async () => {
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>) => {
        if (request.type === "config/entity_registry/list") return [] as T;
        if (request.type === "config/device_registry/list") return [] as T;
        return [] as T;
      },
      connection: {},
      states: {
        "binary_sensor.occupancy_area_kitchen": {
          entity_id: "binary_sensor.occupancy_area_kitchen",
          state: "on",
          attributes: {
            device_class: "occupancy",
            location_id: "area_kitchen",
            reason: "event:trigger",
          },
        },
      },
      areas: {},
      floors: {},
      localize: (key: string) => key,
    };

    const location = structuredClone(baseLocation);
    location.id = "area_kitchen";
    location.name = "Kitchen";
    location.modules._meta = { type: "area" };

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
        .occupancyStates=${{ area_kitchen: false }}
        .occupancyTransitions=${{
          area_kitchen: {
            occupied: false,
            previousOccupied: true,
            reason: "event:clear",
            changedAt: new Date().toISOString(),
          },
        }}
      ></ht-location-inspector>
    `);
    await element.updateComplete;

    const occupancyStatusText = (
      element.shadowRoot!.querySelector('[data-testid="header-occupancy-status"]')?.textContent || ""
    ).trim();
    expect(occupancyStatusText).to.equal("Vacant");
    expect(element.shadowRoot!.querySelector('[data-testid="header-vacancy-reason"]')).to.not.exist;
  });

  it("creates adjacency edges from inspector controls", async () => {
    const callWsRequests: Array<Record<string, any>> = [];
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>) => {
        callWsRequests.push(request);
        if (request.type === "config/entity_registry/list") return [] as T;
        if (request.type === "config/device_registry/list") return [] as T;
        if (request.type === "topomation/adjacency/create") {
          return { success: true, adjacency_edge: { edge_id: "edge_area_kitchen_area_hallway" } } as T;
        }
        return {} as T;
      },
      connection: {},
      states: {},
      areas: {},
      floors: {},
      localize: (key: string) => key,
    };

    const location = structuredClone(baseLocation);
    location.id = "area_kitchen";
    location.name = "Kitchen";
    location.modules._meta = { type: "area" };

    const allLocations: Location[] = [
      location,
      {
        ...structuredClone(baseLocation),
        id: "area_hallway",
        name: "Hallway",
        parent_id: null,
        modules: { _meta: { type: "area" } },
      },
    ];

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
        .allLocations=${allLocations}
        .adjacencyEdges=${[]}
      ></ht-location-inspector>
    `);
    await element.updateComplete;

    const advancedToggle = element.shadowRoot!.querySelector(
      '[data-testid="adjacency-advanced-toggle"]'
    ) as HTMLButtonElement;
    expect(advancedToggle).to.exist;
    advancedToggle.click();
    await element.updateComplete;

    let adjacencyChanged = false;
    element.addEventListener("adjacency-changed", () => {
      adjacencyChanged = true;
    });

    const addButton = element.shadowRoot!.querySelector(
      ".adjacency-form-actions .button.button-primary"
    ) as HTMLButtonElement;
    expect(addButton).to.exist;
    expect(addButton.disabled).to.equal(false);

    addButton.click();
    await element.updateComplete;

    const createCall = callWsRequests.find(
      (request) => request.type === "topomation/adjacency/create"
    );
    expect(createCall).to.exist;
    expect(createCall?.from_location_id).to.equal("area_kitchen");
    expect(createCall?.to_location_id).to.equal("area_hallway");
    expect(createCall?.directionality).to.equal("bidirectional");
    expect(adjacencyChanged).to.equal(true);
  });

  it("limits adjacency neighbors to same-parent room-level siblings", async () => {
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>) => {
        if (request.type === "config/entity_registry/list") return [] as T;
        if (request.type === "config/device_registry/list") return [] as T;
        return {} as T;
      },
      connection: {},
      states: {},
      areas: {},
      floors: {},
      localize: (key: string) => key,
    };

    const location = structuredClone(baseLocation);
    location.id = "area_kitchen";
    location.name = "Kitchen";
    location.parent_id = "floor_main";
    location.modules._meta = { type: "area" };

    const allLocations: Location[] = [
      location,
      {
        ...structuredClone(baseLocation),
        id: "area_hallway",
        name: "Hallway",
        parent_id: "floor_main",
        modules: { _meta: { type: "area" } },
      },
      {
        ...structuredClone(baseLocation),
        id: "area_main_floor_shadow",
        name: "Main Floor",
        parent_id: "floor_main",
        ha_area_id: "main_floor_shadow",
        modules: {
          _meta: {
            type: "area",
            role: "managed_shadow",
            shadow_for_location_id: "floor_main",
          },
        },
      },
      {
        ...structuredClone(baseLocation),
        id: "subarea_pantry",
        name: "Pantry",
        parent_id: "area_kitchen",
        modules: { _meta: { type: "subarea" } },
      },
      {
        ...structuredClone(baseLocation),
        id: "area_primary_bedroom",
        name: "Primary Bedroom",
        parent_id: "floor_second",
        modules: { _meta: { type: "area" } },
      },
      {
        ...structuredClone(baseLocation),
        id: "floor_main",
        name: "Main Floor",
        parent_id: "building_main",
        modules: { _meta: { type: "floor" } },
      },
      {
        ...structuredClone(baseLocation),
        id: "building_main",
        name: "Main Building",
        parent_id: null,
        modules: { _meta: { type: "building" } },
      },
    ];

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
        .allLocations=${allLocations}
        .adjacencyEdges=${[]}
      ></ht-location-inspector>
    `);
    await element.updateComplete;

    const advancedToggle = element.shadowRoot!.querySelector(
      '[data-testid="adjacency-advanced-toggle"]'
    ) as HTMLButtonElement;
    expect(advancedToggle).to.exist;
    advancedToggle.click();
    await element.updateComplete;

    const neighborSelect = element.shadowRoot!.querySelector(
      "#adjacency-neighbor"
    ) as HTMLSelectElement;
    expect(neighborSelect).to.exist;

    const optionLabels = [...neighborSelect.querySelectorAll("option")].map((option) =>
      option.textContent?.trim()
    );
    expect(optionLabels).to.deep.equal(["Hallway"]);
  });

  it("limits cross-area source picker to sibling areas on the same floor", async () => {
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>) => {
        if (request.type === "config/entity_registry/list") return [] as T;
        if (request.type === "config/device_registry/list") return [] as T;
        return {} as T;
      },
      connection: {},
      states: {},
      areas: {
        garage: { area_id: "garage", name: "Garage" },
        kitchen: { area_id: "kitchen", name: "Kitchen" },
        living_room: { area_id: "living_room", name: "Living Room" },
        garage_loft: { area_id: "garage_loft", name: "Garage Loft" },
        garage_shadow: { area_id: "garage_shadow", name: "Garage (System)" },
      },
      floors: {},
      localize: (key: string) => key,
    };

    const location = structuredClone(baseLocation);
    location.id = "area_garage";
    location.name = "Garage";
    location.parent_id = "floor_ground";
    location.ha_area_id = "garage";
    location.modules._meta = { type: "area" };

    const allLocations: Location[] = [
      location,
      {
        ...structuredClone(baseLocation),
        id: "area_kitchen",
        name: "Kitchen",
        parent_id: "floor_ground",
        ha_area_id: "kitchen",
        modules: { _meta: { type: "area" } },
      },
      {
        ...structuredClone(baseLocation),
        id: "area_utility",
        name: "Utility",
        parent_id: "floor_ground",
        modules: { _meta: { type: "area" } },
      },
      {
        ...structuredClone(baseLocation),
        id: "area_garage_shadow",
        name: "Garage",
        parent_id: "floor_ground",
        ha_area_id: "garage_shadow",
        modules: {
          _meta: {
            type: "area",
            role: "managed_shadow",
            shadow_for_location_id: "floor_ground",
          },
        },
      },
      {
        ...structuredClone(baseLocation),
        id: "subarea_garage_loft",
        name: "Garage Loft",
        parent_id: "area_garage",
        ha_area_id: "garage_loft",
        modules: { _meta: { type: "subarea" } },
      },
      {
        ...structuredClone(baseLocation),
        id: "area_living_room",
        name: "Living Room",
        parent_id: "floor_main",
        ha_area_id: "living_room",
        modules: { _meta: { type: "area" } },
      },
      {
        ...structuredClone(baseLocation),
        id: "floor_ground",
        name: "Ground Floor",
        parent_id: "building_home",
        modules: { _meta: { type: "floor" } },
      },
      {
        ...structuredClone(baseLocation),
        id: "floor_main",
        name: "Main Floor",
        parent_id: "building_home",
        modules: { _meta: { type: "floor" } },
      },
      {
        ...structuredClone(baseLocation),
        id: "building_home",
        name: "Home",
        parent_id: null,
        modules: { _meta: { type: "building" } },
      },
    ];

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
        .allLocations=${allLocations}
      ></ht-location-inspector>
    `);
    await element.updateComplete;

    const areaSelect = element.shadowRoot!.querySelector(
      '[data-testid="external-source-area-select"]'
    ) as HTMLSelectElement;
    expect(areaSelect).to.exist;

    const optionValues = Array.from(areaSelect.options).map((option) => option.value);
    expect(optionValues).to.deep.equal(["", "kitchen"]);
    expect(optionValues).to.not.include("__all__");

    const panelText = element.shadowRoot?.textContent || "";
    expect(panelText).to.include("Only sibling areas on this floor are available.");
  });

  it("supports multi-select linked room contributors without locking editing", async () => {
    const callWsRequests: Array<Record<string, any>> = [];
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>) => {
        callWsRequests.push(request);
        if (request.type === "config/entity_registry/list") return [] as T;
        if (request.type === "config/device_registry/list") return [] as T;
        if (request.type === "topomation/locations/set_module_config") {
          await new Promise((resolve) => setTimeout(resolve, 40));
          return { success: true } as T;
        }
        return {} as T;
      },
      connection: {},
      states: {},
      areas: {},
      floors: {},
      localize: (key: string) => key,
    };

    const location = structuredClone(baseLocation);
    location.id = "area_kitchen";
    location.name = "Kitchen";
    location.parent_id = "floor_main";
    location.modules._meta = { type: "area" };
    location.modules.occupancy = {
      enabled: true,
      default_timeout: 300,
      default_trailing_timeout: 120,
      occupancy_sources: [],
      linked_locations: [],
    };

    const allLocations: Location[] = [
      location,
      {
        ...structuredClone(baseLocation),
        id: "area_family_room",
        name: "Family Room",
        parent_id: "floor_main",
        modules: {
          _meta: { type: "area" },
          occupancy: {
            enabled: true,
            default_timeout: 300,
            default_trailing_timeout: 120,
            occupancy_sources: [],
            linked_locations: [],
          },
        },
      },
      {
        ...structuredClone(baseLocation),
        id: "area_dining_room",
        name: "Dining Room",
        parent_id: "floor_main",
        modules: { _meta: { type: "area" } },
      },
      {
        ...structuredClone(baseLocation),
        id: "floor_main",
        name: "Main Floor",
        parent_id: "building_main",
        modules: { _meta: { type: "floor" } },
      },
      {
        ...structuredClone(baseLocation),
        id: "building_main",
        name: "Main Building",
        parent_id: null,
        modules: { _meta: { type: "building" } },
      },
    ];

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
        .allLocations=${allLocations}
      ></ht-location-inspector>
    `);
    await element.updateComplete;
    const advancedToggle = element.shadowRoot!.querySelector(
      '[data-testid="adjacency-advanced-toggle"]'
    ) as HTMLButtonElement;
    expect(advancedToggle).to.exist;
    advancedToggle.click();
    await element.updateComplete;

    const familyCheckbox = element.shadowRoot!.querySelector(
      '[data-testid="linked-location-area_family_room"]'
    ) as HTMLInputElement;
    const diningCheckbox = element.shadowRoot!.querySelector(
      '[data-testid="linked-location-area_dining_room"]'
    ) as HTMLInputElement;
    expect(familyCheckbox).to.exist;
    expect(diningCheckbox).to.exist;
    expect(familyCheckbox.checked).to.equal(false);
    expect(diningCheckbox.checked).to.equal(false);

    familyCheckbox.click();
    await element.updateComplete;
    expect(familyCheckbox.disabled).to.equal(false);
    expect(diningCheckbox.disabled).to.equal(false);

    diningCheckbox.click();
    await element.updateComplete;
    familyCheckbox.click();
    await element.updateComplete;

    await waitUntil(() => {
      const requests = callWsRequests.filter(
        (item) => item.type === "topomation/locations/set_module_config" && item.location_id === "area_kitchen"
      );
      return requests.length >= 3;
    }, "linked room update requests not observed");

    const requests = callWsRequests.filter(
      (item) => item.type === "topomation/locations/set_module_config" && item.location_id === "area_kitchen"
    );
    expect(requests.some((item) => item.config?.linked_locations?.includes("area_family_room"))).to.equal(true);
    expect(
      requests.some(
        (item) =>
          Array.isArray(item.config?.linked_locations) &&
          item.config.linked_locations.includes("area_family_room") &&
          item.config.linked_locations.includes("area_dining_room") &&
          item.config.linked_locations.length === 2
      )
    ).to.equal(true);
    expect(
      requests.some(
        (item) =>
          Array.isArray(item.config?.linked_locations) &&
          item.config.linked_locations.length === 1 &&
          item.config.linked_locations[0] === "area_dining_room"
      )
    ).to.equal(true);
  });

  it("sync rooms writes reciprocal config updates", async () => {
    const callWsRequests: Array<Record<string, any>> = [];
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>) => {
        callWsRequests.push(request);
        if (request.type === "config/entity_registry/list") return [] as T;
        if (request.type === "config/device_registry/list") return [] as T;
        if (request.type === "topomation/locations/set_module_config") {
          return { success: true } as T;
        }
        return {} as T;
      },
      connection: {},
      states: {},
      areas: {},
      floors: {},
      localize: (key: string) => key,
    };

    const location = structuredClone(baseLocation);
    location.id = "area_kitchen";
    location.name = "Kitchen";
    location.parent_id = "floor_main";
    location.modules._meta = { type: "area" };
    location.modules.occupancy = {
      enabled: true,
      default_timeout: 300,
      default_trailing_timeout: 120,
      occupancy_sources: [],
      linked_locations: [],
      sync_locations: [],
    };

    const allLocations: Location[] = [
      location,
      {
        ...structuredClone(baseLocation),
        id: "area_family_room",
        name: "Family Room",
        parent_id: "floor_main",
        modules: {
          _meta: { type: "area" },
          occupancy: {
            enabled: true,
            default_timeout: 300,
            default_trailing_timeout: 120,
            occupancy_sources: [],
            linked_locations: [],
            sync_locations: [],
          },
        },
      },
      {
        ...structuredClone(baseLocation),
        id: "floor_main",
        name: "Main Floor",
        parent_id: "building_main",
        modules: { _meta: { type: "floor" } },
      },
      {
        ...structuredClone(baseLocation),
        id: "building_main",
        name: "Main Building",
        parent_id: null,
        modules: { _meta: { type: "building" } },
      },
    ];

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
        .allLocations=${allLocations}
      ></ht-location-inspector>
    `);
    await element.updateComplete;

    const syncCheckbox = element.shadowRoot!.querySelector(
      '[data-testid="sync-location-area_family_room"]'
    ) as HTMLInputElement;
    expect(syncCheckbox).to.exist;
    expect(syncCheckbox.checked).to.equal(false);

    syncCheckbox.click();
    await element.updateComplete;

    await waitUntil(() => {
      return callWsRequests.some(
        (item) =>
          item.type === "topomation/locations/set_module_config" &&
          item.location_id === "area_kitchen" &&
          Array.isArray(item.config?.sync_locations) &&
          item.config.sync_locations.includes("area_family_room")
      );
    }, "forward sync add request not observed");

    await waitUntil(() => {
      return callWsRequests.some(
        (item) =>
          item.type === "topomation/locations/set_module_config" &&
          item.location_id === "area_family_room" &&
          Array.isArray(item.config?.sync_locations) &&
          item.config.sync_locations.includes("area_kitchen")
      );
    }, "reverse sync add request not observed");

    syncCheckbox.click();
    await element.updateComplete;

    await waitUntil(() => {
      return callWsRequests.some(
        (item) =>
          item.type === "topomation/locations/set_module_config" &&
          item.location_id === "area_family_room" &&
          Array.isArray(item.config?.sync_locations) &&
          !item.config.sync_locations.includes("area_kitchen")
      );
    }, "reverse sync remove request not observed");
  });

  it("sync rooms excludes managed shadow sibling areas", async () => {
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>) => {
        if (request.type === "config/entity_registry/list") return [] as T;
        if (request.type === "config/device_registry/list") return [] as T;
        if (request.type === "topomation/locations/set_module_config") {
          return { success: true } as T;
        }
        return {} as T;
      },
      connection: {},
      states: {},
      areas: {},
      floors: {},
      localize: (key: string) => key,
    };

    const location = structuredClone(baseLocation);
    location.id = "area_kitchen";
    location.name = "Kitchen";
    location.parent_id = "floor_main";
    location.modules._meta = { type: "area" };
    location.modules.occupancy = {
      enabled: true,
      default_timeout: 300,
      default_trailing_timeout: 120,
      occupancy_sources: [],
      linked_locations: [],
      sync_locations: [],
    };

    const allLocations: Location[] = [
      location,
      {
        ...structuredClone(baseLocation),
        id: "area_family_room",
        name: "Family Room",
        parent_id: "floor_main",
        modules: {
          _meta: { type: "area" },
          occupancy: {
            enabled: true,
            default_timeout: 300,
            default_trailing_timeout: 120,
            occupancy_sources: [],
            linked_locations: [],
            sync_locations: [],
          },
        },
      },
      {
        ...structuredClone(baseLocation),
        id: "area_main_floor_shadow",
        name: "Main Floor",
        parent_id: "floor_main",
        modules: {
          _meta: {
            type: "area",
            role: "managed_shadow",
            shadow_for_location_id: "floor_main",
          },
          occupancy: {
            enabled: true,
            default_timeout: 300,
            default_trailing_timeout: 120,
            occupancy_sources: [],
            linked_locations: [],
            sync_locations: [],
          },
        },
      },
      {
        ...structuredClone(baseLocation),
        id: "floor_main",
        name: "Main Floor",
        parent_id: "building_main",
        modules: { _meta: { type: "floor" } },
      },
      {
        ...structuredClone(baseLocation),
        id: "building_main",
        name: "Main Building",
        parent_id: null,
        modules: { _meta: { type: "building" } },
      },
    ];

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
        .allLocations=${allLocations}
      ></ht-location-inspector>
    `);
    await element.updateComplete;

    const familyCheckbox = element.shadowRoot!.querySelector(
      '[data-testid="sync-location-area_family_room"]'
    ) as HTMLInputElement | null;
    const managedShadowCheckbox = element.shadowRoot!.querySelector(
      '[data-testid="sync-location-area_main_floor_shadow"]'
    ) as HTMLInputElement | null;

    expect(familyCheckbox).to.exist;
    expect(managedShadowCheckbox).to.equal(null);
  });

  it("supports optional two-way linked room toggles", async () => {
    const callWsRequests: Array<Record<string, any>> = [];
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>) => {
        callWsRequests.push(request);
        if (request.type === "config/entity_registry/list") return [] as T;
        if (request.type === "config/device_registry/list") return [] as T;
        if (request.type === "topomation/locations/set_module_config") {
          return { success: true } as T;
        }
        return {} as T;
      },
      connection: {},
      states: {},
      areas: {},
      floors: {},
      localize: (key: string) => key,
    };

    const location = structuredClone(baseLocation);
    location.id = "area_kitchen";
    location.name = "Kitchen";
    location.parent_id = "floor_main";
    location.modules._meta = { type: "area" };
    location.modules.occupancy = {
      enabled: true,
      default_timeout: 300,
      default_trailing_timeout: 120,
      occupancy_sources: [],
      linked_locations: [],
    };

    const allLocations: Location[] = [
      location,
      {
        ...structuredClone(baseLocation),
        id: "area_family_room",
        name: "Family Room",
        parent_id: "floor_main",
        modules: {
          _meta: { type: "area" },
          occupancy: {
            enabled: true,
            default_timeout: 300,
            default_trailing_timeout: 120,
            occupancy_sources: [],
            linked_locations: [],
          },
        },
      },
      {
        ...structuredClone(baseLocation),
        id: "floor_main",
        name: "Main Floor",
        parent_id: "building_main",
        modules: { _meta: { type: "floor" } },
      },
      {
        ...structuredClone(baseLocation),
        id: "building_main",
        name: "Main Building",
        parent_id: null,
        modules: { _meta: { type: "building" } },
      },
    ];

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
        .allLocations=${allLocations}
      ></ht-location-inspector>
    `);
    await element.updateComplete;
    const advancedToggle = element.shadowRoot!.querySelector(
      '[data-testid="adjacency-advanced-toggle"]'
    ) as HTMLButtonElement;
    expect(advancedToggle).to.exist;
    advancedToggle.click();
    await element.updateComplete;

    const linkedCheckbox = element.shadowRoot!.querySelector(
      '[data-testid="linked-location-area_family_room"]'
    ) as HTMLInputElement;
    const twoWayCheckbox = element.shadowRoot!.querySelector(
      '[data-testid="linked-location-two-way-area_family_room"]'
    ) as HTMLInputElement;
    expect(linkedCheckbox).to.exist;
    expect(twoWayCheckbox).to.exist;
    expect(twoWayCheckbox.disabled).to.equal(true);

    linkedCheckbox.click();
    await element.updateComplete;

    await waitUntil(() => {
      return callWsRequests.some(
        (item) =>
          item.type === "topomation/locations/set_module_config" &&
          item.location_id === "area_kitchen" &&
          Array.isArray(item.config?.linked_locations) &&
          item.config.linked_locations.includes("area_family_room")
      );
    }, "forward linked room add request not observed");

    expect(twoWayCheckbox.disabled).to.equal(false);
    twoWayCheckbox.click();
    await element.updateComplete;

    await waitUntil(() => {
      return callWsRequests.some(
        (item) =>
          item.type === "topomation/locations/set_module_config" &&
          item.location_id === "area_family_room" &&
          Array.isArray(item.config?.linked_locations) &&
          item.config.linked_locations.includes("area_kitchen")
      );
    }, "reverse linked room add request not observed");

    twoWayCheckbox.click();
    await element.updateComplete;

    await waitUntil(() => {
      return callWsRequests.some(
        (item) =>
          item.type === "topomation/locations/set_module_config" &&
          item.location_id === "area_family_room" &&
          Array.isArray(item.config?.linked_locations) &&
          !item.config.linked_locations.includes("area_kitchen")
      );
    }, "reverse linked room remove request not observed");
  });

  it("does not offer linked room checkboxes for non-area floor-rooted locations", async () => {
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>) => {
        if (request.type === "config/entity_registry/list") return [] as T;
        if (request.type === "config/device_registry/list") return [] as T;
        return {} as T;
      },
      connection: {},
      states: {},
      areas: {},
      floors: {},
      localize: (key: string) => key,
    };

    const location = structuredClone(baseLocation);
    location.id = "building_main";
    location.name = "Home";
    location.parent_id = null;
    location.modules._meta = { type: "building" };
    location.modules.occupancy = {
      enabled: true,
      default_timeout: 300,
      default_trailing_timeout: 120,
      occupancy_sources: [],
      linked_locations: ["area_kitchen"],
    };

    const allLocations: Location[] = [
      location,
      {
        ...structuredClone(baseLocation),
        id: "floor_main",
        name: "Main Floor",
        parent_id: "building_main",
        modules: { _meta: { type: "floor" } },
      },
      {
        ...structuredClone(baseLocation),
        id: "area_kitchen",
        name: "Kitchen",
        parent_id: "floor_main",
        modules: { _meta: { type: "area" } },
      },
    ];

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
        .allLocations=${allLocations}
      ></ht-location-inspector>
    `);
    await element.updateComplete;

    const linkedRows = element.shadowRoot!.querySelectorAll('[data-testid^="linked-location-"]');
    expect(linkedRows.length).to.equal(0);
    expect(element.shadowRoot!.textContent || "").to.include(
      "Sync Rooms is available only for area locations directly under a floor."
    );
  });

  it("removes adjacency edges from inspector controls", async () => {
    const callWsRequests: Array<Record<string, any>> = [];
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>) => {
        callWsRequests.push(request);
        if (request.type === "config/entity_registry/list") return [] as T;
        if (request.type === "config/device_registry/list") return [] as T;
        if (request.type === "topomation/adjacency/delete") {
          return { success: true } as T;
        }
        return {} as T;
      },
      connection: {},
      states: {},
      areas: {},
      floors: {},
      localize: (key: string) => key,
    };

    const location = structuredClone(baseLocation);
    location.id = "area_kitchen";
    location.name = "Kitchen";
    location.modules._meta = { type: "area" };

    const allLocations: Location[] = [
      location,
      {
        ...structuredClone(baseLocation),
        id: "area_hallway",
        name: "Hallway",
        parent_id: null,
        modules: { _meta: { type: "area" } },
      },
    ];

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
        .allLocations=${allLocations}
        .adjacencyEdges=${[
          {
            edge_id: "edge_area_kitchen_area_hallway",
            from_location_id: "area_kitchen",
            to_location_id: "area_hallway",
            directionality: "bidirectional",
            boundary_type: "door",
            crossing_sources: [],
            handoff_window_sec: 12,
            priority: 50,
          },
        ]}
      ></ht-location-inspector>
    `);
    await element.updateComplete;

    const advancedToggle = element.shadowRoot!.querySelector(
      '[data-testid="adjacency-advanced-toggle"]'
    ) as HTMLButtonElement;
    expect(advancedToggle).to.exist;
    advancedToggle.click();
    await element.updateComplete;

    let adjacencyChanged = false;
    element.addEventListener("adjacency-changed", () => {
      adjacencyChanged = true;
    });

    const removeButton = element.shadowRoot!.querySelector(
      ".adjacency-delete-btn"
    ) as HTMLButtonElement;
    expect(removeButton).to.exist;
    removeButton.click();
    await element.updateComplete;

    const deleteCall = callWsRequests.find(
      (request) => request.type === "topomation/adjacency/delete"
    );
    expect(deleteCall).to.exist;
    expect(deleteCall?.edge_id).to.equal("edge_area_kitchen_area_hallway");
    expect(adjacencyChanged).to.equal(true);
  });

  it("renders handoff traces for the selected location", async () => {
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>) => {
        if (request.type === "config/entity_registry/list") return [] as T;
        if (request.type === "config/device_registry/list") return [] as T;
        return {} as T;
      },
      connection: {},
      states: {},
      areas: {},
      floors: {},
      localize: (key: string) => key,
    };

    const location = structuredClone(baseLocation);
    location.id = "area_kitchen";
    location.name = "Kitchen";
    location.modules._meta = { type: "area" };

    const allLocations: Location[] = [
      location,
      {
        ...structuredClone(baseLocation),
        id: "area_hallway",
        name: "Hallway",
        parent_id: null,
        modules: { _meta: { type: "area" } },
      },
    ];

    const occurredAt = new Date().toISOString();
    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
        .allLocations=${allLocations}
        .handoffTraces=${[
          {
            edge_id: "edge_area_kitchen_area_hallway",
            from_location_id: "area_kitchen",
            to_location_id: "area_hallway",
            trigger_entity_id: "binary_sensor.kitchen_hallway_door",
            trigger_source_id: "binary_sensor.kitchen_hallway_door",
            boundary_type: "door",
            handoff_window_sec: 12,
            status: "provisional_triggered",
            timestamp: occurredAt,
          },
        ]}
      ></ht-location-inspector>
    `);
    await element.updateComplete;

    const advancedToggle = element.shadowRoot!.querySelector(
      '[data-testid="adjacency-advanced-toggle"]'
    ) as HTMLButtonElement;
    expect(advancedToggle).to.exist;
    advancedToggle.click();
    await element.updateComplete;

    const traceRows = element.shadowRoot!.querySelectorAll(".handoff-trace-row");
    expect(traceRows.length).to.equal(1);
    const traceText = (traceRows[0].textContent || "").replace(/\s+/g, " ").trim();
    expect(traceText).to.include("Kitchen -> Hallway");
    expect(traceText).to.include("Provisional Triggered");
    expect(traceText).to.include("window 12s");
    expect(traceText).to.include("trigger: binary_sensor.kitchen_hallway_door");
  });

  it("renders vacant-at timestamp when effective timeout is provided", async () => {
    const vacantAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const expectedVacantAtLabel = new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(vacantAt));

    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>) => {
        if (request.type === "config/entity_registry/list") return [] as T;
        if (request.type === "config/device_registry/list") return [] as T;
        return [] as T;
      },
      connection: {},
      states: {
        "binary_sensor.occupancy_area_kitchen": {
          entity_id: "binary_sensor.occupancy_area_kitchen",
          state: "on",
          attributes: {
            device_class: "occupancy",
            location_id: "area_kitchen",
            is_locked: false,
            locked_by: [],
            lock_modes: [],
            direct_locks: [],
            contributions: [{ source_id: "motion.kitchen", expires_at: vacantAt }],
            effective_timeout_at: vacantAt,
            vacant_at: vacantAt,
          },
        },
      },
      areas: {},
      floors: {},
      localize: (key: string) => key,
    };

    const location = structuredClone(baseLocation);
    location.id = "area_kitchen";
    location.name = "Kitchen";
    location.modules._meta = { type: "area" };

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
      ></ht-location-inspector>
    `);
    await element.updateComplete;

    const vacantAtText = (
      element.shadowRoot!.querySelector('[data-testid="header-vacant-at"]')?.textContent || ""
    ).trim();

    expect(vacantAtText).to.equal(`Vacant at ${expectedVacantAtLabel}`);
  });

  it("updates vacant-at header from live occupancy state_changed events", async () => {
    let stateChangedHandler: ((event: any) => void) | undefined;
    const expectedVacantAt = new Date(Date.now() + 90 * 60 * 1000).toISOString();
    const expectedVacantAtLabel = new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(expectedVacantAt));

    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>) => {
        if (request.type === "config/entity_registry/list") return [] as T;
        if (request.type === "config/device_registry/list") return [] as T;
        return [] as T;
      },
      connection: {
        subscribeEvents: async (handler: (event: any) => void, eventType: string) => {
          if (eventType === "state_changed") {
            stateChangedHandler = handler;
          }
          return () => {};
        },
      },
      states: {
        "binary_sensor.occupancy_area_kitchen": {
          entity_id: "binary_sensor.occupancy_area_kitchen",
          state: "off",
          attributes: {
            device_class: "occupancy",
            location_id: "area_kitchen",
          },
        },
      },
      areas: {},
      floors: {},
      localize: (key: string) => key,
    };

    const location = structuredClone(baseLocation);
    location.id = "area_kitchen";
    location.name = "Kitchen";
    location.modules._meta = { type: "area" };

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
        .occupancyStates=${{ area_kitchen: true }}
      ></ht-location-inspector>
    `);
    await element.updateComplete;
    expect(stateChangedHandler).to.exist;

    const beforeText = (
      element.shadowRoot!.querySelector('[data-testid="header-vacant-at"]')?.textContent || ""
    ).trim();
    expect(beforeText).to.equal("Vacant at No timeout scheduled");

    stateChangedHandler!({
      data: {
        entity_id: "binary_sensor.occupancy_area_kitchen",
        old_state: {
          state: "off",
          attributes: {
            device_class: "occupancy",
            location_id: "area_kitchen",
          },
        },
        new_state: {
          state: "on",
          attributes: {
            device_class: "occupancy",
            location_id: "area_kitchen",
            effective_timeout_at: expectedVacantAt,
            vacant_at: expectedVacantAt,
            contributions: [{ source_id: "light.master_bath_toilet_light", expires_at: expectedVacantAt }],
          },
        },
      },
    });

    await waitUntil(
      () =>
        (
          element.shadowRoot!.querySelector('[data-testid="header-vacant-at"]')?.textContent || ""
        ).includes(expectedVacantAtLabel),
      "header vacant-at did not update from live occupancy state_changed event"
    );
  });

  it("shows inline device action include toggles and no Add Rule button", async () => {
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>) => {
        if (request.type === "config/entity_registry/list") return [] as T;
        if (request.type === "config/device_registry/list") return [] as T;
        return [] as T;
      },
      callApi: async <T>(): Promise<T> => ({ result: "ok" } as T),
      connection: {},
      states: {
        "light.kitchen_ceiling": {
          entity_id: "light.kitchen_ceiling",
          state: "off",
          attributes: {
            friendly_name: "Kitchen Ceiling",
            area_id: "kitchen",
          },
        },
      },
      areas: {},
      floors: {},
      localize: (key: string) => key,
    };

    const location = structuredClone(baseLocation);
    location.id = "area_kitchen";
    location.ha_area_id = "kitchen";
    location.modules._meta = { type: "area" };
    location.entity_ids = ["light.kitchen_ceiling"];

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
      ></ht-location-inspector>
    `);

    const vacantTab = Array.from(element.shadowRoot!.querySelectorAll(".tab")).find(
      (el) => (el.textContent || "").includes("On Vacant")
    ) as HTMLButtonElement | undefined;
    expect(vacantTab).to.exist;
    vacantTab!.click();
    await element.updateComplete;

    await waitUntil(
      () =>
        !!Array.from(element.shadowRoot!.querySelectorAll(".action-device-row")).find((el) =>
          (el.textContent || "").includes("Kitchen Ceiling")
        ),
      "inline action device row did not render"
    );

    const addRuleButton = Array.from(element.shadowRoot!.querySelectorAll("button")).find((el) =>
      (el.textContent || "").includes("Add Rule")
    );
    expect(addRuleButton).to.not.exist;

    const row = Array.from(element.shadowRoot!.querySelectorAll(".action-device-row")).find((el) =>
      (el.textContent || "").includes("Kitchen Ceiling")
    ) as HTMLElement | undefined;
    expect(row).to.exist;
    const inlineEntity = row!.querySelector(".action-name-row .action-entity-inline");
    expect((inlineEntity?.textContent || "").trim()).to.equal("light.kitchen_ceiling");
    expect(row!.querySelector("select.action-service-select")).to.exist;
    expect(row!.querySelector('input[type="checkbox"]')).to.exist;
  });

  it("maps forced actions alias to occupied-actions default tab", async () => {
    const hass: HomeAssistant = {
      callWS: async <T>() => [] as T,
      connection: {},
      states: {},
      areas: {},
      floors: {},
      localize: (key: string) => key,
    };

    const location = structuredClone(baseLocation);

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
        .forcedTab=${"actions"}
      ></ht-location-inspector>
    `);
    await element.updateComplete;

    const activeTab = element.shadowRoot!.querySelector(".tab.active");
    expect((activeTab?.textContent || "").trim()).to.equal("On Occupied");
  });

  it("keeps enabled action devices at the top of the list", async () => {
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>) => {
        if (request.type === "topomation/actions/rules/list") {
          return {
            rules: [
              {
                id: "rule_enabled",
                entity_id: "automation.rule_enabled",
                name: "Kitchen Occupied: Zeta Light (turn on)",
                trigger_type: "occupied",
                action_entity_id: "light.kitchen_zeta",
                action_service: "turn_on",
                require_dark: false,
                enabled: true,
              },
            ],
          } as T;
        }
        if (request.type === "config/entity_registry/list") return [] as T;
        if (request.type === "config/device_registry/list") return [] as T;
        if (request.type === "automation/config") return { config: undefined } as T;
        return [] as T;
      },
      callApi: async <T>(): Promise<T> => ({ result: "ok" } as T),
      connection: {},
      states: {
        "binary_sensor.kitchen_occupancy": {
          entity_id: "binary_sensor.kitchen_occupancy",
          state: "off",
          attributes: {
            friendly_name: "Kitchen Occupancy",
            device_class: "occupancy",
            location_id: "area_kitchen",
          },
        },
        "light.kitchen_alpha": {
          entity_id: "light.kitchen_alpha",
          state: "off",
          attributes: {
            friendly_name: "Kitchen Alpha",
            area_id: "kitchen",
          },
        },
        "light.kitchen_zeta": {
          entity_id: "light.kitchen_zeta",
          state: "off",
          attributes: {
            friendly_name: "Kitchen Zeta",
            area_id: "kitchen",
          },
        },
      },
      areas: {},
      floors: {},
      localize: (key: string) => key,
    };

    const location = structuredClone(baseLocation);
    location.id = "area_kitchen";
    location.ha_area_id = "kitchen";
    location.modules._meta = { type: "area" };
    location.entity_ids = ["light.kitchen_alpha", "light.kitchen_zeta"];

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
        .forcedTab=${"actions"}
      ></ht-location-inspector>
    `);
    await element.updateComplete;

    await waitUntil(
      () => element.shadowRoot!.querySelectorAll(".action-device-row").length === 2,
      "expected two action rows to render"
    );

    const rows = Array.from(element.shadowRoot!.querySelectorAll(".action-device-row"));
    expect((rows[0].textContent || "")).to.include("Kitchen Zeta");
  });

  it("creates managed automation rule when inline action include toggle is enabled", async () => {
    const createCalls: Array<Record<string, any>> = [];
    const rules: Array<Record<string, any>> = [];
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>) => {
        if (request.type === "topomation/actions/rules/list") {
          return { rules } as T;
        }
        if (request.type === "topomation/actions/rules/create") {
          createCalls.push(request);
          const rule = {
            id: `rule_${createCalls.length}`,
            entity_id: `automation.rule_${createCalls.length}`,
            name: request.name,
            trigger_type: request.trigger_type,
            action_entity_id: request.action_entity_id,
            action_service: request.action_service,
            require_dark: Boolean(request.require_dark),
            enabled: true,
          };
          rules.push(rule);
          return { rule } as T;
        }
        if (request.type === "topomation/actions/rules/delete") {
          return { success: true } as T;
        }
        if (request.type === "config/entity_registry/list") return [] as T;
        if (request.type === "config/device_registry/list") return [] as T;
        if (request.type === "automation/config") return { config: undefined } as T;
        return [] as T;
      },
      callApi: async <T>(): Promise<T> => ({ result: "ok" } as T),
      connection: {},
      states: {
        "binary_sensor.kitchen_occupancy": {
          entity_id: "binary_sensor.kitchen_occupancy",
          state: "off",
          attributes: {
            friendly_name: "Kitchen Occupancy",
            device_class: "occupancy",
            location_id: "area_kitchen",
          },
        },
        "light.kitchen_ceiling": {
          entity_id: "light.kitchen_ceiling",
          state: "off",
          attributes: {
            friendly_name: "Kitchen Ceiling",
            area_id: "kitchen",
          },
        },
      },
      areas: {},
      floors: {},
      localize: (key: string) => key,
    };

    const location = structuredClone(baseLocation);
    location.id = "area_kitchen";
    location.ha_area_id = "kitchen";
    location.modules._meta = { type: "area" };
    location.entity_ids = ["light.kitchen_ceiling"];

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
        .forcedTab=${"actions"}
      ></ht-location-inspector>
    `);
    await element.updateComplete;

    await waitUntil(
      () =>
        !!Array.from(element.shadowRoot!.querySelectorAll(".action-device-row")).find((el) =>
          (el.textContent || "").includes("Kitchen Ceiling")
        ),
      "inline action device row did not render"
    );

    const row = Array.from(element.shadowRoot!.querySelectorAll(".action-device-row")).find((el) =>
      (el.textContent || "").includes("Kitchen Ceiling")
    ) as HTMLElement | undefined;
    expect(row).to.exist;

    const toggle = row!.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
    expect(toggle).to.exist;
    toggle!.click();
    await element.updateComplete;

    await waitUntil(() => createCalls.length > 0, "managed rule creation call did not occur");
    expect(createCalls[0].action_entity_id).to.equal("light.kitchen_ceiling");
  });

  it("keeps inline managed action enabled when entity registry API is unavailable", async () => {
    const createCalls: Array<Record<string, any>> = [];
    const rules: Array<Record<string, any>> = [];
    const states: Record<string, any> = {
      "binary_sensor.kitchen_occupancy": {
        entity_id: "binary_sensor.kitchen_occupancy",
        state: "off",
        attributes: {
          friendly_name: "Kitchen Occupancy",
          device_class: "occupancy",
          location_id: "area_kitchen",
        },
      },
      "light.kitchen_ceiling": {
        entity_id: "light.kitchen_ceiling",
        state: "off",
        attributes: {
          friendly_name: "Kitchen Ceiling",
          area_id: "kitchen",
        },
      },
    };

    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>) => {
        if (request.type === "topomation/actions/rules/list") {
          return { rules } as T;
        }
        if (request.type === "topomation/actions/rules/create") {
          createCalls.push(request);
          const rule = {
            id: `rule_${createCalls.length}`,
            entity_id: `automation.rule_${createCalls.length}`,
            name: request.name,
            trigger_type: request.trigger_type,
            action_entity_id: request.action_entity_id,
            action_service: request.action_service,
            require_dark: Boolean(request.require_dark),
            enabled: true,
          };
          rules.push(rule);
          return { rule } as T;
        }
        if (request.type === "topomation/actions/rules/delete") {
          return { success: true } as T;
        }
        if (request.type === "config/entity_registry/list") {
          throw new Error("forbidden");
        }
        if (request.type === "config/device_registry/list") return [] as T;
        if (request.type === "automation/config") throw new Error("forbidden");
        return [] as T;
      },
      callApi: async <T>(): Promise<T> => ({ result: "ok" } as T),
      connection: {},
      states,
      areas: {},
      floors: {},
      localize: (key: string) => key,
    };

    const location = structuredClone(baseLocation);
    location.id = "area_kitchen";
    location.ha_area_id = "kitchen";
    location.modules._meta = { type: "area" };
    location.entity_ids = ["light.kitchen_ceiling"];

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
        .forcedTab=${"actions"}
      ></ht-location-inspector>
    `);
    await element.updateComplete;

    const findRow = () =>
      Array.from(element.shadowRoot!.querySelectorAll(".action-device-row")).find((el) =>
        (el.textContent || "").includes("Kitchen Ceiling")
      ) as HTMLElement | undefined;

    await waitUntil(() => !!findRow(), "inline action device row did not render");

    const toggle = findRow()!.querySelector("input.action-include-input") as HTMLInputElement | null;
    expect(toggle).to.exist;
    toggle!.click();
    await element.updateComplete;

    await waitUntil(() => createCalls.length > 0, "managed rule creation call did not occur");

    await waitUntil(() => {
      const updated = findRow()?.querySelector("input.action-include-input") as
        | HTMLInputElement
        | null;
      return !!updated && updated.checked;
    }, "managed action toggle should stay enabled after save");
  });

  it("keeps inline managed action enabled when automation config reads are blocked", async () => {
    const createCalls: Array<Record<string, any>> = [];
    const rules: Array<Record<string, any>> = [];
    const states: Record<string, any> = {
      "binary_sensor.kitchen_occupancy": {
        entity_id: "binary_sensor.kitchen_occupancy",
        state: "off",
        attributes: {
          friendly_name: "Kitchen Occupancy",
          device_class: "occupancy",
          location_id: "area_kitchen",
        },
      },
      "light.kitchen_ceiling": {
        entity_id: "light.kitchen_ceiling",
        state: "off",
        attributes: {
          friendly_name: "Kitchen Ceiling",
          area_id: "kitchen",
        },
      },
    };

    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>) => {
        if (request.type === "topomation/actions/rules/list") {
          return { rules } as T;
        }
        if (request.type === "topomation/actions/rules/create") {
          createCalls.push(request);
          const rule = {
            id: `rule_${createCalls.length}`,
            entity_id: `automation.rule_${createCalls.length}`,
            name: request.name,
            trigger_type: request.trigger_type,
            action_entity_id: request.action_entity_id,
            action_service: request.action_service,
            require_dark: Boolean(request.require_dark),
            enabled: true,
          };
          rules.push(rule);
          return { rule } as T;
        }
        if (request.type === "topomation/actions/rules/delete") {
          return { success: true } as T;
        }
        if (request.type === "config/entity_registry/list") {
          throw new Error("forbidden");
        }
        if (request.type === "config/device_registry/list") return [] as T;
        if (request.type === "automation/config") {
          throw new Error("forbidden");
        }
        return [] as T;
      },
      callApi: async <T>(): Promise<T> => ({ result: "ok" } as T),
      connection: {},
      states,
      areas: {},
      floors: {},
      localize: (key: string) => key,
    };

    const location = structuredClone(baseLocation);
    location.id = "area_kitchen";
    location.ha_area_id = "kitchen";
    location.modules._meta = { type: "area" };
    location.entity_ids = ["light.kitchen_ceiling"];

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
        .forcedTab=${"actions"}
      ></ht-location-inspector>
    `);
    await element.updateComplete;

    const findRow = () =>
      Array.from(element.shadowRoot!.querySelectorAll(".action-device-row")).find((el) =>
        (el.textContent || "").includes("Kitchen Ceiling")
      ) as HTMLElement | undefined;

    await waitUntil(() => !!findRow(), "inline action device row did not render");

    const toggle = findRow()!.querySelector("input.action-include-input") as HTMLInputElement | null;
    expect(toggle).to.exist;
    toggle!.click();
    await element.updateComplete;

    await waitUntil(() => createCalls.length > 0, "managed rule creation call did not occur");

    await waitUntil(() => {
      const updated = findRow()?.querySelector("input.action-include-input") as
        | HTMLInputElement
        | null;
      return !!updated && updated.checked;
    }, "managed action toggle should stay enabled after save when reads are blocked");
  });

  it("keeps inline managed action enabled when state-fallback cannot enumerate new automation yet", async () => {
    const createCalls: Array<Record<string, any>> = [];
    const rules: Array<Record<string, any>> = [];
    const states: Record<string, any> = {
      "binary_sensor.kitchen_occupancy": {
        entity_id: "binary_sensor.kitchen_occupancy",
        state: "off",
        attributes: {
          friendly_name: "Kitchen Occupancy",
          device_class: "occupancy",
          location_id: "area_kitchen",
        },
      },
      "light.kitchen_ceiling": {
        entity_id: "light.kitchen_ceiling",
        state: "off",
        attributes: {
          friendly_name: "Kitchen Ceiling",
          area_id: "kitchen",
        },
      },
      "automation.unrelated_rule": {
        entity_id: "automation.unrelated_rule",
        state: "on",
        attributes: {
          friendly_name: "Unrelated Rule",
          id: "manual_unrelated_rule",
        },
      },
    };

    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>) => {
        if (request.type === "topomation/actions/rules/list") {
          return { rules } as T;
        }
        if (request.type === "topomation/actions/rules/create") {
          createCalls.push(request);
          const rule = {
            id: `rule_${createCalls.length}`,
            entity_id: `automation.rule_${createCalls.length}`,
            name: request.name,
            trigger_type: request.trigger_type,
            action_entity_id: request.action_entity_id,
            action_service: request.action_service,
            require_dark: Boolean(request.require_dark),
            enabled: true,
          };
          rules.push(rule);
          return { rule } as T;
        }
        if (request.type === "topomation/actions/rules/delete") {
          return { success: true } as T;
        }
        if (request.type === "config/entity_registry/list") {
          throw new Error("forbidden");
        }
        if (request.type === "config/device_registry/list") return [] as T;
        if (request.type === "automation/config") {
          throw new Error("forbidden");
        }
        return [] as T;
      },
      callApi: async <T>(): Promise<T> => ({ result: "ok" } as T),
      connection: {},
      states,
      areas: {},
      floors: {},
      localize: (key: string) => key,
    };

    const location = structuredClone(baseLocation);
    location.id = "area_kitchen";
    location.ha_area_id = "kitchen";
    location.modules._meta = { type: "area" };
    location.entity_ids = ["light.kitchen_ceiling"];

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
        .forcedTab=${"actions"}
      ></ht-location-inspector>
    `);
    await element.updateComplete;

    const findRow = () =>
      Array.from(element.shadowRoot!.querySelectorAll(".action-device-row")).find((el) =>
        (el.textContent || "").includes("Kitchen Ceiling")
      ) as HTMLElement | undefined;

    await waitUntil(() => !!findRow(), "inline action device row did not render");

    const toggle = findRow()!.querySelector("input.action-include-input") as HTMLInputElement | null;
    expect(toggle).to.exist;
    toggle!.click();
    await element.updateComplete;

    await waitUntil(() => createCalls.length > 0, "managed rule creation call did not occur");

    await waitUntil(() => {
      const updated = findRow()?.querySelector("input.action-include-input") as
        | HTMLInputElement
        | null;
      return !!updated && updated.checked;
    }, "managed action toggle should stay enabled after save when fallback reads fail");
  });

  it("writes sun-based dark condition when dark toggle is enabled", async () => {
    const createCalls: Array<Record<string, any>> = [];
    const rules: Array<Record<string, any>> = [];
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>) => {
        if (request.type === "topomation/actions/rules/list") {
          return { rules } as T;
        }
        if (request.type === "topomation/actions/rules/create") {
          createCalls.push(request);
          const rule = {
            id: `rule_${createCalls.length}`,
            entity_id: `automation.rule_${createCalls.length}`,
            name: request.name,
            trigger_type: request.trigger_type,
            action_entity_id: request.action_entity_id,
            action_service: request.action_service,
            require_dark: Boolean(request.require_dark),
            enabled: true,
          };
          rules.push(rule);
          return { rule } as T;
        }
        if (request.type === "topomation/actions/rules/delete") {
          return { success: true } as T;
        }
        if (request.type === "config/entity_registry/list") return [] as T;
        if (request.type === "config/device_registry/list") return [] as T;
        if (request.type === "automation/config") return { config: undefined } as T;
        return [] as T;
      },
      callApi: async <T>(): Promise<T> => ({ result: "ok" } as T),
      connection: {},
      states: {
        "binary_sensor.kitchen_occupancy": {
          entity_id: "binary_sensor.kitchen_occupancy",
          state: "off",
          attributes: {
            friendly_name: "Kitchen Occupancy",
            device_class: "occupancy",
            location_id: "area_kitchen",
          },
        },
        "light.kitchen_ceiling": {
          entity_id: "light.kitchen_ceiling",
          state: "off",
          attributes: {
            friendly_name: "Kitchen Ceiling",
            area_id: "kitchen",
          },
        },
      },
      areas: {},
      floors: {},
      localize: (key: string) => key,
    };

    const location = structuredClone(baseLocation);
    location.id = "area_kitchen";
    location.ha_area_id = "kitchen";
    location.modules._meta = { type: "area" };
    location.entity_ids = ["light.kitchen_ceiling"];

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
        .forcedTab=${"actions"}
      ></ht-location-inspector>
    `);
    await element.updateComplete;

    await waitUntil(
      () =>
        !!Array.from(element.shadowRoot!.querySelectorAll(".action-device-row")).find((el) =>
          (el.textContent || "").includes("Kitchen Ceiling")
        ),
      "inline action device row did not render"
    );

    const row = Array.from(element.shadowRoot!.querySelectorAll(".action-device-row")).find((el) =>
      (el.textContent || "").includes("Kitchen Ceiling")
    ) as HTMLElement | undefined;
    expect(row).to.exist;

    const darkToggle = row!.querySelector("input.action-dark-input") as HTMLInputElement | null;
    expect(darkToggle).to.exist;
    darkToggle!.click();
    await element.updateComplete;

    const includeToggle = row!.querySelector("input.action-include-input") as HTMLInputElement | null;
    expect(includeToggle).to.exist;
    includeToggle!.click();
    await element.updateComplete;

    await waitUntil(() => createCalls.length > 0, "managed rule creation call did not occur");
    expect(createCalls[0].require_dark).to.equal(true);
  });

  it("does not render dark toggle on On Vacant tab", async () => {
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>) => {
        if (request.type === "topomation/actions/rules/list") {
          return { rules: [] } as T;
        }
        if (request.type === "config/entity_registry/list") return [] as T;
        if (request.type === "config/device_registry/list") return [] as T;
        if (request.type === "automation/config") return { config: undefined } as T;
        return [] as T;
      },
      callApi: async <T>(): Promise<T> => ({ result: "ok" } as T),
      connection: {},
      states: {
        "binary_sensor.kitchen_occupancy": {
          entity_id: "binary_sensor.kitchen_occupancy",
          state: "off",
          attributes: {
            friendly_name: "Kitchen Occupancy",
            device_class: "occupancy",
            location_id: "area_kitchen",
          },
        },
        "light.kitchen_ceiling": {
          entity_id: "light.kitchen_ceiling",
          state: "off",
          attributes: {
            friendly_name: "Kitchen Ceiling",
            area_id: "kitchen",
          },
        },
      },
      areas: {},
      floors: {},
      localize: (key: string) => key,
    };

    const location = structuredClone(baseLocation);
    location.id = "area_kitchen";
    location.ha_area_id = "kitchen";
    location.modules._meta = { type: "area" };
    location.entity_ids = ["light.kitchen_ceiling"];

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
        .forcedTab=${"actions"}
      ></ht-location-inspector>
    `);
    await element.updateComplete;

    await waitUntil(
      () =>
        !!Array.from(element.shadowRoot!.querySelectorAll(".action-device-row")).find((el) =>
          (el.textContent || "").includes("Kitchen Ceiling")
        ),
      "inline action device row did not render"
    );

    const vacantTab = Array.from(element.shadowRoot!.querySelectorAll(".tab")).find((el) =>
      (el.textContent || "").includes("On Vacant")
    ) as HTMLButtonElement | undefined;
    expect(vacantTab).to.exist;
    vacantTab!.click();
    (element as any)._activeTab = "vacant_actions";
    element.requestUpdate();
    await element.updateComplete;

    const row = Array.from(element.shadowRoot!.querySelectorAll(".action-device-row")).find((el) =>
      (el.textContent || "").includes("Kitchen Ceiling")
    ) as HTMLElement | undefined;
    expect(row).to.exist;
    const darkToggle = row!.querySelector("input.action-dark-input");
    expect(darkToggle).to.equal(null);
  });

  it("forces require_dark false for On Vacant managed rule saves", async () => {
    const createCalls: Array<Record<string, any>> = [];
    const rules: Array<Record<string, any>> = [];
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>) => {
        if (request.type === "topomation/actions/rules/list") {
          return { rules } as T;
        }
        if (request.type === "topomation/actions/rules/create") {
          createCalls.push(request);
          const rule = {
            id: `rule_${createCalls.length}`,
            entity_id: `automation.rule_${createCalls.length}`,
            name: request.name,
            trigger_type: request.trigger_type,
            action_entity_id: request.action_entity_id,
            action_service: request.action_service,
            require_dark: Boolean(request.require_dark),
            enabled: true,
          };
          rules.push(rule);
          return { rule } as T;
        }
        if (request.type === "topomation/actions/rules/delete") {
          return { success: true } as T;
        }
        if (request.type === "config/entity_registry/list") return [] as T;
        if (request.type === "config/device_registry/list") return [] as T;
        if (request.type === "automation/config") return { config: undefined } as T;
        return [] as T;
      },
      callApi: async <T>(): Promise<T> => ({ result: "ok" } as T),
      connection: {},
      states: {
        "binary_sensor.kitchen_occupancy": {
          entity_id: "binary_sensor.kitchen_occupancy",
          state: "off",
          attributes: {
            friendly_name: "Kitchen Occupancy",
            device_class: "occupancy",
            location_id: "area_kitchen",
          },
        },
        "light.kitchen_ceiling": {
          entity_id: "light.kitchen_ceiling",
          state: "off",
          attributes: {
            friendly_name: "Kitchen Ceiling",
            area_id: "kitchen",
          },
        },
      },
      areas: {},
      floors: {},
      localize: (key: string) => key,
    };

    const location = structuredClone(baseLocation);
    location.id = "area_kitchen";
    location.ha_area_id = "kitchen";
    location.modules._meta = { type: "area" };
    location.entity_ids = ["light.kitchen_ceiling"];

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
        .forcedTab=${"actions"}
      ></ht-location-inspector>
    `);
    await element.updateComplete;

    await waitUntil(
      () =>
        !!Array.from(element.shadowRoot!.querySelectorAll(".action-device-row")).find((el) =>
          (el.textContent || "").includes("Kitchen Ceiling")
        ),
      "inline action device row did not render"
    );

    (element as any)._actionDarkSelections = {
      "vacant:light.kitchen_ceiling": true,
    };

    const vacantTab = Array.from(element.shadowRoot!.querySelectorAll(".tab")).find((el) =>
      (el.textContent || "").includes("On Vacant")
    ) as HTMLButtonElement | undefined;
    expect(vacantTab).to.exist;
    vacantTab!.click();
    (element as any)._activeTab = "vacant_actions";
    element.requestUpdate();
    await element.updateComplete;

    const row = Array.from(element.shadowRoot!.querySelectorAll(".action-device-row")).find((el) =>
      (el.textContent || "").includes("Kitchen Ceiling")
    ) as HTMLElement | undefined;
    expect(row).to.exist;

    const includeToggle = row!.querySelector("input.action-include-input") as HTMLInputElement | null;
    expect(includeToggle).to.exist;
    includeToggle!.click();
    await element.updateComplete;

    await waitUntil(() => createCalls.length > 0, "vacant managed rule creation call did not occur");
    expect(createCalls[0].trigger_type).to.equal("vacant");
    expect(createCalls[0].require_dark).to.equal(false);
  });

  it("recognizes managed rules when automation unique_id is opaque", async () => {
    const automationEntityId = "automation.generated_kitchen_occupied";
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>) => {
        if (request.type === "config/entity_registry/list") {
          return [
            {
              entity_id: automationEntityId,
              unique_id: "01JXXXXAUTOMATIONOPAQUE",
              domain: "automation",
              platform: "automation",
              labels: [],
              categories: {},
            },
          ] as T;
        }
        if (request.type === "config/device_registry/list") return [] as T;
        if (request.type === "automation/config") {
          if (request.entity_id !== automationEntityId) return { config: undefined } as T;
          return {
            config: {
              id: "topomation_area_kitchen_occupied_1234567890_abcd",
              alias: "Kitchen Occupied: Kitchen Ceiling (turn on)",
              description:
                'Managed by Topomation.\n[topomation] {"version":1,"location_id":"area_kitchen","trigger_type":"occupied"}',
              actions: [
                {
                  action: "light.turn_on",
                  target: { entity_id: "light.kitchen_ceiling" },
                },
              ],
            },
          } as T;
        }
        return [] as T;
      },
      callApi: async <T>(): Promise<T> => ({ result: "ok" } as T),
      connection: {},
      states: {
        [automationEntityId]: {
          entity_id: automationEntityId,
          state: "on",
          attributes: {
            friendly_name: "Kitchen Occupied: Kitchen Ceiling (turn on)",
          },
        },
        "light.kitchen_ceiling": {
          entity_id: "light.kitchen_ceiling",
          state: "off",
          attributes: {
            friendly_name: "Kitchen Ceiling",
            area_id: "kitchen",
          },
        },
      },
      areas: {},
      floors: {},
      localize: (key: string) => key,
    };

    const location = structuredClone(baseLocation);
    location.id = "area_kitchen";
    location.ha_area_id = "kitchen";
    location.modules._meta = { type: "area" };
    location.entity_ids = ["light.kitchen_ceiling"];

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
        .forcedTab=${"actions"}
      ></ht-location-inspector>
    `);
    await element.updateComplete;

    const findRow = () =>
      Array.from(element.shadowRoot!.querySelectorAll(".action-device-row")).find((el) =>
        (el.textContent || "").includes("Kitchen Ceiling")
      ) as HTMLElement | undefined;

    await waitUntil(() => !!findRow(), "inline action device row did not render");

    const row = findRow();
    expect(row).to.exist;
    const toggle = row!.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
    expect(toggle).to.exist;
    expect(toggle!.checked).to.equal(true);
  });

  it("loads dark toggle state from existing managed automation conditions", async () => {
    const automationEntityId = "automation.kitchen_occupied_dark";
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>) => {
        if (request.type === "config/entity_registry/list") {
          return [
            {
              entity_id: automationEntityId,
              unique_id: "topomation_area_kitchen_occupied_dark",
              domain: "automation",
              platform: "automation",
              labels: [],
              categories: {},
            },
          ] as T;
        }
        if (request.type === "config/device_registry/list") return [] as T;
        if (request.type === "automation/config") {
          if (request.entity_id !== automationEntityId) return { config: undefined } as T;
          return {
            config: {
              id: "topomation_area_kitchen_occupied_dark",
              alias: "Kitchen Occupied: Kitchen Ceiling (turn on)",
              description:
                'Managed by Topomation.\n[topomation] {"version":1,"location_id":"area_kitchen","trigger_type":"occupied"}',
              conditions: [
                {
                  condition: "state",
                  entity_id: "sun.sun",
                  state: "below_horizon",
                },
              ],
              actions: [
                {
                  action: "light.turn_on",
                  target: { entity_id: "light.kitchen_ceiling" },
                },
              ],
            },
          } as T;
        }
        return [] as T;
      },
      callApi: async <T>(): Promise<T> => ({ result: "ok" } as T),
      connection: {},
      states: {
        [automationEntityId]: {
          entity_id: automationEntityId,
          state: "on",
          attributes: {
            friendly_name: "Kitchen Occupied: Kitchen Ceiling (turn on)",
          },
        },
        "light.kitchen_ceiling": {
          entity_id: "light.kitchen_ceiling",
          state: "off",
          attributes: {
            friendly_name: "Kitchen Ceiling",
            area_id: "kitchen",
          },
        },
      },
      areas: {},
      floors: {},
      localize: (key: string) => key,
    };

    const location = structuredClone(baseLocation);
    location.id = "area_kitchen";
    location.ha_area_id = "kitchen";
    location.modules._meta = { type: "area" };
    location.entity_ids = ["light.kitchen_ceiling"];

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
        .forcedTab=${"actions"}
      ></ht-location-inspector>
    `);
    await element.updateComplete;

    const findRow = () =>
      Array.from(element.shadowRoot!.querySelectorAll(".action-device-row")).find((el) =>
        (el.textContent || "").includes("Kitchen Ceiling")
      ) as HTMLElement | undefined;

    await waitUntil(() => !!findRow(), "inline action device row did not render");

    const row = findRow();
    expect(row).to.exist;
    const darkToggle = row!.querySelector("input.action-dark-input") as HTMLInputElement | null;
    expect(darkToggle).to.exist;
    expect(darkToggle!.checked).to.equal(true);
  });

  it("refreshes managed action rows when automation is deleted externally", async () => {
    let stateChangedHandler: ((event: any) => void) | undefined;
    const automationEntityId = "automation.kitchen_occupied_action";
    const automationConfigByEntityId: Record<string, Record<string, any> | undefined> = {
      [automationEntityId]: {
        id: "topomation_area_kitchen_occupied_abc123",
        alias: "Kitchen Occupied: Kitchen Ceiling (turn on)",
        description:
          'Managed by Topomation.\n[topomation] {"version":1,"location_id":"area_kitchen","trigger_type":"occupied"}',
        actions: [
          {
            action: "light.turn_on",
            target: { entity_id: "light.kitchen_ceiling" },
          },
        ],
      },
    };
    const states: Record<string, any> = {
      [automationEntityId]: {
        entity_id: automationEntityId,
        state: "on",
        attributes: {
          friendly_name: "Kitchen Occupied: Kitchen Ceiling (turn on)",
        },
      },
      "light.kitchen_ceiling": {
        entity_id: "light.kitchen_ceiling",
        state: "off",
        attributes: {
          friendly_name: "Kitchen Ceiling",
          area_id: "kitchen",
        },
      },
    };

    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>) => {
        if (request.type === "config/entity_registry/list") {
          return [
            {
              entity_id: automationEntityId,
              unique_id: "topomation_area_kitchen_occupied_abc123",
              domain: "automation",
              platform: "automation",
            },
          ] as T;
        }
        if (request.type === "config/device_registry/list") return [] as T;
        if (request.type === "automation/config") {
          return {
            config: automationConfigByEntityId[request.entity_id],
          } as T;
        }
        return [] as T;
      },
      callApi: async <T>(): Promise<T> => ({ result: "ok" } as T),
      connection: {
        subscribeEvents: async (handler: (event: any) => void, eventType: string) => {
          if (eventType === "state_changed") {
            stateChangedHandler = handler;
          }
          return () => {};
        },
      },
      states,
      areas: {},
      floors: {},
      localize: (key: string) => key,
    };

    const location = structuredClone(baseLocation);
    location.id = "area_kitchen";
    location.ha_area_id = "kitchen";
    location.modules._meta = { type: "area" };
    location.entity_ids = ["light.kitchen_ceiling"];

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
        .forcedTab=${"actions"}
      ></ht-location-inspector>
    `);
    await element.updateComplete;

    const findToggle = () =>
      (Array.from(element.shadowRoot!.querySelectorAll(".action-device-row"))
        .find((el) => (el.textContent || "").includes("Kitchen Ceiling"))
        ?.querySelector("input.action-include-input") as HTMLInputElement | null) ?? null;

    await waitUntil(() => !!findToggle(), "inline action device row did not render");
    expect(findToggle()!.checked).to.equal(true);
    expect(stateChangedHandler).to.exist;

    delete states[automationEntityId];
    delete automationConfigByEntityId[automationEntityId];
    stateChangedHandler!({
      data: {
        entity_id: automationEntityId,
        old_state: { state: "on" },
        new_state: null,
      },
    });

    await waitUntil(() => {
      const toggle = findToggle();
      return !!toggle && !toggle.checked;
    }, "managed action toggle should clear after external automation deletion");
  });

  it("refreshes managed action rows when automation is added externally", async () => {
    let stateChangedHandler: ((event: any) => void) | undefined;
    const automationEntityId = "automation.kitchen_occupied_action_added";
    const automationConfigByEntityId: Record<string, Record<string, any> | undefined> = {};
    const states: Record<string, any> = {
      "light.kitchen_ceiling": {
        entity_id: "light.kitchen_ceiling",
        state: "off",
        attributes: {
          friendly_name: "Kitchen Ceiling",
          area_id: "kitchen",
        },
      },
    };

    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>) => {
        if (request.type === "config/entity_registry/list") {
          return automationConfigByEntityId[automationEntityId]
            ? [
                {
                  entity_id: automationEntityId,
                  unique_id: "topomation_area_kitchen_occupied_added",
                  domain: "automation",
                  platform: "automation",
                },
              ]
            : ([] as any);
        }
        if (request.type === "config/device_registry/list") return [] as T;
        if (request.type === "automation/config") {
          return {
            config: automationConfigByEntityId[request.entity_id],
          } as T;
        }
        return [] as T;
      },
      callApi: async <T>(): Promise<T> => ({ result: "ok" } as T),
      connection: {
        subscribeEvents: async (handler: (event: any) => void, eventType: string) => {
          if (eventType === "state_changed") {
            stateChangedHandler = handler;
          }
          return () => {};
        },
      },
      states,
      areas: {},
      floors: {},
      localize: (key: string) => key,
    };

    const location = structuredClone(baseLocation);
    location.id = "area_kitchen";
    location.ha_area_id = "kitchen";
    location.modules._meta = { type: "area" };
    location.entity_ids = ["light.kitchen_ceiling"];

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
        .forcedTab=${"actions"}
      ></ht-location-inspector>
    `);
    await element.updateComplete;

    const findToggle = () =>
      (Array.from(element.shadowRoot!.querySelectorAll(".action-device-row"))
        .find((el) => (el.textContent || "").includes("Kitchen Ceiling"))
        ?.querySelector("input.action-include-input") as HTMLInputElement | null) ?? null;

    await waitUntil(() => !!findToggle(), "inline action device row did not render");
    expect(findToggle()!.checked).to.equal(false);
    expect(stateChangedHandler).to.exist;

    states[automationEntityId] = {
      entity_id: automationEntityId,
      state: "on",
      attributes: {
        friendly_name: "Kitchen Occupied: Kitchen Ceiling (turn on)",
      },
    };
    automationConfigByEntityId[automationEntityId] = {
      id: "topomation_area_kitchen_occupied_added",
      alias: "Kitchen Occupied: Kitchen Ceiling (turn on)",
      description:
        'Managed by Topomation.\n[topomation] {"version":1,"location_id":"area_kitchen","trigger_type":"occupied"}',
      actions: [
        {
          action: "light.turn_on",
          target: { entity_id: "light.kitchen_ceiling" },
        },
      ],
    };

    stateChangedHandler!({
      data: {
        entity_id: automationEntityId,
        old_state: null,
        new_state: { state: "on" },
      },
    });

    await waitUntil(() => {
      const toggle = findToggle();
      return !!toggle && toggle.checked;
    }, "managed action toggle should enable after external automation add");
  });

  it("uses selected per-device action service when creating managed automation rule", async () => {
    const createCalls: Array<Record<string, any>> = [];
    const rules: Array<Record<string, any>> = [];
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>) => {
        if (request.type === "topomation/actions/rules/list") {
          return { rules } as T;
        }
        if (request.type === "topomation/actions/rules/create") {
          createCalls.push(request);
          const rule = {
            id: `rule_${createCalls.length}`,
            entity_id: `automation.rule_${createCalls.length}`,
            name: request.name,
            trigger_type: request.trigger_type,
            action_entity_id: request.action_entity_id,
            action_service: request.action_service,
            require_dark: Boolean(request.require_dark),
            enabled: true,
          };
          rules.push(rule);
          return { rule } as T;
        }
        if (request.type === "topomation/actions/rules/delete") {
          return { success: true } as T;
        }
        if (request.type === "config/entity_registry/list") return [] as T;
        if (request.type === "config/device_registry/list") return [] as T;
        if (request.type === "automation/config") return { config: undefined } as T;
        return [] as T;
      },
      callApi: async <T>(): Promise<T> => ({ result: "ok" } as T),
      connection: {},
      states: {
        "binary_sensor.kitchen_occupancy": {
          entity_id: "binary_sensor.kitchen_occupancy",
          state: "off",
          attributes: {
            friendly_name: "Kitchen Occupancy",
            device_class: "occupancy",
            location_id: "area_kitchen",
          },
        },
        "light.kitchen_ceiling": {
          entity_id: "light.kitchen_ceiling",
          state: "off",
          attributes: {
            friendly_name: "Kitchen Ceiling",
            area_id: "kitchen",
          },
        },
      },
      areas: {},
      floors: {},
      localize: (key: string) => key,
    };

    const location = structuredClone(baseLocation);
    location.id = "area_kitchen";
    location.ha_area_id = "kitchen";
    location.modules._meta = { type: "area" };
    location.entity_ids = ["light.kitchen_ceiling"];

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
        .forcedTab=${"actions"}
      ></ht-location-inspector>
    `);
    await element.updateComplete;

    await waitUntil(
      () =>
        !!Array.from(element.shadowRoot!.querySelectorAll(".action-device-row")).find((el) =>
          (el.textContent || "").includes("Kitchen Ceiling")
        ),
      "inline action device row did not render"
    );

    const row = Array.from(element.shadowRoot!.querySelectorAll(".action-device-row")).find((el) =>
      (el.textContent || "").includes("Kitchen Ceiling")
    ) as HTMLElement | undefined;
    expect(row).to.exist;
    const inlineEntity = row!.querySelector(".action-name-row .action-entity-inline");
    expect((inlineEntity?.textContent || "").trim()).to.equal("light.kitchen_ceiling");

    const serviceSelect = row!.querySelector("select.action-service-select") as
      | HTMLSelectElement
      | null;
    expect(serviceSelect).to.exist;
    const optionValues = Array.from(serviceSelect!.options).map((option) => option.value);
    expect(optionValues).to.not.include("toggle");
    serviceSelect!.value = "turn_off";
    serviceSelect!.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    await element.updateComplete;

    const toggle = row!.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
    expect(toggle).to.exist;
    toggle!.click();
    await element.updateComplete;

    await waitUntil(
      () =>
        createCalls.some((call) => call.action_service === "turn_off"),
      "managed rule update call with selected action did not occur"
    );
  });

  it("enumerates only supported occupancy action device categories", async () => {
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>) => {
        if (request.type === "config/entity_registry/list") return [] as T;
        if (request.type === "config/device_registry/list") return [] as T;
        if (request.type === "automation/config") return { config: undefined } as T;
        return [] as T;
      },
      callApi: async <T>(): Promise<T> => ({ result: "ok" } as T),
      connection: {},
      states: {
        "light.basic_light": {
          entity_id: "light.basic_light",
          state: "off",
          attributes: {
            friendly_name: "Basic Light",
            area_id: "kitchen",
            supported_color_modes: ["onoff"],
          },
        },
        "light.kitchen_dimmer": {
          entity_id: "light.kitchen_dimmer",
          state: "off",
          attributes: {
            friendly_name: "Kitchen Dimmer",
            area_id: "kitchen",
            supported_color_modes: ["brightness"],
          },
        },
        "light.kitchen_color": {
          entity_id: "light.kitchen_color",
          state: "off",
          attributes: {
            friendly_name: "Kitchen Color Light",
            area_id: "kitchen",
            supported_color_modes: ["xy", "color_temp"],
          },
        },
        "fan.kitchen_fan": {
          entity_id: "fan.kitchen_fan",
          state: "off",
          attributes: {
            friendly_name: "Kitchen Fan",
            area_id: "kitchen",
          },
        },
        "media_player.family_tv": {
          entity_id: "media_player.family_tv",
          state: "off",
          attributes: {
            friendly_name: "Family TV",
            area_id: "kitchen",
            device_class: "tv",
          },
        },
        "media_player.hifi_receiver": {
          entity_id: "media_player.hifi_receiver",
          state: "off",
          attributes: {
            friendly_name: "HiFi Receiver",
            area_id: "kitchen",
          },
        },
        "switch.exhaust": {
          entity_id: "switch.exhaust",
          state: "off",
          attributes: {
            friendly_name: "Exhaust Switch",
            area_id: "kitchen",
          },
        },
      },
      areas: {},
      floors: {},
      localize: (key: string) => key,
    };

    const location = structuredClone(baseLocation);
    location.id = "area_kitchen";
    location.ha_area_id = "kitchen";
    location.modules._meta = { type: "area" };
    location.entity_ids = [
      "light.basic_light",
      "light.kitchen_dimmer",
      "light.kitchen_color",
      "fan.kitchen_fan",
      "media_player.family_tv",
      "media_player.hifi_receiver",
      "switch.exhaust",
    ];

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
        .forcedTab=${"actions"}
      ></ht-location-inspector>
    `);
    await element.updateComplete;

    await waitUntil(
      () => element.shadowRoot!.querySelectorAll(".action-device-row").length === 6,
      "expected exactly 6 supported action device rows"
    );

    const text = element.shadowRoot!.textContent || "";
    expect(text).to.include("State:");
    expect(text).to.not.include("Entity:");
    expect(text).to.not.include("Type:");
    expect(text).to.not.include("Configured action:");
    expect(text).to.not.include("Exhaust Switch");

    const stereoRow = Array.from(element.shadowRoot!.querySelectorAll(".action-device-row")).find((el) =>
      (el.textContent || "").includes("HiFi Receiver")
    ) as HTMLElement | undefined;
    expect(stereoRow).to.exist;
    const serviceSelect = stereoRow!.querySelector("select.action-service-select") as
      | HTMLSelectElement
      | null;
    expect(serviceSelect).to.exist;
    const optionValues = Array.from(serviceSelect!.options).map((option) => option.value);
    expect(optionValues).to.deep.equal(["media_stop", "media_pause", "turn_off"]);
  });

  it("updates action label text when service selection changes on occupied and vacant tabs", async () => {
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>) => {
        if (request.type === "config/entity_registry/list") return [] as T;
        if (request.type === "config/device_registry/list") return [] as T;
        if (request.type === "automation/config") return { config: undefined } as T;
        return [] as T;
      },
      callApi: async <T>(): Promise<T> => ({ result: "ok" } as T),
      connection: {},
      states: {
        "binary_sensor.kitchen_occupancy": {
          entity_id: "binary_sensor.kitchen_occupancy",
          state: "off",
          attributes: {
            friendly_name: "Kitchen Occupancy",
            device_class: "occupancy",
            location_id: "area_kitchen",
          },
        },
        "light.kitchen_ceiling": {
          entity_id: "light.kitchen_ceiling",
          state: "off",
          attributes: {
            friendly_name: "Kitchen Ceiling",
            area_id: "kitchen",
            supported_color_modes: ["onoff"],
          },
        },
      },
      areas: {},
      floors: {},
      localize: (key: string) => key,
    };

    const location = structuredClone(baseLocation);
    location.id = "area_kitchen";
    location.ha_area_id = "kitchen";
    location.modules._meta = { type: "area" };
    location.entity_ids = ["light.kitchen_ceiling"];

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
        .forcedTab=${"actions"}
      ></ht-location-inspector>
    `);
    await element.updateComplete;

    const getRow = () =>
      Array.from(element.shadowRoot!.querySelectorAll(".action-device-row")).find((el) =>
        (el.textContent || "").includes("Kitchen Ceiling")
      ) as HTMLElement | undefined;

    await waitUntil(() => !!getRow(), "inline action device row did not render");

    const occupiedRow = getRow();
    expect(occupiedRow).to.exist;
    const occupiedSelect = occupiedRow!.querySelector("select.action-service-select") as
      | HTMLSelectElement
      | null;
    expect(occupiedSelect).to.exist;
    const occupiedNextValue = occupiedSelect!.value === "turn_on" ? "turn_off" : "turn_on";
    occupiedSelect!.value = occupiedNextValue;
    occupiedSelect!.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    await element.updateComplete;

    const occupiedRowAfter = getRow();
    expect(occupiedRowAfter).to.exist;
    const occupiedSelectAfter = occupiedRowAfter!.querySelector("select.action-service-select") as
      | HTMLSelectElement
      | null;
    expect(occupiedSelectAfter).to.exist;
    expect(occupiedSelectAfter!.value).to.equal(occupiedNextValue);

    const vacantTab = Array.from(element.shadowRoot!.querySelectorAll(".tab")).find((el) =>
      (el.textContent || "").includes("On Vacant")
    ) as HTMLButtonElement | undefined;
    expect(vacantTab).to.exist;
    vacantTab!.click();
    // Force deterministic tab state in test environments where synthetic clicks
    // can occasionally miss component-level handlers.
    (element as any)._activeTab = "vacant_actions";
    element.requestUpdate();
    await element.updateComplete;

    await waitUntil(() => !!getRow(), "vacant row did not render");
    const vacantRow = getRow();
    expect(vacantRow).to.exist;

    const vacantSelect = vacantRow!.querySelector("select.action-service-select") as
      | HTMLSelectElement
      | null;
    expect(vacantSelect).to.exist;
    const vacantNextValue = vacantSelect!.value === "turn_on" ? "turn_off" : "turn_on";
    vacantSelect!.value = vacantNextValue;
    vacantSelect!.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    await element.updateComplete;

    const vacantRowAfter = getRow();
    expect(vacantRowAfter).to.exist;
    const vacantSelectAfter = vacantRowAfter!.querySelector("select.action-service-select") as
      | HTMLSelectElement
      | null;
    expect(vacantSelectAfter).to.exist;
    expect(vacantSelectAfter!.value).to.equal(vacantNextValue);
  });
});

describe("HtLocationInspector WIAB configuration", () => {
  it("scopes WIAB candidates to location area by default and can show all entities", async () => {
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>): Promise<T> => {
        if (request.type === "config/entity_registry/list") return [] as T;
        if (request.type === "config/device_registry/list") return [] as T;
        if (request.type === "topomation/locations/set_module_config") return { success: true } as T;
        return {} as T;
      },
      connection: {},
      states: {
        "binary_sensor.kitchen_motion": {
          entity_id: "binary_sensor.kitchen_motion",
          state: "off",
          attributes: {
            friendly_name: "Kitchen Motion",
            device_class: "motion",
            area_id: "kitchen",
          },
        },
        "binary_sensor.kitchen_door": {
          entity_id: "binary_sensor.kitchen_door",
          state: "off",
          attributes: {
            friendly_name: "Kitchen Door",
            device_class: "door",
            area_id: "kitchen",
          },
        },
        "binary_sensor.bedroom_motion": {
          entity_id: "binary_sensor.bedroom_motion",
          state: "off",
          attributes: {
            friendly_name: "Bedroom Motion",
            device_class: "motion",
            area_id: "bedroom",
          },
        },
      },
      areas: {
        kitchen: { area_id: "kitchen", name: "Kitchen" },
        bedroom: { area_id: "bedroom", name: "Bedroom" },
      },
      floors: {},
      localize: (key: string) => key,
    };

    const location = structuredClone(baseLocation);
    location.id = "area_kitchen";
    location.name = "Kitchen";
    location.ha_area_id = "kitchen";
    location.modules._meta = { type: "area" };
    location.modules.occupancy = {
      enabled: true,
      default_timeout: 300,
      default_trailing_timeout: 120,
      occupancy_sources: [],
      wiab: { preset: "enclosed_room" },
    };

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector .hass=${hass} .location=${location}></ht-location-inspector>
    `);
    await element.updateComplete;

    const interiorSelect = element.shadowRoot!.querySelector(
      '[data-testid="wiab-interior-select"]'
    ) as HTMLSelectElement | null;
    expect(interiorSelect).to.exist;

    const optionValuesScoped = Array.from(interiorSelect!.options).map((option) => option.value);
    expect(optionValuesScoped).to.include("binary_sensor.kitchen_motion");
    expect(optionValuesScoped).to.not.include("binary_sensor.bedroom_motion");

    const showAllToggle = element.shadowRoot!.querySelector(
      '[data-testid="wiab-show-all-toggle"]'
    ) as HTMLInputElement | null;
    expect(showAllToggle).to.exist;
    showAllToggle!.checked = true;
    showAllToggle!.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    await element.updateComplete;

    const interiorSelectAfter = element.shadowRoot!.querySelector(
      '[data-testid="wiab-interior-select"]'
    ) as HTMLSelectElement | null;
    expect(interiorSelectAfter).to.exist;
    const optionValuesAll = Array.from(interiorSelectAfter!.options).map((option) => option.value);
    expect(optionValuesAll).to.include("binary_sensor.bedroom_motion");
  });

  it("renders WIAB preset and configured entities", async () => {
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>): Promise<T> => {
        if (request.type === "config/entity_registry/list") return [] as T;
        if (request.type === "config/device_registry/list") return [] as T;
        if (request.type === "topomation/locations/set_module_config") return { success: true } as T;
        return {} as T;
      },
      connection: {},
      states: {
        "binary_sensor.bathroom_motion": {
          entity_id: "binary_sensor.bathroom_motion",
          state: "off",
          attributes: { friendly_name: "Bathroom Motion", device_class: "motion" },
        },
        "binary_sensor.bathroom_door": {
          entity_id: "binary_sensor.bathroom_door",
          state: "off",
          attributes: { friendly_name: "Bathroom Door", device_class: "door" },
        },
      },
      areas: { bathroom: { area_id: "bathroom", name: "Bathroom" } },
      floors: {},
      localize: (key: string) => key,
    };

    const location = structuredClone(baseLocation);
    location.id = "area_bathroom";
    location.name = "Bathroom";
    location.ha_area_id = "bathroom";
    location.modules._meta = { type: "area" };
    location.modules.occupancy = {
      enabled: true,
      default_timeout: 300,
      default_trailing_timeout: 120,
      occupancy_sources: [],
      wiab: {
        preset: "enclosed_room",
        interior_entities: ["binary_sensor.bathroom_motion"],
        door_entities: ["binary_sensor.bathroom_door"],
        hold_timeout_sec: 900,
        release_timeout_sec: 90,
      },
    };

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector .hass=${hass} .location=${location}></ht-location-inspector>
    `);
    await element.updateComplete;

    const presetSelect = element.shadowRoot!.querySelector(
      '[data-testid="wiab-preset-select"]'
    ) as HTMLSelectElement | null;
    expect(presetSelect).to.exist;
    expect(presetSelect!.value).to.equal("enclosed_room");

    const interiorChips = element.shadowRoot!.querySelectorAll('[data-testid="wiab-interior-chip"]');
    const doorChips = element.shadowRoot!.querySelectorAll('[data-testid="wiab-door-chip"]');
    expect(interiorChips.length).to.equal(1);
    expect(doorChips.length).to.equal(1);
  });

  it("persists WIAB preset and entity list changes", async () => {
    const setConfigCalls: Array<Record<string, any>> = [];
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>): Promise<T> => {
        if (request.type === "config/entity_registry/list") return [] as T;
        if (request.type === "config/device_registry/list") return [] as T;
        if (request.type === "topomation/locations/set_module_config") {
          setConfigCalls.push(request);
          return { success: true } as T;
        }
        return {} as T;
      },
      connection: {},
      states: {
        "binary_sensor.house_motion": {
          entity_id: "binary_sensor.house_motion",
          state: "off",
          attributes: { friendly_name: "House Motion", device_class: "motion" },
        },
        "binary_sensor.front_door": {
          entity_id: "binary_sensor.front_door",
          state: "off",
          attributes: { friendly_name: "Front Door", device_class: "door" },
        },
      },
      areas: { hallway: { area_id: "hallway", name: "Hallway" } },
      floors: {},
      localize: (key: string) => key,
    };

    const location = structuredClone(baseLocation);
    location.id = "building_home";
    location.name = "Home";
    location.ha_area_id = "hallway";
    location.modules._meta = { type: "building" };
    location.entity_ids = ["binary_sensor.house_motion", "binary_sensor.front_door"];
    location.modules.occupancy = {
      enabled: true,
      default_timeout: 300,
      default_trailing_timeout: 120,
      occupancy_sources: [],
      wiab: { preset: "off" },
    };

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector .hass=${hass} .location=${location}></ht-location-inspector>
    `);
    await element.updateComplete;

    const presetSelect = element.shadowRoot!.querySelector(
      '[data-testid="wiab-preset-select"]'
    ) as HTMLSelectElement;
    presetSelect.value = "enclosed_room";
    presetSelect.dispatchEvent(new Event("change", { bubbles: true, composed: true }));

    await waitUntil(
      () => setConfigCalls.some((request) => request.config?.wiab?.preset === "enclosed_room"),
      "WIAB preset change was not persisted"
    );

    const interiorSelect = element.shadowRoot!.querySelector(
      '[data-testid="wiab-interior-select"]'
    ) as HTMLSelectElement;
    interiorSelect.value = "binary_sensor.house_motion";
    interiorSelect.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    await element.updateComplete;
    const interiorAdd = element.shadowRoot!.querySelector(
      '[data-testid="wiab-interior-add"]'
    ) as HTMLButtonElement;
    interiorAdd.click();
    await element.updateComplete;

    await waitUntil(
      () =>
        setConfigCalls.some(
          (request) =>
            Array.isArray(request.config?.wiab?.interior_entities) &&
            request.config.wiab.interior_entities.includes("binary_sensor.house_motion")
        ),
      "WIAB interior entity change was not persisted"
    );

    const doorSelect = element.shadowRoot!.querySelector(
      '[data-testid="wiab-door-select"]'
    ) as HTMLSelectElement;
    doorSelect.value = "binary_sensor.front_door";
    doorSelect.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    await element.updateComplete;
    const doorAdd = element.shadowRoot!.querySelector(
      '[data-testid="wiab-door-add"]'
    ) as HTMLButtonElement;
    doorAdd.click();
    await element.updateComplete;

    await waitUntil(
      () =>
        setConfigCalls.some(
          (request) =>
            Array.isArray(request.config?.wiab?.door_entities) &&
            request.config.wiab.door_entities.includes("binary_sensor.front_door")
        ),
      "WIAB door entity change was not persisted"
    );
  });

  it("shows ambient lux in the header card and ambient section", async () => {
    const callWsRequests: Array<Record<string, any>> = [];
    let ambientReadingCalls = 0;
    let stateChangedHandler: ((event: any) => void) | undefined;
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>): Promise<T> => {
        callWsRequests.push(request);
        if (request.type === "config/entity_registry/list") return [] as T;
        if (request.type === "config/device_registry/list") return [] as T;
        if (request.type === "topomation/ambient/get_reading") {
          ambientReadingCalls += 1;
          return {
            lux: ambientReadingCalls >= 2 ? 18 : 22.5,
            source_sensor: "sensor.roof_lux",
            source_location: "building_home",
            is_inherited: true,
            is_dark: true,
            is_bright: false,
            dark_threshold: 50,
            bright_threshold: 500,
            fallback_method: null,
            timestamp: new Date().toISOString(),
          } as T;
        }
        return {} as T;
      },
      connection: {
        subscribeEvents: async (callback: (event: any) => void, eventType: string) => {
          if (eventType === "state_changed") {
            stateChangedHandler = callback;
          }
          return () => {
            stateChangedHandler = undefined;
          };
        },
      },
      states: {
        "sensor.roof_lux": {
          entity_id: "sensor.roof_lux",
          state: "22.5",
          attributes: {
            friendly_name: "Roof Lux",
            device_class: "illuminance",
            unit_of_measurement: "lx",
          },
        },
      },
      areas: {
        kitchen: { area_id: "kitchen", name: "Kitchen" },
      },
      floors: {},
      localize: (key: string) => key,
    };

    const location = structuredClone(baseLocation);
    location.id = "area_kitchen";
    location.name = "Kitchen";
    location.ha_area_id = "kitchen";
    location.modules._meta = { type: "area" };
    location.modules.ambient = {
      lux_sensor: null,
      auto_discover: false,
      inherit_from_parent: true,
      dark_threshold: 50,
      bright_threshold: 500,
      fallback_to_sun: true,
      assume_dark_on_error: true,
    };

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector .hass=${hass} .location=${location}></ht-location-inspector>
    `);

    await waitUntil(
      () =>
        (element.shadowRoot?.querySelector('[data-testid="header-ambient-lux"]')?.textContent || "").includes(
          "22.5 lx"
        ),
      "ambient header lux did not render"
    );

    const headerAmbientText =
      element.shadowRoot?.querySelector('[data-testid="header-ambient-lux"]')?.textContent || "";
    expect(headerAmbientText).to.include("Ambient: 22.5 lx");
    expect(headerAmbientText).to.include("(inherited)");

    const ambientTab = Array.from(element.shadowRoot?.querySelectorAll(".tab") || []).find((tab) =>
      (tab.textContent || "").includes("Ambient")
    ) as HTMLButtonElement | undefined;
    ambientTab?.click();
    await element.updateComplete;

    const sectionLuxText =
      element.shadowRoot?.querySelector('[data-testid="ambient-lux-level"]')?.textContent || "";
    const sourceMethodText =
      element.shadowRoot?.querySelector('[data-testid="ambient-source-method"]')?.textContent || "";
    expect(sectionLuxText).to.equal("22.5 lx");
    expect(sourceMethodText).to.equal("Inherited sensor");
    expect(element.shadowRoot?.querySelector('[data-testid="ambient-refresh-button"]')).to.not.exist;

    await waitUntil(() => Boolean(stateChangedHandler), "state_changed subscription not established");
    stateChangedHandler?.({
      data: {
        entity_id: "sensor.roof_lux",
        new_state: {
          entity_id: "sensor.roof_lux",
          state: "18",
          attributes: {
            device_class: "illuminance",
            unit_of_measurement: "lx",
          },
        },
        old_state: {
          entity_id: "sensor.roof_lux",
          state: "22.5",
          attributes: {
            device_class: "illuminance",
            unit_of_measurement: "lx",
          },
        },
      },
    });

    await waitUntil(
      () =>
        callWsRequests.filter((request) => request.type === "topomation/ambient/get_reading").length >= 2,
      "ambient state change did not trigger a second ambient/get_reading call",
      { timeout: 3000 }
    );

    await waitUntil(
      () =>
        (element.shadowRoot?.querySelector('[data-testid="ambient-lux-level"]')?.textContent || "").includes(
          "18.0 lx"
        ),
      "ambient section did not update after state change",
      { timeout: 3000 }
    );
  });

  it("expands recent occupancy events when Show all is toggled", async () => {
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>) => {
        if (request.type === "config/entity_registry/list") return [] as T;
        if (request.type === "config/device_registry/list") return [] as T;
        return {} as T;
      },
      connection: {},
      states: {
        "binary_sensor.occupancy_area_kitchen": {
          entity_id: "binary_sensor.occupancy_area_kitchen",
          state: "on",
          attributes: {
            device_class: "occupancy",
            location_id: "area_kitchen",
            contributions: [
              {
                source_id: "binary_sensor.kitchen_motion",
                state: "active",
                updated_at: new Date().toISOString(),
              },
              {
                source_id: "sensor.kitchen_presence",
                state: "active",
                updated_at: new Date(Date.now() - 1000).toISOString(),
              },
            ],
          },
        },
      },
      areas: {},
      floors: {},
      localize: (key: string) => key,
    };

    const location = structuredClone(baseLocation);
    location.id = "area_kitchen";
    location.name = "Kitchen";
    location.modules._meta = { type: "area" };
    location.modules.occupancy = {
      enabled: true,
      default_timeout: 300,
      default_trailing_timeout: 120,
      occupancy_sources: [],
    };

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector .hass=${hass} .location=${location}></ht-location-inspector>
    `);
    await element.updateComplete;

    const initialRows = element.shadowRoot?.querySelectorAll(".occupancy-event") || [];
    expect(initialRows.length).to.equal(1);

    const toggle = element.shadowRoot?.querySelector(
      '[data-testid="recent-events-toggle"]'
    ) as HTMLButtonElement | null;
    expect(toggle).to.exist;
    toggle?.click();
    await element.updateComplete;

    const expandedRows = element.shadowRoot?.querySelectorAll(".occupancy-event") || [];
    expect(expandedRows.length).to.equal(2);
  });

  it("persists ambient config updates with explicit sensor assignment and auto-discover disabled", async () => {
    const setConfigCalls: Array<Record<string, any>> = [];
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>): Promise<T> => {
        if (request.type === "config/entity_registry/list") return [] as T;
        if (request.type === "config/device_registry/list") return [] as T;
        if (request.type === "topomation/ambient/get_reading") {
          return {
            lux: 145,
            source_sensor: "sensor.patio_lux",
            source_location: "area_kitchen",
            is_inherited: false,
            is_dark: false,
            is_bright: false,
            dark_threshold: 50,
            bright_threshold: 500,
            fallback_method: null,
            timestamp: new Date().toISOString(),
          } as T;
        }
        if (request.type === "topomation/locations/set_module_config") {
          setConfigCalls.push(request);
          return { success: true } as T;
        }
        return {} as T;
      },
      connection: {},
      states: {
        "sensor.patio_lux": {
          entity_id: "sensor.patio_lux",
          state: "145",
          attributes: {
            friendly_name: "Patio Lux",
            device_class: "illuminance",
            unit_of_measurement: "lx",
          },
        },
      },
      areas: {
        kitchen: { area_id: "kitchen", name: "Kitchen" },
      },
      floors: {},
      localize: (key: string) => key,
    };

    const location = structuredClone(baseLocation);
    location.id = "area_kitchen";
    location.name = "Kitchen";
    location.ha_area_id = "kitchen";
    location.entity_ids = ["sensor.patio_lux"];
    location.modules._meta = { type: "area" };
    location.modules.ambient = {
      lux_sensor: null,
      auto_discover: true,
      inherit_from_parent: true,
      dark_threshold: 50,
      bright_threshold: 500,
      fallback_to_sun: true,
      assume_dark_on_error: true,
    };

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector .hass=${hass} .location=${location}></ht-location-inspector>
    `);
    const ambientTab = Array.from(element.shadowRoot?.querySelectorAll(".tab") || []).find((tab) =>
      (tab.textContent || "").includes("Ambient")
    ) as HTMLButtonElement | undefined;
    ambientTab?.click();
    await element.updateComplete;

    const darkInput = element.shadowRoot?.querySelector(
      '[data-testid="ambient-dark-threshold"]'
    ) as HTMLInputElement | null;
    expect(darkInput).to.exist;
    darkInput!.value = "120";
    darkInput!.dispatchEvent(new Event("change", { bubbles: true, composed: true }));

    await waitUntil(
      () =>
        setConfigCalls.some(
          (request) =>
            request.module_id === "ambient" &&
            request.config?.dark_threshold === 120 &&
            request.config?.bright_threshold >= 121 &&
            request.config?.auto_discover === false
        ),
      "ambient threshold update was not persisted with guarded bright threshold and auto_discover=false"
    );

    const sensorSelect = element.shadowRoot?.querySelector(
      '[data-testid="ambient-lux-sensor-select"]'
    ) as HTMLSelectElement | null;
    expect(sensorSelect).to.exist;
    sensorSelect!.value = "sensor.patio_lux";
    sensorSelect!.dispatchEvent(new Event("change", { bubbles: true, composed: true }));

    await waitUntil(
      () =>
        setConfigCalls.some(
          (request) =>
            request.module_id === "ambient" &&
            request.config?.lux_sensor === "sensor.patio_lux" &&
            request.config?.auto_discover === false
        ),
      "ambient explicit sensor assignment was not persisted"
    );
  });
});
