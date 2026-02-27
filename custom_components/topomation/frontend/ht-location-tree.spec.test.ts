/// <reference types="mocha" />
import { fixture, html, expect, waitUntil } from '@open-wc/testing';
import { HtLocationTree } from './ht-location-tree';
import { getLocationIcon } from './icon-utils';
import type { HomeAssistant, Location } from './types';

// Ensure element is registered
if (!customElements.get('ht-location-tree')) {
  customElements.define('ht-location-tree', HtLocationTree);
}

const mockHass: Partial<HomeAssistant> = {
  states: {},
  areas: {},
  floors: {},
  callWS: async () => ({}),
  callService: async () => ({}),
  connection: {
    subscribeEvents: async () => () => {}
  } as any,
  localize: (key: string) => key
};

/**
 * Test data for building/grounds + floor/area/subarea hierarchy:
 * Main Building
 *   └── First Floor
 *         ├── Kitchen
 *         └── Pantry (subarea)
 * Grounds
 *   └── Patio
 */
const hierarchicalLocations: Location[] = [
  {
    id: 'main-building',
    name: 'Main Building',
    parent_id: null,
    is_explicit_root: false,
    ha_area_id: null,
    entity_ids: [],
    modules: { _meta: { type: 'building' } }
  },
  {
    id: 'first-floor',
    name: 'First Floor',
    parent_id: 'main-building',
    is_explicit_root: false,
    ha_area_id: null,
    entity_ids: [],
    modules: { _meta: { type: 'floor' } }
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    parent_id: 'first-floor',
    is_explicit_root: false,
    ha_area_id: null,
    entity_ids: [],
    modules: { _meta: { type: 'area' } }
  },
  {
    id: 'pantry',
    name: 'Pantry',
    parent_id: 'kitchen',
    is_explicit_root: false,
    ha_area_id: null,
    entity_ids: [],
    modules: { _meta: { type: 'subarea' } }
  },
  {
    id: 'grounds',
    name: 'Grounds',
    parent_id: null,
    is_explicit_root: false,
    ha_area_id: null,
    entity_ids: [],
    modules: { _meta: { type: 'grounds' } }
  },
  {
    id: 'patio',
    name: 'Patio',
    parent_id: 'grounds',
    is_explicit_root: false,
    ha_area_id: null,
    entity_ids: [],
    modules: { _meta: { type: 'area' } }
  }
];

describe('HtLocationTree - Design Spec Compliance', () => {
  describe('Panel Initialization', () => {
    it('renders without errors', async () => {
      const element = await fixture<HtLocationTree>(html`
        <ht-location-tree
          .hass=${mockHass as HomeAssistant}
          .locations=${[]}
        ></ht-location-tree>
      `);

      await element.updateComplete;
      expect(element).to.exist;
    });

    it('shows empty state when no locations', async () => {
      const element = await fixture<HtLocationTree>(html`
        <ht-location-tree
          .hass=${mockHass as HomeAssistant}
          .locations=${[]}
        ></ht-location-tree>
      `);

      await element.updateComplete;
      const emptyState = element.shadowRoot!.querySelector('.empty-state');
      expect(emptyState).to.exist;
    });
  });

  describe('Tree Hierarchy Rendering (docs/history/2026.02.24-ui-design.md Section 3.1.2)', () => {
    it('renders all locations in hierarchy when expanded', async () => {
      const element = await fixture<HtLocationTree>(html`
        <ht-location-tree
          .hass=${mockHass as HomeAssistant}
          .locations=${hierarchicalLocations}
        ></ht-location-tree>
      `);

      await element.updateComplete;

      // Expand all nodes
      (element as any)._expandedIds = new Set(hierarchicalLocations.map(l => l.id));
      element.requestUpdate();
      await element.updateComplete;

      // FLAT RENDERING: All items are .tree-item (not nested .tree-node)
      const items = element.shadowRoot!.querySelectorAll('.tree-item');
      expect(items.length).to.equal(6); // All 6 locations
    });

    it('renders hierarchy with correct parent-child relationships via indentation', async () => {
      const element = await fixture<HtLocationTree>(html`
        <ht-location-tree
          .hass=${mockHass as HomeAssistant}
          .locations=${hierarchicalLocations}
        ></ht-location-tree>
      `);

      await element.updateComplete;

      // Expand all
      (element as any)._expandedIds = new Set(hierarchicalLocations.map(l => l.id));
      element.requestUpdate();
      await element.updateComplete;

      // Find items by data-id
      const buildingItem = element.shadowRoot!.querySelector('[data-id="main-building"]') as HTMLElement;
      const firstFloorItem = element.shadowRoot!.querySelector('[data-id="first-floor"]') as HTMLElement;
      const kitchenItem = element.shadowRoot!.querySelector('[data-id="kitchen"]') as HTMLElement;
      const pantryItem = element.shadowRoot!.querySelector('[data-id="pantry"]') as HTMLElement;

      expect(buildingItem).to.exist;
      expect(firstFloorItem).to.exist;
      expect(kitchenItem).to.exist;
      expect(pantryItem).to.exist;

      // Check indentation via margin-left (24px per level)
      expect(buildingItem.style.marginLeft).to.equal('0px'); // Root level
      expect(firstFloorItem.style.marginLeft).to.equal('24px'); // Child of building
      expect(kitchenItem.style.marginLeft).to.equal('48px'); // Child of first-floor
      expect(pantryItem.style.marginLeft).to.equal('72px'); // Child of kitchen
    });

    it('uses correct indentation (24px per level per spec Section 6.3)', async () => {
      const element = await fixture<HtLocationTree>(html`
        <ht-location-tree
          .hass=${mockHass as HomeAssistant}
          .locations=${hierarchicalLocations}
        ></ht-location-tree>
      `);

      await element.updateComplete;

      // Expand all
      (element as any)._expandedIds = new Set(hierarchicalLocations.map(l => l.id));
      element.requestUpdate();
      await element.updateComplete;

      // FLAT RENDERING: Indentation is via margin-left on .tree-item, not nested containers
      const kitchenItem = element.shadowRoot!.querySelector('[data-id="kitchen"]') as HTMLElement;
      expect(kitchenItem).to.exist;
      // Pantry is depth 3 (main-building→first-floor→kitchen→pantry), so 3*24 = 72px
      const pantryItem = element.shadowRoot!.querySelector('[data-id="pantry"]') as HTMLElement;
      expect(pantryItem).to.exist;
      expect(pantryItem.style.marginLeft).to.equal('72px');
    });
  });

  describe('Icon Resolution (docs/history/2026.02.24-ui-design.md Section 3.1.3)', () => {
    it('uses explicit icon override when provided', async () => {
      const location: Location = {
        id: 'test',
        name: 'Test Room',
        parent_id: null,
        is_explicit_root: false,
        ha_area_id: null,
        entity_ids: [],
        modules: { _meta: { type: 'area', icon: 'mdi:custom-icon' } }
      };

      expect(getLocationIcon(location)).to.equal('mdi:custom-icon');
    });

    it('infers category icon from name', async () => {
      const kitchen: Location = {
        id: 'kitchen',
        name: 'Kitchen',
        parent_id: null,
        is_explicit_root: false,
        ha_area_id: null,
        entity_ids: [],
        modules: { _meta: { type: 'area' } } // No explicit icon
      };

      // Should infer kitchen category icon (mdi:silverware-fork-knife)
      expect(getLocationIcon(kitchen)).to.equal('mdi:silverware-fork-knife');
    });

    it('falls back to type icon when no category match', async () => {
      const room: Location = {
        id: 'room',
        name: 'Random Room',
        parent_id: null,
        is_explicit_root: false,
        ha_area_id: null,
        entity_ids: [],
        modules: { _meta: { type: 'area' } }
      };

      // Should use type fallback (area = mdi:map-marker)
      expect(getLocationIcon(room)).to.equal('mdi:map-marker');
    });
  });

  describe('Tree Interactions (docs/history/2026.02.24-ui-design.md Section 3.1.4)', () => {
    it('selects location on click', async () => {
      const element = await fixture<HtLocationTree>(html`
        <ht-location-tree
          .hass=${mockHass as HomeAssistant}
          .locations=${hierarchicalLocations}
          .selectedId=${undefined}
        ></ht-location-tree>
      `);

      await element.updateComplete;

      let selectedId: string | undefined;
      element.addEventListener('location-selected', (e: Event) => {
        selectedId = (e as CustomEvent).detail.locationId;
      });

      // Click on the location name (not drag handle or buttons)
      const firstItem = element.shadowRoot!.querySelector('.tree-item') as HTMLElement;
      const nameEl = firstItem?.querySelector('.location-name') as HTMLElement;
      expect(nameEl).to.exist;
      nameEl.click();
      await element.updateComplete;

      expect(selectedId).to.equal('main-building');
    });

    it('highlights selected node', async () => {
      const element = await fixture<HtLocationTree>(html`
        <ht-location-tree
          .hass=${mockHass as HomeAssistant}
          .locations=${hierarchicalLocations}
          .selectedId=${'kitchen'}
        ></ht-location-tree>
      `);

      await element.updateComplete;

      // Expand to show kitchen
      (element as any)._expandedIds = new Set(['main-building', 'first-floor', 'kitchen']);
      element.requestUpdate();
      await element.updateComplete;

      const selectedItem = element.shadowRoot!.querySelector('.tree-item.selected') as HTMLElement;
      expect(selectedItem).to.exist;
      expect(selectedItem?.getAttribute('data-id')).to.equal('kitchen');
    });

    it('expands/collapses on chevron click', async () => {
      const element = await fixture<HtLocationTree>(html`
        <ht-location-tree
          .hass=${mockHass as HomeAssistant}
          .locations=${hierarchicalLocations}
        ></ht-location-tree>
      `);

      await element.updateComplete;

      // Tree starts collapsed by default.
      let items = element.shadowRoot!.querySelectorAll('.tree-item');
      const initialCount = items.length;

      // Click expand/collapse button on main building
      const expandBtn = element.shadowRoot!.querySelector('[data-id="main-building"] .expand-btn') as HTMLElement;
      expect(expandBtn).to.exist;
      expandBtn.click();
      await element.updateComplete;

      // After expand, should show more items.
      items = element.shadowRoot!.querySelectorAll('.tree-item');
      const expandedCount = items.length;
      expect(expandedCount).to.be.greaterThan(initialCount);

      // Collapse again should reduce back.
      expandBtn.click();
      await element.updateComplete;
      items = element.shadowRoot!.querySelectorAll('.tree-item');
      expect(items.length).to.be.lessThan(expandedCount);
    });

    it('shows chevron only for nodes with children', async () => {
      const element = await fixture<HtLocationTree>(html`
        <ht-location-tree
          .hass=${mockHass as HomeAssistant}
          .locations=${hierarchicalLocations}
        ></ht-location-tree>
      `);

      await element.updateComplete;

      // Expand all
      (element as any)._expandedIds = new Set(hierarchicalLocations.map(l => l.id));
      element.requestUpdate();
      await element.updateComplete;

      // Patio has no children, so its expand-btn should be hidden
      const patioItem = element.shadowRoot!.querySelector('[data-id="patio"]');
      const patioExpandBtn = patioItem?.querySelector('.expand-btn');
      expect(patioExpandBtn?.classList.contains('hidden')).to.be.true;

      // Kitchen has one child (Pantry), so its expand-btn should NOT be hidden
      const kitchenItem = element.shadowRoot!.querySelector('[data-id="kitchen"]');
      const kitchenExpandBtn = kitchenItem?.querySelector('.expand-btn');
      expect(kitchenExpandBtn?.classList.contains('hidden')).to.be.false;

      // Main building has children, so its expand-btn should NOT be hidden
      const buildingItem = element.shadowRoot!.querySelector('[data-id="main-building"]');
      const buildingExpandBtn = buildingItem?.querySelector('.expand-btn');
      expect(buildingExpandBtn?.classList.contains('hidden')).to.be.false;
    });
  });

  describe('Node Structure (docs/history/2026.02.24-ui-design.md Section 3.1.2)', () => {
    it('renders node with all required elements', async () => {
      const element = await fixture<HtLocationTree>(html`
        <ht-location-tree
          .hass=${mockHass as HomeAssistant}
          .locations=${hierarchicalLocations}
        ></ht-location-tree>
      `);

      await element.updateComplete;

      const item = element.shadowRoot!.querySelector('.tree-item');
      expect(item).to.exist;

      // Check for required elements (FLAT RENDERING class names)
      expect(item?.querySelector('.drag-handle')).to.exist;
      expect(item?.querySelector('.expand-btn')).to.exist;
      expect(item?.querySelector('.location-name')).to.exist;
      expect(item?.querySelector('.lock-btn')).to.exist;
    });

    it('shows drag handle with low opacity by default', async () => {
      const element = await fixture<HtLocationTree>(html`
        <ht-location-tree
          .hass=${mockHass as HomeAssistant}
          .locations=${hierarchicalLocations}
        ></ht-location-tree>
      `);

      await element.updateComplete;

      const dragHandle = element.shadowRoot!.querySelector('.drag-handle') as HTMLElement;
      expect(dragHandle).to.exist;

      // Should have low default opacity (visible on hover via CSS)
      const style = getComputedStyle(dragHandle);
      expect(style.opacity).to.equal('0.35');
    });
  });
});
