/// <reference types="mocha" />
import { fixture, html, expect, waitUntil } from '@open-wc/testing';
import './topomation-panel.ts';
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

  it("renders room explainability docked under the tree for the selected location", async () => {
    const explainabilityLocations = locations.map((loc) =>
      loc.id === "kitchen"
        ? {
            ...loc,
            modules: {
              ...loc.modules,
              occupancy: {
                enabled: true,
                default_timeout: 300,
                occupancy_sources: [],
              },
            },
          }
        : { ...loc }
    );

    const hass: HomeAssistant = {
      callWS: async <T>(req: Record<string, any>): Promise<T> => {
        if (req.type === "topomation/locations/list") {
          return { locations: explainabilityLocations } as T;
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
      states: {
        "binary_sensor.kitchen_occupancy": {
          entity_id: "binary_sensor.kitchen_occupancy",
          state: "on",
          attributes: {
            friendly_name: "Kitchen Occupancy",
            device_class: "occupancy",
            location_id: "kitchen",
            reason: "event:trigger",
            recent_changes: [
              {
                kind: "state",
                event: "occupied",
                changed_at: new Date(Date.now() - 1_000).toISOString(),
              },
              {
                kind: "signal",
                event: "trigger",
                source_id: "binary_sensor.kitchen_motion",
                changed_at: new Date(Date.now() - 2_000).toISOString(),
              },
            ],
            contributions: [
              {
                source_id: "binary_sensor.kitchen_motion",
                state: "active",
                updated_at: new Date(Date.now() - 2_000).toISOString(),
              },
            ],
          },
        },
        "binary_sensor.kitchen_motion": {
          entity_id: "binary_sensor.kitchen_motion",
          state: "on",
          attributes: {
            friendly_name: "Kitchen Motion",
            device_class: "motion",
          },
        },
      },
      areas: {
        kitchen: { area_id: "kitchen", name: "Kitchen" },
      } as any,
      floors: {},
      config: { location_name: "Test Property" },
      localize: (key: string) => key,
    };

    const element = await fixture<HTMLDivElement>(html`
      <topomation-panel .hass=${hass}></topomation-panel>
    `);

    await waitUntil(() => (element as any)._loading === false, "panel did not finish loading");
    (element as any)._selectedId = "kitchen";
    element.requestUpdate();
    await (element as any).updateComplete;

    const explainability = element.shadowRoot?.querySelector(
      "ht-room-explainability"
    ) as HTMLElement | null;
    expect(explainability).to.exist;

    await waitUntil(
      () => Boolean(explainability?.shadowRoot?.querySelector('[data-testid="room-explainability-panel"]')),
      "expected room explainability panel to render"
    );

    const panel = explainability?.shadowRoot?.querySelector(
      '[data-testid="room-explainability-panel"]'
    ) as HTMLElement | null;
    expect(panel).to.exist;
    expect(panel?.textContent || "").to.include("Room Explainability");
    expect(panel?.textContent || "").to.include("Current state");
    expect(panel?.textContent || "").to.include("Kitchen Motion");
    expect(panel?.textContent || "").to.include("Occupied by trigger");
    expect(panel?.textContent || "").not.to.include("Vacated by trigger");
    expect(panel?.textContent || "").to.include("Room became occupied");

    const dockBody = explainability?.shadowRoot?.querySelector(".dock-body") as HTMLElement | null;
    expect(dockBody).to.exist;
    expect(getComputedStyle(dockBody!).resize).to.equal("vertical");
  });

  it("skips managed shadow locations for default selection and dialog parent candidates", async () => {
    const locationsWithShadowFirst: Location[] = [
      {
        id: "main-floor-shadow",
        name: "Main Floor",
        parent_id: "main_floor",
        is_explicit_root: false,
        ha_area_id: "main_floor_shadow",
        entity_ids: [],
        modules: {
          _meta: {
            type: "area",
            role: "managed_shadow",
            shadow_for_location_id: "main_floor",
          },
        },
      },
      {
        id: "main_floor",
        name: "Main Floor",
        parent_id: null,
        is_explicit_root: false,
        ha_area_id: "main_floor",
        entity_ids: [],
        modules: { _meta: { type: "floor" } },
      },
      {
        id: "area_kitchen",
        name: "Kitchen",
        parent_id: "main_floor",
        is_explicit_root: false,
        ha_area_id: "kitchen",
        entity_ids: [],
        modules: { _meta: { type: "area" } },
      },
    ];

    const hass: HomeAssistant = {
      callWS: async <T>(req: Record<string, any>): Promise<T> => {
        if (req.type === "topomation/locations/list") {
          return { locations: locationsWithShadowFirst } as T;
        }
        if (req.type === "config/entity_registry/list") return [] as T;
        if (req.type === "config/device_registry/list") return [] as T;
        throw new Error("Unexpected WS call");
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
      localize: (key: string) => key,
    };

    const element = await fixture<HTMLDivElement>(html`
      <topomation-panel
        .hass=${hass}
        .panel=${{ config: { topomation_view: "location", entry_id: "entry_123" } }}
      ></topomation-panel>
    `);

    await waitUntil(() => (element as any)._loading === false, "panel did not finish loading");

    expect((element as any)._selectedId).to.equal("main_floor");
    const loadedLocations = ((element as any)._locations || []) as Location[];
    expect(loadedLocations.map((loc) => loc.id)).to.not.include("main-floor-shadow");

    (element as any)._locationDialogOpen = true;
    element.requestUpdate();
    await (element as any).updateComplete;

    const dialog = element.shadowRoot!.querySelector("ht-location-dialog") as any;
    expect(dialog).to.exist;
    const dialogLocationIds = (dialog.locations || []).map((loc: Location) => loc.id);
    expect(dialogLocationIds).to.include("main_floor");
    expect(dialogLocationIds).to.include("area_kitchen");
    expect(dialogLocationIds).to.not.include("main-floor-shadow");
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

  it("shows add and delete controls in media manager view", async () => {
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
        .panel=${{ config: { topomation_view: "media" } }}
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

  it("opens location dialog when Add Structure is clicked in media view", async () => {
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
        .panel=${{ config: { topomation_view: "media" } }}
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

  it("dispatches hass-toggle-menu from mobile sidebar hamburger button", async () => {
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
      config: { location_name: "Test Property" },
      localize: (key: string) => key,
    };

    const element = await fixture<HTMLDivElement>(html`
      <topomation-panel .hass=${hass} .narrow=${true}></topomation-panel>
    `);

    await waitUntil(() => (element as any)._loading === false, "panel did not finish loading");

    let receivedDetail: any;
    element.addEventListener("hass-toggle-menu", (ev: Event) => {
      receivedDetail = (ev as CustomEvent).detail;
    });

    const sidebarButton = element.shadowRoot!.querySelector(
      '[data-testid="mobile-sidebar-button"]'
    ) as HTMLButtonElement | null;
    expect(sidebarButton).to.exist;
    expect(sidebarButton?.getAttribute("aria-label")).to.equal("Open Home Assistant sidebar");

    sidebarButton!.click();

    expect(receivedDetail).to.deep.equal({ open: true });
  });

  it("renders media rules editor in media view", async () => {
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
      config: {
        location_name: "Test Property",
      },
      localize: (key: string) => key,
    };

    const element = await fixture<HTMLDivElement>(html`
      <topomation-panel
        .hass=${hass}
        .panel=${{ config: { topomation_view: "media" } }}
      ></topomation-panel>
    `);

    await waitUntil(() => (element as any)._loading === false, "panel did not finish loading");
    (element as any)._selectedId = "kitchen";
    await (element as any).updateComplete;

    const inspector = element.shadowRoot!.querySelector("ht-location-inspector") as any;
    expect(inspector).to.exist;

    await waitUntil(
      () => !!inspector.shadowRoot?.querySelector('[data-testid="actions-rules-section"]'),
      "rules section not rendered"
    );

    const addRuleButton = inspector.shadowRoot?.querySelector(
      '[data-testid="action-rule-add"]'
    ) as HTMLButtonElement | null;
    expect(addRuleButton).to.exist;

    const text = inspector.shadowRoot?.textContent || "";
    expect(text).to.contain("Media Rules");
    expect(text).to.contain("No media rules configured yet.");
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

  it("updates inspector header occupancy from event-driven location occupancy state", async () => {
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
        return {} as T;
      },
      connection: {},
      states: {
        "binary_sensor.occupancy_kitchen": {
          entity_id: "binary_sensor.occupancy_kitchen",
          state: "off",
          attributes: {
            device_class: "occupancy",
            location_id: "kitchen",
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
    (element as any)._rightPanelMode = "inspector";
    (element as any)._selectedId = "kitchen";
    element.requestUpdate();
    await element.updateComplete;

    const inspector = element.shadowRoot!.querySelector("ht-location-inspector") as any;
    expect(inspector).to.exist;
    await inspector.updateComplete;

    const initialStatus = (
      inspector.shadowRoot?.querySelector('[data-testid="header-occupancy-status"]')?.textContent ||
      ""
    ).trim();
    expect(initialStatus).to.equal("Vacant");

    (element as any)._setOccupancyState("kitchen", true);
    await element.updateComplete;
    await inspector.updateComplete;

    const updatedStatus = (
      inspector.shadowRoot?.querySelector('[data-testid="header-occupancy-status"]')?.textContent ||
      ""
    ).trim();
    expect(updatedStatus).to.equal("Occupied");
  });

  it("exposes vacancy reason as status detail from topomation_occupancy_changed events", async () => {
    let occupancyChangedHandler: ((event: any) => void) | undefined;

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
        return {} as T;
      },
      connection: {
        subscribeEvents: async (handler: (event: any) => void, eventType: string) => {
          if (eventType === "topomation_occupancy_changed") {
            occupancyChangedHandler = handler;
          }
          return () => {};
        },
      },
      states: {
        "binary_sensor.occupancy_kitchen": {
          entity_id: "binary_sensor.occupancy_kitchen",
          state: "on",
          attributes: {
            device_class: "occupancy",
            location_id: "kitchen",
            reason: "event:trigger",
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
    await waitUntil(
      () => typeof occupancyChangedHandler === "function",
      "panel did not subscribe to topomation_occupancy_changed"
    );

    (element as any)._rightPanelMode = "inspector";
    (element as any)._selectedId = "kitchen";
    element.requestUpdate();
    await element.updateComplete;

    occupancyChangedHandler!({
      data: {
        location_id: "kitchen",
        occupied: false,
        previous_occupied: true,
        reason: "timeout",
      },
    });

    await waitUntil(() => {
      const inspector = element.shadowRoot!.querySelector("ht-location-inspector") as any;
      const statusChip = inspector?.shadowRoot?.querySelector(
        '[data-testid="header-occupancy-status"]'
      ) as HTMLElement | null;
      return (statusChip?.getAttribute("title") || "").trim() === "Vacated by timeout";
    }, "vacancy reason detail did not update");

    const inspector = element.shadowRoot!.querySelector("ht-location-inspector") as any;
    const occupancyStatusChip = inspector.shadowRoot?.querySelector(
      '[data-testid="header-occupancy-status"]'
    ) as HTMLElement | null;
    const occupancyStatus = (occupancyStatusChip?.textContent || "").trim();
    const vacancyReasonDetail = (occupancyStatusChip?.getAttribute("title") || "").trim();

    expect(occupancyStatus).to.equal("Vacant");
    expect(vacancyReasonDetail).to.equal("Vacated by timeout");
  });

  it("renders grouped device assignment list with unassigned and location buckets", async () => {
    const locationsWithEntities: Location[] = locations.map((loc) =>
      loc.id === "kitchen"
        ? { ...loc, entity_ids: ["light.kitchen_main"] }
        : loc.id === "main_floor"
          ? { ...loc, entity_ids: ["switch.floor_fan"] }
          : { ...loc }
    );

    const hass: HomeAssistant = {
      callWS: async <T>(req: Record<string, any>): Promise<T> => {
        if (req.type === "topomation/locations/list") {
          return { locations: locationsWithEntities } as T;
        }
        if (req.type === "config/entity_registry/list") {
          return [
            { entity_id: "light.kitchen_main", area_id: "kitchen", device_id: null },
            { entity_id: "switch.floor_fan", area_id: null, device_id: null },
            { entity_id: "light.unassigned", area_id: null, device_id: null },
          ] as T;
        }
        if (req.type === "config/device_registry/list") {
          return [] as T;
        }
        throw new Error("Unexpected WS call");
      },
      connection: {},
      states: {
        "light.kitchen_main": {
          entity_id: "light.kitchen_main",
          state: "off",
          attributes: { friendly_name: "Kitchen Main", area_id: "kitchen" },
        },
        "switch.floor_fan": {
          entity_id: "switch.floor_fan",
          state: "off",
          attributes: { friendly_name: "Floor Fan" },
        },
        "light.unassigned": {
          entity_id: "light.unassigned",
          state: "off",
          attributes: { friendly_name: "Spare Lamp" },
        },
      },
      areas: {
        kitchen: { area_id: "kitchen", name: "Kitchen" },
      } as any,
      floors: {},
      config: { location_name: "Test Property" },
      localize: (key: string) => key,
    };

    const element = await fixture<HTMLDivElement>(html`
      <topomation-panel .hass=${hass}></topomation-panel>
    `);

    await waitUntil(() => (element as any)._loading === false, "panel did not finish loading");
    const assignModeButton = element.shadowRoot!.querySelector(
      '[data-testid="right-mode-assign"]'
    ) as HTMLButtonElement | null;
    expect(assignModeButton).to.exist;
    assignModeButton!.click();
    await (element as any).updateComplete;

    const unassignedGroup = element.shadowRoot!.querySelector(
      '[data-testid="device-group-unassigned"]'
    );
    const kitchenGroup = element.shadowRoot!.querySelector('[data-testid="device-group-kitchen"]');
    const floorGroup = element.shadowRoot!.querySelector('[data-testid="device-group-main_floor"]');

    expect(unassignedGroup?.textContent || "").to.contain("Spare Lamp");
    expect(kitchenGroup?.textContent || "").to.contain("Kitchen");
    expect(floorGroup?.textContent || "").to.contain("Main Floor");

    (kitchenGroup?.querySelector(".device-group-header") as HTMLButtonElement | null)?.click();
    (floorGroup?.querySelector(".device-group-header") as HTMLButtonElement | null)?.click();
    await (element as any).updateComplete;

    expect(kitchenGroup?.textContent || "").to.contain("Kitchen Main");
    expect(floorGroup?.textContent || "").to.contain("Floor Fan");
  });

  it("assigns a device when dropped on tree and calls assign websocket command", async () => {
    const callWsCalls: Array<Record<string, any>> = [];
    let locationsState: Location[] = locations.map((loc) =>
      loc.id === "kitchen" ? { ...loc, entity_ids: [] } : { ...loc }
    );

    const hass: HomeAssistant = {
      callWS: async <T>(req: Record<string, any>): Promise<T> => {
        callWsCalls.push(req);
        if (req.type === "topomation/locations/list") {
          return { locations: locationsState } as T;
        }
        if (req.type === "config/entity_registry/list") {
          return [{ entity_id: "light.unassigned", area_id: null, device_id: null }] as T;
        }
        if (req.type === "config/device_registry/list") {
          return [] as T;
        }
        if (req.type === "topomation/locations/assign_entity") {
          locationsState = locationsState.map((loc) => ({
            ...loc,
            entity_ids:
              loc.id === req.target_location_id
                ? [...(loc.entity_ids || []).filter((id) => id !== req.entity_id), req.entity_id]
                : (loc.entity_ids || []).filter((id) => id !== req.entity_id),
          }));
          return {
            success: true,
            entity_id: req.entity_id,
            target_location_id: req.target_location_id,
            ha_area_id: null,
          } as T;
        }
        throw new Error("Unexpected WS call");
      },
      connection: {},
      states: {
        "light.unassigned": {
          entity_id: "light.unassigned",
          state: "off",
          attributes: { friendly_name: "Spare Lamp" },
        },
      },
      areas: {},
      floors: {},
      config: { location_name: "Test Property" },
      localize: (key: string) => key,
    };

    const element = await fixture<HTMLDivElement>(html`
      <topomation-panel .hass=${hass}></topomation-panel>
    `);

    await waitUntil(() => (element as any)._loading === false, "panel did not finish loading");
    (element as any)._selectedId = "kitchen";
    element.requestUpdate();
    await (element as any).updateComplete;

    const assignModeButton = element.shadowRoot!.querySelector(
      '[data-testid="right-mode-assign"]'
    ) as HTMLButtonElement | null;
    expect(assignModeButton).to.exist;
    assignModeButton!.click();
    await (element as any).updateComplete;

    const tree = element.shadowRoot!.querySelector("ht-location-tree") as HTMLElement;
    expect(tree).to.exist;

    tree.dispatchEvent(
      new CustomEvent("entity-dropped", {
        detail: { entityId: "light.unassigned", targetLocationId: "kitchen" },
        bubbles: true,
        composed: true,
      })
    );

    await waitUntil(
      () =>
        callWsCalls.some(
          (call) =>
            call.type === "topomation/locations/assign_entity" &&
            call.entity_id === "light.unassigned" &&
            call.target_location_id === "kitchen"
        ),
      "assign websocket command was not called"
    );

    const kitchen = (element as any)._locations.find((loc: Location) => loc.id === "kitchen");
    expect(kitchen?.entity_ids || []).to.include("light.unassigned");

    await waitUntil(() => {
      const firstGroup = element.shadowRoot!.querySelector(".device-group");
      return firstGroup?.getAttribute("data-testid") === "device-group-kitchen";
    }, "kitchen group was not surfaced after assignment");

    const kitchenGroup = element.shadowRoot!.querySelector('[data-testid="device-group-kitchen"]');
    expect(kitchenGroup?.textContent || "").to.contain("Spare Lamp");
  });

  it("refreshes locations and assignments when HA registry updates fire", async () => {
    const callWsCalls: Array<Record<string, any>> = [];
    let useUpdatedData = false;
    const eventCallbacks = new Map<string, (event: any) => void>();

    const initialLocations: Location[] = locations.map((loc) =>
      loc.id === "kitchen" ? { ...loc, entity_ids: ["switch.master_toilet"] } : { ...loc }
    );
    const updatedLocations: Location[] = locations.map((loc) =>
      loc.id === "kitchen" ? { ...loc, entity_ids: ["light.master_toilet"] } : { ...loc }
    );

    const hass: HomeAssistant = {
      callWS: async <T>(req: Record<string, any>): Promise<T> => {
        callWsCalls.push(req);
        if (req.type === "topomation/locations/list") {
          return { locations: useUpdatedData ? updatedLocations : initialLocations } as T;
        }
        if (req.type === "config/entity_registry/list") {
          return [
            {
              entity_id: useUpdatedData ? "light.master_toilet" : "switch.master_toilet",
              area_id: "kitchen",
              device_id: null,
            },
          ] as T;
        }
        if (req.type === "config/device_registry/list") {
          return [] as T;
        }
        throw new Error("Unexpected WS call");
      },
      connection: {
        subscribeEvents: async (cb: (event: any) => void, eventType?: string) => {
          if (eventType) eventCallbacks.set(eventType, cb);
          return () => {
            if (eventType) eventCallbacks.delete(eventType);
          };
        },
      } as any,
      states: {
        "switch.master_toilet": {
          entity_id: "switch.master_toilet",
          state: "off",
          attributes: { friendly_name: "Master Toilet Switch" },
        },
        "light.master_toilet": {
          entity_id: "light.master_toilet",
          state: "off",
          attributes: { friendly_name: "Master Toilet Light" },
        },
      },
      areas: {
        kitchen: { area_id: "kitchen", name: "Kitchen" },
      } as any,
      floors: {},
      config: { location_name: "Test Property" },
      localize: (key: string) => key,
    };

    const element = await fixture<HTMLDivElement>(html`
      <topomation-panel .hass=${hass}></topomation-panel>
    `);

    await waitUntil(() => (element as any)._loading === false, "panel did not finish loading");
    const assignModeButton = element.shadowRoot!.querySelector(
      '[data-testid="right-mode-assign"]'
    ) as HTMLButtonElement | null;
    expect(assignModeButton).to.exist;
    assignModeButton!.click();
    await (element as any).updateComplete;

    expect(eventCallbacks.has("entity_registry_updated")).to.equal(true);
    expect(eventCallbacks.has("device_registry_updated")).to.equal(true);
    expect(eventCallbacks.has("area_registry_updated")).to.equal(true);

    const initialLocationCalls = callWsCalls.filter((call) => call.type === "topomation/locations/list").length;
    const initialEntityRegistryCalls = callWsCalls.filter(
      (call) => call.type === "config/entity_registry/list"
    ).length;

    useUpdatedData = true;
    eventCallbacks.get("entity_registry_updated")?.({
      data: { action: "update", entity_id: "light.master_toilet" },
    });

    await waitUntil(
      () =>
        callWsCalls.filter((call) => call.type === "topomation/locations/list").length >
        initialLocationCalls,
      "locations/list was not reloaded after registry update"
    );
    await waitUntil(
      () =>
        callWsCalls.filter((call) => call.type === "config/entity_registry/list").length >
        initialEntityRegistryCalls,
      "entity_registry/list was not refreshed after registry update"
    );
  });

  it("reloads locations when the browser window regains focus", async () => {
    const callWsCalls: Array<Record<string, any>> = [];
    let useUpdatedData = false;

    const initialLocations: Location[] = locations.map((loc) =>
      loc.id === "kitchen" ? { ...loc, name: "Kitchen" } : { ...loc }
    );
    const updatedLocations: Location[] = locations.map((loc) =>
      loc.id === "kitchen" ? { ...loc, name: "Kitchen Focus Refresh" } : { ...loc }
    );

    const hass: HomeAssistant = {
      callWS: async <T>(req: Record<string, any>): Promise<T> => {
        callWsCalls.push(req);
        if (req.type === "topomation/locations/list") {
          return { locations: useUpdatedData ? updatedLocations : initialLocations } as T;
        }
        if (req.type === "config/entity_registry/list") {
          return [] as T;
        }
        if (req.type === "config/device_registry/list") {
          return [] as T;
        }
        throw new Error("Unexpected WS call");
      },
      connection: {
        subscribeEvents: async () => () => undefined,
      } as any,
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
    const initialLocationCalls = callWsCalls.filter((call) => call.type === "topomation/locations/list").length;

    useUpdatedData = true;
    window.dispatchEvent(new Event("focus"));

    await waitUntil(
      () =>
        callWsCalls.filter((call) => call.type === "topomation/locations/list").length >
        initialLocationCalls,
      "locations/list was not reloaded after window focus"
    );
    await waitUntil(
      () =>
        (element as any)._locations.find((loc: Location) => loc.id === "kitchen")?.name ===
        "Kitchen Focus Refresh",
      "focused reload did not update panel locations"
    );
  });

  it("resolves manager view from panel config and path", async () => {
    const element = document.createElement("topomation-panel") as any;

    element.panel = { config: { topomation_view: "media" } };
    expect(element._managerView()).to.equal("media");

    element.panel = undefined;
    element.route = { path: "/topomation-media" };
    expect(element._managerView()).to.equal("media");

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
