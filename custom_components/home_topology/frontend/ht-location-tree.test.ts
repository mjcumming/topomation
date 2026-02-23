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

  it('dispatches location-delete when user confirms delete', async () => {
    const element = await fixture<HtLocationTree>(html`
      <ht-location-tree
        .hass=${mockHass as HomeAssistant}
        .locations=${mockLocations}
      ></ht-location-tree>
    `);

    await element.updateComplete;

    let deletedLocation: Location | undefined;
    element.addEventListener('location-delete', (e: Event) => {
      deletedLocation = (e as CustomEvent).detail.location;
    });

    // Mock confirm to return true
    const originalConfirm = window.confirm;
    window.confirm = () => true;

    try {
      const deleteBtn = element.shadowRoot!.querySelector('.delete-btn') as HTMLElement;
      expect(deleteBtn).to.exist;
      deleteBtn.click();

      await element.updateComplete;

      expect(deletedLocation).to.exist;
      expect(deletedLocation?.id).to.equal('kitchen');
    } finally {
      window.confirm = originalConfirm;
    }
  });

  it('double-click on name enables inline editing', async () => {
    const element = await fixture<HtLocationTree>(html`
      <ht-location-tree
        .hass=${mockHass as HomeAssistant}
        .locations=${mockLocations}
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

  it('computes automatic reparent move from pantry shelf subtree to main-floor sibling', () => {
    const flatNodes = __TEST__.buildFlatTree(
      deepTreeLocations,
      new Set(['house', 'main-floor', 'kitchen', 'pantry', 'pantry-shelf'])
    );

    const oldIndex = flatNodes.findIndex((n: any) => n.location.id === 'top-shelf');
    const targetIndex = flatNodes.findIndex((n: any) => n.location.id === 'living-room');

    const result = __TEST__.computeDropTarget(
      flatNodes,
      'top-shelf',
      oldIndex,
      targetIndex,
      'pantry-shelf',
      { relatedId: 'living-room', willInsertAfter: false }
    );

    expect(result.parentId).to.equal('main-floor');
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

    const flatNodes = __TEST__.buildFlatTree(
      deepTreeLocations,
      new Set(['house', 'main-floor', 'kitchen', 'pantry', 'pantry-shelf'])
    );
    const oldIndex = flatNodes.findIndex((n: any) => n.location.id === 'top-shelf');
    const targetIndex = flatNodes.findIndex((n: any) => n.location.id === 'living-room');

    (element as any)._lastDropContext = { relatedId: 'living-room', willInsertAfter: false };

    const item = document.createElement('div');
    item.setAttribute('data-id', 'top-shelf');

    (element as any)._handleDragEnd({
      item,
      oldIndex,
      newIndex: targetIndex,
    });

    expect(moveDetail).to.exist;
    expect(moveDetail.locationId).to.equal('top-shelf');
    expect(moveDetail.newParentId).to.equal('main-floor');
    expect(moveDetail.newIndex).to.equal(1);
  });

  it('outdents when dropped after current parent row', () => {
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

    const oldIndex = flatNodes.findIndex((n: any) => n.location.id === 'top-shelf');
    const livingIndex = flatNodes.findIndex((n: any) => n.location.id === 'living-room');
    const result = __TEST__.computeDropTarget(
      flatNodes,
      'top-shelf',
      oldIndex,
      livingIndex + 1,
      'living-room',
      { relatedId: 'living-room', willInsertAfter: true }
    );

    expect(result.parentId).to.equal('main-floor');
  });

  it('infers child reparenting from horizontal drop intent', () => {
    const flatNodes = __TEST__.buildFlatTree(
      deepTreeLocations,
      new Set(['house', 'main-floor', 'kitchen', 'pantry', 'pantry-shelf'])
    );

    const oldIndex = flatNodes.findIndex((n: any) => n.location.id === 'top-shelf');
    const livingIndex = flatNodes.findIndex((n: any) => n.location.id === 'living-room');

    const result = __TEST__.computeDropTarget(
      flatNodes,
      'top-shelf',
      oldIndex,
      livingIndex + 1,
      'pantry-shelf',
      {
        relatedId: 'living-room',
        willInsertAfter: false,
        relatedLeft: 200,
        pointerX: 250,
      }
    );

    expect(result.parentId).to.equal('living-room');
  });
});
