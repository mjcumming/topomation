/// <reference types="mocha" />
import { fixture, html, expect, waitUntil } from '@open-wc/testing';
import './topomation-panel';
import type { HomeAssistant, Location } from './types';

const locations: Location[] = [
  {
    id: 'main-building',
    name: 'Main Building',
    parent_id: null,
    is_explicit_root: false,
    entity_ids: [],
    modules: { _meta: { type: 'building' } }
  },
  {
    id: 'grounds',
    name: 'Grounds',
    parent_id: null,
    is_explicit_root: false,
    entity_ids: [],
    modules: { _meta: { type: 'grounds' } }
  },
  {
    id: 'basement',
    name: 'Basement',
    parent_id: 'main-building',
    is_explicit_root: false,
    ha_area_id: 'basement',
    entity_ids: [],
    modules: { _meta: { type: 'floor' } }
  },
  {
    id: 'main_floor',
    name: 'Main Floor',
    parent_id: 'main-building',
    is_explicit_root: false,
    ha_area_id: 'main_floor',
    entity_ids: [],
    modules: { _meta: { type: 'floor' } }
  },
  {
    id: 'second_floor',
    name: 'Second Floor',
    parent_id: 'main-building',
    is_explicit_root: false,
    ha_area_id: 'second_floor',
    entity_ids: [],
    modules: { _meta: { type: 'floor' } }
  },
  {
    id: 'living_room',
    name: 'Living Room',
    parent_id: 'main_floor',
    is_explicit_root: false,
    ha_area_id: 'living_room',
    entity_ids: [],
    modules: { _meta: { type: 'area' } }
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    parent_id: 'main_floor',
    is_explicit_root: false,
    ha_area_id: 'kitchen',
    entity_ids: [],
    modules: { _meta: { type: 'area' } }
  },
  {
    id: 'pantry',
    name: 'Pantry',
    parent_id: 'kitchen',
    is_explicit_root: false,
    entity_ids: [],
    modules: { _meta: { type: 'subarea' } }
  },
  {
    id: 'primary_bedroom',
    name: 'Primary Bedroom',
    parent_id: 'second_floor',
    is_explicit_root: false,
    ha_area_id: 'primary_bedroom',
    entity_ids: [],
    modules: { _meta: { type: 'area' } }
  },
  {
    id: 'guest_bedroom',
    name: 'Guest Bedroom',
    parent_id: 'second_floor',
    is_explicit_root: false,
    ha_area_id: 'guest_bedroom',
    entity_ids: [],
    modules: { _meta: { type: 'area' } }
  },
  {
    id: 'patio',
    name: 'Patio',
    parent_id: 'grounds',
    is_explicit_root: false,
    ha_area_id: 'patio',
    entity_ids: [],
    modules: { _meta: { type: 'area' } }
  }
];

const locationsWithExplicitRoot: Location[] = [
  {
    id: "home",
    name: "Home Root",
    parent_id: null,
    is_explicit_root: true,
    entity_ids: [],
    modules: { _meta: { type: "building" } },
  },
  ...locations,
];

const TREE_PANEL_SPLIT_STORAGE_KEY = "topomation:panel-tree-split";

describe('TopomationPanel integration (fake hass)', () => {
  beforeEach(() => {
    window.localStorage?.removeItem(TREE_PANEL_SPLIT_STORAGE_KEY);
  });

  afterEach(() => {
    window.localStorage?.removeItem(TREE_PANEL_SPLIT_STORAGE_KEY);
  });

  it('loads locations from callWS and renders building/grounds hierarchy', async () => {
    const callWsCalls: any[] = [];
    const hass: HomeAssistant = {
      callWS: async <T>(req: Record<string, any>): Promise<T> => {
        callWsCalls.push(req);
        if (req.type === 'topomation/locations/list') {
          return { locations } as T;
        }
        if (req.type === 'config/entity_registry/list') {
          return [] as T;
        }
        if (req.type === 'config/device_registry/list') {
          return [] as T;
        }
        throw new Error('Unexpected WS call');
      },
      connection: {},
      states: {},
      areas: {},
      floors: {},
      config: {
        location_name: "Test Property",
        latitude: 37.7749,
        longitude: -122.4194,
        time_zone: "America/Los_Angeles",
        country: "US",
      },
      localize: (key: string) => key
    };

    const element = await fixture<HTMLDivElement>(html`
      <topomation-panel
        .hass=${hass}
        .panel=${{ config: { topomation_view: "location", entry_id: "entry_123" } }}
      ></topomation-panel>
    `);

    // Wait for initial load to finish
    await waitUntil(() => (element as any)._loading === false, 'panel did not finish loading');

    const tree = element.shadowRoot!.querySelector('ht-location-tree') as any;
    await tree.updateComplete;

    await waitUntil(() => Array.isArray(tree.locations) && tree.locations.length > 1, 'tree did not receive locations');

    // Ensure locations are set (defensive)
    tree.locations = locations;

    // Expand all nodes to reveal hierarchy
    (tree as any)._expandedIds = new Set(locations.map(loc => loc.id));
    tree.requestUpdate();
    await tree.updateComplete;

    const locationNames = Array.from(tree.shadowRoot!.querySelectorAll('.location-name'))
      .map((el) => (el as HTMLElement).textContent?.trim() || '')
      .filter(Boolean);

    expect(locationNames).to.include('Main Building');
    expect(locationNames).to.include('Grounds');
    expect(locationNames).to.include('Basement');
    expect(locationNames).to.include('Main Floor');
    expect(locationNames).to.include('Second Floor');
    expect(locationNames).to.include('Living Room');
    expect(locationNames).to.include('Kitchen');
    expect(locationNames).to.include('Pantry');
    expect(locationNames).to.include('Patio');
    expect(
      callWsCalls.some(
        (c) => c.type === "topomation/locations/list" && c.entry_id === "entry_123"
      )
    ).to.be.true;
  });

  it("reuses last known entry_id when panel config is temporarily unavailable", async () => {
    const callWsCalls: Array<Record<string, any>> = [];
    const hass: HomeAssistant = {
      callWS: async <T>(req: Record<string, any>): Promise<T> => {
        callWsCalls.push(req);
        if (req.type === "topomation/locations/list") {
          return { locations } as T;
        }
        if (req.type === "config/entity_registry/list") {
          return [] as T;
        }
        if (req.type === "config/device_registry/list") {
          return [] as T;
        }
        throw new Error("Unexpected WS call");
      },
      connection: {},
      states: {},
      areas: {},
      floors: {},
      config: {
        location_name: "Test Property",
      },
      localize: (key: string) => key,
    };

    const element = await fixture<HTMLDivElement>(html`
      <topomation-panel
        .hass=${hass}
        .panel=${{ config: { topomation_view: "location", entry_id: "entry_123" } }}
      ></topomation-panel>
    `);

    await waitUntil(() => (element as any)._loading === false, "panel did not finish loading");

    (element as any).panel = undefined;
    await (element as any).updateComplete;
    await (element as any)._loadLocations(true);

    const locationListCalls = callWsCalls.filter(
      (call) => call.type === "topomation/locations/list"
    );
    expect(locationListCalls.length).to.be.greaterThan(1);
    expect(locationListCalls[locationListCalls.length - 1].entry_id).to.equal("entry_123");
  });

  it("hides explicit Home root from the manager tree", async () => {
    const hass: HomeAssistant = {
      callWS: async <T>(req: Record<string, any>): Promise<T> => {
        if (req.type === "topomation/locations/list") {
          return { locations: locationsWithExplicitRoot } as T;
        }
        if (req.type === "config/entity_registry/list") {
          return [] as T;
        }
        if (req.type === "config/device_registry/list") {
          return [] as T;
        }
        throw new Error("Unexpected WS call");
      },
      connection: {},
      states: {},
      areas: {},
      floors: {},
      config: { location_name: "Test Property" },
      localize: (key: string) => key,
    };

    const element = await fixture<HTMLDivElement>(html`
      <topomation-panel .hass=${hass}></topomation-panel>
    `);

    await waitUntil(() => (element as any)._loading === false, "panel did not finish loading");
    const tree = element.shadowRoot!.querySelector("ht-location-tree") as any;
    expect(tree).to.exist;
    await tree.updateComplete;

    expect((tree.locations as Location[]).some((loc) => loc.is_explicit_root)).to.equal(false);
    expect((element as any)._selectedId).to.not.equal("home");
  });

  it("uses topology header and omits property context banner", async () => {
    const hass: HomeAssistant = {
      callWS: async <T>(req: Record<string, any>): Promise<T> => {
        if (req.type === "topomation/locations/list") {
          return { locations } as T;
        }
        if (req.type === "config/entity_registry/list") {
          return [] as T;
        }
        if (req.type === "config/device_registry/list") {
          return [] as T;
        }
        throw new Error("Unexpected WS call");
      },
      connection: {},
      states: {},
      areas: {},
      floors: {},
      config: {
        location_name: "Lake House",
        latitude: 44.9778,
        longitude: -93.2650,
        time_zone: "America/Chicago",
        country: "US",
      },
      localize: (key: string) => key,
    };

    const element = await fixture<HTMLDivElement>(html`
      <topomation-panel .hass=${hass}></topomation-panel>
    `);

    await waitUntil(() => (element as any)._loading === false, "panel did not finish loading");

    const contextCard = element.shadowRoot!.querySelector(".property-context");
    expect(contextCard).to.equal(null);

    const leftHeaderTitle = element.shadowRoot!.querySelector(".panel-left .header-title");
    expect((leftHeaderTitle?.textContent || "").trim()).to.equal("Topology");

    const leftHeaderSubtitle = element.shadowRoot!.querySelector(".panel-left .header-subtitle");
    expect((leftHeaderSubtitle?.textContent || "").trim()).to.contain("Organize buildings");
  });

  it("opens location dialog with building defaults from add-structure handler", async () => {
    const hass: HomeAssistant = {
      callWS: async <T>(req: Record<string, any>): Promise<T> => {
        if (req.type === "topomation/locations/list") {
          return { locations } as T;
        }
        if (req.type === "config/entity_registry/list") {
          return [] as T;
        }
        if (req.type === "config/device_registry/list") {
          return [] as T;
        }
        throw new Error("Unexpected WS call");
      },
      connection: {},
      states: {},
      areas: {},
      floors: {},
      config: {
        location_name: "Test Property",
      },
      localize: (key: string) => key,
    };

    const element = await fixture<HTMLDivElement>(html`
      <topomation-panel .hass=${hass}></topomation-panel>
    `);

    await waitUntil(() => (element as any)._loading === false, "panel did not finish loading");

    (element as any)._handleNewLocation();
    await (element as any).updateComplete;

    expect((element as any)._locationDialogOpen).to.equal(true);
    expect((element as any)._newLocationDefaults?.type).to.equal("building");
    expect((element as any)._newLocationDefaults?.parentId).to.equal(null);
  });

  it("deletes selected location via websocket and reloads", async () => {
    const callWsCalls: any[] = [];
    let locationsState = [...locations];

    const hass: HomeAssistant = {
      callWS: async <T>(req: Record<string, any>): Promise<T> => {
        callWsCalls.push(req);
        if (req.type === "topomation/locations/list") {
          return { locations: locationsState } as T;
        }
        if (req.type === "topomation/locations/delete") {
          locationsState = locationsState.filter((loc) => loc.id !== req.location_id);
          return { success: true } as T;
        }
        if (req.type === "config/entity_registry/list") {
          return [] as T;
        }
        if (req.type === "config/device_registry/list") {
          return [] as T;
        }
        throw new Error("Unexpected WS call");
      },
      connection: {},
      states: {},
      areas: {},
      floors: {},
      config: {
        location_name: "Test Property",
      },
      localize: (key: string) => key,
    };

    const element = await fixture<HTMLDivElement>(html`
      <topomation-panel .hass=${hass}></topomation-panel>
    `);

    await waitUntil(() => (element as any)._loading === false, "panel did not finish loading");
    (element as any)._selectedId = "kitchen";

    await (element as any)._handleLocationDelete(
      new CustomEvent("location-delete", {
        detail: {
          location: {
            id: "kitchen",
            name: "Kitchen",
            parent_id: "main_floor",
          },
        },
      })
    );

    expect(callWsCalls.some((call) => call.type === "topomation/locations/delete")).to.equal(true);
    expect((element as any)._locations.find((loc: any) => loc.id === "kitchen")).to.equal(undefined);
  });

  it("shows add and delete controls in actions manager view", async () => {
    const hass: HomeAssistant = {
      callWS: async <T>(req: Record<string, any>): Promise<T> => {
        if (req.type === "topomation/locations/list") {
          return { locations } as T;
        }
        if (req.type === "config/entity_registry/list") {
          return [] as T;
        }
        if (req.type === "config/device_registry/list") {
          return [] as T;
        }
        throw new Error("Unexpected WS call");
      },
      connection: {},
      states: {},
      areas: {},
      floors: {},
      config: {
        location_name: "Test Property",
      },
      localize: (key: string) => key,
    };

    const element = await fixture<HTMLDivElement>(html`
      <topomation-panel
        .hass=${hass}
        .panel=${{ config: { topomation_view: "actions" } }}
      ></topomation-panel>
    `);

    await waitUntil(() => (element as any)._loading === false, "panel did not finish loading");
    (element as any)._selectedId = "main-building";
    await (element as any).updateComplete;

    const buttons = Array.from(
      element.shadowRoot!.querySelectorAll(".header-actions .button")
    ) as HTMLButtonElement[];
    const labels = buttons.map((btn) => (btn.textContent || "").trim());

    expect(labels.some((label) => label.includes("Add Structure"))).to.equal(true);
    expect(labels.some((label) => label.includes("Delete Selected"))).to.equal(true);
  });

  it("opens location dialog when Add Structure is clicked in actions view", async () => {
    const hass: HomeAssistant = {
      callWS: async <T>(req: Record<string, any>): Promise<T> => {
        if (req.type === "topomation/locations/list") {
          return { locations } as T;
        }
        if (req.type === "config/entity_registry/list") {
          return [] as T;
        }
        if (req.type === "config/device_registry/list") {
          return [] as T;
        }
        throw new Error("Unexpected WS call");
      },
      connection: {},
      states: {},
      areas: {},
      floors: {},
      config: {
        location_name: "Test Property",
      },
      localize: (key: string) => key,
    };

    const element = await fixture<HTMLDivElement>(html`
      <topomation-panel
        .hass=${hass}
        .panel=${{ config: { topomation_view: "actions" } }}
      ></topomation-panel>
    `);

    await waitUntil(() => (element as any)._loading === false, "panel did not finish loading");

    const buttons = Array.from(
      element.shadowRoot!.querySelectorAll(".header-actions .button")
    ) as HTMLButtonElement[];
    const addButton = buttons.find((btn) => (btn.textContent || "").includes("Add Structure"));
    expect(addButton).to.exist;

    addButton!.click();
    await (element as any).updateComplete;

    expect((element as any)._locationDialogOpen).to.equal(true);
  });

  it("renders inline action list in actions view without Add Rule dialog", async () => {
    const hass: HomeAssistant = {
      callWS: async <T>(req: Record<string, any>): Promise<T> => {
        if (req.type === "topomation/locations/list") {
          return { locations } as T;
        }
        if (req.type === "config/entity_registry/list") {
          return [] as T;
        }
        if (req.type === "config/device_registry/list") {
          return [] as T;
        }
        if (req.type === "config/automation/list") {
          return [] as T;
        }
        if (req.type === "automation/config") {
          return { config: undefined } as T;
        }
        return [] as T;
      },
      callApi: async <T>(): Promise<T> => ({ result: "ok" } as T),
      connection: {},
      states: {
        "light.kitchen_main": {
          entity_id: "light.kitchen_main",
          state: "off",
          attributes: {
            friendly_name: "Kitchen Main Light",
            area_id: "kitchen",
          },
        },
      },
      areas: {},
      floors: {},
      config: {
        location_name: "Test Property",
      },
      localize: (key: string) => key,
    };

    const element = await fixture<HTMLDivElement>(html`
      <topomation-panel
        .hass=${hass}
        .panel=${{ config: { topomation_view: "actions" } }}
      ></topomation-panel>
    `);

    await waitUntil(() => (element as any)._loading === false, "panel did not finish loading");
    (element as any)._selectedId = "kitchen";
    await (element as any).updateComplete;

    const inspector = element.shadowRoot!.querySelector("ht-location-inspector") as any;
    expect(inspector).to.exist;

    await waitUntil(
      () =>
        !!Array.from(inspector.shadowRoot?.querySelectorAll(".action-device-row") || []).length,
      "inline action rows not rendered"
    );

    const addRuleButton = Array.from(inspector.shadowRoot.querySelectorAll("button")).find((el) =>
      (el.textContent || "").includes("Add Rule")
    );
    expect(addRuleButton).to.not.exist;

    const rowText = inspector.shadowRoot?.textContent || "";
    expect(rowText).to.contain("Kitchen Main Light");
  });

  it("shows warning notification when a move is blocked by tree rules", async () => {
    const notifications: any[] = [];
    const hass: HomeAssistant = {
      callWS: async <T>(req: Record<string, any>): Promise<T> => {
        if (req.type === "topomation/locations/list") {
          return { locations } as T;
        }
        if (req.type === "config/entity_registry/list") {
          return [] as T;
        }
        if (req.type === "config/device_registry/list") {
          return [] as T;
        }
        throw new Error("Unexpected WS call");
      },
      connection: {},
      states: {},
      areas: {},
      floors: {},
      config: {
        location_name: "Test Property",
      },
      localize: (key: string) => key,
    };

    const element = await fixture<HTMLDivElement>(html`
      <topomation-panel .hass=${hass}></topomation-panel>
    `);

    await waitUntil(() => (element as any)._loading === false, "panel did not finish loading");
    element.addEventListener("hass-notification", (event: Event) => {
      notifications.push((event as CustomEvent).detail);
    });

    const tree = element.shadowRoot!.querySelector("ht-location-tree") as HTMLElement;
    expect(tree).to.exist;

    tree.dispatchEvent(
      new CustomEvent("location-move-blocked", {
        detail: {
          reason:
            "Parent locations cannot move under a different parent. Reorder it within the current level.",
        },
        bubbles: true,
        composed: true,
      })
    );

    await (element as any).updateComplete;

    expect(notifications.length).to.equal(1);
    expect(notifications[0].message).to.contain("cannot move under a different parent");
  });

  it("uses automation title in right header for occupancy view", async () => {
    const hass: HomeAssistant = {
      callWS: async <T>(req: Record<string, any>): Promise<T> => {
        if (req.type === "topomation/locations/list") {
          return { locations } as T;
        }
        if (req.type === "config/entity_registry/list") {
          return [] as T;
        }
        if (req.type === "config/device_registry/list") {
          return [] as T;
        }
        throw new Error("Unexpected WS call");
      },
      connection: {},
      states: {},
      areas: {},
      floors: {},
      config: {
        location_name: "Test Property",
      },
      localize: (key: string) => key,
    };

    const element = await fixture<HTMLDivElement>(html`
      <topomation-panel
        .hass=${hass}
        .panel=${{ config: { topomation_view: "occupancy" } }}
      ></topomation-panel>
    `);

    await waitUntil(() => (element as any)._loading === false, "panel did not finish loading");
    const rightHeader = element.shadowRoot!.querySelector(".panel-right .header-title");
    expect((rightHeader?.textContent || "").trim()).to.equal("Automation");
  });

  it("handles lock toggle from tree via topomation lock service", async () => {
    const callWsCalls: any[] = [];
    const hass: HomeAssistant = {
      callWS: async <T>(req: Record<string, any>): Promise<T> => {
        callWsCalls.push(req);
        if (req.type === "topomation/locations/list") {
          return { locations } as T;
        }
        if (req.type === "config/entity_registry/list") {
          return [] as T;
        }
        if (req.type === "config/device_registry/list") {
          return [] as T;
        }
        if (req.type === "call_service") {
          return {} as T;
        }
        throw new Error("Unexpected WS call");
      },
      connection: {},
      states: {},
      areas: {},
      floors: {},
      config: {
        location_name: "Test Property",
      },
      localize: (key: string) => key,
    };

    const element = await fixture<HTMLDivElement>(html`
      <topomation-panel .hass=${hass}></topomation-panel>
    `);

    await waitUntil(() => (element as any)._loading === false, "panel did not finish loading");
    const tree = element.shadowRoot!.querySelector("ht-location-tree") as HTMLElement;
    expect(tree).to.exist;

    tree.dispatchEvent(
      new CustomEvent("location-lock-toggle", {
        detail: { locationId: "kitchen", lock: true },
        bubbles: true,
        composed: true,
      })
    );

    await waitUntil(
      () =>
        callWsCalls.some(
          (call) =>
            call.type === "call_service" &&
            call.domain === "topomation" &&
            call.service === "lock" &&
            call.service_data?.location_id === "kitchen"
        ),
      "lock service was not called"
    );
  });

  it("handles occupancy toggle from tree via topomation trigger service", async () => {
    const callWsCalls: any[] = [];
    const hass: HomeAssistant = {
      callWS: async <T>(req: Record<string, any>): Promise<T> => {
        callWsCalls.push(req);
        if (req.type === "topomation/locations/list") {
          return { locations } as T;
        }
        if (req.type === "config/entity_registry/list") {
          return [] as T;
        }
        if (req.type === "config/device_registry/list") {
          return [] as T;
        }
        if (req.type === "call_service") {
          return {} as T;
        }
        throw new Error("Unexpected WS call");
      },
      connection: {},
      states: {},
      areas: {},
      floors: {},
      config: {
        location_name: "Test Property",
      },
      localize: (key: string) => key,
    };

    const element = await fixture<HTMLDivElement>(html`
      <topomation-panel .hass=${hass}></topomation-panel>
    `);

    await waitUntil(() => (element as any)._loading === false, "panel did not finish loading");
    const tree = element.shadowRoot!.querySelector("ht-location-tree") as HTMLElement;
    expect(tree).to.exist;

    tree.dispatchEvent(
      new CustomEvent("location-occupancy-toggle", {
        detail: { locationId: "kitchen", occupied: true },
        bubbles: true,
        composed: true,
      })
    );

    await waitUntil(
      () =>
        callWsCalls.some(
          (call) =>
            call.type === "call_service" &&
            call.domain === "topomation" &&
            call.service === "trigger" &&
            call.service_data?.location_id === "kitchen"
        ),
      "trigger service was not called"
    );
  });

  it("shows warning toast and skips service call when occupancy toggle targets locked location", async () => {
    const callWsCalls: any[] = [];
    const notifications: any[] = [];
    const hass: HomeAssistant = {
      callWS: async <T>(req: Record<string, any>): Promise<T> => {
        callWsCalls.push(req);
        if (req.type === "topomation/locations/list") {
          return { locations } as T;
        }
        if (req.type === "config/entity_registry/list") {
          return [] as T;
        }
        if (req.type === "config/device_registry/list") {
          return [] as T;
        }
        if (req.type === "call_service") {
          return {} as T;
        }
        throw new Error("Unexpected WS call");
      },
      connection: {},
      states: {
        "binary_sensor.occupancy_kitchen": {
          entity_id: "binary_sensor.occupancy_kitchen",
          state: "on",
          attributes: {
            device_class: "occupancy",
            location_id: "kitchen",
            is_locked: true,
            locked_by: ["manual_ui"],
          },
        },
      },
      areas: {},
      floors: {},
      config: {
        location_name: "Test Property",
      },
      localize: (key: string) => key,
    };

    const element = await fixture<HTMLDivElement>(html`
      <topomation-panel .hass=${hass}></topomation-panel>
    `);

    await waitUntil(() => (element as any)._loading === false, "panel did not finish loading");
    element.addEventListener("hass-notification", (event: Event) => {
      notifications.push((event as CustomEvent).detail);
    });

    const tree = element.shadowRoot!.querySelector("ht-location-tree") as HTMLElement;
    expect(tree).to.exist;

    tree.dispatchEvent(
      new CustomEvent("location-occupancy-toggle", {
        detail: { locationId: "kitchen", occupied: false },
        bubbles: true,
        composed: true,
      })
    );

    await waitUntil(() => notifications.length > 0, "warning notification was not emitted");
    expect(notifications[0].message).to.contain("can't do it");
    expect(
      callWsCalls.some(
        (call) =>
          call.type === "call_service" &&
          call.domain === "topomation" &&
          (call.service === "trigger" || call.service === "clear" || call.service === "vacate_area")
      )
    ).to.equal(false);
  });

  it("handles occupancy toggle to vacant via topomation vacate_area service", async () => {
    const callWsCalls: any[] = [];
    const hass: HomeAssistant = {
      callWS: async <T>(req: Record<string, any>): Promise<T> => {
        callWsCalls.push(req);
        if (req.type === "topomation/locations/list") {
          return { locations } as T;
        }
        if (req.type === "config/entity_registry/list") {
          return [] as T;
        }
        if (req.type === "config/device_registry/list") {
          return [] as T;
        }
        if (req.type === "call_service") {
          return {} as T;
        }
        throw new Error("Unexpected WS call");
      },
      connection: {},
      states: {},
      areas: {},
      floors: {},
      config: {
        location_name: "Test Property",
      },
      localize: (key: string) => key,
    };

    const element = await fixture<HTMLDivElement>(html`
      <topomation-panel .hass=${hass}></topomation-panel>
    `);

    await waitUntil(() => (element as any)._loading === false, "panel did not finish loading");
    const tree = element.shadowRoot!.querySelector("ht-location-tree") as HTMLElement;
    expect(tree).to.exist;

    tree.dispatchEvent(
      new CustomEvent("location-occupancy-toggle", {
        detail: { locationId: "kitchen", occupied: false },
        bubbles: true,
        composed: true,
      })
    );

    await waitUntil(
      () =>
        callWsCalls.some(
          (call) =>
            call.type === "call_service" &&
            call.domain === "topomation" &&
            call.service === "vacate_area" &&
            call.service_data?.location_id === "kitchen"
        ),
      "vacate_area service was not called"
    );
  });

  it("resolves manager view from panel config and path", async () => {
    const element = document.createElement("topomation-panel") as any;

    element.panel = { config: { topomation_view: "actions" } };
    expect(element._managerView()).to.equal("actions");

    element.panel = undefined;
    element.route = { path: "/topomation-actions" };
    expect(element._managerView()).to.equal("actions");

    element.route = { path: "/topomation-occupancy" };
    expect(element._managerView()).to.equal("occupancy");

    element.route = { path: "/topomation" };
    expect(element._managerView()).to.equal("location");
  });

  it("clamps and persists panel split preference", () => {
    const element = document.createElement("topomation-panel") as any;

    element._setPanelSplit(1.2, true);
    expect(element._treePanelSplit).to.equal(0.75);
    expect(parseFloat(window.localStorage.getItem(TREE_PANEL_SPLIT_STORAGE_KEY) || "0")).to.equal(0.75);

    element._setPanelSplit(0.1, true);
    expect(element._treePanelSplit).to.equal(0.25);
    expect(parseFloat(window.localStorage.getItem(TREE_PANEL_SPLIT_STORAGE_KEY) || "0")).to.equal(0.25);
  });

});
