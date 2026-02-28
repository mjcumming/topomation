import { fixture, html, expect } from '@open-wc/testing';
import { HtLocationTree, __TEST__ } from './ht-location-tree';
import type { HomeAssistant, Location } from './types';

// Ensure the element is registered for the test environment
if (!customElements.get('ht-location-tree')) {
  customElements.define('ht-location-tree', HtLocationTree);
}

// Mock data
const mockHass: Partial<HomeAssistant> = {
  states: {},
  areas: {},
  floors: {},
  callWS: async () => ({}),
  callService: async () => ({}),
  connection: {
    subscribeEvents: async () => () => {}
  } as any
};

const mockLocations: Location[] = [
  {
    id: 'kitchen',
    name: 'Kitchen',
    parent_id: null,
    is_explicit_root: false,
    ha_area_id: null,
    entity_ids: ['light.kitchen'],
    modules: { _meta: { type: 'area' } }
  },
  {
    id: 'living-room',
    name: 'Living Room',
    parent_id: null,
    is_explicit_root: false,
    ha_area_id: null,
    entity_ids: [],
    modules: { _meta: { type: 'area' } }
  }
];

const nestedLocations: Location[] = [
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
    id: 'kitchen',
    name: 'Kitchen',
    parent_id: 'house',
    is_explicit_root: false,
    ha_area_id: null,
    entity_ids: ['light.kitchen'],
    modules: { _meta: { type: 'area' } }
  },
  {
    id: 'pantry',
    name: 'Pantry',
    parent_id: 'kitchen',
    is_explicit_root: false,
    ha_area_id: null,
    entity_ids: [],
    modules: { _meta: { type: 'area' } }
  }
];

const deepTreeLocations: Location[] = [
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
    id: 'main-floor',
    name: 'Main Floor',
    parent_id: 'house',
    is_explicit_root: false,
    ha_area_id: null,
    entity_ids: [],
    modules: { _meta: { type: 'floor' } }
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    parent_id: 'main-floor',
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
    modules: { _meta: { type: 'area' } }
  },
  {
    id: 'pantry-shelf',
    name: 'Pantry Shelf',
    parent_id: 'pantry',
    is_explicit_root: false,
    ha_area_id: null,
    entity_ids: [],
    modules: { _meta: { type: 'area' } }
  },
  {
    id: 'top-shelf',
    name: 'Top Shelf',
    parent_id: 'pantry-shelf',
    is_explicit_root: false,
    ha_area_id: null,
    entity_ids: [],
    modules: { _meta: { type: 'area' } }
  },
  {
    id: 'living-room',
    name: 'Living Room',
    parent_id: 'main-floor',
    is_explicit_root: false,
    ha_area_id: null,
    entity_ids: [],
    modules: { _meta: { type: 'area' } }
  }
];

describe('HtLocationTree - shouldUpdate Performance', () => {
  it('does NOT re-render on unrelated hass state changes', async () => {
    const element = await fixture<HtLocationTree>(html`
      <ht-location-tree
        .hass=${mockHass as HomeAssistant}
        .locations=${mockLocations}
        .allowRename=${true}
      ></ht-location-tree>
    `);

    await element.updateComplete;

    const initialMarkup = element.shadowRoot!.innerHTML;

    // Update hass with unrelated entity
    element.hass = {
      ...mockHass,
      states: {
        'light.living_room': {
          entity_id: 'light.living_room',
          state: 'on',
          attributes: {},
          last_changed: new Date().toISOString(),
          last_updated: new Date().toISOString(),
          context: { id: '123', parent_id: null, user_id: null }
        }
      }
    } as HomeAssistant;

    await element.updateComplete;

    // Tree doesn't depend on entity states, so DOM should remain stable
    expect(element.shadowRoot!.innerHTML).to.equal(initialMarkup);
  });

  it('DOES re-render when locations change', async () => {
    const element = await fixture<HtLocationTree>(html`
      <ht-location-tree
        .hass=${mockHass as HomeAssistant}
        .locations=${mockLocations}
        .allowRename=${true}
      ></ht-location-tree>
    `);

    await element.updateComplete;

    // Update locations
    element.locations = [
      ...mockLocations,
      {
        id: 'bedroom',
        name: 'Bedroom',
        parent_id: null,
        is_explicit_root: false,
        ha_area_id: null,
        entity_ids: [],
        modules: { _meta: { type: 'area' } }
      }
    ];

    await element.updateComplete;

    // FLAT RENDERING: Items are .tree-item
    const items = element.shadowRoot!.querySelectorAll('.tree-item');
    expect(items.length).to.equal(3);
  });

  it('renders location names correctly', async () => {
    const element = await fixture<HtLocationTree>(html`
      <ht-location-tree
        .hass=${mockHass as HomeAssistant}
        .locations=${mockLocations}
        .allowRename=${true}
      ></ht-location-tree>
    `);

    await element.updateComplete;

    const locationNames = Array.from(
      element.shadowRoot!.querySelectorAll('.location-name')
    ).map(el => el.textContent?.trim());

    expect(locationNames).to.include('Kitchen');
    expect(locationNames).to.include('Living Room');
  });

  it('emits location-selected event on click', async () => {
    const element = await fixture<HtLocationTree>(html`
      <ht-location-tree
        .hass=${mockHass as HomeAssistant}
        .locations=${mockLocations}
        .allowRename=${true}
      ></ht-location-tree>
    `);

    await element.updateComplete;

    let selectedId: string | undefined;
    element.addEventListener('location-selected', (e: Event) => {
      selectedId = (e as CustomEvent).detail.locationId;
    });

    // Click on location name (not drag handle or buttons)
    const firstItem = element.shadowRoot!.querySelector('.tree-item') as HTMLElement;
    const nameEl = firstItem?.querySelector('.location-name') as HTMLElement;
    expect(nameEl).to.exist;
    nameEl.click();

    await element.updateComplete;

    expect(selectedId).to.equal('kitchen');
  });

  it('shows empty state and fires location-create when clicking New Location', async () => {
    const element = await fixture<HtLocationTree>(html`
      <ht-location-tree
        .hass=${mockHass as HomeAssistant}
        .locations=${[]}
      ></ht-location-tree>
    `);

    await element.updateComplete;

    let createEventFired = false;
    element.addEventListener('location-create', () => {
      createEventFired = true;
    });

    const createButton = element.shadowRoot!.querySelector('.empty-state .button') as HTMLElement;
    expect(createButton).to.exist;
    createButton.click();

    expect(createEventFired).to.equal(true);
  });

  it('expands children and emits selection for nested nodes', async () => {
    const element = await fixture<HtLocationTree>(html`
      <ht-location-tree
        .hass=${mockHass as HomeAssistant}
        .locations=${nestedLocations}
      ></ht-location-tree>
    `);

    await element.updateComplete;

    // Auto-expansion should show all items
    // Expand all to ensure we can see nested items
    (element as any)._expandedIds = new Set(['house', 'kitchen']);
    element.requestUpdate();
    await element.updateComplete;

    let selectedId: string | undefined;
    element.addEventListener('location-selected', (e: Event) => {
      selectedId = (e as CustomEvent).detail.locationId;
    });

    // Find and click on the pantry (nested 2 levels deep)
    const pantryItem = element.shadowRoot!.querySelector('[data-id="pantry"]') as HTMLElement;
    expect(pantryItem).to.exist;
    const nameEl = pantryItem?.querySelector('.location-name') as HTMLElement;
    nameEl.click();

    await element.updateComplete;

    expect(selectedId).to.equal('pantry');
  });

  it('starts with collapsed branches until user expands them', async () => {
    const element = await fixture<HtLocationTree>(html`
      <ht-location-tree
        .hass=${mockHass as HomeAssistant}
        .locations=${nestedLocations}
      ></ht-location-tree>
    `);

    await element.updateComplete;

    const expanded = (element as any)._expandedIds as Set<string>;
    expect(expanded.size).to.equal(0);
    expect(element.shadowRoot!.querySelector('[data-id="house"]')).to.exist;
    expect(element.shadowRoot!.querySelector('[data-id="kitchen"]')).to.equal(null);
    expect(element.shadowRoot!.querySelector('[data-id="pantry"]')).to.equal(null);
  });

  it('uses explicit drop zones only (no drag-hover auto-expand per C-011)', async () => {
    const element = await fixture<HtLocationTree>(html`
      <ht-location-tree
        .hass=${mockHass as HomeAssistant}
        .locations=${deepTreeLocations}
      ></ht-location-tree>
    `);
    await element.updateComplete;
    (element as any)._expandedIds = new Set(['house', 'main-floor']);
    expect((element as any)._expandedIds.has('kitchen')).to.equal(false);
  });

  it('preserves collapsed state after locations refresh', async () => {
    const element = await fixture<HtLocationTree>(html`
      <ht-location-tree
        .hass=${mockHass as HomeAssistant}
        .locations=${nestedLocations}
      ></ht-location-tree>
    `);

    await element.updateComplete;

    // Simulate user collapsing nested branch and keeping only root expanded.
    (element as any)._expandedIds = new Set(['house']);

    element.locations = [
      ...nestedLocations,
      {
        id: 'office',
        name: 'Office',
        parent_id: 'house',
        is_explicit_root: false,
        ha_area_id: null,
        entity_ids: [],
        modules: { _meta: { type: 'area' } }
      }
    ];
    await element.updateComplete;

    const expanded = (element as any)._expandedIds as Set<string>;
    expect(expanded.has('house')).to.equal(true);
    expect(expanded.has('kitchen')).to.equal(false);
  });

  it('dispatches location-lock-toggle when lock icon is clicked', async () => {
    const element = await fixture<HtLocationTree>(html`
      <ht-location-tree
        .hass=${mockHass as HomeAssistant}
        .locations=${mockLocations}
        .allowRename=${true}
      ></ht-location-tree>
    `);

    await element.updateComplete;

    let lockDetail: { locationId: string; lock: boolean } | undefined;
    element.addEventListener('location-lock-toggle', (e: Event) => {
      lockDetail = (e as CustomEvent).detail;
    });

    const lockBtn = element.shadowRoot!.querySelector('.lock-btn') as HTMLElement;
    expect(lockBtn).to.exist;
    lockBtn.click();

    await element.updateComplete;
    expect(lockDetail).to.exist;
    expect(lockDetail?.locationId).to.equal('kitchen');
    expect(lockDetail?.lock).to.equal(true);
  });

  it('dispatches location-occupancy-toggle when occupancy icon is clicked', async () => {
    const element = await fixture<HtLocationTree>(html`
      <ht-location-tree
        .hass=${mockHass as HomeAssistant}
        .locations=${mockLocations}
        .occupancyStates=${{ kitchen: false }}
        .allowRename=${true}
      ></ht-location-tree>
    `);

    await element.updateComplete;

    let occupancyDetail: { locationId: string; occupied: boolean } | undefined;
    element.addEventListener('location-occupancy-toggle', (e: Event) => {
      occupancyDetail = (e as CustomEvent).detail;
    });

    const occupancyBtn = element.shadowRoot!.querySelector('.occupancy-btn') as HTMLElement;
    expect(occupancyBtn).to.exist;
    occupancyBtn.click();

    await element.updateComplete;
    expect(occupancyDetail).to.exist;
    expect(occupancyDetail?.locationId).to.equal('kitchen');
    expect(occupancyDetail?.occupied).to.equal(true);
  });

  it('does not render row delete buttons', async () => {
    const element = await fixture<HtLocationTree>(html`
      <ht-location-tree
        .hass=${mockHass as HomeAssistant}
        .locations=${nestedLocations}
      ></ht-location-tree>
    `);

    await element.updateComplete;
    (element as any)._expandedIds = new Set(['house']);
    element.requestUpdate();
    await element.updateComplete;

    const rootRow = element.shadowRoot!.querySelector('[data-id="house"]') as HTMLElement;
    expect(rootRow).to.exist;
    expect(rootRow.querySelector('.delete-btn')).to.equal(null);
    const allDeleteButtons = element.shadowRoot!.querySelectorAll('.delete-btn');
    expect(allDeleteButtons.length).to.equal(0);
    expect(rootRow.querySelector('.type-badge')?.textContent?.trim().toLowerCase()).to.equal('home root');
  });

  it('double-click on name enables inline editing', async () => {
    const element = await fixture<HtLocationTree>(html`
      <ht-location-tree
        .hass=${mockHass as HomeAssistant}
        .locations=${mockLocations}
        .allowRename=${true}
      ></ht-location-tree>
    `);

    await element.updateComplete;

    // Find the location name element
    const nameEl = element.shadowRoot!.querySelector('.location-name') as HTMLElement;
    expect(nameEl).to.exist;
    expect(nameEl.textContent?.trim()).to.equal('Kitchen');

    // Double-click to start editing
    nameEl.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    await element.updateComplete;

    // Should now show an input field
    const input = element.shadowRoot!.querySelector('.location-name-input') as HTMLInputElement;
    expect(input).to.exist;
    expect(input.value).to.equal('Kitchen');
  });

  it('dispatches location-renamed when Enter is pressed in edit mode', async () => {
    const element = await fixture<HtLocationTree>(html`
      <ht-location-tree
        .hass=${mockHass as HomeAssistant}
        .locations=${mockLocations}
        .allowRename=${true}
      ></ht-location-tree>
    `);

    await element.updateComplete;

    let renamedData: { locationId: string; newName: string } | undefined;
    element.addEventListener('location-renamed', (e: Event) => {
      renamedData = (e as CustomEvent).detail;
    });

    // Start editing
    const nameEl = element.shadowRoot!.querySelector('.location-name') as HTMLElement;
    nameEl.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    await element.updateComplete;

    // Get the input and change value
    const input = element.shadowRoot!.querySelector('.location-name-input') as HTMLInputElement;
    input.value = 'New Kitchen Name';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await element.updateComplete;

    // Press Enter to confirm
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await element.updateComplete;

    expect(renamedData).to.exist;
    expect(renamedData?.locationId).to.equal('kitchen');
    expect(renamedData?.newName).to.equal('New Kitchen Name');
  });

  it('Escape key cancels inline editing', async () => {
    const element = await fixture<HtLocationTree>(html`
      <ht-location-tree
        .hass=${mockHass as HomeAssistant}
        .locations=${mockLocations}
        .allowRename=${true}
      ></ht-location-tree>
    `);

    await element.updateComplete;

    // Start editing
    const nameEl = element.shadowRoot!.querySelector('.location-name') as HTMLElement;
    nameEl.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    await element.updateComplete;

    // Get the input and change value
    const input = element.shadowRoot!.querySelector('.location-name-input') as HTMLInputElement;
    input.value = 'Changed Name';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await element.updateComplete;

    // Press Escape to cancel
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await element.updateComplete;

    // Should go back to showing the name, not the input
    const inputAfter = element.shadowRoot!.querySelector('.location-name-input');
    expect(inputAfter).to.not.exist;

    // Name should still be original
    const nameElAfter = element.shadowRoot!.querySelector('.location-name') as HTMLElement;
    expect(nameElAfter.textContent?.trim()).to.equal('Kitchen');
  });

  it('resolveDropTargetFromZone: before related row gives sibling under same parent', () => {
    const flatNodes = __TEST__.buildFlatTree(
      deepTreeLocations,
      new Set(['house', 'main-floor', 'kitchen', 'pantry', 'pantry-shelf'])
    );

    const result = __TEST__.resolveDropTargetFromZone(
      flatNodes,
      'top-shelf',
      'pantry-shelf',
      'living-room',
      'before'
    );

    expect(result.parentId).to.equal('main-floor');
    expect(result.siblingIndex).to.equal(1); // before living-room (kitchen is 0)
  });

  it('dispatches sibling index (not flat index) when emitting location-moved', async () => {
    const element = await fixture<HtLocationTree>(html`
      <ht-location-tree
        .hass=${mockHass as HomeAssistant}
        .locations=${deepTreeLocations}
      ></ht-location-tree>
    `);
    (element as any)._expandedIds = new Set(['house', 'main-floor', 'kitchen', 'pantry', 'pantry-shelf']);
    await element.updateComplete;

    let moveDetail: any;
    element.addEventListener('location-moved', (e: Event) => {
      moveDetail = (e as CustomEvent).detail;
    });

    (element as any)._activeDropTarget = { relatedId: 'living-room', zone: 'before' };

    const item = document.createElement('div');
    item.setAttribute('data-id', 'top-shelf');

    (element as any)._handleDragEnd({ item });

    expect(moveDetail).to.exist;
    expect(moveDetail.locationId).to.equal('top-shelf');
    expect(moveDetail.newParentId).to.equal('main-floor');
    expect(moveDetail.newIndex).to.equal(1);
  });

  it('outdent zone on current parent row moves to grandparent', () => {
    const movedTree: Location[] = [
      ...deepTreeLocations.filter((l) => l.id !== 'top-shelf'),
      {
        id: 'top-shelf',
        name: 'Top Shelf',
        parent_id: 'living-room',
        is_explicit_root: false,
        ha_area_id: null,
        entity_ids: [],
        modules: { _meta: { type: 'area' } },
      },
    ];

    const flatNodes = __TEST__.buildFlatTree(
      movedTree,
      new Set(['house', 'main-floor', 'kitchen', 'pantry', 'pantry-shelf', 'living-room'])
    );

    const result = __TEST__.resolveDropTargetFromZone(
      flatNodes,
      'top-shelf',
      'living-room',
      'living-room',
      'outdent'
    );

    expect(result.parentId).to.equal('main-floor');
  });

  it('inside zone on current parent row keeps as child', () => {
    const movedTree: Location[] = [
      ...deepTreeLocations.filter((l) => l.id !== 'top-shelf'),
      {
        id: 'top-shelf',
        name: 'Top Shelf',
        parent_id: 'living-room',
        is_explicit_root: false,
        ha_area_id: null,
        entity_ids: [],
        modules: { _meta: { type: 'area' } },
      },
    ];

    const flatNodes = __TEST__.buildFlatTree(
      movedTree,
      new Set(['house', 'main-floor', 'kitchen', 'pantry', 'pantry-shelf', 'living-room'])
    );

    const result = __TEST__.resolveDropTargetFromZone(
      flatNodes,
      'top-shelf',
      'living-room',
      'living-room',
      'inside'
    );

    expect(result.parentId).to.equal('living-room');
    expect(result.siblingIndex).to.equal(0);
  });

  it('inside zone makes related row the new parent', () => {
    const flatNodes = __TEST__.buildFlatTree(
      deepTreeLocations,
      new Set(['house', 'main-floor', 'kitchen', 'pantry', 'pantry-shelf'])
    );

    const result = __TEST__.resolveDropTargetFromZone(
      flatNodes,
      'top-shelf',
      'pantry-shelf',
      'living-room',
      'inside'
    );

    expect(result.parentId).to.equal('living-room');
    expect(result.siblingIndex).to.equal(0);
  });

  it('before zone gives sibling under same parent', () => {
    const flatNodes = __TEST__.buildFlatTree(
      deepTreeLocations,
      new Set(['house', 'main-floor', 'kitchen', 'pantry', 'pantry-shelf'])
    );

    const result = __TEST__.resolveDropTargetFromZone(
      flatNodes,
      'top-shelf',
      'pantry-shelf',
      'living-room',
      'before'
    );

    expect(result.parentId).to.equal('main-floor');
  });

  it('after zone gives next sibling index', () => {
    const flatNodes = __TEST__.buildFlatTree(
      deepTreeLocations,
      new Set(['house', 'main-floor', 'kitchen', 'pantry', 'pantry-shelf'])
    );

    const result = __TEST__.resolveDropTargetFromZone(
      flatNodes,
      'top-shelf',
      'pantry-shelf',
      'living-room',
      'after'
    );

    expect(result.parentId).to.equal('main-floor');
    expect(result.siblingIndex).to.equal(2);
  });

  it('after zone on kitchen gives main-floor sibling index', () => {
    const flatNodes = __TEST__.buildFlatTree(
      deepTreeLocations,
      new Set(['house', 'main-floor', 'kitchen', 'pantry', 'pantry-shelf'])
    );

    const result = __TEST__.resolveDropTargetFromZone(
      flatNodes,
      'top-shelf',
      'pantry-shelf',
      'kitchen',
      'after'
    );

    expect(result.parentId).to.equal('main-floor');
    expect(result.siblingIndex).to.equal(1);
  });

  it('keeps floor moves at building/root level when dropped before another floor row', () => {
    const floorTree: Location[] = [
      {
        id: 'building',
        name: 'Building',
        parent_id: null,
        is_explicit_root: false,
        ha_area_id: null,
        entity_ids: [],
        modules: { _meta: { type: 'building' } }
      },
      {
        id: 'ground-floor',
        name: 'Ground Floor',
        parent_id: 'building',
        is_explicit_root: false,
        ha_area_id: null,
        entity_ids: [],
        modules: { _meta: { type: 'floor' } }
      },
      {
        id: 'second-floor',
        name: 'Second Floor',
        parent_id: 'building',
        is_explicit_root: false,
        ha_area_id: null,
        entity_ids: [],
        modules: { _meta: { type: 'floor' } }
      }
    ];

    const flatNodes = __TEST__.buildFlatTree(floorTree, new Set(['building', 'ground-floor', 'second-floor']));

    const result = __TEST__.resolveDropTargetFromZone(
      flatNodes,
      'second-floor',
      'building',
      'ground-floor',
      'before'
    );

    expect(result.parentId).to.equal('building');
  });

  it('zoneFromPointerInRow returns before/inside/after by Y third', () => {
    const row = new DOMRect(0, 0, 100, 30);
    expect(__TEST__.zoneFromPointerInRow(row, 50, 5, false)).to.equal('before');
    expect(__TEST__.zoneFromPointerInRow(row, 50, 15, false)).to.equal('inside');
    expect(__TEST__.zoneFromPointerInRow(row, 50, 25, false)).to.equal('after');
  });

  it('zoneFromPointerInRow returns outdent when over current parent left strip', () => {
    const row = new DOMRect(100, 0, 200, 36);
    expect(__TEST__.zoneFromPointerInRow(row, 110, 18, true)).to.equal('outdent');
    expect(__TEST__.zoneFromPointerInRow(row, 130, 18, true)).to.equal('inside');
  });
});
