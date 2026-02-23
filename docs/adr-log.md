# Architecture Decision Records (ADR) - home-topology-ha

> Decisions specific to the Home Assistant integration layer.
> For core library decisions, see [home-topology ADR log](https://github.com/mjcumming/home-topology/blob/main/docs/adr-log.md).

**Purpose**: Track significant decisions for the HA integration.

---

## Active Decisions

### ADR-HA-001: Lit for Frontend (2025-12-09)

**Status**: ✅ APPROVED

**Context**:

- Need to build frontend panel for location management
- Options: React, Lit, Vue
- Home Assistant's entire frontend is Lit

**Decision**:
Use Lit (LitElement) for all frontend components.

**Rationale**:

1. **Native to HA**: Entire HA frontend uses Lit
2. **Component reuse**: Can use `ha-*` components directly
3. **Theme integration**: CSS variables work automatically
4. **WebSocket access**: `hass` object available natively
5. **No bundling friction**: ES modules work out of the box

**Consequences**:

- ✅ Leverage battle-tested HA components
- ✅ Automatic dark/light mode support
- ✅ Standard HA patterns available
- ⚠️ Less familiar than React (but worth learning)

**Alternatives Considered**:

- React: Too much friction with HA's ecosystem
- Vue: Not used in HA at all

---

### ADR-HA-002: Entity Scope - Area Entities Only (2025-12-09)

**Status**: ✅ APPROVED

**Context**:
When configuring occupancy sources (entities that generate events), which entities should be available?

- Option A: Only entities in this HA area
- Option B: Any entity from anywhere
- Option C: Default to area, allow adding from elsewhere

**Decision**:
Option A - Strict: Only entities assigned to this HA area.

**Rationale**:

1. **Follows HA paradigm**: HA already organizes entities by area
2. **Simpler mental model**: "Sources are the entities in this location"
3. **Easier debugging**: Clear entity-location relationships
4. **Can expand later**: Add cross-area support in v2 if needed

**Workaround for Edge Cases**:
Users can create template sensors in HA config:

```yaml
template:
  - binary_sensor:
      - name: "Living Room Motion (from Hallway)"
        state: "{{ states('binary_sensor.hallway_motion') }}"
```

**Consequences**:

- ✅ Simple UI (only show area entities)
- ✅ Clear relationships
- ⚠️ Requires proper HA area assignments
- ⚠️ Edge cases need template sensors

---

### ADR-HA-003: Two Trigger Modes for Entity Configuration (2025-12-09)

**Status**: ✅ APPROVED

**Context**:
Not all entities have simple binary on/off states:

- Motion sensors: on/off (simple)
- Dimmers: 0-100% brightness
- Media players: playing/paused/idle + volume
- Thermostats: temperature, mode, setpoint

**Decision**:
Two trigger modes:

**Mode 1: "Any Change" (Activity Detection)**

- Any state change → TRIGGER with timeout
- Best for: dimmers, volume, thermostats, unusual sensors

**Mode 2: "Specific States" (Binary Mapping)**

- Configure ON state → TRIGGER (with timeout or indefinite)
- Configure OFF state → Ignore or CLEAR (with trailing)
- Best for: motion, presence, door, media player state

**Consequences**:

- ✅ Handles 99% of cases with two simple modes
- ✅ Progressive complexity (simple mode for basic users)
- ✅ Escape hatch exists (direct service calls)
- ⚠️ UI needs clear mode explanation

**Default Patterns**:

- Motion: Specific States (ON→TRIGGER(5m), OFF→ignore)
- Presence: Specific States (ON→TRIGGER(∞), OFF→CLEAR(2m))
- Door (entry): Specific States (ON→TRIGGER(2m), OFF→ignore)
- Door (state): Specific States (ON→TRIGGER(∞), OFF→CLEAR(0))
- Dimmer: Any Change (TRIGGER(5m))

---

### ADR-HA-004: Host-Controlled Timeout Scheduling (2025-12-09)

**Status**: ✅ APPROVED (inherited from core library)

**Context**:
Occupancy module needs periodic timeout checks. Where does scheduling happen?

**Decision**:
Integration provides scheduling via `coordinator.py`:

- Modules expose `get_next_timeout()` and `check_timeouts(now)`
- Coordinator queries all modules for next timeout
- Uses `async_track_point_in_time()` to schedule
- Calls `check_timeouts(now)` when triggered
- Reschedules for next timeout

**Rationale**:

1. **Time-agnostic kernel**: Core library has no timers
2. **Testable**: Tests control time exactly
3. **HA native**: Uses HA's async scheduler
4. **Efficient**: Single coordinator for all modules

**Consequences**:

- ✅ Kernel stays platform-agnostic
- ✅ Easy to test
- ✅ Standard HA patterns
- ℹ️ Integration must implement coordinator

---

### ADR-HA-005: Location Type Storage via `_meta` Module (2025-12-09)

**Status**: ✅ APPROVED

**Context**:
Kernel is type-agnostic (no concept of floor/room/zone). Where to store type metadata?

**Decision**:
Use the `_meta` module convention:

```python
loc_mgr.set_module_config(
    location_id="kitchen",
    module_id="_meta",
    config={
        "type": "room",
        "category": "kitchen",
        "icon": "mdi:silverware-fork-knife"
    }
)
```

**Rationale**:

1. **Kernel stays simple**: No type system in core
2. **Integration-specific**: Different integrations may have different types
3. **Flexible**: Can add fields without kernel changes
4. **Consistent**: Uses existing module config mechanism

**Consequences**:

- ✅ Type system isolated to integration
- ✅ Easy to extend
- ✅ No kernel changes needed
- ℹ️ Integration enforces hierarchy rules in UI

---

### ADR-HA-006: Hierarchy Constraints in UI Only (2025-12-09)

**Status**: ✅ APPROVED

**Context**:
Should the kernel enforce hierarchy rules (floors contain rooms, rooms contain zones)?

**Decision**:
NO - Kernel accepts any tree structure. UI enforces sensible constraints.

**Valid Hierarchy (UI enforced)**:

```
Building/Root
  └── Floor
        └── Room / Suite
              └── Zone (terminal)
```

**Rationale**:

1. **Kernel flexibility**: Power users can bypass via API if needed
2. **Integration-specific rules**: Different platforms may have different hierarchies
3. **UI guides users**: Normal users get sensible defaults
4. **No kernel complexity**: Rules live in UI drag-and-drop validation

**Consequences**:

- ✅ Flexible kernel
- ✅ User-friendly UI
- ✅ API power available
- ℹ️ UI must validate moves before committing

---

### ADR-HA-007: Simplified Type System - Floor & Area (2025-12-25)

**Status**: ✅ APPROVED

**Context**:
The previous design (ADR-HA-006) used a complex taxonomy (Building, Floor, Suite, Room, Zone, Outdoor). This introduced significant "metadata friction" and didn't align perfectly with Home Assistant's native organization model.

**Decision**:
Simplify the integration's location types to just two: **Floor** and **Area**.

1.  **Floor**: A top-level container that maps to a native Home Assistant Floor entity.
2.  **Area**: A location that maps to a native Home Assistant Area entity.

**Hierarchy Rules (UI Enforced)**:

- **Floor**: Must be a root node (parent_id = null). Cannot be a child of any other location.
- **Area**: Can be a root node (if no floor is used), a child of a Floor, or a child of another Area (supporting nested topologies like Zones or Suites).

**Rationale**:

1.  **Alignment with HA**: Matches HA's native "Floor" and "Area" terminology.
2.  **Simplified UX**: Reduces cognitive load in the location creation dialog.
3.  **Semantic Flexibility**: Semantic distinctions (Kitchen, Bedroom, etc.) are handled by **Categories** and **Icons**, not structural types.
4.  **Preserves Power**: Still allows deep nesting (Area within Area) which standard HA Areas lack, fulfilling the core goal of the "Topology" integration.

**Consequences**:

- ✅ Clean, intuitive organization model.
- ✅ Perfect mapping to HA's core entity structure.
- ✅ Reduced validation logic complexity.
- ℹ️ Legacy types (Suite, Zone, etc.) are collapsed into "Area".

---

### ADR-HA-008: Flat Rendering Pattern for Location Tree (2025-12-28)

**Status**: ✅ APPROVED

**Context**:
The location tree component (`ht-location-tree.ts`) was implemented using **nested DOM containers** with multiple SortableJS instances. This approach caused severe issues:

1. **Item duplication**: Multiple Sortable instances fired events for the same drag, causing items to appear duplicated
2. **Wrong parent detection**: 100+ lines of fallback DOM traversal logic trying to determine drop targets
3. **Bandaid fixes**: Each bug fix added complexity without addressing the root cause
4. **Hours of wasted iteration**: The architecture was fundamentally flawed

**The original design documents (`ui-design.md` Section 10.3, `drag-drop-design-pattern.md`) actually specified the correct approach but it wasn't implemented:**

> "Render flat list with visual indentation (not nested DOM)"
> "Use CSS padding-left for depth (simpler than nested components)"

**Decision**:
Rewrite the tree component using the **flat rendering pattern**:

1. **Single flat list in the DOM** - no nested `.tree-children` containers
2. **Visual hierarchy via CSS** - `margin-left` based on computed depth
3. **Single SortableJS instance** - eliminates sync issues between multiple instances
4. **Parent computed from position** - use flat list index to determine new parent, not DOM structure

**Implementation**:

```typescript
// Compute flat render order from hierarchical data
function buildFlatTree(locations, expandedIds): FlatTreeNode[] {
  // Depth-first traversal, only including expanded children
  // Returns flat array with { location, depth, hasChildren, isExpanded }
}

// Determine parent from drop position
function computeNewParent(flatNodes, draggedId, newIndex): string | null {
  // Look at item before drop position
  // If expanded parent → becomes first child
  // Otherwise → becomes sibling (same parent)
}
```

**Rationale**:

1. **Proven pattern**: SortableJS's own nested examples use this approach
2. **Single source of truth**: Only the data model matters, not DOM structure
3. **Simple `onEnd` handler**: ~20 lines instead of 100+
4. **No DOM traversal**: O(1) parent lookup via position
5. **Lit's `repeat()` works correctly**: No nested key collisions

**Consequences**:

- ✅ Eliminates all drag-drop duplication bugs
- ✅ Clean, maintainable code (~400 lines vs ~1100 lines)
- ✅ No `@ts-nocheck` needed - proper TypeScript throughout
- ✅ Matches the original design specification
- ℹ️ Flat DOM requires computing depth for each render (trivial cost)

**Code Deleted**:

- 700+ lines of nested DOM rendering and complex fallback logic
- Multiple Sortable instance management
- DOM traversal in `_handleDragEnd`

---

## Rejected Decisions

### REJECTED: React for Frontend

**Status**: ❌ REJECTED

**Context**: Frontend technology choice

**Decision**: Use Lit instead

**Reason**: Too much friction with HA's Lit ecosystem, bundling complexity

**Date**: 2025-12-09

---

### REJECTED: Global Entity Picker

**Status**: ❌ REJECTED

**Context**: Entity selection scope

**Decision**: Restrict to area entities only

**Reason**: Simplicity, follows HA paradigm, clear relationships

**Date**: 2025-12-09

---

### REJECTED: Nested DOM with Multiple Sortable Instances

**Status**: ❌ REJECTED

**Context**: Tree drag-and-drop implementation

**Decision**: Use flat rendering with single Sortable instead

**Reason**: Nested DOM + multiple Sortable instances caused item duplication, wrong parent detection, and 700+ lines of bandaid fixes. See ADR-HA-008 for the correct approach.

**Date**: 2025-12-28

---

### ADR-HA-009: Explicit Static Properties for Mock Components (2025-12-28)

**Status**: ✅ APPROVED

**Context**:
Mock HA components (`MockHaIcon`, `MockHaForm`, etc.) in the dev harness were silently broken. Properties passed via attributes were not being received by the components. Symptoms:

- Icons showed "?" instead of symbols
- Forms didn't accept input
- Dialog properties were empty

Unit tests (25/25) passed, but the harness was non-functional.

**Root Cause**:
Lit's `@property()` decorator relies on class field transforms. Vite's ESM dev mode can skip these transforms, causing properties to not be reactive. The decorators work in:

- Production builds (full Rollup transforms)
- Unit tests (`@open-wc/testing` uses different loading)

But fail silently in Vite dev mode.

**Decision**:
ALL Lit components in `mock-ha-components.ts` MUST have explicit `static properties` declarations alongside `@property()` decorators:

```typescript
export class MockHaIcon extends LitElement {
  @property({ type: String }) icon = "";

  // REQUIRED - Vite dev mode needs this
  static properties = {
    icon: { type: String },
  };
}
```

**Rationale**:

1. `static properties` is Lit's fallback mechanism when decorators don't transform
2. Adding it is harmless (Lit merges both sources)
3. This is the only way to ensure dev harness works
4. Production builds work regardless (but we develop in harness)

**Consequences**:

- ✅ Dev harness works correctly
- ✅ No runtime overhead
- ⚠️ Slight code duplication (decorator + static properties)
- ℹ️ Must remember to add both when creating new mock components

**Alternatives Considered**:

- **Vite plugin for decorators**: Too complex, adds dependency
- **Remove decorators entirely**: Loses TypeScript type checking benefits
- **Different dev tooling**: Would require major workflow changes

**Lesson Learned**:
Unit tests are not sufficient for UI verification. The dev harness must be manually tested before commits. See `lessons-learned-2025-12-28.md` for full post-mortem.

---

### ADR-HA-010: Flexible Organizational Hierarchy (2025-12-28)

**Status**: ✅ APPROVED (Supersedes restrictions in ADR-HA-007)

**Context**:
Previous designs enforced strict "physical" rules (e.g., Floors must be root, Areas must be inside Floors). This restricted the user's ability to organize their topology for behavioral purposes (e.g., grouping Floors under a "House" Area).

**Decision**:
Transition to a "User-First" organizational model:
1. **Areas** can nest under anything (Root, Floor, or another Area).
2. **Floors** can be Root or children of an **Area**.
3. **CONSTRAINT**: A Floor CANNOT be nested inside another Floor (logically blocked).

**Rationale**:
1. **HT vs HA**: Home Topology is for *behavior* and *organization*; Home Assistant is for *physical registry*. HT should not be limited by HA's flat model.
2. **User Control**: Users can create arbitrary groupings (e.g., "Main House", "Guest House") using Areas as containers.

**Consequences**:
- ✅ Maximum flexibility for complex properties.
- ✅ Simplifies hierarchy validation code.
- ℹ️ Requires a "Smart Sync" strategy to map this back to HA's flat Area/Floor registry.

---

### ADR-HA-011: Smart Sync Strategy for HA Registry (2025-12-28)

**Status**: ✅ APPROVED

**Context**:
With ADR-HA-010, the HT hierarchy can become deeper than HA supports (`Area -> Floor` only). We need to maintain the HA registry without breaking the user's HT organization.

**Decision**:
Implement a "Nearest Floor Ancestor" sync logic:
1. When an Area moves, HT looks up its ancestor chain.
2. The **first Floor ancestor** found is assigned as the area's `floor_id` in HA.
3. If no Floor is found in the chain, the `floor_id` is set to `null` in HA.

**Rationale**:
1. **Compatibility**: Keeps HA's native registries organized in a way that makes sense.
2. **Automation Friendly**: HA areas stay linked to floors, which helps standard HA automations and voice commands.
3. **Zero Friction**: The sync happens automatically in the background.

**Consequences**:
- ✅ HT remains the "Master Organizer".
- ✅ HA registries stay as clean as possible.
- ℹ️ Complex HT nesting is "invisible" to native HA (which is fine).

---

### ADR-HA-012: Core-Emitted Topology Mutation Events (2026-02-23)

**Status**: ✅ APPROVED

**Context**:
Topology-to-HA sync depends on location mutation events (`location.renamed`,
`location.parent_changed`, `location.deleted`). Event emission was implemented in
the HA adapter by wrapping `LocationManager` methods, which duplicated behavior
and made other adapters inconsistent.

**Decision**:
Emit topology mutation events directly from the core `LocationManager` when an
event bus is configured via `set_event_bus()`. The HA integration consumes these
events; it no longer monkeypatches manager methods.

**Rationale**:
1. Single source of truth for topology mutations
2. Consistent behavior across adapters/platforms
3. Less integration-level complexity and lower regression risk

**Consequences**:
- ✅ Topology rename/parent/delete sync is deterministic
- ✅ Adapter code is thinner and easier to reason about
- ⚠️ Core now has optional runtime coupling to an event bus instance

---

### ADR-HA-013: Canonical Sibling Ordering in Core (2026-02-23)

**Status**: ✅ APPROVED

**Context**:
Tree UI ordering is a primary UX requirement. Previously, reorder operations
accepted `new_index` but backend ordering was ignored, causing unstable ordering
after refresh/restart/sync.

**Decision**:
Store canonical sibling order in core (`Location.order`) and use
`LocationManager.reorder_location()` as the authoritative mutation path.
Integration persists and restores the `order` field.

**Rationale**:
1. Stable tree rendering across sessions
2. Deterministic behavior for drag/drop and sync flows
3. Enables future diff/versioning and undo/redo on explicit ordering semantics

**Consequences**:
- ✅ Backend and frontend agree on tree order
- ✅ Reorder survives restart and sync
- ⚠️ Requires migration awareness for older persisted data without `order`

---

### ADR-HA-014: Explicit Sync Authority Rules (2026-02-23)

**Status**: ✅ APPROVED

**Context**:
Bidirectional sync can produce conflicting edits unless authority is explicit.
Current behavior mixes lock-based loop prevention with implicit assumptions.

**Decision**:
Adopt and document authority rules:
1. `sync_source=homeassistant`: HA owns canonical name/floor linkage; topology edits sync back when allowed.
2. `sync_source=topology`: Topology owns structure/metadata; no HA back-propagation unless explicitly enabled later.
3. `sync_enabled=false`: No cross-boundary writebacks for that location.

**Rationale**:
1. Predictable conflict handling
2. Clear operator mental model
3. Cleaner future support for per-location sync policy UI

**Consequences**:
- ✅ Fewer ambiguous sync outcomes
- ✅ Easier troubleshooting and QA
- ⚠️ Some advanced merge cases still need explicit future policy work

---

## How to Use This Log

### When to Create an ADR

- Significant integration decision
- Affects UI/UX patterns
- Technology choices
- Non-obvious trade-offs

### When NOT to Create an ADR

- Implementation details
- Temporary workarounds
- Obvious choices
- Inherited from core library (reference core ADR instead)

### ADR Template

```markdown
### ADR-HA-XXX: Title (YYYY-MM-DD)

**Status**: 🟡 PROPOSED | ✅ APPROVED | ❌ REJECTED

**Context**:
What's the situation? What problem are we solving?

**Decision**:
What did we decide to do?

**Rationale**:

1. Reason 1
2. Reason 2

**Consequences**:

- ✅ Positive outcomes
- ⚠️ Risks or downsides
- ℹ️ Neutral facts

**Alternatives Considered**:

- Option A: Why not?
- Option B: Why not?
```

---

**Maintainer**: Mike
**Review Frequency**: As decisions are made
**Location**: `/docs/adr-log.md`
