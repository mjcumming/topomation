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
 * Test data matching ui-design.md hierarchy example:
 * House (root)
 *   └── First Floor
 *         ├── Kitchen
 *         ├── Living Room
 *         └── Dining Room
 */
const hierarchicalLocations: Location[] = [
  {
    id: 'house',
    name: 'House',
    parent_id: null,
    is_explicit_root: true,
    ha_area_id: null,
    entity_ids: [],
    modules: { _meta: { type: 'area' } }
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
    id: 'kitchen',
    name: 'Kitchen',
    parent_id: 'first-floor',
    is_explicit_root: false,
    ha_area_id: null,
    entity_ids: [],
    modules: { _meta: { type: 'area' } }
  },
  {
    id: 'living-room',
    name: 'Living Room',
    parent_id: 'first-floor',
    is_explicit_root: false,
    ha_area_id: null,
    entity_ids: [],
    modules: { _meta: { type: 'area' } }
  },
  {
    id: 'dining-room',
    name: 'Dining Room',
    parent_id: 'first-floor',
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

  describe('Tree Hierarchy Rendering (ui-design.md Section 3.1.2)', () => {
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
      expect(items.length).to.equal(5); // All 5 locations
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
      const houseItem = element.shadowRoot!.querySelector('[data-id="house"]') as HTMLElement;
      const firstFloorItem = element.shadowRoot!.querySelector('[data-id="first-floor"]') as HTMLElement;
      const kitchenItem = element.shadowRoot!.querySelector('[data-id="kitchen"]') as HTMLElement;

      expect(houseItem).to.exist;
      expect(firstFloorItem).to.exist;
      expect(kitchenItem).to.exist;

      // Check indentation via margin-left (24px per level)
      expect(houseItem.style.marginLeft).to.equal('0px'); // Root level
      expect(firstFloorItem.style.marginLeft).to.equal('24px'); // Child of house
      expect(kitchenItem.style.marginLeft).to.equal('48px'); // Child of first-floor
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
      // Kitchen is depth 2 (house→first-floor→kitchen), so 2*24 = 48px
      expect(kitchenItem.style.marginLeft).to.equal('48px');
    });
  });

  describe('Icon Resolution (ui-design.md Section 3.1.3)', () => {
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

  describe('Tree Interactions (ui-design.md Section 3.1.4)', () => {
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

      expect(selectedId).to.equal('house');
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
      (element as any)._expandedIds = new Set(['house', 'first-floor']);
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

      // Initially should auto-expand parents
      let items = element.shadowRoot!.querySelectorAll('.tree-item');
      const initialCount = items.length;

      // Click expand/collapse button on house
      const expandBtn = element.shadowRoot!.querySelector('[data-id="house"] .expand-btn') as HTMLElement;
      expect(expandBtn).to.exist;
      expandBtn.click();
      await element.updateComplete;

      // After collapse, should show fewer items
      items = element.shadowRoot!.querySelectorAll('.tree-item');
      expect(items.length).to.be.lessThan(initialCount);
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

      // Kitchen has no children, so its expand-btn should be hidden
      const kitchenItem = element.shadowRoot!.querySelector('[data-id="kitchen"]');
      const kitchenExpandBtn = kitchenItem?.querySelector('.expand-btn');
      expect(kitchenExpandBtn?.classList.contains('hidden')).to.be.true;

      // House has children, so its expand-btn should NOT be hidden
      const houseItem = element.shadowRoot!.querySelector('[data-id="house"]');
      const houseExpandBtn = houseItem?.querySelector('.expand-btn');
      expect(houseExpandBtn?.classList.contains('hidden')).to.be.false;
    });
  });

  describe('Node Structure (ui-design.md Section 3.1.2)', () => {
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
      expect(item?.querySelector('.delete-btn')).to.exist;
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

      // Should have opacity: 0.2 by default (visible on hover via CSS)
      const style = getComputedStyle(dragHandle);
      expect(style.opacity).to.equal('0.2');
    });
  });
});
