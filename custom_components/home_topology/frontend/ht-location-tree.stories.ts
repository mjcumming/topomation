import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components';
import './ht-location-tree';
import type { Location } from './types';

// Mock hass object
const mockHass = {
  states: {},
  areas: {},
  devices: {},
  entities: {},
  config: {
    latitude: 0,
    longitude: 0,
    elevation: 0,
    unit_system: { length: 'km' }
  },
  themes: {},
  selectedTheme: 'default',
  panels: {},
  services: {},
  user: { id: '123', name: 'Test User', is_admin: true, is_owner: true },
  callService: async () => ({}),
  callWS: async () => ({}),
  connection: {
    subscribeEvents: async () => () => {}
  } as any,
  language: 'en',
  localize: (key: string) => key
};

const mockLocations: Location[] = [
  {
    id: 'house',
    name: 'House',
    parent_id: null,
    is_explicit_root: true,
    ha_area_id: null,
    entity_ids: [],
    modules: { _meta: { type: 'building' } }
  },
  {
    id: 'ground-floor',
    name: 'Ground Floor',
    parent_id: 'house',
    is_explicit_root: false,
    ha_area_id: null,
    entity_ids: [],
    modules: { _meta: { type: 'floor' } }
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    parent_id: 'ground-floor',
    is_explicit_root: false,
    ha_area_id: null,
    entity_ids: ['light.kitchen'],
    modules: { _meta: { type: 'room' } }
  },
  {
    id: 'living-room',
    name: 'Living Room',
    parent_id: 'ground-floor',
    is_explicit_root: false,
    ha_area_id: null,
    entity_ids: ['light.living_room', 'media_player.tv'],
    modules: { _meta: { type: 'room' } }
  },
  {
    id: 'first-floor',
    name: 'First Floor',
    parent_id: 'house',
    is_explicit_root: false,
    ha_area_id: null,
    entity_ids: [],
    modules: { _meta: { type: 'floor' } }
  },
  {
    id: 'bedroom',
    name: 'Master Bedroom',
    parent_id: 'first-floor',
    is_explicit_root: false,
    ha_area_id: null,
    entity_ids: ['light.bedroom'],
    modules: { _meta: { type: 'room' } }
  }
];

const meta: Meta = {
  title: 'Components/Location Tree',
  component: 'ht-location-tree',
  tags: ['autodocs'],
  argTypes: {
    selectedId: { control: 'text' }
  }
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => html`
    <div style="width: 300px; height: 600px; border: 1px solid var(--divider-color);">
      <ht-location-tree
        .hass=${mockHass}
        .locations=${mockLocations}
      ></ht-location-tree>
    </div>
  `
};

export const WithSelection: Story = {
  render: () => html`
    <div style="width: 300px; height: 600px; border: 1px solid var(--divider-color);">
      <ht-location-tree
        .hass=${mockHass}
        .locations=${mockLocations}
        .selectedId=${'kitchen'}
      ></ht-location-tree>
    </div>
  `
};

export const EmptyTree: Story = {
  render: () => html`
    <div style="width: 300px; height: 600px; border: 1px solid var(--divider-color);">
      <ht-location-tree
        .hass=${mockHass}
        .locations=${[]}
      ></ht-location-tree>
    </div>
  `
};

export const SingleLocation: Story = {
  render: () => html`
    <div style="width: 300px; height: 600px; border: 1px solid var(--divider-color);">
      <ht-location-tree
        .hass=${mockHass}
        .locations=${[mockLocations[0]]}
      ></ht-location-tree>
    </div>
  `
};

