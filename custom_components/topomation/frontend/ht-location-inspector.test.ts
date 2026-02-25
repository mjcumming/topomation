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

  it("renders lock diagnostics and indefinite vacant timing when block-vacant lock is active", async () => {
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

    const untilVacantText = (
      element.shadowRoot!.querySelector('[data-testid="runtime-time-until-vacant"]')?.textContent || ""
    ).trim();
    const lockModesText = Array.from(element.shadowRoot!.querySelectorAll(".runtime-row"))
      .find((row) => (row.textContent || "").includes("Lock Modes"))
      ?.textContent || "";
    const lockDirectiveText = (
      element.shadowRoot!.querySelector(".lock-directive")?.textContent || ""
    ).trim();

    expect(untilVacantText).to.include("Indefinite");
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

    const untilVacantText = (
      element.shadowRoot!.querySelector('[data-testid="runtime-time-until-vacant"]')?.textContent || ""
    ).trim();
    const vacantAtText = (
      element.shadowRoot!.querySelector('[data-testid="runtime-vacant-at"]')?.textContent || ""
    ).trim();

    expect(untilVacantText).to.not.equal("Unknown");
    expect(untilVacantText).to.not.equal("Already vacant");
    expect(vacantAtText).to.equal(expectedVacantAtLabel);
  });

  it("emits add-rule with vacant trigger from On Vacant tab", async () => {
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

    const addRuleEvent = new Promise<CustomEvent>((resolve) => {
      element.addEventListener("add-rule", (event) => resolve(event as CustomEvent), {
        once: true,
      });
    });

    const addRuleButton = Array.from(element.shadowRoot!.querySelectorAll(".button.button-primary")).find(
      (el) => (el.textContent || "").includes("Add Rule")
    ) as HTMLButtonElement | undefined;
    expect(addRuleButton).to.exist;
    addRuleButton!.click();

    const event = await addRuleEvent;
    expect(event.detail?.trigger_type).to.equal("vacant");
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
});
