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
    const vacateCall = callWsRequests.find(
      (request) =>
        request.type === "call_service" &&
        request.domain === "topomation" &&
        request.service === "vacate"
    );

    expect(triggerCall).to.exist;
    expect(triggerCall?.service_data?.location_id).to.equal("area_kitchen");
    expect(triggerCall?.service_data?.source_id).to.equal("light.kitchen_ceiling");

    expect(vacateCall).to.exist;
    expect(vacateCall?.service_data?.location_id).to.equal("area_kitchen");
    expect(vacateCall?.service_data?.source_id).to.equal(undefined);

    expect(emitted.map((detail) => detail.action)).to.deep.equal(["trigger", "vacate"]);
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

  it("adds selected external entity as staged occupancy source", async () => {
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
      () => ((element as any)._stagedSources || []).length === 1,
      "source was not staged"
    );

    const staged = (element as any)._stagedSources as Array<Record<string, any>>;
    expect(staged[0].entity_id).to.equal("binary_sensor.kitchen_motion");
  });

  it("renders Detection/On Occupied/On Vacant tabs", async () => {
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
    expect(tabLabels).to.include("On Occupied");
    expect(tabLabels).to.include("On Vacant");
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

  it("creates managed automation rule when inline action include toggle is enabled", async () => {
    const callApiCalls: Array<{
      method: string;
      endpoint: string;
      parameters?: Record<string, any>;
    }> = [];
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>) => {
        if (request.type === "config/entity_registry/list") return [] as T;
        if (request.type === "config/device_registry/list") return [] as T;
        if (request.type === "automation/config") return { config: undefined } as T;
        return [] as T;
      },
      callApi: async <T>(
        method: string,
        endpoint: string,
        parameters?: Record<string, any>
      ): Promise<T> => {
        callApiCalls.push({ method, endpoint, parameters });
        return { result: "ok" } as T;
      },
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

    await waitUntil(() => callApiCalls.length > 0, "managed rule creation call did not occur");

    expect(callApiCalls[0].method).to.equal("post");
    expect(callApiCalls[0].endpoint).to.contain("config/automation/config/");
    expect(callApiCalls[0].parameters?.actions?.[0]?.target?.entity_id).to.equal(
      "light.kitchen_ceiling"
    );
  });

  it("uses selected per-device action service when creating managed automation rule", async () => {
    const callApiCalls: Array<{
      method: string;
      endpoint: string;
      parameters?: Record<string, any>;
    }> = [];
    const hass: HomeAssistant = {
      callWS: async <T>(request: Record<string, any>) => {
        if (request.type === "config/entity_registry/list") return [] as T;
        if (request.type === "config/device_registry/list") return [] as T;
        if (request.type === "automation/config") return { config: undefined } as T;
        return [] as T;
      },
      callApi: async <T>(
        method: string,
        endpoint: string,
        parameters?: Record<string, any>
      ): Promise<T> => {
        callApiCalls.push({ method, endpoint, parameters });
        return { result: "ok" } as T;
      },
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

    const serviceSelect = row!.querySelector("select.action-service-select") as
      | HTMLSelectElement
      | null;
    expect(serviceSelect).to.exist;
    serviceSelect!.value = "turn_off";
    serviceSelect!.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    await element.updateComplete;

    const toggle = row!.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
    expect(toggle).to.exist;
    toggle!.click();
    await element.updateComplete;

    await waitUntil(
      () =>
        callApiCalls.some(
          (call) =>
            call.method === "post" &&
            call.parameters?.actions?.[0]?.action === "light.turn_off"
        ),
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
    expect(text).to.include("Current state:");
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
    expect(optionValues).to.deep.equal(["media_stop", "turn_off"]);
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
    expect(occupiedSelect!.value).to.equal("turn_on");
    occupiedSelect!.value = "turn_off";
    occupiedSelect!.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    await element.updateComplete;

    const occupiedRowAfter = getRow();
    expect(occupiedRowAfter).to.exist;
    const occupiedSelectAfter = occupiedRowAfter!.querySelector("select.action-service-select") as
      | HTMLSelectElement
      | null;
    expect(occupiedSelectAfter).to.exist;
    expect(occupiedSelectAfter!.value).to.equal("turn_off");

    const vacantTab = Array.from(element.shadowRoot!.querySelectorAll(".tab")).find((el) =>
      (el.textContent || "").includes("On Vacant")
    ) as HTMLButtonElement | undefined;
    expect(vacantTab).to.exist;
    vacantTab!.click();
    await element.updateComplete;

    await waitUntil(() => !!getRow(), "vacant row did not render");
    const vacantRow = getRow();
    expect(vacantRow).to.exist;

    const vacantSelect = vacantRow!.querySelector("select.action-service-select") as
      | HTMLSelectElement
      | null;
    expect(vacantSelect).to.exist;
    expect(vacantSelect!.value).to.equal("turn_off");
    vacantSelect!.value = "turn_on";
    vacantSelect!.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    await element.updateComplete;

    const vacantRowAfter = getRow();
    expect(vacantRowAfter).to.exist;
    const vacantSelectAfter = vacantRowAfter!.querySelector("select.action-service-select") as
      | HTMLSelectElement
      | null;
    expect(vacantSelectAfter).to.exist;
    expect(vacantSelectAfter!.value).to.equal("turn_on");
  });
});
