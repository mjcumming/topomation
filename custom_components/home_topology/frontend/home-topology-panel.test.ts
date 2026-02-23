/// <reference types="mocha" />
import { fixture, html, expect, waitUntil } from '@open-wc/testing';
import './home-topology-panel';
import type { HomeAssistant, Location } from './types';

const locations: Location[] = [
  {
    id: 'house',
    name: 'House',
    parent_id: null,
    is_explicit_root: true,
    entity_ids: [],
    modules: { _meta: { type: 'building' } }
  },
  {
    id: 'basement',
    name: 'Basement',
    parent_id: 'house',
    is_explicit_root: false,
    ha_area_id: 'basement',
    entity_ids: [],
    modules: { _meta: { type: 'floor' } }
  },
  {
    id: 'main_floor',
    name: 'Main Floor',
    parent_id: 'house',
    is_explicit_root: false,
    ha_area_id: 'main_floor',
    entity_ids: [],
    modules: { _meta: { type: 'floor' } }
  },
  {
    id: 'second_floor',
    name: 'Second Floor',
    parent_id: 'house',
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
    modules: { _meta: { type: 'room' } }
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    parent_id: 'main_floor',
    is_explicit_root: false,
    ha_area_id: 'kitchen',
    entity_ids: [],
    modules: { _meta: { type: 'room' } }
  },
  {
    id: 'primary_bedroom',
    name: 'Primary Bedroom',
    parent_id: 'second_floor',
    is_explicit_root: false,
    ha_area_id: 'primary_bedroom',
    entity_ids: [],
    modules: { _meta: { type: 'room' } }
  },
  {
    id: 'guest_bedroom',
    name: 'Guest Bedroom',
    parent_id: 'second_floor',
    is_explicit_root: false,
    ha_area_id: 'guest_bedroom',
    entity_ids: [],
    modules: { _meta: { type: 'room' } }
  }
];

describe('HomeTopologyPanel integration (fake hass)', () => {
  it('loads locations from callWS and renders floors/rooms', async () => {
    const callWsCalls: any[] = [];
    const hass: HomeAssistant = {
      callWS: async <T>(req: Record<string, any>): Promise<T> => {
        callWsCalls.push(req);
        if (req.type === 'home_topology/locations/list') {
          return { locations } as T;
        }
        throw new Error('Unexpected WS call');
      },
      connection: {},
      states: {},
      areas: {},
      localize: (key: string) => key
    };

    const element = await fixture<HTMLDivElement>(html`
      <home-topology-panel .hass=${hass}></home-topology-panel>
    `);

    // Wait for initial load to finish
    await waitUntil(() => (element as any)._loading === false, 'panel did not finish loading');

    const tree = element.shadowRoot!.querySelector('ht-location-tree') as any;
    await tree.updateComplete;

    await waitUntil(() => Array.isArray(tree.locations) && tree.locations.length > 1, 'tree did not receive locations');

    // Ensure locations are set (defensive)
    tree.locations = locations;

    // Expand all nodes to reveal floors/rooms
    (tree as any)._expandedIds = new Set(locations.map(loc => loc.id));
    tree.requestUpdate();
    await tree.updateComplete;

    const locationNames = Array.from(tree.shadowRoot!.querySelectorAll('.location-name'))
      .map((el) => (el as HTMLElement).textContent?.trim() || '')
      .filter(Boolean);

    expect(locationNames).to.include('Basement');
    expect(locationNames).to.include('Main Floor');
    expect(locationNames).to.include('Second Floor');
    expect(locationNames).to.include('Living Room');
    expect(locationNames).to.include('Kitchen');
    expect(callWsCalls.some(c => c.type === 'home_topology/locations/list')).to.be.true;
  });

});
