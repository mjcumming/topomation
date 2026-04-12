/// <reference types="mocha" />
import { fixture, html, expect, waitUntil } from "@open-wc/testing";
import "./ht-location-inspector";
import type { HomeAssistant, Location, TopomationActionRule } from "./types";
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

const switchTopTab = async (
  element: HtLocationInspector,
  label:
    | "Occupancy"
    | "Occupancy Groups"
    | "Ambient"
    | "Lighting"
    | "Media"
    | "HVAC"
    | "Advanced"
): Promise<void> => {
  const tabs = Array.from(
    element.shadowRoot?.querySelectorAll(".tabs > .tab") ?? []
  ) as HTMLButtonElement[];
  const tab = tabs.find((candidate) => candidate.textContent?.trim() === label);
  if (!tab && label === "Advanced") {
    await element.updateComplete;
    return;
  }
  expect(tab, `${label} tab did not render`).to.exist;
  tab!.click();
  await element.updateComplete;
};

const openExternalSourceDialog = async (element: HtLocationInspector): Promise<void> => {
  const openButton = element.shadowRoot?.querySelector(
    '[data-testid="open-external-source-dialog"]'
  ) as HTMLButtonElement | null;
  expect(openButton, "Add Source button did not render").to.exist;
  openButton!.click();
  await element.updateComplete;
  await waitUntil(
    () => !!element.shadowRoot?.querySelector('[data-testid="external-source-dialog"]'),
    "Add Source dialog did not open"
  );
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

  it("hides on-timeout controls for state-held presence sources while keeping vacant delay controls", async () => {
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>): Promise<T> => {
        if (request.type === "config/entity_registry/list") return [] as T;
        if (request.type === "config/device_registry/list") return [] as T;
        return {} as T;
      },
      connection: {},
      states: {
        "binary_sensor.office_presence": {
          entity_id: "binary_sensor.office_presence",
          state: "on",
          attributes: {
            friendly_name: "Office Presence",
            device_class: "presence",
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
    location.modules.occupancy = {
      enabled: true,
      default_timeout: 300,
      default_trailing_timeout: 120,
      occupancy_sources: [
        {
          entity_id: "binary_sensor.office_presence",
          source_id: "binary_sensor.office_presence",
          mode: "specific_states",
          on_event: "trigger",
          on_timeout: null,
          off_event: "clear",
          off_trailing: 300,
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
      () => !!element.shadowRoot?.querySelector('[data-testid="source-on-state-held"]'),
      "state-held presence note did not render"
    );

    const stateHeldNote = element.shadowRoot!.querySelector(
      '[data-testid="source-on-state-held"]'
    ) as HTMLElement | null;
    expect(stateHeldNote?.textContent || "").to.include("state-held, not timed");
    expect(element.shadowRoot!.querySelector("#source-on-timeout-0")).to.equal(null);
    expect(element.shadowRoot!.textContent || "").to.not.include("Indefinite (until Not detected)");
    expect(element.shadowRoot!.querySelector("#source-off-trailing-0")).to.exist;
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

    const location = structuredClone(baseLocation);
    location.modules._meta = { type: "area" };

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
      ></ht-location-inspector>
    `);

    await waitUntil(
      () =>
        callWsCalls.includes("config/entity_registry/list") &&
        callWsCalls.includes("config/device_registry/list"),
      "registry lookups were not requested"
    );

    await openExternalSourceDialog(element);

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

    await openExternalSourceDialog(element);

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

    const location = structuredClone(baseLocation);
    location.modules._meta = { type: "area" };

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
      ></ht-location-inspector>
    `);

    await openExternalSourceDialog(element);

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

    const location = structuredClone(baseLocation);
    location.modules._meta = { type: "area" };

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
      ></ht-location-inspector>
    `);

    await openExternalSourceDialog(element);

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

  it("persists selected external entity as occupancy source on save", async () => {
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
    location.modules._meta = { type: "area" };
    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
      ></ht-location-inspector>
    `);

    await openExternalSourceDialog(element);

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
      '[data-testid="confirm-add-external-source"]'
    ) as HTMLButtonElement;
    expect(addButton.disabled).to.equal(false);
    addButton.click();
    await element.updateComplete;

    const saveButton = element.shadowRoot!.querySelector(
      '[data-testid="detection-save-button"]'
    ) as HTMLButtonElement;
    expect(saveButton).to.exist;
    expect(saveButton.disabled).to.equal(false);
    saveButton.click();
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

    await openExternalSourceDialog(element);

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

  it("renders Occupancy/Ambient/Lighting/Appliances/Media/HVAC top-level tabs for area-like locations", async () => {
    const hass: HomeAssistant = {
      callWS: async <T>() => [] as T,
      connection: {},
      states: {},
      areas: {},
      floors: {},
      localize: (key: string) => key,
    };

    const location = structuredClone(baseLocation);
    location.id = "area_living_room";
    location.name = "Living Room";
    location.modules._meta = { type: "area" };

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
      ></ht-location-inspector>
    `);

    const tabLabels = Array.from(element.shadowRoot!.querySelectorAll(".tab"))
      .map((el) => (el.textContent || "").trim())
      .filter(Boolean);

    expect(tabLabels).to.include("Occupancy");
    expect(tabLabels).to.include("Ambient");
    expect(tabLabels).to.include("Lighting");
    expect(tabLabels).to.include("Appliances");
    expect(tabLabels).to.include("Media");
    expect(tabLabels).to.include("HVAC");
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

  it("keeps the location banner stack outside a dedicated inspector scroll body", async () => {
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>) => {
        if (request.type === "config/entity_registry/list") return [] as T;
        if (request.type === "config/device_registry/list") return [] as T;
        return [] as T;
      },
      connection: {},
      states: {},
      areas: {},
      floors: {},
      localize: (key: string) => key,
    };

    const location = structuredClone(baseLocation);
    location.id = "area_back_hallway";
    location.name = "Back Hallway";
    location.modules._meta = { type: "area" };

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
      ></ht-location-inspector>
    `);
    await element.updateComplete;

    const inspectorTop = element.shadowRoot!.querySelector(".inspector-top") as HTMLElement | null;
    const inspectorBody = element.shadowRoot!.querySelector(".inspector-body") as HTMLElement | null;
    expect(inspectorTop).to.exist;
    expect(inspectorBody).to.exist;
    expect(getComputedStyle(inspectorTop!).position).to.equal("static");
    expect(getComputedStyle(inspectorBody!).overflowY).to.equal("auto");
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

  it("hides advanced occupancy relationship controls", async () => {
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

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector .hass=${hass} .location=${location}></ht-location-inspector>
    `);
    await element.updateComplete;

    const inspectorText = element.shadowRoot?.textContent || "";
    expect(inspectorText).to.not.include("Advanced Occupancy Relationships");
    expect(inspectorText).to.not.include("Show Advanced Controls");
    expect(element.shadowRoot?.querySelector('[data-testid="adjacency-advanced-toggle"]')).to.equal(null);
  });

  it("does not render adjacency neighbor controls in the active inspector UI", async () => {
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

    expect(element.shadowRoot?.querySelector("#adjacency-neighbor")).to.equal(null);
    expect(element.shadowRoot?.textContent || "").to.not.include("Advanced Occupancy Relationships");
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

    await openExternalSourceDialog(element);

    const areaSelect = element.shadowRoot!.querySelector(
      '[data-testid="external-source-area-select"]'
    ) as HTMLSelectElement;
    expect(areaSelect).to.exist;

    const optionValues = Array.from(areaSelect.options).map((option) => option.value);
    expect(optionValues).to.deep.equal(["", "__this_area__", "kitchen"]);
    expect(optionValues).to.not.include("__all__");

    const dialogText = element.shadowRoot?.textContent || "";
    expect(dialogText).to.include("Sibling areas on this floor are available, plus all compatible entities in this area.");
  });

  it("does not render linked-room contributor controls in the active inspector UI", async () => {
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

    expect(element.shadowRoot?.querySelector('[data-testid="linked-location-area_family_room"]')).to.equal(null);
    expect(element.shadowRoot?.querySelector('[data-testid="linked-location-area_dining_room"]')).to.equal(null);
  });

  it("floor occupancy groups write shared occupancy_group_id updates", async () => {
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
    location.id = "floor_main";
    location.name = "Main Floor";
    location.parent_id = "building_main";
    location.modules._meta = { type: "floor" };
    location.modules.occupancy = {
      enabled: true,
      default_timeout: 300,
      default_trailing_timeout: 120,
      occupancy_sources: [],
      linked_locations: [],
      occupancy_group_id: null,
    };

    const allLocations: Location[] = [
      {
        ...structuredClone(baseLocation),
        id: "area_kitchen",
        name: "Kitchen",
        parent_id: "floor_main",
        modules: {
          _meta: { type: "area" },
          occupancy: {
            enabled: true,
            default_timeout: 300,
            default_trailing_timeout: 120,
            occupancy_sources: [],
            occupancy_group_id: null,
            linked_locations: [],
          },
        },
      },
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
            occupancy_group_id: null,
            linked_locations: [],
          },
        },
      },
      location,
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
    const kitchenCheckbox = element.shadowRoot!.querySelector(
      '[data-testid="occupancy-group-create-location-area_kitchen"]'
    ) as HTMLInputElement;
    const familyCheckbox = element.shadowRoot!.querySelector(
      '[data-testid="occupancy-group-create-location-area_family_room"]'
    ) as HTMLInputElement;
    const createButton = element.shadowRoot!.querySelector(
      '[data-testid="occupancy-group-create-button"]'
    ) as HTMLButtonElement;
    expect(kitchenCheckbox).to.exist;
    expect(familyCheckbox).to.exist;
    expect(createButton).to.exist;

    kitchenCheckbox.click();
    familyCheckbox.click();
    await element.updateComplete;
    expect(createButton.disabled).to.equal(false);
    createButton.click();
    await element.updateComplete;
    expect(
      element.shadowRoot!.querySelector('[data-testid="detection-save-button"]')
    ).to.equal(null);
    expect(
      element.shadowRoot!.querySelector('[data-testid="detection-draft-toolbar"]')
    ).to.equal(null);

    await waitUntil(() => {
      return callWsRequests.some(
        (item) =>
          item.type === "topomation/locations/set_module_config" &&
          item.location_id === "area_kitchen" &&
          typeof item.config?.occupancy_group_id === "string"
      );
    }, "kitchen occupancy group write not observed");

    await waitUntil(() => {
      return callWsRequests.some(
        (item) =>
          item.type === "topomation/locations/set_module_config" &&
          item.location_id === "area_family_room" &&
          typeof item.config?.occupancy_group_id === "string"
      );
    }, "family room occupancy group write not observed");

    const kitchenWrite = callWsRequests.find(
      (item) =>
        item.type === "topomation/locations/set_module_config" &&
        item.location_id === "area_kitchen" &&
        typeof item.config?.occupancy_group_id === "string"
    );
    const familyWrite = callWsRequests.find(
      (item) =>
        item.type === "topomation/locations/set_module_config" &&
        item.location_id === "area_family_room" &&
        typeof item.config?.occupancy_group_id === "string"
    );
    expect(kitchenWrite?.config?.occupancy_group_id).to.equal(familyWrite?.config?.occupancy_group_id);
    expect(kitchenWrite?.config).to.not.have.property("sync_locations");
    expect(familyWrite?.config).to.not.have.property("sync_locations");

    const deleteButton = element.shadowRoot!.querySelector(
      '[data-testid="occupancy-group-delete-1"]'
    ) as HTMLButtonElement;
    expect(deleteButton).to.exist;
    deleteButton.click();
    await element.updateComplete;

    await waitUntil(() => {
      return callWsRequests.some(
        (item) =>
          item.type === "topomation/locations/set_module_config" &&
          item.location_id === "area_family_room" &&
          item.config?.occupancy_group_id === null
      );
    }, "family room occupancy group removal not observed");
  });

  it("shows occupancy group summary in Detection tab for floor-rooted areas", async () => {
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
    location.modules.occupancy = {
      enabled: true,
      default_timeout: 300,
      default_trailing_timeout: 120,
      occupancy_sources: [],
      occupancy_group_id: null,
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
            occupancy_group_id: null,
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

    const syncSections = element.shadowRoot!.querySelectorAll('[data-testid="occupancy-group-summary-section"]');
    const syncSection = element.shadowRoot!.querySelector('[data-testid="occupancy-group-summary-section"]');
    expect(syncSections.length).to.equal(1);
    expect(syncSection).to.exist;
    expect(syncSection?.textContent || "").to.include("Occupancy Group");
    expect(syncSection?.textContent || "").to.include("Managed from Main Floor.");
    expect(syncSection?.textContent || "").to.include("No occupancy group assigned.");
  });

  it("renders effective occupancy group membership from shared occupancy_group_id", async () => {
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
    location.modules.occupancy = {
      enabled: true,
      default_timeout: 300,
      default_trailing_timeout: 120,
      occupancy_sources: [],
      occupancy_group_id: "main_open_area",
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
            occupancy_group_id: "main_open_area",
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

    const sharedSpaceSection = element.shadowRoot!.querySelector(
      '[data-testid="occupancy-group-summary-section"]'
    ) as HTMLElement | null;

    expect(sharedSpaceSection?.textContent || "").to.include("Members: Family Room, Kitchen");
  });

  it("floor occupancy groups normalize a full group by assigning one shared occupancy_group_id", async () => {
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
    location.id = "floor_main";
    location.name = "Main Floor";
    location.parent_id = "building_main";
    location.modules._meta = { type: "floor" };
    location.modules.occupancy = {
      enabled: true,
      default_timeout: 300,
      default_trailing_timeout: 120,
      occupancy_sources: [],
      occupancy_group_id: null,
      linked_locations: [],
    };

    const allLocations: Location[] = [
      {
        ...structuredClone(baseLocation),
        id: "area_kitchen",
        name: "Kitchen",
        parent_id: "floor_main",
        modules: {
          _meta: { type: "area" },
          occupancy: {
            enabled: true,
            default_timeout: 300,
            default_trailing_timeout: 120,
            occupancy_sources: [],
            occupancy_group_id: "main_open_area",
            linked_locations: [],
          },
        },
      },
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
            occupancy_group_id: "main_open_area",
            linked_locations: [],
          },
        },
      },
      {
        ...structuredClone(baseLocation),
        id: "area_back_hallway",
        name: "Back Hallway",
        parent_id: "floor_main",
        modules: {
          _meta: { type: "area" },
          occupancy: {
            enabled: true,
            default_timeout: 300,
            default_trailing_timeout: 120,
            occupancy_sources: [],
            occupancy_group_id: null,
            linked_locations: [],
          },
        },
      },
      location,
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

    const hallwayCheckbox = element.shadowRoot!.querySelector(
      '[data-testid="occupancy-group-1-location-area_back_hallway"]'
    ) as HTMLInputElement;
    expect(hallwayCheckbox).to.exist;
    hallwayCheckbox.click();
    await element.updateComplete;
    expect(
      element.shadowRoot!.querySelector('[data-testid="detection-save-button"]')
    ).to.equal(null);

    await waitUntil(() => {
      const kitchenWrite = callWsRequests.find(
        (item) =>
          item.type === "topomation/locations/set_module_config" &&
          item.location_id === "area_kitchen"
      );
      const familyWrite = callWsRequests.find(
        (item) =>
          item.type === "topomation/locations/set_module_config" &&
          item.location_id === "area_family_room"
      );
      const hallwayWrite = callWsRequests.find(
        (item) =>
          item.type === "topomation/locations/set_module_config" &&
          item.location_id === "area_back_hallway"
      );
      if (!kitchenWrite || !familyWrite || !hallwayWrite) return false;
      const kitchenGroup = kitchenWrite.config?.occupancy_group_id;
      const familyGroup = familyWrite.config?.occupancy_group_id;
      const hallwayGroup = hallwayWrite.config?.occupancy_group_id;
      return (
        typeof kitchenGroup === "string" &&
        kitchenGroup === familyGroup &&
        familyGroup === hallwayGroup
      );
    }, "full occupancy group writes were not observed");
  });

  it("shows floor occupancy groups for child areas on the selected floor", async () => {
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
    location.id = "floor_main";
    location.name = "Main Floor";
    location.parent_id = "building_main";
    location.modules._meta = { type: "floor" };
    location.modules.occupancy = {
      enabled: true,
      default_timeout: 300,
      default_trailing_timeout: 120,
      occupancy_sources: [],
      linked_locations: [],
      occupancy_group_id: null,
    };

    const allLocations: Location[] = [
      location,
      {
        ...structuredClone(baseLocation),
        id: "area_kitchen",
        name: "Kitchen",
        parent_id: "floor_main",
        modules: {
          _meta: { type: "area" },
          occupancy: {
            enabled: true,
            default_timeout: 300,
            default_trailing_timeout: 120,
            occupancy_sources: [],
            linked_locations: [],
            occupancy_group_id: null,
          },
        },
      },
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
            occupancy_group_id: null,
          },
        },
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

    const tabLabels = Array.from(element.shadowRoot!.querySelectorAll(".tabs > .tab")).map((tab) =>
      tab.textContent?.trim()
    );
    const groupsSection = element.shadowRoot!.querySelector('[data-testid="occupancy-groups-section"]');
    const kitchenCheckbox = element.shadowRoot!.querySelector(
      '[data-testid="occupancy-group-create-location-area_kitchen"]'
    ) as HTMLInputElement | null;
    expect(tabLabels).to.deep.equal([]);
    expect(groupsSection).to.exist;
    expect(kitchenCheckbox).to.exist;
    expect(element.shadowRoot?.querySelector('[data-testid="structural-overview-section"]')).to.exist;
  });

  it("floor occupancy groups exclude managed shadow child areas", async () => {
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
    location.id = "floor_main";
    location.name = "Main Floor";
    location.parent_id = "building_main";
    location.modules._meta = { type: "floor" };
    location.modules.occupancy = {
      enabled: true,
      default_timeout: 300,
      default_trailing_timeout: 120,
      occupancy_sources: [],
      linked_locations: [],
      occupancy_group_id: null,
    };

    const allLocations: Location[] = [
      {
        ...structuredClone(baseLocation),
        id: "area_kitchen",
        name: "Kitchen",
        parent_id: "floor_main",
        modules: {
          _meta: { type: "area" },
          occupancy: {
            enabled: true,
            default_timeout: 300,
            default_trailing_timeout: 120,
            occupancy_sources: [],
            linked_locations: [],
            occupancy_group_id: null,
          },
        },
      },
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
            occupancy_group_id: null,
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
            occupancy_group_id: null,
          },
        },
      },
      location,
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
      '[data-testid="occupancy-group-create-location-area_family_room"]'
    ) as HTMLInputElement | null;
    const managedShadowCheckbox = element.shadowRoot!.querySelector(
      '[data-testid="occupancy-group-create-location-area_main_floor_shadow"]'
    ) as HTMLInputElement | null;

    expect(familyCheckbox).to.exist;
    expect(managedShadowCheckbox).to.equal(null);
  });

  it("disables Create group when fewer than two ungrouped areas remain", async () => {
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
    location.id = "floor_main";
    location.name = "Main Floor";
    location.parent_id = "building_main";
    location.modules._meta = { type: "floor" };

    const allLocations: Location[] = [
      {
        ...structuredClone(baseLocation),
        id: "area_kitchen",
        name: "Kitchen",
        parent_id: "floor_main",
        modules: {
          _meta: { type: "area" },
          occupancy: {
            enabled: true,
            default_timeout: 300,
            default_trailing_timeout: 120,
            occupancy_sources: [],
            linked_locations: [],
            occupancy_group_id: "main_open_area",
          },
        },
      },
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
            occupancy_group_id: "main_open_area",
          },
        },
      },
      {
        ...structuredClone(baseLocation),
        id: "area_hall",
        name: "Hall",
        parent_id: "floor_main",
        modules: {
          _meta: { type: "area" },
          occupancy: {
            enabled: true,
            default_timeout: 300,
            default_trailing_timeout: 120,
            occupancy_sources: [],
            linked_locations: [],
            occupancy_group_id: null,
          },
        },
      },
      location,
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

    const createButton = element.shadowRoot!.querySelector(
      '[data-testid="occupancy-group-create-button"]'
    ) as HTMLButtonElement | null;
    const emptyState = element.shadowRoot!.textContent || "";

    expect(createButton).to.equal(null);
    expect(emptyState).to.include("Only one ungrouped area remains");
  });

  it("does not render two-way linked-room toggles in the active inspector UI", async () => {
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

    expect(element.shadowRoot?.querySelector('[data-testid="linked-location-two-way-area_family_room"]')).to.equal(
      null
    );
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
    await switchTopTab(element, "Advanced");

    const linkedRows = element.shadowRoot!.querySelectorAll('[data-testid^="linked-location-"]');
    expect(linkedRows.length).to.equal(0);
    expect(element.shadowRoot!.textContent || "").to.not.include("Occupancy Group");
    expect(element.shadowRoot!.textContent || "").to.not.include("Occupancy groups are managed from the parent floor.");
    expect(element.shadowRoot!.textContent || "").to.not.include("Wasp In A Box");
    expect(element.shadowRoot!.textContent || "").to.not.include("Managed System Area");
  });

  it("does not render adjacency delete controls in the active inspector UI", async () => {
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

    expect(element.shadowRoot?.querySelector(".adjacency-delete-btn")).to.equal(null);
  });

  it("does not render handoff trace controls in the active inspector UI", async () => {
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

    expect(element.shadowRoot!.querySelectorAll(".handoff-trace-row").length).to.equal(0);
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
    expect(beforeText).to.equal("");

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


  it("renders HVAC rules editor with add button", async () => {
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>) => {
        if (request.type === "topomation/actions/rules/list") {
          return { rules: [] } as T;
        }
        if (request.type === "config/entity_registry/list") return [] as T;
        if (request.type === "config/device_registry/list") return [] as T;
        return [] as T;
      },
      connection: {},
      states: {
        "fan.kitchen_hood": {
          entity_id: "fan.kitchen_hood",
          state: "off",
          attributes: {
            friendly_name: "Kitchen Hood",
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
    location.entity_ids = ["fan.kitchen_hood"];

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector .hass=${hass} .location=${location} .forcedTab=${"hvac"}></ht-location-inspector>
    `);
    await element.updateComplete;

    await waitUntil(
      () => !!element.shadowRoot?.querySelector('[data-testid="actions-rules-section"]'),
      "rules section did not render"
    );

    const addRuleButton = element.shadowRoot?.querySelector(
      '[data-testid="action-rule-add"]'
    ) as HTMLButtonElement | null;
    expect(addRuleButton).to.exist;
    expect(addRuleButton?.disabled).to.equal(false);
    expect(element.shadowRoot?.querySelector('[data-testid="startup-reapply-hvac"]')).to.equal(null);
    expect((element.shadowRoot?.textContent || "")).to.include("No HVAC rules configured yet.");
  });

  it("renders lighting rules add button enabled when the tab is idle", async () => {
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>) => {
        if (request.type === "topomation/actions/rules/list") {
          return { rules: [] } as T;
        }
        if (request.type === "config/entity_registry/list") return [] as T;
        if (request.type === "config/device_registry/list") return [] as T;
        return [] as T;
      },
      connection: {},
      states: {
        "light.main_bedroom_lamp": {
          entity_id: "light.main_bedroom_lamp",
          state: "off",
          attributes: {
            friendly_name: "Main Bedroom Lamp",
            area_id: "main_bedroom",
          },
        },
      },
      areas: {},
      floors: {},
      localize: (key: string) => key,
    };

    const location = structuredClone(baseLocation);
    location.id = "area_main_bedroom";
    location.name = "Main Bedroom";
    location.ha_area_id = "main_bedroom";
    location.modules._meta = { type: "area" };
    location.entity_ids = ["light.main_bedroom_lamp"];

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
        .forcedTab=${"lighting"}
      ></ht-location-inspector>
    `);
    await element.updateComplete;

    await waitUntil(
      () => !!element.shadowRoot?.querySelector('[data-testid="action-rule-add"]'),
      "lighting add-rule button did not render"
    );

    const addRuleButton = element.shadowRoot?.querySelector(
      '[data-testid="action-rule-add"]'
    ) as HTMLButtonElement | null;
    expect(addRuleButton).to.exist;
    expect(addRuleButton?.disabled).to.equal(false);
  });

  it("adds a visible lighting rule row when Add rule is clicked", async () => {
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>) => {
        if (request.type === "topomation/actions/rules/list") {
          return { rules: [] } as T;
        }
        if (request.type === "config/entity_registry/list") return [] as T;
        if (request.type === "config/device_registry/list") return [] as T;
        return [] as T;
      },
      connection: {},
      states: {
        "light.main_bedroom_lamp": {
          entity_id: "light.main_bedroom_lamp",
          state: "off",
          attributes: {
            friendly_name: "Main Bedroom Lamp",
            area_id: "main_bedroom",
          },
        },
      },
      areas: {},
      floors: {},
      localize: (key: string) => key,
    };

    const location = structuredClone(baseLocation);
    location.id = "area_main_bedroom";
    location.name = "Main Bedroom";
    location.ha_area_id = "main_bedroom";
    location.modules._meta = { type: "area" };
    location.entity_ids = ["light.main_bedroom_lamp"];

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
        .forcedTab=${"lighting"}
      ></ht-location-inspector>
    `);
    await element.updateComplete;

    await waitUntil(
      () => !!element.shadowRoot?.querySelector('[data-testid="action-rule-add"]'),
      "lighting add-rule button did not render"
    );

    const addRuleButton = element.shadowRoot?.querySelector(
      '[data-testid="action-rule-add"]'
    ) as HTMLButtonElement | null;
    expect(addRuleButton).to.exist;
    expect(addRuleButton?.disabled).to.equal(false);

    addRuleButton!.click();
    await element.updateComplete;

    await waitUntil(
      () => (element.shadowRoot?.querySelectorAll(".dusk-block-row").length || 0) === 1,
      "new lighting rule row did not render"
    );
  });

  it("allows adding a lighting rule while the managed-rules list is still loading", async () => {
    let resolveRules!: (value: { rules: TopomationActionRule[] }) => void;
    const rulesPromise = new Promise<{ rules: TopomationActionRule[] }>((resolve) => {
      resolveRules = resolve;
    });

    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>) => {
        if (request.type === "topomation/actions/rules/list") {
          return (await rulesPromise) as T;
        }
        if (request.type === "config/entity_registry/list") return [] as T;
        if (request.type === "config/device_registry/list") return [] as T;
        return [] as T;
      },
      connection: {},
      states: {
        "light.main_bedroom_lamp": {
          entity_id: "light.main_bedroom_lamp",
          state: "off",
          attributes: {
            friendly_name: "Main Bedroom Lamp",
            area_id: "main_bedroom",
          },
        },
      },
      areas: {},
      floors: {},
      localize: (key: string) => key,
    };

    const location = structuredClone(baseLocation);
    location.id = "area_main_bedroom";
    location.name = "Main Bedroom";
    location.ha_area_id = "main_bedroom";
    location.modules._meta = { type: "area" };
    location.entity_ids = ["light.main_bedroom_lamp"];

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
        .forcedTab=${"lighting"}
      ></ht-location-inspector>
    `);
    await element.updateComplete;

    await waitUntil(
      () => !!element.shadowRoot?.querySelector('[data-testid="action-rule-add"]'),
      "lighting add-rule button did not render while loading"
    );

    const addRuleButton = element.shadowRoot?.querySelector(
      '[data-testid="action-rule-add"]'
    ) as HTMLButtonElement | null;
    expect(addRuleButton).to.exist;
    expect(addRuleButton?.disabled).to.equal(false);

    addRuleButton!.click();
    await element.updateComplete;

    await waitUntil(
      () => (element.shadowRoot?.querySelectorAll(".dusk-block-row").length || 0) === 1,
      "new lighting rule row did not render while rules list was loading"
    );

    resolveRules({ rules: [] });
  });

  it("keeps draft lighting rule controls enabled while the managed-rules list is still loading", async () => {
    let resolveRules!: (value: { rules: TopomationActionRule[] }) => void;
    const rulesPromise = new Promise<{ rules: TopomationActionRule[] }>((resolve) => {
      resolveRules = resolve;
    });

    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>) => {
        if (request.type === "topomation/actions/rules/list") {
          return (await rulesPromise) as T;
        }
        if (request.type === "config/entity_registry/list") return [] as T;
        if (request.type === "config/device_registry/list") return [] as T;
        return [] as T;
      },
      connection: {},
      states: {
        "light.main_bedroom_lamp": {
          entity_id: "light.main_bedroom_lamp",
          state: "off",
          attributes: {
            friendly_name: "Main Bedroom Lamp",
            area_id: "main_bedroom",
          },
        },
      },
      areas: {},
      floors: {},
      localize: (key: string) => key,
    };

    const location = structuredClone(baseLocation);
    location.id = "area_main_bedroom";
    location.name = "Main Bedroom";
    location.ha_area_id = "main_bedroom";
    location.modules._meta = { type: "area" };
    location.entity_ids = ["light.main_bedroom_lamp"];

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
        .forcedTab=${"lighting"}
      ></ht-location-inspector>
    `);
    await element.updateComplete;

    await waitUntil(
      () => !!element.shadowRoot?.querySelector('[data-testid="action-rule-add"]'),
      "lighting add-rule button did not render while loading"
    );

    const addRuleButton = element.shadowRoot?.querySelector(
      '[data-testid="action-rule-add"]'
    ) as HTMLButtonElement | null;
    expect(addRuleButton).to.exist;

    addRuleButton!.click();
    await element.updateComplete;

    await waitUntil(
      () => (element.shadowRoot?.querySelectorAll(".dusk-block-row").length || 0) === 1,
      "new lighting rule row did not render while rules list was loading"
    );

    const saveButton = Array.from(
      element.shadowRoot?.querySelectorAll("button") || []
    ).find((button) => (button.textContent || "").trim() === "Save rule") as
      | HTMLButtonElement
      | undefined;
    const occupiedChoice = Array.from(
      element.shadowRoot?.querySelectorAll('[data-testid^="action-rule-"] .choice-pill') || []
    ).find((pill) => (pill.textContent || "").includes("Room becomes occupied")) as
      | HTMLButtonElement
      | undefined;
    const darkChoice = element.shadowRoot?.querySelector(
      'input[name^="lighting-trigger-"][name$="-occupancy-condition"][value="dark"]'
    ) as HTMLInputElement | null;
    const targetSelect = element.shadowRoot?.querySelector(
      'select[data-testid^="action-rule-"][data-testid$="-device-action-0"]'
    ) as HTMLSelectElement | null;
    expect(saveButton?.disabled).to.equal(false);
    expect(occupiedChoice?.disabled).to.equal(false);
    expect(darkChoice?.disabled).to.equal(false);
    expect(targetSelect?.disabled).to.equal(false);

    resolveRules({ rules: [] });
  });

  it("adds a visible media rule row even when no media devices exist yet", async () => {
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>) => {
        if (request.type === "topomation/actions/rules/list") {
          return { rules: [] } as T;
        }
        if (request.type === "config/entity_registry/list") return [] as T;
        if (request.type === "config/device_registry/list") return [] as T;
        return [] as T;
      },
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
      <ht-location-inspector .hass=${hass} .location=${location} .forcedTab=${"media"}></ht-location-inspector>
    `);
    await element.updateComplete;

    const addRuleButton = element.shadowRoot?.querySelector(
      '[data-testid="action-rule-add"]'
    ) as HTMLButtonElement | null;
    expect(addRuleButton).to.exist;
    addRuleButton!.click();
    await element.updateComplete;

    await waitUntil(
      () => (element.shadowRoot?.querySelectorAll(".dusk-block-row").length || 0) === 1,
      "new media rule row did not render without pre-mapped media devices"
    );
  });

  it("maps forced media tab to Media", async () => {
    const hass: HomeAssistant = {
      callWS: async <T>() => [] as T,
      connection: {},
      states: {},
      areas: {},
      floors: {},
      localize: (key: string) => key,
    };

    const location = structuredClone(baseLocation);
    location.id = "area_media_room";
    location.name = "Media Room";
    location.modules._meta = { type: "area" };

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
        .forcedTab=${"media"}
      ></ht-location-inspector>
    `);
    await element.updateComplete;

    const activeTab = element.shadowRoot!.querySelector(".tab.active");
    expect((activeTab?.textContent || "").trim()).to.equal("Media");
  });

  it("maps forcedTab appliances to Appliances", async () => {
    const hass: HomeAssistant = {
      callWS: async <T>() => [] as T,
      connection: {},
      states: {},
      areas: {},
      floors: {},
      localize: (key: string) => key,
    };

    const location = structuredClone(baseLocation);
    location.id = "area_appliances_room";
    location.name = "Utility";
    location.modules._meta = { type: "area" };

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
        .forcedTab=${"appliances"}
      ></ht-location-inspector>
    `);
    await element.updateComplete;

    const activeTab = element.shadowRoot!.querySelector(".tab.active");
    expect((activeTab?.textContent || "").trim()).to.equal("Appliances");
  });

  it("filters Appliances target entities to standalone fans and switches", async () => {
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>) => {
        if (request.type === "topomation/actions/rules/list") {
          return { rules: [] } as T;
        }
        if (request.type === "config/entity_registry/list") {
          return [
            { entity_id: "fan.kitchen_hood", device_id: "dev_hvac_stack" },
            { entity_id: "climate.kitchen", device_id: "dev_hvac_stack" },
            { entity_id: "fan.bathroom_fan", device_id: "dev_bath" },
          ] as T;
        }
        if (request.type === "config/device_registry/list") {
          return [
            { id: "dev_hvac_stack", via_device_id: null },
            { id: "dev_bath", via_device_id: null },
          ] as T;
        }
        return [] as T;
      },
      connection: {},
      states: {
        "fan.kitchen_hood": {
          entity_id: "fan.kitchen_hood",
          state: "off",
          attributes: {
            friendly_name: "Kitchen Hood",
            area_id: "kitchen",
          },
        },
        "fan.bathroom_fan": {
          entity_id: "fan.bathroom_fan",
          state: "off",
          attributes: {
            friendly_name: "Bathroom Fan",
            area_id: "kitchen",
          },
        },
        "switch.kitchen_accent": {
          entity_id: "switch.kitchen_accent",
          state: "off",
          attributes: {
            friendly_name: "Kitchen Accent",
            area_id: "kitchen",
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
        "media_player.kitchen_speaker": {
          entity_id: "media_player.kitchen_speaker",
          state: "idle",
          attributes: {
            friendly_name: "Kitchen Speaker",
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
      "light.kitchen_ceiling",
      "fan.kitchen_hood",
      "fan.bathroom_fan",
      "media_player.kitchen_speaker",
      "switch.kitchen_accent",
    ];

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector .hass=${hass} .location=${location} .forcedTab=${"appliances"}></ht-location-inspector>
    `);
    await element.updateComplete;

    const addRuleButton = element.shadowRoot?.querySelector(
      '[data-testid="action-rule-add"]'
    ) as HTMLButtonElement | null;
    expect(addRuleButton).to.exist;
    addRuleButton!.click();
    await element.updateComplete;

    await waitUntil(
      () => {
        const row = element.shadowRoot!.querySelector(".dusk-block-row") as HTMLElement | null;
        if (!row) return false;
        const sel = row.querySelector("select.dusk-wide-select") as HTMLSelectElement | null;
        if (!sel) return false;
        const opts = Array.from(sel.options).map((o) => o.value);
        return (
          opts.includes("fan.bathroom_fan") &&
          opts.includes("switch.kitchen_accent") &&
          !opts.includes("fan.kitchen_hood") &&
          !opts.includes("light.kitchen_ceiling") &&
          !opts.includes("media_player.kitchen_speaker")
        );
      },
      "appliance rule targets did not match standalone fan + switch filter"
    );
  });

  it("adds a rule and shows HVAC trigger/conditions/actions controls", async () => {
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>) => {
        if (request.type === "topomation/actions/rules/list") {
          return { rules: [] } as T;
        }
        if (request.type === "config/entity_registry/list") {
          return [
            { entity_id: "fan.kitchen_hood", device_id: "dev_hvac_stack" },
            { entity_id: "climate.kitchen", device_id: "dev_hvac_stack" },
          ] as T;
        }
        if (request.type === "config/device_registry/list") {
          return [{ id: "dev_hvac_stack", via_device_id: null }] as T;
        }
        return [] as T;
      },
      connection: {},
      states: {
        "fan.kitchen_hood": {
          entity_id: "fan.kitchen_hood",
          state: "off",
          attributes: {
            friendly_name: "Kitchen Hood",
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
    location.entity_ids = ["fan.kitchen_hood"];

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector .hass=${hass} .location=${location} .forcedTab=${"hvac"}></ht-location-inspector>
    `);
    await element.updateComplete;

    const addRuleButton = element.shadowRoot?.querySelector(
      '[data-testid="action-rule-add"]'
    ) as HTMLButtonElement | null;
    expect(addRuleButton).to.exist;
    addRuleButton!.click();
    await element.updateComplete;

    await waitUntil(
      () => (element.shadowRoot?.querySelectorAll(".dusk-block-row").length || 0) === 1,
      "new action rule row did not render"
    );

    const row = element.shadowRoot!.querySelector(".dusk-block-row") as HTMLElement | null;
    expect(row).to.exist;

    expect((row!.textContent || "")).to.include("Occupancy change");
    expect((row!.textContent || "")).to.include("Room becomes occupied");
    expect((row!.textContent || "")).to.include("Time window");
    expect((row!.textContent || "")).to.not.include("Ambient light change");

    const selects = Array.from(row!.querySelectorAll("select.dusk-wide-select")) as HTMLSelectElement[];
    expect(selects.length).to.equal(2);

    expect(row!.querySelectorAll('input[type="time"]').length).to.equal(0);
    const limitTime = Array.from(row!.querySelectorAll("button")).find((btn) =>
      (btn.textContent || "").includes("Limit to a time range")
    ) as HTMLButtonElement | null;
    expect(limitTime).to.exist;
    limitTime!.click();
    await element.updateComplete;

    await waitUntil(
      () => (row!.querySelectorAll('input[type="time"]').length || 0) === 2,
      "time window fields did not render"
    );
  });

  it("filters HVAC target entities to fans linked to a climate device on the same HA device", async () => {
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>) => {
        if (request.type === "topomation/actions/rules/list") {
          return { rules: [] } as T;
        }
        if (request.type === "config/entity_registry/list") {
          return [
            { entity_id: "fan.kitchen_hood", device_id: "dev_hvac_stack" },
            { entity_id: "climate.kitchen", device_id: "dev_hvac_stack" },
          ] as T;
        }
        if (request.type === "config/device_registry/list") {
          return [{ id: "dev_hvac_stack", via_device_id: null }] as T;
        }
        return [] as T;
      },
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
        "fan.kitchen_hood": {
          entity_id: "fan.kitchen_hood",
          state: "off",
          attributes: {
            friendly_name: "Kitchen Hood",
            area_id: "kitchen",
          },
        },
        "media_player.kitchen_speaker": {
          entity_id: "media_player.kitchen_speaker",
          state: "idle",
          attributes: {
            friendly_name: "Kitchen Speaker",
            area_id: "kitchen",
          },
        },
        "switch.kitchen_accent": {
          entity_id: "switch.kitchen_accent",
          state: "off",
          attributes: {
            friendly_name: "Kitchen Accent",
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
      "light.kitchen_ceiling",
      "fan.kitchen_hood",
      "media_player.kitchen_speaker",
      "switch.kitchen_accent",
    ];

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector .hass=${hass} .location=${location} .forcedTab=${"hvac"}></ht-location-inspector>
    `);
    await element.updateComplete;

    const addRuleButton = element.shadowRoot?.querySelector(
      '[data-testid="action-rule-add"]'
    ) as HTMLButtonElement | null;
    expect(addRuleButton).to.exist;
    addRuleButton!.click();
    await element.updateComplete;

    const row = element.shadowRoot!.querySelector(".dusk-block-row") as HTMLElement | null;
    expect(row).to.exist;
    expect((row!.textContent || "")).to.not.include("Occupancy must be");

    const selects = Array.from(row!.querySelectorAll("select.dusk-wide-select")) as HTMLSelectElement[];
    expect(selects.length).to.equal(2);
    const targetOptions = Array.from(selects[0].options).map((option) => option.value);
    expect(targetOptions).to.include("fan.kitchen_hood");
    expect(targetOptions).to.not.include("switch.kitchen_accent");
    expect(targetOptions).to.not.include("light.kitchen_ceiling");
    expect(targetOptions).to.not.include("media_player.kitchen_speaker");
  });

  it("saves HVAC action rules with occupancy, time, and execution settings", async () => {
    const deleteCalls: Array<Record<string, any>> = [];
    const createCalls: Array<Record<string, any>> = [];

    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>) => {
        if (request.type === "topomation/actions/rules/list") {
          return {
            rules: [
              {
                id: "rule_existing",
                entity_id: "automation.rule_existing",
                name: "Existing",
                trigger_type: "on_occupied",
                action_entity_id: "fan.kitchen_hood",
                action_service: "turn_on",
                ambient_condition: "any",
                must_be_occupied: false,
                time_condition_enabled: false,
                start_time: "18:00",
                end_time: "23:59",
                enabled: true,
              },
            ],
          } as T;
        }
        if (request.type === "topomation/actions/rules/delete") {
          deleteCalls.push(request);
          return { success: true } as T;
        }
        if (request.type === "topomation/actions/rules/create") {
          createCalls.push(request);
          const automationId =
            typeof request.automation_id === "string" && request.automation_id.length > 0
              ? request.automation_id
              : "rule_created";
          return {
            rule: {
              id: automationId,
              entity_id: `automation.${automationId}`,
              name: request.name,
              rule_uuid: request.rule_uuid,
              trigger_type: request.trigger_type,
              action_entity_id: request.action_entity_id,
              action_service: request.action_service,
              ambient_condition: request.ambient_condition,
              must_be_occupied: request.must_be_occupied,
              time_condition_enabled: request.time_condition_enabled,
              start_time: request.start_time,
              end_time: request.end_time,
              enabled: true,
            },
          } as T;
        }
        if (request.type === "config/entity_registry/list") {
          return [
            { entity_id: "fan.kitchen_hood", device_id: "dev_hvac_stack" },
            { entity_id: "climate.kitchen", device_id: "dev_hvac_stack" },
          ] as T;
        }
        if (request.type === "config/device_registry/list") {
          return [{ id: "dev_hvac_stack", via_device_id: null }] as T;
        }
        return [] as T;
      },
      connection: {},
      states: {
        "fan.kitchen_hood": {
          entity_id: "fan.kitchen_hood",
          state: "off",
          attributes: {
            friendly_name: "Kitchen Hood",
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
    location.entity_ids = ["fan.kitchen_hood"];

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector .hass=${hass} .location=${location} .forcedTab=${"hvac"}></ht-location-inspector>
    `);
    await element.updateComplete;

    await waitUntil(
      () => (element.shadowRoot?.querySelectorAll(".dusk-block-row").length || 0) === 1,
      "expected existing rule to render"
    );

    const row = element.shadowRoot!.querySelector(".dusk-block-row") as HTMLElement | null;
    expect(row).to.exist;

    const vacantRadio = row!.querySelector(
      'input[type="radio"][value="on_vacant"]'
    ) as HTMLInputElement | null;
    expect(vacantRadio).to.exist;
    vacantRadio!.click();
    await element.updateComplete;

    let selects = Array.from(row!.querySelectorAll("select.dusk-wide-select")) as HTMLSelectElement[];
    selects[0].value = "fan.kitchen_hood";
    selects[0].dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    selects[1].value = "turn_off";
    selects[1].dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    await element.updateComplete;

    const limitTime = Array.from(row!.querySelectorAll("button")).find((btn) =>
      (btn.textContent || "").includes("Limit to a time range")
    ) as HTMLButtonElement | null;
    expect(limitTime).to.exist;
    limitTime!.click();
    await element.updateComplete;

    await waitUntil(
      () => (row!.querySelectorAll('input[type="time"]').length || 0) === 2,
      "time controls did not render"
    );

    const timeInputs = Array.from(row!.querySelectorAll('input[type="time"]')) as HTMLInputElement[];
    timeInputs[0].value = "19:15";
    timeInputs[0].dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    timeInputs[1].value = "23:30";
    timeInputs[1].dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    await element.updateComplete;

    const updateButton = row!.querySelector(
      '[data-testid="action-rule-rule_existing-update"]'
    ) as HTMLButtonElement | null;
    expect(updateButton).to.exist;
    expect(updateButton!.disabled).to.equal(false);
    updateButton!.click();

    await waitUntil(() => createCalls.length === 1, "expected action rule create call");
    expect(deleteCalls.length).to.equal(0);

    const payload = createCalls[0];
    expect(payload.automation_id).to.equal("rule_existing");
    expect(typeof payload.rule_uuid).to.equal("string");
    expect(String(payload.rule_uuid || "").length).to.be.greaterThan(0);
    expect(payload.trigger_type).to.equal("on_vacant");
    expect(payload.trigger_types).to.deep.equal(["on_vacant"]);
    expect(payload.ambient_condition).to.equal("any");
    expect(payload.must_be_occupied === false || payload.must_be_occupied === undefined).to.equal(
      true
    );
    expect(payload.time_condition_enabled).to.equal(true);
    expect(payload.start_time).to.equal("19:15");
    expect(payload.end_time).to.equal("23:30");
    expect(payload.run_on_startup).to.equal(false);
    expect(payload.action_entity_id).to.equal("fan.kitchen_hood");
    expect(payload.action_service).to.equal("turn_off");
    expect(payload.require_dark).to.equal(false);
  });

  it("shows media actions without ambient and includes mute controls", async () => {
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>) => {
        if (request.type === "topomation/actions/rules/list") {
          return { rules: [] } as T;
        }
        if (request.type === "config/entity_registry/list") return [] as T;
        if (request.type === "config/device_registry/list") return [] as T;
        return [] as T;
      },
      connection: {},
      states: {
        "media_player.kitchen_speaker": {
          entity_id: "media_player.kitchen_speaker",
          state: "idle",
          attributes: {
            friendly_name: "Kitchen Speaker",
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
    location.entity_ids = ["media_player.kitchen_speaker"];

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector .hass=${hass} .location=${location} .forcedTab=${"media"}></ht-location-inspector>
    `);
    await element.updateComplete;

    const addRuleButton = element.shadowRoot?.querySelector(
      '[data-testid="action-rule-add"]'
    ) as HTMLButtonElement | null;
    expect(addRuleButton).to.exist;
    addRuleButton!.click();
    await element.updateComplete;

    await waitUntil(
      () => (element.shadowRoot?.querySelectorAll(".dusk-block-row").length || 0) === 1,
      "new media rule row did not render"
    );

    const row = element.shadowRoot!.querySelector(".dusk-block-row") as HTMLElement | null;
    expect(row).to.exist;
    expect((row!.textContent || "")).to.not.include("Ambient must be");
    expect((row!.textContent || "")).to.not.include("Occupancy must be");

    const selects = Array.from(row!.querySelectorAll("select.dusk-wide-select")) as HTMLSelectElement[];
    expect(selects.length).to.equal(2);
    selects[0].value = "media_player.kitchen_speaker";
    selects[0].dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    await element.updateComplete;

    const actionSelect = Array.from(
      row!.querySelectorAll("select.dusk-wide-select")
    )[1] as HTMLSelectElement;
    const actionOptionValues = Array.from(actionSelect.options).map((option) => option.value);
    expect(new Set(actionOptionValues)).to.deep.equal(
      new Set([
        "media_play",
        "turn_on",
        "volume_mute:false",
        "volume_set",
        "volume_mute:true",
        "media_pause",
        "media_play_pause",
        "turn_off",
        "media_stop",
      ])
    );
  });

  it("shows media volume control only for set volume actions", async () => {
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>) => {
        if (request.type === "topomation/actions/rules/list") return { rules: [] } as T;
        if (request.type === "config/entity_registry/list") return [] as T;
        if (request.type === "config/device_registry/list") return [] as T;
        return [] as T;
      },
      connection: {},
      states: {
        "media_player.kitchen_speaker": {
          entity_id: "media_player.kitchen_speaker",
          state: "idle",
          attributes: { friendly_name: "Kitchen Speaker", area_id: "kitchen" },
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
    location.entity_ids = ["media_player.kitchen_speaker"];

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector .hass=${hass} .location=${location} .forcedTab=${"media"}></ht-location-inspector>
    `);
    await element.updateComplete;

    const addRuleButton = element.shadowRoot?.querySelector(
      '[data-testid="action-rule-add"]'
    ) as HTMLButtonElement | null;
    addRuleButton!.click();
    await element.updateComplete;

    const row = element.shadowRoot!.querySelector(".dusk-block-row") as HTMLElement;
    const selects = Array.from(row.querySelectorAll("select.dusk-wide-select")) as HTMLSelectElement[];
    selects[0].value = "media_player.kitchen_speaker";
    selects[0].dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    await element.updateComplete;

    let actionSelect = Array.from(row.querySelectorAll("select.dusk-wide-select"))[1] as HTMLSelectElement;
    actionSelect.value = "volume_set";
    actionSelect.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    await element.updateComplete;

    expect((row.textContent || "")).to.include("Volume");
    const slider = row.querySelector('input[type="range"]') as HTMLInputElement | null;
    expect(slider).to.exist;
    expect(slider?.value).to.equal("30");
  });

  it("shows appliance fan speed control only for set speed actions", async () => {
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>) => {
        if (request.type === "topomation/actions/rules/list") return { rules: [] } as T;
        if (request.type === "config/entity_registry/list") return [] as T;
        if (request.type === "config/device_registry/list") return [] as T;
        return [] as T;
      },
      connection: {},
      states: {
        "fan.kitchen_hood": {
          entity_id: "fan.kitchen_hood",
          state: "off",
          attributes: { friendly_name: "Kitchen Hood", area_id: "kitchen" },
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
    location.entity_ids = ["fan.kitchen_hood"];

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector .hass=${hass} .location=${location} .forcedTab=${"appliances"}></ht-location-inspector>
    `);
    await element.updateComplete;

    const addRuleButton = element.shadowRoot?.querySelector(
      '[data-testid="action-rule-add"]'
    ) as HTMLButtonElement | null;
    addRuleButton!.click();
    await element.updateComplete;

    const row = element.shadowRoot!.querySelector(".dusk-block-row") as HTMLElement;
    const actionSelect = Array.from(row.querySelectorAll("select.dusk-wide-select"))[1] as HTMLSelectElement;
    actionSelect.value = "set_percentage";
    actionSelect.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    await element.updateComplete;

    expect((row.textContent || "")).to.include("Fan speed");
    const slider = row.querySelector('input[type="range"]') as HTMLInputElement | null;
    expect(slider).to.exist;
    expect(slider?.value).to.equal("30");
  });

  it("reloads action rules from Home Assistant when external changes occur during draft edits", async () => {
    let listCalls = 0;
    let stateChangedHandler: ((event: any) => void) | undefined;

    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>) => {
        if (request.type === "topomation/actions/rules/list") {
          listCalls += 1;
          if (listCalls < 3) {
            return {
              rules: [
                {
                  id: "rule_existing",
                  entity_id: "automation.rule_existing",
                  name: "Existing",
                  trigger_type: "on_occupied",
                  action_entity_id: "fan.kitchen_hood",
                  action_service: "turn_on",
                  ambient_condition: "any",
                  must_be_occupied: false,
                  time_condition_enabled: false,
                  start_time: "18:00",
                  end_time: "23:59",
                  enabled: true,
                },
              ],
            } as T;
          }
          return { rules: [] } as T;
        }
        if (request.type === "config/entity_registry/list") {
          return [
            { entity_id: "fan.kitchen_hood", device_id: "dev_hvac_stack" },
            { entity_id: "climate.kitchen", device_id: "dev_hvac_stack" },
          ] as T;
        }
        if (request.type === "config/device_registry/list") {
          return [{ id: "dev_hvac_stack", via_device_id: null }] as T;
        }
        return [] as T;
      },
      connection: {
        subscribeEvents: async (cb: (event: any) => void, eventType?: string) => {
          if (eventType === "state_changed") stateChangedHandler = cb;
          return () => {};
        },
      } as any,
      states: {
        "fan.kitchen_hood": {
          entity_id: "fan.kitchen_hood",
          state: "off",
          attributes: {
            friendly_name: "Kitchen Hood",
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
    location.entity_ids = ["fan.kitchen_hood"];

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector .hass=${hass} .location=${location} .forcedTab=${"hvac"}></ht-location-inspector>
    `);
    await element.updateComplete;

    await waitUntil(
      () => (element.shadowRoot?.querySelectorAll(".dusk-block-row").length || 0) === 1,
      "expected initial managed action rule to render"
    );

    const addRuleButton = element.shadowRoot?.querySelector(
      '[data-testid="action-rule-add"]'
    ) as HTMLButtonElement | null;
    expect(addRuleButton).to.exist;
    addRuleButton!.click();
    await element.updateComplete;

    await waitUntil(
      () => (element.shadowRoot?.querySelectorAll(".dusk-block-row").length || 0) === 2,
      "expected local draft rule row to render"
    );

    expect(stateChangedHandler).to.exist;
    stateChangedHandler!({
      data: {
        entity_id: "automation.rule_existing",
        old_state: { entity_id: "automation.rule_existing", state: "on", attributes: {} },
        new_state: null,
      },
    });

    await waitUntil(() => listCalls >= 3, "expected action rules reload after external automation change");
    await waitUntil(
      () => (element.shadowRoot?.querySelectorAll(".dusk-block-row").length || 0) === 0,
      "expected draft to reload from Home Assistant after external rule removal"
    );
    expect(element.shadowRoot?.textContent || "").to.include("No HVAC rules configured yet.");
  });

  it("does not reload rules on same-connection hass churn and still adds a draft rule", async () => {
    let listCalls = 0;
    const connection = {
      subscribeEvents: async () => () => {},
    } as any;

    const buildHass = (): HomeAssistant => ({
      callWS: async <T>(request: Record<string, any>) => {
        if (request.type === "topomation/actions/rules/list") {
          listCalls += 1;
          return { rules: [] } as T;
        }
        if (request.type === "config/entity_registry/list") return [] as T;
        if (request.type === "config/device_registry/list") return [] as T;
        return [] as T;
      },
      connection,
      states: {
        "fan.kitchen_hood": {
          entity_id: "fan.kitchen_hood",
          state: "off",
          attributes: {
            friendly_name: "Kitchen Hood",
            area_id: "kitchen",
          },
        },
      },
      areas: {},
      floors: {},
      localize: (key: string) => key,
    });

    const location = structuredClone(baseLocation);
    location.id = "area_kitchen";
    location.ha_area_id = "kitchen";
    location.modules._meta = { type: "area" };
    location.entity_ids = ["fan.kitchen_hood"];

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${buildHass()}
        .location=${location}
        .forcedTab=${"appliances"}
      ></ht-location-inspector>
    `);
    await element.updateComplete;

    await waitUntil(
      () => !!element.shadowRoot?.querySelector('[data-testid="action-rule-add"]'),
      "expected add-rule button to render"
    );
    const baselineListCalls = listCalls;

    for (let iteration = 0; iteration < 5; iteration += 1) {
      element.hass = buildHass();
      await element.updateComplete;
    }

    const addRuleButton = element.shadowRoot?.querySelector(
      '[data-testid="action-rule-add"]'
    ) as HTMLButtonElement | null;
    expect(addRuleButton).to.exist;
    expect(addRuleButton?.disabled).to.equal(false);
    expect(listCalls).to.equal(baselineListCalls);

    addRuleButton!.click();
    await element.updateComplete;

    await waitUntil(
      () => (element.shadowRoot?.querySelectorAll(".dusk-block-row").length || 0) === 1,
      "expected draft rule row after same-connection hass churn"
    );
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
    await switchTopTab(element, "Advanced");

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
    await switchTopTab(element, "Advanced");

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

  it("does not render WIAB or managed system area controls for buildings", async () => {
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>): Promise<T> => {
        if (request.type === "config/entity_registry/list") return [] as T;
        if (request.type === "config/device_registry/list") return [] as T;
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
    expect(Array.from(element.shadowRoot?.querySelectorAll(".tabs > .tab") || []).length).to.equal(0);
    expect(element.shadowRoot?.querySelector('[data-testid="derived-occupancy-section"]')).to.exist;
    expect(element.shadowRoot?.querySelector('[data-testid="structure-summary-panel"]')).to.exist;
    expect(element.shadowRoot?.querySelector('[data-testid="open-external-source-dialog"]')).to.equal(null);
    expect(element.shadowRoot?.textContent || "").to.include("Derived Occupancy");
    expect(element.shadowRoot?.textContent || "").to.include("Building occupancy is derived from child locations");
    expect(element.shadowRoot?.querySelector('[data-testid="wiab-preset-select"]')).to.equal(null);
    expect(element.shadowRoot?.querySelector('[data-testid="managed-shadow-section"]')).to.equal(null);
    expect(element.shadowRoot?.textContent || "").to.not.include("Wasp In A Box");
    expect(element.shadowRoot?.textContent || "").to.not.include("Managed System Area");
  });

  it("does not render occupancy group, WIAB, or managed system area controls for grounds", async () => {
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>): Promise<T> => {
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
    location.id = "grounds_home";
    location.name = "Grounds";
    location.modules._meta = { type: "grounds" };
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
    expect(Array.from(element.shadowRoot?.querySelectorAll(".tabs > .tab") || []).length).to.equal(0);
    expect(element.shadowRoot?.querySelector('[data-testid="derived-occupancy-section"]')).to.exist;
    expect(element.shadowRoot?.querySelector('[data-testid="structure-summary-panel"]')).to.exist;
    expect(element.shadowRoot?.querySelector('[data-testid="open-external-source-dialog"]')).to.equal(null);
    expect(element.shadowRoot?.textContent || "").to.include("Derived Occupancy");
    expect(element.shadowRoot?.textContent || "").to.include("Grounds occupancy is derived from child locations");
    expect(element.shadowRoot?.querySelector('[data-testid="occupancy-group-summary-section"]')).to.equal(null);
    expect(element.shadowRoot?.querySelector('[data-testid="wiab-preset-select"]')).to.equal(null);
    expect(element.shadowRoot?.querySelector('[data-testid="managed-shadow-section"]')).to.equal(null);
    expect(element.shadowRoot?.textContent || "").to.not.include("Occupancy Group");
    expect(element.shadowRoot?.textContent || "").to.not.include("Wasp In A Box");
    expect(element.shadowRoot?.textContent || "").to.not.include("Managed System Area");
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
    expect(ambientTab).to.exist;
    ambientTab?.click();
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector('[data-testid="ambient-save-button"]')).to.equal(null);
    expect(element.shadowRoot?.querySelector('[data-testid="ambient-discard-button"]')).to.equal(null);

    const sectionLuxText =
      element.shadowRoot?.querySelector('[data-testid="ambient-lux-level"]')?.textContent || "";
    const ambientStateText =
      element.shadowRoot?.querySelector('[data-testid="ambient-state"]')?.textContent || "";
    const sourceMethodText =
      element.shadowRoot?.querySelector('[data-testid="ambient-source-method"]')?.textContent || "";
    expect(sectionLuxText).to.equal("22.5 lx");
    expect(ambientStateText).to.equal("Dark");
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

  it("discard resets occupancy draft state and hides draft actions", async () => {
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
      states: {},
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
      linked_locations: [],
      occupancy_group_id: null,
      wiab: {
        preset: "off",
      },
    };

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector .hass=${hass} .location=${location}></ht-location-inspector>
    `);
    await element.updateComplete;

    expect((element as any)._getOccupancyConfig().enabled).to.equal(true);
    (element as any)._toggleEnabled();
    await element.updateComplete;

    const discardButton = element.shadowRoot!.querySelector(
      '[data-testid="detection-discard-button"]'
    ) as HTMLButtonElement | null;
    const saveButton = element.shadowRoot!.querySelector(
      '[data-testid="detection-save-button"]'
    ) as HTMLButtonElement | null;
    expect(discardButton).to.exist;
    expect(saveButton).to.exist;

    discardButton!.click();
    await element.updateComplete;

    expect((element as any)._getOccupancyConfig().enabled).to.equal(true);
    expect(
      element.shadowRoot!.querySelector('[data-testid="detection-discard-button"]')
    ).to.equal(null);
    expect(
      element.shadowRoot!.querySelector('[data-testid="detection-save-button"]')
    ).to.equal(null);
    expect(
      element.shadowRoot!.querySelector('[data-testid="detection-draft-toolbar"]')
    ).to.equal(null);
  });

  it("renders room explainability with current state and expandable recent changes", async () => {
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
            reason: "event:trigger",
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
            recent_changes: [
              {
                kind: "state",
                event: "occupied",
                reason: "event:trigger",
                changed_at: new Date().toISOString(),
              },
              {
                kind: "signal",
                event: "trigger",
                source_id: "binary_sensor.kitchen_motion",
                changed_at: new Date(Date.now() - 1000).toISOString(),
              },
              {
                kind: "signal",
                event: "clear",
                source_id: "sensor.kitchen_presence",
                changed_at: new Date(Date.now() - 2000).toISOString(),
              },
              {
                kind: "signal",
                event: "trigger",
                source_id: "sensor.kitchen_presence",
                changed_at: new Date(Date.now() - 3000).toISOString(),
              },
              {
                kind: "signal",
                event: "clear",
                source_id: "binary_sensor.kitchen_motion",
                changed_at: new Date(Date.now() - 4000).toISOString(),
              },
              {
                kind: "signal",
                event: "trigger",
                source_id: "binary_sensor.kitchen_motion",
                changed_at: new Date(Date.now() - 5000).toISOString(),
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

    const drawer = element.shadowRoot?.querySelector(
      '[data-testid="recent-occupancy-events-drawer"]'
    ) as HTMLElement | null;
    expect(drawer).to.equal(null);
    expect(drawer?.textContent || "").to.not.include("Advanced Occupancy Relationships");
    expect(
      element.shadowRoot?.querySelector('[data-testid="adjacency-advanced-toggle"]')
    ).to.equal(null);
  });

  it("does not auto-run Sync Import when selecting a structural location", async () => {
    const callWsRequests: Array<Record<string, any>> = [];
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>) => {
        callWsRequests.push(request);
        if (request.type === "config/entity_registry/list") return [] as T;
        if (request.type === "config/device_registry/list") return [] as T;
        if (request.type === "topomation/sync/import") {
          return { success: true, message: "Imported 7 locations from Home Assistant" } as T;
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
    location.id = "floor_main";
    location.name = "Main Floor";
    location.parent_id = "building_home";
    location.modules._meta = { type: "floor" };
    location.modules._meta.shadow_area_id = "";

    const allLocations: Location[] = [
      location,
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

    await element.updateComplete;
    expect(callWsRequests.some((request) => request.type === "topomation/sync/import")).to.equal(false);
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
    expect(ambientTab).to.exist;
    ambientTab?.click();
    await element.updateComplete;

    const darkInput = element.shadowRoot?.querySelector(
      '[data-testid="ambient-dark-threshold"]'
    ) as HTMLInputElement | null;
    expect(darkInput).to.exist;
    darkInput!.value = "120";
    darkInput!.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    await element.updateComplete;

    const sensorSelect = element.shadowRoot?.querySelector(
      '[data-testid="ambient-lux-sensor-select"]'
    ) as HTMLSelectElement | null;
    expect(sensorSelect).to.exist;
    sensorSelect!.value = "sensor.patio_lux";
    sensorSelect!.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    await element.updateComplete;

    const saveButton = element.shadowRoot?.querySelector(
      '[data-testid="ambient-sticky-save-button"]'
    ) as HTMLButtonElement | null;
    expect(saveButton).to.exist;
    saveButton!.click();
    await element.updateComplete;

    await waitUntil(
      () =>
        setConfigCalls.some(
          (request) =>
            request.module_id === "ambient" &&
            request.config?.dark_threshold === 120 &&
            request.config?.bright_threshold >= 121 &&
            request.config?.lux_sensor === "sensor.patio_lux" &&
            request.config?.inherit_from_parent === false &&
            request.config?.auto_discover === false
        ),
      "ambient changes were not persisted on save"
    );
  });

  it("lists direct area lux sensors even when unavailable and refreshes the reading after save", async () => {
    const setConfigCalls: Array<Record<string, any>> = [];
    let ambientReadingCount = 0;
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>): Promise<T> => {
        if (request.type === "config/entity_registry/list") {
          return [
            {
              entity_id: "sensor.dead_area_lux",
              area_id: "kitchen",
            },
            {
              entity_id: "sensor.kitchen_ambient_lux",
              area_id: null,
            },
          ] as T;
        }
        if (request.type === "config/device_registry/list") return [] as T;
        if (request.type === "topomation/ambient/get_reading") {
          ambientReadingCount += 1;
          if (ambientReadingCount === 1) {
            return {
              lux: 1000,
              source_sensor: null,
              source_location: null,
              is_inherited: false,
              is_dark: false,
              is_bright: true,
              dark_threshold: 50,
              bright_threshold: 500,
              fallback_method: "sun_position",
              timestamp: new Date().toISOString(),
            } as T;
          }
          return {
            lux: 250,
            source_sensor: "sensor.kitchen_ambient_lux",
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
        "sensor.dead_area_lux": {
          entity_id: "sensor.dead_area_lux",
          state: "unavailable",
          attributes: {
            friendly_name: "Dead Area Lux",
            device_class: "illuminance",
            unit_of_measurement: "lx",
            area_id: "kitchen",
          },
        },
        "sensor.kitchen_ambient_lux": {
          entity_id: "sensor.kitchen_ambient_lux",
          state: "250",
          attributes: {
            friendly_name: "Kitchen Ambient Lux",
            device_class: "illuminance",
            unit_of_measurement: "lx",
            area_id: "kitchen",
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
    location.entity_ids = ["sensor.dead_area_lux"];
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

    const ambientTab = Array.from(element.shadowRoot?.querySelectorAll(".tab") || []).find((tab) =>
      (tab.textContent || "").includes("Ambient")
    ) as HTMLButtonElement | undefined;
    expect(ambientTab).to.exist;
    ambientTab?.click();
    await element.updateComplete;

    const sensorSelect = element.shadowRoot?.querySelector(
      '[data-testid="ambient-lux-sensor-select"]'
    ) as HTMLSelectElement | null;
    expect(sensorSelect).to.exist;
    const optionValues = Array.from(sensorSelect?.options || []).map((option) => option.value);
    expect(optionValues).to.include("sensor.kitchen_ambient_lux");
    expect(optionValues).to.include("sensor.dead_area_lux");

    sensorSelect!.value = "sensor.kitchen_ambient_lux";
    sensorSelect!.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    await element.updateComplete;

    const saveButton = element.shadowRoot?.querySelector(
      '[data-testid="ambient-sticky-save-button"]'
    ) as HTMLButtonElement | null;
    expect(saveButton).to.exist;
    saveButton!.click();
    await element.updateComplete;

    await waitUntil(
      () =>
        setConfigCalls.some(
          (request) =>
            request.module_id === "ambient" &&
            request.config?.lux_sensor === "sensor.kitchen_ambient_lux" &&
            request.config?.inherit_from_parent === false
        ),
      "ambient save payload did not include the selected area lux sensor"
    );

    await waitUntil(
      () => (element.shadowRoot?.querySelector('[data-testid="ambient-source-sensor"]')?.textContent || "").trim() ===
        "sensor.kitchen_ambient_lux",
      "ambient source sensor did not refresh after save"
    );
    expect(
      (element.shadowRoot?.querySelector('[data-testid="ambient-source-location"]')?.textContent || "").trim()
    ).to.equal("Kitchen");
  });

  it("shows a neutral empty ambient sensor label when a direct local sensor is available", async () => {
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>): Promise<T> => {
        if (request.type === "config/entity_registry/list") {
          return [
            {
              entity_id: "sensor.living_room_ambient_lux",
              area_id: null,
            },
          ] as T;
        }
        if (request.type === "config/device_registry/list") return [] as T;
        if (request.type === "topomation/ambient/get_reading") {
          return {
            lux: 1000,
            source_sensor: null,
            source_location: null,
            is_inherited: false,
            is_dark: false,
            is_bright: true,
            dark_threshold: 50,
            bright_threshold: 500,
            fallback_method: "sun_position",
            timestamp: new Date().toISOString(),
          } as T;
        }
        return {} as T;
      },
      connection: {},
      states: {
        "sensor.living_room_ambient_lux": {
          entity_id: "sensor.living_room_ambient_lux",
          state: "120",
          attributes: {
            friendly_name: "Living Room Ambient Lux",
            device_class: "illuminance",
            unit_of_measurement: "lx",
            area_id: "living_room",
          },
        },
      },
      areas: {
        living_room: { area_id: "living_room", name: "Living Room" },
      },
      floors: {},
      localize: (key: string) => key,
    };

    const location = structuredClone(baseLocation);
    location.id = "area_living_room";
    location.name = "Living Room";
    location.ha_area_id = "living_room";
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

    const ambientTab = Array.from(element.shadowRoot?.querySelectorAll(".tab") || []).find((tab) =>
      (tab.textContent || "").includes("Ambient")
    ) as HTMLButtonElement | undefined;
    expect(ambientTab).to.exist;
    ambientTab?.click();
    await element.updateComplete;

    const sensorSelect = element.shadowRoot?.querySelector(
      '[data-testid="ambient-lux-sensor-select"]'
    ) as HTMLSelectElement | null;
    expect(sensorSelect).to.exist;
    expect(sensorSelect?.options[0]?.textContent?.trim()).to.equal("Inherit from parent");
    expect(element.shadowRoot?.querySelector('[data-testid="ambient-inherit-toggle"]')).to.equal(null);
  });

  it("shows the ambient draft bar after selecting a different lux sensor", async () => {
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>): Promise<T> => {
        if (request.type === "config/entity_registry/list") {
          return [
            { entity_id: "sensor.living_room_ambient_lux", area_id: null },
            { entity_id: "sensor.living_room_window_ambient_lux", area_id: null },
          ] as T;
        }
        if (request.type === "config/device_registry/list") return [] as T;
        if (request.type === "topomation/ambient/get_reading") {
          return {
            lux: 120,
            source_sensor: "sensor.living_room_ambient_lux",
            source_location: "area_living_room",
            is_inherited: false,
            is_dark: false,
            is_bright: false,
            dark_threshold: 50,
            bright_threshold: 500,
            fallback_method: null,
            timestamp: new Date().toISOString(),
          } as T;
        }
        return {} as T;
      },
      connection: {},
      states: {
        "sensor.living_room_ambient_lux": {
          entity_id: "sensor.living_room_ambient_lux",
          state: "120",
          attributes: {
            friendly_name: "Living Room Ambient Lux",
            device_class: "illuminance",
            unit_of_measurement: "lx",
            area_id: "living_room",
          },
        },
        "sensor.living_room_window_ambient_lux": {
          entity_id: "sensor.living_room_window_ambient_lux",
          state: "180",
          attributes: {
            friendly_name: "Living Room Window Ambient Lux",
            device_class: "illuminance",
            unit_of_measurement: "lx",
            area_id: "living_room",
          },
        },
      },
      areas: {
        living_room: { area_id: "living_room", name: "Living Room" },
      },
      floors: {},
      localize: (key: string) => key,
    };

    const location = structuredClone(baseLocation);
    location.id = "area_living_room";
    location.name = "Living Room";
    location.ha_area_id = "living_room";
    location.modules._meta = { type: "area" };
    location.modules.ambient = {
      lux_sensor: "sensor.living_room_ambient_lux",
      auto_discover: false,
      inherit_from_parent: false,
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

    const sensorSelect = element.shadowRoot?.querySelector(
      '[data-testid="ambient-lux-sensor-select"]'
    ) as HTMLSelectElement | null;
    expect(sensorSelect).to.exist;
    sensorSelect!.value = "sensor.living_room_window_ambient_lux";
    sensorSelect!.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    await element.updateComplete;

    const stickyBar = element.shadowRoot?.querySelector(
      '[data-testid="ambient-sticky-draft-bar"]'
    ) as HTMLElement | null;
    const saveButton = element.shadowRoot?.querySelector(
      '[data-testid="ambient-sticky-save-button"]'
    ) as HTMLButtonElement | null;
    expect(stickyBar).to.exist;
    expect(saveButton).to.exist;
    expect(saveButton?.disabled).to.equal(false);
  });

  it("ignores legacy dusk/dawn payloads in the active lighting editor", async () => {
    const createCalls: Array<Record<string, any>> = [];
    const setConfigCalls: Array<Record<string, any>> = [];

    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>): Promise<T> => {
        if (request.type === "topomation/actions/rules/list") {
          return { rules: [] } as T;
        }
        if (request.type === "topomation/actions/rules/create") {
          createCalls.push(request);
          const automationId = `lighting_${createCalls.length}`;
          const createdRule = {
            id: automationId,
            entity_id: `automation.${automationId}`,
            name: request.name,
            trigger_type: request.trigger_type,
            rule_uuid: request.rule_uuid,
            action_entity_id: request.action_entity_id,
            action_service: request.action_service,
            ambient_condition: request.ambient_condition,
            must_be_occupied: request.must_be_occupied,
            time_condition_enabled: request.time_condition_enabled,
            start_time: request.start_time,
            end_time: request.end_time,
            enabled: true,
          };
          return { rule: createdRule } as T;
        }
        if (request.type === "topomation/actions/rules/delete") {
          return { success: true } as T;
        }
        if (request.type === "topomation/locations/set_module_config") {
          setConfigCalls.push(request);
          return { success: true } as T;
        }
        if (request.type === "config/entity_registry/list") return [] as T;
        if (request.type === "config/device_registry/list") return [] as T;
        if (request.type === "topomation/ambient/get_reading") {
          return {
            lux: 12,
            is_dark: true,
            is_bright: false,
            source_sensor: null,
            source_location: null,
            timestamp: new Date().toISOString(),
          } as T;
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
            supported_color_modes: ["brightness"],
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
    location.entity_ids = ["light.kitchen_ceiling"];
    location.modules._meta = { type: "area" };
    location.modules.dusk_dawn = {
      version: 3,
      blocks: [
        {
          id: "evening",
          name: "Rule 1",
          trigger_mode: "on_dark",
          ambient_condition: "dark",
          must_be_occupied: false,
          time_condition_enabled: false,
          light_targets: [
            {
              entity_id: "light.kitchen_ceiling",
              power: "on",
            },
          ],
        },
      ],
    };

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
        .forcedTab=${"lighting"}
      ></ht-location-inspector>
    `);
    await element.updateComplete;

    expect((element.shadowRoot?.querySelectorAll(".dusk-block-row").length || 0)).to.equal(0);
    expect(element.shadowRoot?.textContent || "").to.include("No lighting rules configured yet.");

    expect(element.shadowRoot?.querySelector('[data-testid="lighting-rules-save"]')).to.equal(null);
    expect(element.shadowRoot?.querySelector('[data-testid="startup-reapply-lighting"]')).to.equal(null);
    expect(createCalls.length).to.equal(0);

    const addRuleButton = element.shadowRoot?.querySelector(
      '[data-testid="action-rule-add"]'
    ) as HTMLButtonElement | null;
    expect(addRuleButton).to.exist;
    addRuleButton!.click();
    await element.updateComplete;

    await waitUntil(
      () => (element.shadowRoot?.querySelectorAll(".dusk-block-row").length || 0) === 1,
      "expected fresh lighting draft rule to render"
    );

    const draftTitle = element.shadowRoot?.querySelector(
      ".dusk-block-title-button"
    ) as HTMLButtonElement | null;
    expect(draftTitle).to.exist;
    expect((draftTitle?.textContent || "").trim()).to.equal("New rule");
    expect(element.shadowRoot?.querySelector('[data-testid="action-rule-add"]')).to.equal(null);

    const draftRule = element.shadowRoot?.querySelector(".dusk-block-row") as HTMLElement | null;
    expect(draftRule).to.exist;
    expect((draftRule?.textContent || "")).to.include("Occupancy change");
    expect((draftRule?.textContent || "")).to.include("Ambient light change");
    expect((draftRule?.textContent || "")).to.include("Time window");
    expect((draftRule?.textContent || "")).to.include("Lights");
    expect(draftRule?.querySelectorAll(".lighting-situation-card").length || 0).to.equal(2);

    const saveButton = element.shadowRoot?.querySelector(
      '[data-testid^="action-rule-"][data-testid$="-save"]'
    ) as HTMLButtonElement | null;
    expect(saveButton).to.exist;
    expect(saveButton!.disabled).to.equal(false);
    saveButton!.click();

    await waitUntil(() => createCalls.length === 1, "expected managed lighting create call");
    const payload = createCalls[0];
    expect(payload.trigger_type).to.equal("on_occupied");
    expect(payload.trigger_types).to.deep.equal(["on_occupied"]);
    expect(Array.isArray(payload.actions)).to.equal(true);
    expect(payload.actions.length).to.equal(1);
    expect(payload.action_entity_id).to.equal("light.kitchen_ceiling");
    expect(payload.action_service).to.equal("turn_on");
    expect(payload.ambient_condition).to.equal("dark");
    expect(payload.must_be_occupied).to.equal(undefined);
    expect(typeof payload.rule_uuid).to.equal("string");
    expect(String(payload.rule_uuid || "").length).to.be.greaterThan(0);
    expect(setConfigCalls.some((request) => request.module_id === "dusk_dawn")).to.equal(false);
  });

  it("supports multiple lighting actions in a single rule save payload", async () => {
    const createCalls: Array<Record<string, any>> = [];
    let listCalls = 0;
    let persistedRules: Array<Record<string, any>> = [];

    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>): Promise<T> => {
        if (request.type === "topomation/actions/rules/list") {
          listCalls += 1;
          return { rules: persistedRules } as T;
        }
        if (request.type === "topomation/actions/rules/create") {
          createCalls.push(request);
          const automationId = request.automation_id || "lighting_multi_1";
          const createdRule = {
            id: automationId,
            entity_id: `automation.${automationId}`,
            name: request.name,
            trigger_type: request.trigger_type,
            rule_uuid: request.rule_uuid,
            actions: request.actions,
            action_entity_id: request.action_entity_id,
            action_service: request.action_service,
            action_data: request.action_data,
            ambient_condition: request.ambient_condition,
            must_be_occupied: request.must_be_occupied,
            time_condition_enabled: request.time_condition_enabled,
            start_time: request.start_time,
            end_time: request.end_time,
            enabled: true,
          };
          persistedRules = [createdRule];
          return { rule: createdRule } as T;
        }
        if (request.type === "config/entity_registry/list") return [] as T;
        if (request.type === "config/device_registry/list") return [] as T;
        if (request.type === "topomation/ambient/get_reading") {
          return {
            lux: 12,
            is_dark: true,
            is_bright: false,
            source_sensor: null,
            source_location: null,
            timestamp: new Date().toISOString(),
          } as T;
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
            supported_color_modes: ["brightness"],
          },
        },
        "light.kitchen_island": {
          entity_id: "light.kitchen_island",
          state: "off",
          attributes: {
            friendly_name: "Kitchen Island",
            supported_color_modes: ["brightness"],
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
    location.entity_ids = ["light.kitchen_ceiling", "light.kitchen_island"];
    location.modules._meta = { type: "area" };

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
        .forcedTab=${"lighting"}
      ></ht-location-inspector>
    `);
    await element.updateComplete;

    const addRuleButton = element.shadowRoot?.querySelector(
      '[data-testid="action-rule-add"]'
    ) as HTMLButtonElement | null;
    expect(addRuleButton).to.exist;
    addRuleButton!.click();
    await element.updateComplete;

    await waitUntil(
      () => (element.shadowRoot?.querySelectorAll(".dusk-block-row").length || 0) === 1,
      "expected one draft lighting rule row"
    );

    const firstOnlyIfOffToggle = Array.from(
      element.shadowRoot?.querySelectorAll(".choice-pill") || []
    ).find((pill) => (pill.textContent || "").includes("Only if off")) as
      | HTMLButtonElement
      | undefined;
    expect(firstOnlyIfOffToggle).to.exist;
    firstOnlyIfOffToggle!.click();
    await element.updateComplete;

    const secondIncludeToggle = element.shadowRoot?.querySelector(
      '[data-testid="action-rule-action_rule_1-device-include-1"]'
    ) as HTMLInputElement | null;
    if (secondIncludeToggle) {
      secondIncludeToggle.checked = true;
      secondIncludeToggle.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    } else {
      const includeToggles = Array.from(
        element.shadowRoot?.querySelectorAll('[data-testid*="-device-include-"]') || []
      ) as HTMLInputElement[];
      expect(includeToggles.length).to.equal(2);
      includeToggles[1].checked = true;
      includeToggles[1].dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    }
    await element.updateComplete;
    const listCallsBeforeSave = listCalls;

    const saveRuleButton = Array.from(
      element.shadowRoot?.querySelectorAll(".dusk-block-footer button") || []
    ).find((button) => (button.textContent || "").trim() === "Save rule") as HTMLButtonElement | undefined;
    expect(saveRuleButton).to.exist;
    saveRuleButton!.click();

    await waitUntil(() => createCalls.length === 1, "expected one create call");
    const payload = createCalls[0];
    expect(Array.isArray(payload.actions)).to.equal(true);
    expect(payload.actions.length).to.equal(2);
    const entityIds = (payload.actions as Array<{ entity_id: string }>).map((action) => action.entity_id);
    expect(new Set(entityIds)).to.deep.equal(new Set(["light.kitchen_ceiling", "light.kitchen_island"]));
    const ceilingAction = (payload.actions as Array<{ entity_id: string; only_if_off?: boolean }>).find(
      (action) => action.entity_id === "light.kitchen_ceiling"
    );
    expect(ceilingAction?.only_if_off).to.equal(true);
    await new Promise((resolve) => window.setTimeout(resolve, 350));
    expect(listCalls).to.equal(listCallsBeforeSave);
  });

  it("uses card-local lifecycle controls for persisted and draft lighting rules", async () => {
    const persistedRules = [
      {
        id: "rule_existing",
        entity_id: "automation.rule_existing",
        name: "Existing",
        trigger_type: "on_dark",
        rule_uuid: "rule_existing_uuid",
        action_entity_id: "light.kitchen_ceiling",
        action_service: "turn_on",
        ambient_condition: "dark",
        must_be_occupied: false,
        time_condition_enabled: false,
        start_time: "18:00",
        end_time: "23:59",
        enabled: true,
      },
    ];

    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>): Promise<T> => {
        if (request.type === "topomation/actions/rules/list") {
          return { rules: persistedRules } as T;
        }
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
            supported_color_modes: ["brightness"],
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
    location.entity_ids = ["light.kitchen_ceiling"];
    location.modules._meta = { type: "area" };

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
        .forcedTab=${"lighting"}
      ></ht-location-inspector>
    `);
    await element.updateComplete;

    await waitUntil(
      () => (element.shadowRoot?.querySelectorAll(".dusk-block-row").length || 0) === 1,
      "expected persisted lighting rule row to render"
    );

    const persistedDelete = element.shadowRoot?.querySelector(
      '[data-testid="action-rule-rule_existing-delete"]'
    ) as HTMLButtonElement | null;
    expect(persistedDelete).to.exist;
    expect(
      element.shadowRoot?.querySelector('[data-testid="action-rule-rule_existing-update"]')
    ).to.equal(null);
    expect(
      element.shadowRoot?.querySelector('[data-testid="action-rule-rule_existing-discard-edits"]')
    ).to.equal(null);

    const persistedRow = element.shadowRoot?.querySelector(
      '[data-testid="action-rule-rule_existing"]'
    ) as HTMLElement | null;
    expect(persistedRow).to.exist;
    expect((persistedRow?.textContent || "")).to.include("Occupancy change");
    expect(
      element.shadowRoot?.querySelector('[data-testid="action-rule-rule_existing-duplicate"]')
    ).to.exist;

    const brightAmbientTrigger = Array.from(
      persistedRow?.querySelectorAll(".choice-pill") || []
    ).find((pill) => (pill.textContent || "").includes("It becomes bright")) as
      | HTMLButtonElement
      | undefined;
    expect(brightAmbientTrigger).to.exist;
    brightAmbientTrigger!.click();
    await element.updateComplete;
    expect(element.shadowRoot?.querySelector('[data-testid="action-rule-add"]')).to.equal(null);

    await waitUntil(
      () => !!element.shadowRoot?.querySelector('[data-testid="action-rule-rule_existing-update"]'),
      "expected dirty persisted row to show update action"
    );
    expect(
      element.shadowRoot?.querySelector('[data-testid="action-rule-rule_existing-discard-edits"]')
    ).to.exist;
    expect(
      element.shadowRoot?.querySelector('[data-testid="action-rule-rule_existing-delete"]')
    ).to.exist;
    expect(
      element.shadowRoot?.querySelector('[data-testid="action-rule-rule_existing-duplicate"]')
    ).to.exist;
    expect(
      element.shadowRoot?.querySelector('[data-testid="action-rule-rule_existing-save"]')
    ).to.equal(null);
    expect(
      element.shadowRoot?.querySelector('[data-testid="action-rule-rule_existing-remove"]')
    ).to.equal(null);

    const persistedDiscard = element.shadowRoot?.querySelector(
      '[data-testid="action-rule-rule_existing-discard-edits"]'
    ) as HTMLButtonElement | null;
    expect(persistedDiscard).to.exist;
    persistedDiscard!.click();
    await element.updateComplete;

    await waitUntil(
      () => !element.shadowRoot?.querySelector('[data-testid="action-rule-rule_existing-update"]'),
      "expected discard to restore clean persisted lifecycle controls"
    );

    const addRuleButton = element.shadowRoot?.querySelector(
      '[data-testid="action-rule-add"]'
    ) as HTMLButtonElement | null;
    expect(addRuleButton).to.exist;
    addRuleButton!.click();
    await element.updateComplete;

    await waitUntil(
      () => (element.shadowRoot?.querySelectorAll(".dusk-block-row").length || 0) === 2,
      "expected new draft lighting rule row"
    );

    const footerButtons = Array.from(element.shadowRoot?.querySelectorAll(".dusk-block-footer button") || []);
    const removeRuleCount = footerButtons.filter(
      (button) => (button.textContent || "").trim() === "Remove rule"
    ).length;
    const saveRuleCount = footerButtons.filter(
      (button) => (button.textContent || "").trim() === "Save rule"
    ).length;
    const duplicateRuleCount = footerButtons.filter(
      (button) => (button.textContent || "").trim() === "Duplicate rule"
    ).length;
    const deleteRuleCount = footerButtons.filter(
      (button) => (button.textContent || "").trim() === "Delete rule"
    ).length;
    expect(removeRuleCount).to.equal(1);
    expect(saveRuleCount).to.equal(1);
    expect(duplicateRuleCount).to.equal(2);
    expect(deleteRuleCount).to.equal(1);
  });

  it("shows situation requirement choices for occupancy-based lighting rules", async () => {
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>): Promise<T> => {
        if (request.type === "topomation/actions/rules/list") {
          return { rules: [] } as T;
        }
        if (request.type === "config/entity_registry/list") return [] as T;
        if (request.type === "config/device_registry/list") return [] as T;
        if (request.type === "topomation/ambient/get_reading") {
          return {
            lux: 12,
            is_dark: true,
            is_bright: false,
            source_sensor: null,
            source_location: null,
            timestamp: new Date().toISOString(),
          } as T;
        }
        return {} as T;
      },
      connection: {},
      states: {
        "light.office_status_light": {
          entity_id: "light.office_status_light",
          state: "off",
          attributes: {
            friendly_name: "Office Status Light",
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
    location.entity_ids = ["light.office_status_light"];
    location.modules._meta = { type: "area" };

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
        .forcedTab=${"lighting"}
      ></ht-location-inspector>
    `);
    await element.updateComplete;

    const addRuleButton = element.shadowRoot?.querySelector(
      '[data-testid="action-rule-add"]'
    ) as HTMLButtonElement | null;
    expect(addRuleButton).to.exist;
    addRuleButton!.click();
    await element.updateComplete;

    const ruleBody = element.shadowRoot?.querySelector(".dusk-block-row") as HTMLElement | null;
    expect(ruleBody).to.exist;
    expect((ruleBody?.textContent || "")).to.include("Occupancy change");
    expect((ruleBody?.textContent || "")).to.include("Ambient light change");
    expect((ruleBody?.textContent || "")).to.include("Room becomes occupied");
    expect((ruleBody?.textContent || "")).to.include("It becomes dark");
    expect((ruleBody?.textContent || "")).to.include("Any");
  });

  it("keeps paired common-case requirements in sync when a lighting situation changes", async () => {
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>): Promise<T> => {
        if (request.type === "topomation/actions/rules/list") {
          return {
            rules: [
              {
                id: "rule_existing",
                entity_id: "automation.rule_existing",
                name: "Existing",
                trigger_type: "on_occupied",
                trigger_types: ["on_occupied", "on_dark"],
                rule_uuid: "rule_existing_uuid",
                action_entity_id: "light.storage_light",
                action_service: "turn_on",
                ambient_condition: "dark",
                must_be_occupied: true,
                time_condition_enabled: false,
                enabled: true,
              },
            ],
          } as T;
        }
        if (request.type === "config/entity_registry/list") return [] as T;
        if (request.type === "config/device_registry/list") return [] as T;
        if (request.type === "topomation/ambient/get_reading") {
          return {
            lux: 12,
            is_dark: true,
            is_bright: false,
            source_sensor: null,
            source_location: null,
            timestamp: new Date().toISOString(),
          } as T;
        }
        return {} as T;
      },
      connection: {},
      states: {
        "light.storage_light": {
          entity_id: "light.storage_light",
          state: "off",
          attributes: {
            friendly_name: "Storage Light",
            supported_color_modes: ["brightness"],
          },
        },
      },
      areas: {
        storage: { area_id: "storage", name: "Storage" },
      },
      floors: {},
      localize: (key: string) => key,
    };

    const location = structuredClone(baseLocation);
    location.id = "area_storage";
    location.name = "Storage";
    location.ha_area_id = "storage";
    location.entity_ids = ["light.storage_light"];
    location.modules._meta = { type: "area" };

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
        .forcedTab=${"lighting"}
      ></ht-location-inspector>
    `);
    await element.updateComplete;

    await waitUntil(
      () => (element.shadowRoot?.querySelectorAll(".dusk-block-row").length || 0) === 1,
      "expected persisted lighting rule row to render"
    );

    const persistedRow = element.shadowRoot?.querySelector(
      '[data-testid="action-rule-rule_existing"]'
    ) as HTMLElement | null;
    expect(persistedRow).to.exist;

    const brightEventInput = Array.from(
      persistedRow?.querySelectorAll(".choice-pill") || []
    ).find((pill) => (pill.textContent || "").includes("It becomes bright")) as
      | HTMLButtonElement
      | undefined;
    expect(brightEventInput).to.exist;
    brightEventInput!.click();
    await element.updateComplete;

    const updatedRow = element.shadowRoot?.querySelector(
      '[data-testid="action-rule-rule_existing"]'
    ) as HTMLElement | null;
    expect(updatedRow).to.exist;
    const brightRequirementInput = updatedRow?.querySelector(
      'input[name="lighting-trigger-rule_existing-occupancy-condition"][value="bright"]'
    ) as HTMLInputElement | null;
    expect(brightRequirementInput).to.exist;
    expect(brightRequirementInput?.checked).to.equal(true);
  });

  it("hydrates lighting situations from a loaded legacy trigger payload", async () => {
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>): Promise<T> => {
        if (request.type === "topomation/actions/rules/list") {
          return {
            rules: [
              {
                id: "rule_existing",
                entity_id: "automation.rule_existing",
                name: "Existing",
                trigger_type: "occupied",
                rule_uuid: "rule_existing_uuid",
                action_entity_id: "light.office_status_light",
                action_service: "turn_on",
                ambient_condition: "any",
                must_be_occupied: true,
                time_condition_enabled: false,
                enabled: true,
              },
            ],
          } as T;
        }
        if (request.type === "config/entity_registry/list") return [] as T;
        if (request.type === "config/device_registry/list") return [] as T;
        if (request.type === "topomation/ambient/get_reading") {
          return {
            lux: 12,
            is_dark: true,
            is_bright: false,
            source_sensor: null,
            source_location: null,
            timestamp: new Date().toISOString(),
          } as T;
        }
        return {} as T;
      },
      connection: {},
      states: {
        "light.office_status_light": {
          entity_id: "light.office_status_light",
          state: "off",
          attributes: {
            friendly_name: "Office Status Light",
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
    location.entity_ids = ["light.office_status_light"];
    location.modules._meta = { type: "area" };

    const element = await fixture<HtLocationInspector>(html`
      <ht-location-inspector
        .hass=${hass}
        .location=${location}
        .forcedTab=${"lighting"}
      ></ht-location-inspector>
    `);
    await element.updateComplete;

    await waitUntil(
      () => (element.shadowRoot?.querySelectorAll(".dusk-block-row").length || 0) === 1,
      "expected persisted lighting rule row to render"
    );

    const occupancyTriggerCard = element.shadowRoot?.querySelector(
      '[data-testid="action-rule-rule_existing-trigger-family-occupancy"]'
    ) as HTMLElement | null;
    expect(occupancyTriggerCard).to.exist;
    expect((occupancyTriggerCard?.textContent || "")).to.include("Room becomes occupied");
    expect((occupancyTriggerCard?.textContent || "")).to.include("Any");
  });
});
