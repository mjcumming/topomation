# Drag-and-Drop Design Pattern for Nested Tree

**Based on**: SortableJS official nested example + LitElement best practices
**Date**: 2025-12-12
**Status**: Proposed Design

---

## The Proven Pattern (from SortableJS docs)

### Official Nested Sortables Example

```javascript
// Loop through each nested sortable element
for (var i = 0; i < nestedSortables.length; i++) {
  new Sortable(nestedSortables[i], {
    group: "nested",
    animation: 150,
    fallbackOnBody: true, // CRITICAL for nested
    swapThreshold: 0.65, // CRITICAL for nested (lower than default 1.0)
  });
}
```

**Key Points**:

1. **Same `group` name** for all containers (root + nested)
2. **`fallbackOnBody: true`** - Required for nested with animation
3. **`swapThreshold: 0.65`** - Lower threshold makes nested drops easier
4. **`to` in `onEnd` is the container element** - Not a child, the actual container

---

## Our Implementation Pattern

### 1. Container Structure

```html
<div class="tree-container">
  <!-- Root container -->
  <div class="sortable-item" data-location-id="house">
    <div class="tree-node">House</div>
    <div class="tree-children" data-location-id="house">
      <!-- Nested container -->
      <div class="sortable-item" data-location-id="floor1">
        <div class="tree-node">Floor 1</div>
        <div class="tree-children" data-location-id="floor1">
          <!-- Another nested -->
          <div class="sortable-item" data-location-id="room1">
            <div class="tree-node">Room 1</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

### 2. SortableJS Initialization (with Cycle Detection)

**CRITICAL**: Use `onMove` to prevent invalid drops before they happen:

```typescript
private _initializeSortable(): void {
  // Destroy existing instances
  this._sortableInstance?.destroy();
  this._childSortableInstances.forEach(inst => inst.destroy());
  this._childSortableInstances = [];

  // Wait for Lit to render
  this.updateComplete.then(() => {
    // 1. Initialize root container
    const rootContainer = this.shadowRoot?.querySelector('.tree-container');
    if (rootContainer) {
      this._sortableInstance = Sortable.create(rootContainer, {
        group: 'locations',
        animation: 150,
        fallbackOnBody: true,        // CRITICAL
        swapThreshold: 0.65,         // CRITICAL
        handle: '.drag-handle',
        draggable: '.sortable-item',
        onEnd: (evt) => this._handleDragEnd(evt),
        onMove: (evt) => this._handleDragMove(evt),
      });
    }

    // 2. Initialize ALL nested containers (including newly expanded ones)
    const childContainers = this.shadowRoot?.querySelectorAll('.tree-children');
    childContainers.forEach(container => {
      const instance = Sortable.create(container, {
        group: 'locations',           // Same group!
        animation: 150,
        fallbackOnBody: true,         // CRITICAL
        swapThreshold: 0.65,          // CRITICAL
        handle: '.drag-handle',
        draggable: '.sortable-item',
        onEnd: (evt) => this._handleDragEnd(evt),
        onMove: (evt) => this._handleDragMove(evt),
      });
      this._childSortableInstances.push(instance);
    });
  });
}
```

### 3. Drop Target Detection (THE KEY)

**SortableJS gives you the container directly in `onEnd`** - Use data attributes, not DOM traversal:

```typescript
private _handleDragEnd(evt: Sortable.SortableEvent): void {
  const { item, to, from, newIndex, oldIndex } = evt;

  // Validate move happened
  if (newIndex === undefined || oldIndex === undefined) return;

  // Get location ID from dragged item (O(1) lookup)
  const locationId = item.dataset.locationId;
  if (!locationId) {
    console.error("[Tree] Dragged item missing data-location-id");
    return;
  }

  // THE KEY: `to` IS THE CONTAINER ELEMENT
  // Use dataset for O(1) lookup, not DOM traversal
  let newParentId: string | null = null;

  if (to.classList.contains('tree-children')) {
    // Dropped into nested container - parent ID is in data attribute
    newParentId = to.dataset.locationId || null;
  } else if (to.classList.contains('tree-container')) {
    // Dropped into root container
    newParentId = null;
  } else {
    // Invalid drop target - don't fallback to 'from' (that's wrong!)
    console.error("[Tree] Drop target is not a valid container:", to);
    return;
  }

  // Get old parent for comparison
  const location = this.locations.find(l => l.id === locationId);
  const oldParentId = location?.parent_id ?? null;

  // Guard: Only skip if BOTH parent AND index are unchanged
  const isSameParent = (newParentId === oldParentId);
  const isSameIndex = (newIndex === oldIndex);
  const isSameContainer = (to === from);

  if (isSameParent && isSameIndex && isSameContainer) {
    return; // Nothing changed, don't dispatch
  }

  // Dispatch event
  this.dispatchEvent(new CustomEvent('location-moved', {
    detail: { locationId, newParentId, newIndex },
    bubbles: true,
    composed: true,
  }));
}
```

**Key improvements from architectural analysis**:

- Use `dataset.locationId` instead of `getAttribute()` (cleaner, O(1))
- Explicit guard clause checking parent AND index separately
- No fallback to `from` - fail explicitly if detection fails
- Better error logging for debugging

### 4. Reinitialize When Nodes Expand

```typescript
private _handleExpandToggle(e: Event, locationId: string): void {
  // ... toggle expansion state ...

  // CRITICAL: Reinitialize Sortable when new containers are created
  this.updateComplete.then(() => {
    this._initializeSortable();
  });
}
```

---

## Why Our Current Code Fails

1. **Missing `fallbackOnBody: true`** - Required for nested
2. **Missing `swapThreshold: 0.65`** - Default 1.0 makes nested drops hard
3. **Over-complicated drop detection** - We're traversing DOM when `to` IS the container
4. **Not reinitializing on expand** - New containers don't get Sortable instances
5. **Early return bug** - `if (newIndex === oldIndex && to === from)` blocks same-index moves to different parents

---

## The Fix (Complete)

1. **Add required options**: `fallbackOnBody: true`, `swapThreshold: 0.65`
2. **Use data attributes**: `dataset.locationId` instead of `getAttribute()` + DOM traversal
3. **Fix guard clause**: Check parent AND index separately, allow same-index cross-parent moves
4. **Reinitialize on expand**: `await updateComplete` then `_initializeSortable()`
5. **Cycle detection**: Use `onMove` to prevent dragging into own descendants
6. **Empty container fix**: Add `min-height` CSS to `.tree-children` so empty folders are droppable
7. **No fallbacks**: If detection fails, return early - don't default to `from`

## Additional Fixes from Architectural Analysis

### Cycle Detection in `onMove`

```typescript
private _handleDragMove(evt: Sortable.MoveEvent): boolean {
  const draggedId = evt.dragged.dataset.locationId;
  const targetContainer = evt.to;

  // Prevent cycles: Can't drag into own descendants
  if (targetContainer.classList.contains('tree-children')) {
    const targetParentId = targetContainer.dataset.locationId;
    if (targetParentId && this._isDescendant(draggedId, targetParentId)) {
      return false; // Block the move
    }
  }

  // Hierarchy validation (existing logic)
  // ... rest of validation ...

  return true; // Allow move
}
```

### Empty Container CSS Fix

```css
.tree-children {
  min-height: 10px; /* Ensure droppable even when empty */
  padding-bottom: 5px; /* Create landing pad */
}

.tree-children:empty {
  border: 1px dashed var(--divider-color); /* Visual cue */
}
```

### Forensic Logging (for debugging)

```typescript
onEnd: (evt) => {
  console.group("🔍 Sortable Drop Forensics");
  console.log("Dragged Item:", evt.item);
  console.log("Target Container (evt.to):", evt.to);
  console.log("Target ID (dataset):", evt.to.dataset.locationId);
  console.log("Source Container (evt.from):", evt.from);
  console.log("Class Check:", evt.to.classList.contains("tree-children"));
  console.groupEnd();

  this._handleDragEnd(evt);
};
```

---

## References

- **SortableJS Nested Example**: https://sortablejs.github.io/Sortable/#nested
- **SortableJS GitHub Issue #122**: Shows pattern for detecting parent containers
- **LitElement + SortableJS**: GitHub issue #2275 shows pattern (though they use `onMove` returning false)

---

## Next Steps

1. Apply this pattern to `ht-location-tree.ts`
2. Test with nested items (drag child to different parent)
3. Test with root items (drag to nested container)
4. Verify all containers get Sortable instances when expanded
