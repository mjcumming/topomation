# Architecture Decision Records (ADR) - topomation

> Decisions specific to the Home Assistant integration layer.
> For core library decisions, see the Topomation core ADR log.

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

**Status**: ⚠️ SUPERSEDED (see ADR-HA-020)

**Context**:
When configuring occupancy sources (entities that generate events), which entities should be available?

- Option A: Only entities in this HA area
- Option B: Any entity from anywhere
- Option C: Default to area, allow adding from elsewhere

**Decision** (historical):
Option A - strict area-only source selection for HA-backed locations.

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

**Consequences** (historical):

- ✅ Simple UI (only show area entities)
- ✅ Clear relationships
- ⚠️ Requires proper HA area assignments
- ⚠️ Edge cases need template sensors

**Superseded By**:
- ADR-HA-020 narrows this rule: HA-backed nodes retain area-first defaults, while
  integration-owned nodes (`building`/`grounds`/`subarea`) support explicit source assignment.

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
Kernel is type-agnostic (no concept of floor/area/building). Where to store type metadata?

**Decision**:
Use the `_meta` module convention:

```python
loc_mgr.set_module_config(
    location_id="kitchen",
    module_id="_meta",
    config={
        "type": "area",
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
Should the kernel enforce hierarchy rules (for example floor/area/subarea relationships)?

**Decision**:
NO - Kernel accepts any tree structure. UI enforces sensible constraints.

**Valid Hierarchy (UI enforced at the time)**:

```
Building/Root
  └── Floor
        └── Area
              └── Subarea
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

**Follow-up Evolution**:
- Later ADRs (ADR-HA-010, ADR-HA-020) refined concrete type sets and parent rules,
  while preserving this core principle: hierarchy constraints live in UI, not kernel.

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

**The original design documents (`docs/history/2026.02.24-ui-design.md` Section 10.3, `docs/history/2026.02.24-drag-drop-design-pattern.md`) actually specified the correct approach but it wasn't implemented:**

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

**Decision** (historical): Restrict to area entities only

**Reason**: Simplicity, follows HA paradigm, clear relationships

**Note**: ADR-HA-020 later introduced explicit cross-area/entity selection for
integration-owned structural nodes, while keeping area-first defaults for
HA-backed wrappers.

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
1. **HT vs HA**: Topomation is for *behavior* and *organization*; Home Assistant is for *physical registry*. HT should not be limited by HA's flat model.
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
- ✅ Core-emitted rename/parent/delete events are deterministic for adapters that consume them
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

### ADR-HA-015: HA Service Wrapper Contract Alignment (2026-02-23)

**Status**: ✅ APPROVED

**Context**:
The HA service wrapper drifted from the core occupancy API:
- `topomation.clear` behavior needed to stay strictly source-scoped
  (source release with optional trailing timeout), while authoritative vacant
  intent required a distinct command path.
- Lock/unlock/vacate calls omitted `source_id`, reducing determinism for
  multi-source lock semantics.
- Service dispatch implicitly selected the first loaded config entry, which is
  unsafe when multiple entries are loaded.
- Service registration did not explicitly handle repeated setup/unload cycles.

**Decision**:
Standardize the wrapper contract:
1. Keep clear semantics source-scoped (`occupancy.clear`) and add explicit
   authoritative single-location vacate service (`topomation.vacate` ->
   `occupancy.vacate`).
2. Require source-aware forwarding for lock/unlock/vacate behavior.
3. Add optional `entry_id` routing for all services, and reject ambiguous calls
   when multiple entries are loaded and `entry_id` is omitted.
4. Make service registration idempotent and unregister services when the last
   config entry unloads.

**Rationale**:
1. Keep event/command terminology explicit and unambiguous
2. Align integration behavior with core occupancy semantics
3. Avoid cross-entry ambiguity in multi-instance setups
4. Reduce lifecycle regressions during reload/restart workflows

**Consequences**:
- ✅ Service calls now map correctly to core occupancy methods
- ✅ Multi-source lock behavior is deterministic in the wrapper path
- ✅ Multi-entry setups have explicit routing semantics
- ⚠️ Multi-entry users must provide `entry_id` for manual service calls

---

### ADR-HA-016: Archive Legacy Root Status Docs (2026-02-23)

**Status**: ✅ APPROVED

**Context**:
Root-level status snapshots (`BIDIRECTIONAL-SYNC-COMPLETE.md`,
`COMPLETION-SUMMARY.md`, `IMPLEMENTATION-STATUS.md`, `NEXT-STEPS.md`) diverged
from current implementation state and duplicated information already tracked in
ADR/changelog/history docs.

**Decision**:
Remove the legacy root status files and treat these as canonical status sources:
1. `CHANGELOG.md` for release-facing deltas
2. `docs/adr-log.md` for architectural decisions
3. `docs/history/*` for time-boxed implementation notes

**Rationale**:
1. Single source of truth for operational status
2. Lower doc drift and maintenance overhead
3. Clear separation between active docs and archived narrative history

**Consequences**:
- ✅ Reduced duplicated/stale status documents
- ✅ Easier onboarding to current state
- ⚠️ Links to deleted root status docs must be updated if discovered

---

### ADR-HA-017: HA Registry Mutations Are Out of Scope for This Adapter (2026-02-24)

**Status**: ✅ APPROVED

**Context**:
The integration currently includes code paths that mutate Home Assistant Area/Floor
registries from the topology panel and topology mutation handlers (e.g. area create,
area/floor rename, floor assignment writeback). This blurs ownership boundaries and
increases conflict risk between HA-native settings and topology UI operations.

**Decision**:
Treat Home Assistant Area/Floor registries as **read-only** in this adapter:
1. Users create/rename/manage Areas and Floors in HA Settings menus only.
2. This adapter imports and reflects HA registry state into topology.
3. Topology-originated lifecycle mutations no longer write back to HA
   area/floor registry, except floor-link synchronization for HA-backed areas
   during explicit hierarchy reorder.
4. UI flows no longer call HA registry create/update endpoints directly.

**Rationale**:
1. Keep adapter scope thin and predictable ("wrapper, not owner of HA registry")
2. Reduce accidental global edits from topology UX actions
3. Simplify sync conflict handling and operator mental model
4. Align with HA-native information architecture for Area/Floor administration

**Consequences**:
- ✅ Clear ownership boundary: HA menus are authoritative for Areas/Floors
- ✅ Lower risk of loop/conflict behavior from bidirectional write paths
- ✅ Simpler support/debugging for naming and floor-link discrepancies
- ✅ Legacy topology→HA rename/delete/floor-writeback handlers removed from adapter code
- ✅ Explicit hierarchy reorder path syncs HA-backed area `floor_id` from nearest floor ancestor (or `null` at root/no-floor)
- ⚠️ Less convenience: no one-click HA area creation/rename from topology panel
- ⚠️ Users may switch between HA Settings and topology UI during setup

**Supersedes / Narrows**:
- Narrows ADR-HA-014 by disabling topology→HA writeback paths for area/floor metadata
  in the current adapter policy.

---

### ADR-HA-018: Explicit Signal-Key Sources for Interaction Entities (2026-02-24)

**Status**: ✅ APPROVED

**Context**:
Occupancy source UX and bridge behavior drifted when activity-style entities
(media players and advanced lights) were modeled as a single source row.
Users needed independent control for different interaction channels:

- media playback vs volume vs mute
- light power vs brightness level changes vs RGB/color changes

Without explicit decomposition, UI behavior became inconsistent (missing OFF
behavior where expected), and bridge events could not reliably map to intended
source semantics.

**Decision**:
Adopt explicit per-signal source records using `signal_key`, with stable source
IDs: `{entity_id}::{signal_key}`.

1. Media source signals: `playback`, `volume`, `mute`
2. Light source signals: `power`, `level`, `color`
3. Bridge emits matching `signal_key` in `occupancy.signal` payload
4. UI presents each signal as its own include/config row
5. OFF behavior remains configurable for state signals (`power`), and is
   suppressed for interaction-only signals (`volume`, `mute`, `level`, `color`)

**Rationale**:
1. Clear and predictable behavior mapping per interaction type
2. Better UX than overloading one source row with mixed semantics
3. Deterministic routing between incoming events and configured sources
4. Extensible pattern for future signal families without schema churn

**Consequences**:
- ✅ User intent maps directly to source configuration
- ✅ Event bridge and UI use the same signal taxonomy
- ✅ Advanced light/media interactions are first-class occupancy sources
- ⚠️ More rows in source lists for rich entities
- ⚠️ Existing assumptions that one entity equals one source are no longer valid

---

### ADR-HA-019: Single Integration with Internal Module Boundaries (2026-02-24)

**Status**: ✅ APPROVED

**Context**:
A design review session raised the question of whether the integration should be
split into separate HA integrations: one for topology hierarchy, one for occupancy
detection, and a future one for actions. The question was motivated by the
observation that topology is infrastructure that occupancy needs, occupancy is
infrastructure that actions need, and each layer has independent value.

Three structural options were considered:
1. **Split**: Separate HA integrations (`topomation_topology`, `topomation_occupancy`, `topomation_actions`)
2. **One integration, add actions later as a module within it**
3. **Expose state only**: Integration produces HA entities; users write native HA automations

**Decision**:
Keep this as a **single HA integration** with **internal module boundaries**:

1. **Topology layer** (current scope): Location hierarchy, HA area/floor sync, panel UI
2. **Occupancy module** (current scope): Source config, occupancy sensors, timeout coordination
3. **Actions module** (v0.2+): Rules triggered by occupancy state — deferred; design TBD
4. **Naming**: "Topomation" retained for now; a more descriptive name is an open question for a future decision when the full feature set is clearer

**Rationale**:
1. **Topology enables occupancy**: Hierarchical rollup (child → parent propagation) is the primary
   reason occupancy needs topology. They are correctly coupled.
2. **Single install**: Users install one HACS component. No dependency ordering, no
   split configuration across multiple Devices & Services entries.
3. **HA integration dependencies are fragile**: Cross-integration data sharing via
   `manifest.json` dependencies is unusual in HA and creates lifecycle complexity.
4. **Module split is internal, not external**: The kernel already structures this
   as modules. The HA integration mirrors that internally without exposing the
   split as a user-facing install decision.
5. **Actions can be additive**: A future Actions tab in the existing panel is less
   friction than a second integration that users must discover and install separately.

**Consequences**:
- ✅ Single install, single Devices & Services entry, single panel
- ✅ Clean internal module boundaries still maintained (topology layer, occupancy module)
- ✅ Actions deferred without blocking v0.1.0
- ✅ Native HA automations can consume occupancy sensors in the interim (no gap)
- ⚠️ Integration name "Topomation" undersells the occupancy value — naming review deferred
- ⚠️ Actions module design needs a dedicated session before v0.2+ scoping

**Open Question (not decided)**:
What does the Actions module provide that standard HA automations consuming
`binary_sensor.occupancy_*` entities cannot? The answer to this question should
drive v0.2+ scoping.

---

### ADR-HA-020: Integration-Owned Building/Grounds Topology with HA Floor/Area Import (2026-02-24)

**Status**: ✅ APPROVED (phased, non-breaking rollout)

**Context**:
The integration already treats area-with-children as a core behavior model for
occupancy rollup, while Home Assistant registry structure remains floor/area
focused and intentionally limited. Design discussion identified two practical
needs:

1. Support homes where users need multiple top-level structures (for example
   main building plus detached spaces/grounds) without introducing full
   multi-property orchestration complexity.
2. Support global/building-level policy devices (for example security panel
   `arm_away`) that should apply occupancy actions across a selected subtree.

At the same time, we do not want a synthetic "property root" requirement or a
schema that forces users to model remote/multi-instance properties.

**Decision**:
Keep Home Assistant and integration responsibilities split, and extend topology
with integration-owned structure where HA has no native concept.

1. **No mandatory property root**:
   - Keep rootless behavior (multiple top-level roots allowed).
   - Do not require a synthetic `house`/`property` node.

2. **HA-native structures remain imported**:
   - Continue importing HA `floor` and `area` wrappers.
   - HA remains lifecycle authority for floor/area create/rename/delete.

3. **Integration-owned location types are allowed**:
   - Add optional topology-owned nodes for `building`, `grounds`, and `subarea`
     (or equivalent naming, finalized in implementation).
   - These nodes are behavioral containers and do not imply HA registry objects.

4. **Area-child hierarchy stays core**:
   - HA-backed areas may continue to have child areas/subareas in integration
     topology even though HA registry is flat.
   - Occupancy/security behaviors execute against the integration tree.

5. **Source assignment model by node capability**:
   - HA-backed area nodes: retain area-entity discovery flow.
   - Integration-owned nodes (`building`/`grounds`/`subarea`): use explicit
     "Add Source" assignment from HA entities.

6. **Policy-source scope for global devices**:
   - Global entities (alarm panel, mode switches, etc.) are configured as
     scoped policy bindings targeting one or more topology roots/subtrees.
   - Example policy mapping: `armed_away -> vacate subtree`.

7. **Outdoors/grounds are first-class integration nodes**:
   - Do not require "outside" to be represented as an HA floor.
   - Outdoor HA areas may be mapped under `grounds` when desired.

8. **Migration posture**:
   - Existing floor/area-only topologies remain valid.
   - New node types and policy bindings are opt-in and additive.

**Rationale**:
1. Preserves HA alignment where HA is strong (`floor`/`area` metadata and
   entity assignment).
2. Preserves integration differentiation where HA is weak (hierarchical areas,
   global policy scoping, grounds/building semantics).
3. Avoids forcing multi-property abstraction for users running one local HA
   instance.
4. Minimizes migration risk by keeping the current model as a valid subset.

**Consequences**:
- ✅ Supports detached structures and grounds without abusing HA floors
- ✅ Keeps area-with-children as a first-class occupancy feature
- ✅ Enables deterministic scope for security/global policy devices
- ✅ Avoids mandatory synthetic property roots
- ⚠️ Introduces additional node types that require clear UI affordances
- ⚠️ Explicit source assignment is required for integration-owned nodes
- ℹ️ This decision narrows/supersedes ADR-HA-002's strict "area entities only"
  rule by allowing explicit cross-area assignment for integration-owned nodes
  while preserving area-local discovery defaults for HA-backed areas

**Alternatives Considered**:
- Synthetic property root everywhere: rejected (extra complexity, weak HA fit)
- Ignore HA floors entirely: rejected (loses useful HA-native structure)
- Model outdoors as HA floor by default: rejected (semantic mismatch)

---

### ADR-HA-021: Three Sidebar Managers with Shared Panel Core (2026-02-24)

**Status**: ⚠️ SUPERSEDED

**Context**:
The single "Location Manager" panel currently mixes three concerns in one view:
topology structure, occupancy tuning, and action-rule authoring. In live usage,
occupancy and actions are conceptually distinct operator workflows, while
topology management is structural and less frequent.

**Decision** (original trial):
Expose three HA sidebar entries that share one frontend implementation:

1. `Location Manager` (`/topomation`)
2. `Occupancy Manager` (`/topomation-occupancy`)
3. `Actions Manager` (`/topomation-actions`)

Each entry loads the same `topomation-panel` module and location tree; the
selected manager determines the default/right-panel focus (topology, occupancy,
or actions).

**Rationale**:
1. Keeps one integration and one code path while improving task-oriented UX.
2. Reduces context-switching for operators focused on occupancy tuning.
3. Keeps actions discoverable without forcing users through topology-first flow.
4. Avoids split integrations or duplicated frontend stacks.

**Consequences** (trial):
- ✅ Better information architecture in the HA sidebar for day-to-day workflows
- ✅ Reuse of existing panel/tree/state subscriptions (low implementation risk)
- ✅ No migration required for stored topology/module config data
- ⚠️ Slightly higher sidebar surface area (three entries instead of one)
- ℹ️ This is a UX decomposition, not a backend architecture split

**Superseded By**:
- Follow-up UX decision (2026-02-25): keep one visible sidebar entry
  (`Location Manager`) and preserve `/topomation-occupancy` and
  `/topomation-actions` as deep-link aliases that set default view focus.

**Why Superseded**:
- Occupancy and actions workflows still require shared tree selection context.
- Multiple sidebar entries introduced navigation duplication without reducing
  panel complexity.

**Alternatives Considered**:
- Keep single panel with tabs only: adopted (with alias routes for deep links)
- Split into separate integrations: rejected (installation/lifecycle complexity)

---

### ADR-HA-022: Startup Reconciliation Makes HA Canonical for HA-Backed Wrappers (2026-02-24)

**Status**: ✅ APPROVED

**Context**:
The integration restores persisted topology/config at startup before syncing from
Home Assistant registries. Without explicit boot-time reconciliation, stale
persisted values for HA-backed wrappers (`floor_*`, `area_*`) can survive until a
later registry event occurs.

**Decision**:
After loading persisted configuration, run startup reconciliation against current
HA floor/area/entity registries and force canonical HA values for HA-backed
wrappers:

1. Floor/area names are updated from HA registry values.
2. Area parent linkage is updated from HA `floor_id` (or root when no floor).
3. Wrapper metadata is normalized:
   - `sync_source=homeassistant`
   - `sync_enabled=true`
   - current `ha_area_id` / `ha_floor_id`
4. Area entity membership is reconciled to exact HA area assignments.
5. Invalid persisted payloads remain non-fatal (ignored).

**Rationale**:
1. Enforces the ownership boundary from ADR-HA-017 at startup, not only during
   later live events.
2. Prevents stale local state from appearing authoritative after restart.
3. Produces deterministic startup behavior for validation and operations.

**Consequences**:
- ✅ HA-backed wrappers converge to HA truth immediately on boot
- ✅ Reduced drift between `.storage` state and HA registries
- ✅ Sync ownership flags cannot persist in an invalid state for HA wrappers
- ⚠️ Manual edits to HA-wrapper records in storage are overwritten at startup
- ℹ️ Topology-only nodes remain additive and unaffected by this reconciliation

**Alternatives Considered**:
- Lazy reconciliation only via later registry events: rejected (non-deterministic boot)
- Trust persisted wrapper state over HA registries: rejected (violates adapter ownership model)

---

### ADR-HA-023: Location-First Workspace with Building/Grounds Structural Context (2026-02-25)

**Status**: ✅ APPROVED

**Context**:
ADR-HA-020 introduced integration-owned structural nodes (`building`, `grounds`,
`subarea`). Occupancy and actions workflows still require the same location tree
selection context as topology management. A split-manager sidebar experiment
was already superseded in ADR-HA-021.

**Decision**:
Keep a location-first workspace model:

1. One visible sidebar entry (`Location Manager`) with shared tree context.
2. Occupancy/actions are right-panel concerns (tab/alias driven), not separate trees.
3. Building/grounds/subarea behavior is validated and documented as baseline
   fixture/test topology, not treated as edge-case examples.

**Rationale**:
1. Prevents duplicated navigation while preserving deep-link entry points.
2. Keeps global policy and source assignment workflows anchored to one selected node.
3. Aligns test fixtures, harness data, and docs with the actual post-ADR-020 model.

**Consequences**:
- ✅ UI flow stays coherent for topology + occupancy + actions
- ✅ Building/grounds scenarios are first-class in tests and validation checklists
- ✅ No migration required for persisted data or routes
- ⚠️ Tree/inspector UX must stay clear for both HA-backed and integration-owned nodes

---

### ADR-HA-024: Floor Parenting Constraint (Root or Building Only) (2026-02-25)

**Status**: ✅ APPROVED

**Context**:
With `building` and `grounds` wrappers now first-class, floor placement needed an
explicit and stable constraint for UI validation and drag/drop behavior.

**Decision**:
For frontend hierarchy validation:

1. `floor` nodes may be either:
   - root-level (`parent_id = null`), or
   - children of `building` nodes.
2. `floor` nodes cannot be children of `grounds`, `area`, `subarea`, or other `floor` nodes.
3. `building` and `grounds` remain root-only wrappers.

**Rationale**:
1. Matches the structural intent of `building` as the indoor container for floor stacks.
2. Prevents invalid semantics such as floors under outdoor/grounds branches.
3. Preserves a useful rootless mode for users who do not model buildings explicitly.

**Consequences**:
- ✅ Clear floor placement contract in UI and tests
- ✅ Predictable drag/drop outcomes for mixed building/grounds topologies
- ✅ Backward compatible with existing root-level floor installs
- ⚠️ Legacy explicit-root patterns with floors under non-building wrappers are no longer valid move targets

---

### ADR-HA-025: Inspector Tab Model — Detection + Split Occupied/Vacant Actions (2026-02-25)

**Status**: ✅ APPROVED

**Context**:
The inspector previously used two tabs (`Occupancy`, `Actions`). In practice this
mixed occupancy-source configuration with two distinct automation intents
(`occupied` vs `vacant`) in one actions surface.

**Decision**:
Adopt a three-tab inspector model:

1. `Detection` — occupancy source assignment and timeout behavior
2. `On Occupied` — automation rules with trigger `occupied`
3. `On Vacant` — automation rules with trigger `vacant`

Route aliases continue to work as default-focus helpers:

- `/topomation-occupancy` defaults to `Detection`
- `/topomation-actions` defaults to `On Occupied`

Users can still switch tabs after landing.

**Rationale**:
1. Keeps sensor/detection concerns separate from action execution concerns.
2. Reduces ambiguity in the actions UI by separating trigger intent.
3. Preserves existing deep links without introducing sidebar duplication.

**Consequences**:
- ✅ Clearer operator workflow in the inspector
- ✅ Faster rule authoring for occupied/vacant-specific behavior
- ✅ Backward-compatible route aliases and shared tree selection context
- ⚠️ Frontend tests/docs must track updated tab labels

---

### ADR-HA-026: Location Lifecycle in Panel — Rename Everywhere, Delete for Non-Root Nodes (2026-02-25)

**Status**: ✅ APPROVED

**Context**:
The panel already supported hierarchy edits and creation, but delete was blocked
and rename/delete behavior was inconsistent with the topology-owned
`building`/`grounds` model.

**Decision**:
Enable lifecycle operations with explicit ownership boundaries:

1. `rename` remains supported via `locations/update` for both topology-owned and
   HA-backed wrappers (HA-backed rename is synced to HA registry where applicable).
2. `delete` is enabled for all non-root locations (including HA-backed floor/area wrappers).
3. `delete` is blocked only for explicit Home root location.
4. When deleting any node with children, direct children are
   reparented to the deleted node's parent (one-level lift), then the node is deleted.
5. For HA-backed wrappers, delete is forwarded to HA area/floor registries first;
   topology wrappers are then removed by sync (or fallback direct delete).

**Rationale**:
1. Supports real topology maintenance workflows (cleanup, restructuring).
2. Preserves HA ownership of floor/area lifecycle while allowing panel-originated lifecycle requests.
3. Avoids destructive subtree cascades as default behavior.

**Consequences**:
- ✅ Inline rename + delete now work end-to-end from the panel
- ✅ HA-backed lifecycle authority remains intact (delete forwarded to HA registries)
- ✅ Building/grounds cleanup no longer requires backend hacks
- ⚠️ Delete semantics now include implicit child reparenting; UI messaging must remain clear

---

### ADR-HA-027: Actions Persisted as Native HA Automations (2026-02-25)

**Status**: ✅ APPROVED

**Context**:
The inspector already split action intent by trigger (`On Occupied` / `On Vacant`),
but action tabs did not create first-class HA automations. That created two
problems:

1. Rules were not first-class Home Assistant automations (limited interoperability).
2. Long-term product direction remained open on whether actions should duplicate HA's
   automation system or layer on top of it.

**Decision**:
For inspector action tabs, persist and manage rules as native Home Assistant
automations:

1. `+ Add Rule` creates a real HA automation (`automations.yaml` / automation entity).
2. `On Occupied` and `On Vacant` tabs filter by Topomation metadata embedded in
   automation description (`location_id`, `trigger_type`).
3. Topomation assigns automation labels/category for organization and discoverability.
4. Delete/toggle operations act on HA automation entities/config entries directly.
5. No separate integration-local rule store is introduced.

**Rationale**:
1. Keeps automation lifecycle inside HA's native, well-supported rules system.
2. Avoids building a parallel rule domain with overlapping semantics.
3. Lets users inspect/edit/run rules from standard HA automation tooling.
4. Preserves inspector UX while reducing backend-specific action state.

**Consequences**:
- ✅ Occupied/vacant actions are first-class HA automations
- ✅ Better interoperability with existing HA tooling (automation editor, traces, labels/search)
- ✅ Clear ownership model: Topology selects scope/context, HA executes automations
- ⚠️ Requires admin permissions for automation config APIs
- ⚠️ Metadata marker must remain stable for robust tab filtering

---

### ADR-HA-028: Manual Occupancy Tree Controls with Lock-Safe Vacate Semantics (2026-02-25)

**Status**: ✅ APPROVED
**Lifecycle**: Active. Extended by ADR-HA-029 for automation lock policy modes/scopes.

**Context**:
Operators needed a fast way to force occupancy state during testing and live
validation directly from the location tree. Two constraints had to remain true:

1. Locked locations must remain immutable.
2. "Set vacant" must actually vacate effective occupancy state, not only clear a
   single source contribution.

Using `clear` for manual "vacant" was insufficient when occupancy remained active
because of other contributions or descendant rollups.

**Decision**:
Add row-level manual occupancy controls in the left location tree and route them
to explicit service wrappers:

1. `set occupied` -> `topomation.trigger(location_id, source_id="manual_ui", timeout=default_timeout)`
2. `set unoccupied` -> `topomation.vacate_area(location_id, source_id="manual_ui", include_locked=false)`
3. Before either action, check lock state from occupancy entity attributes and
   reject with a warning toast when locked.
4. Persist runtime occupancy mutations by scheduling debounced autosave on
   `occupancy.changed`.

**Rationale**:
1. Tree-level control keeps manual testing fast and local to the selected
   topology context.
2. `vacate_area` expresses operator intent ("make this location vacant now")
   better than source-level `clear`.
3. Lock pre-check enforces the hard invariant: locked state cannot be overridden.
4. Autosave-on-change ensures manual overrides survive restart/reload windows.

**Consequences**:
- ✅ Occupied/unoccupied manual testing is available without opening service tools
- ✅ Lock semantics remain strict and user-visible
- ✅ Vacate behavior is deterministic for subtree state
- ✅ Runtime occupancy changes are persisted via existing debounced save path
- ⚠️ Vacate excludes locked descendants by default (`include_locked=false`)
- ⚠️ UI icon states reflect effective occupancy state, not per-source diagnostics

---

### ADR-HA-029: Automation-first lock policies with mode/scope contract (2026-02-25)

**Status**: ✅ APPROVED

**Context**:
The existing `lock/unlock` controls solved local freeze behavior but did not
cleanly model two primary HA automation intents:

1. Away/security mode: prevent occupancy from becoming active in a scope.
2. Party/manual hold mode: keep occupancy active in a scope.

Manual UI controls are useful for validation, but production behavior is driven
by Home Assistant automations, helpers, and alarm state changes.

**Decision**:
Extend lock service contract and core semantics:

1. `topomation.lock` accepts:
   - `mode`: `freeze | block_occupied | block_vacant`
   - `scope`: `self | subtree`
2. `topomation.unlock` remains source-aware (`source_id` must match intent owner).
3. Add `topomation.unlock_all` for emergency/operator reset.
4. Scope application is inherited policy evaluation, not lock-copy fanout to
   every child node.
5. Keep row-level lock UI as a fast operator/test surface; canonical long-lived
   behavior should be configured via HA automations.
6. Ship starter blueprints for `away` and `party` workflows.

**Rationale**:
1. Separates occupancy propagation from occupancy policy constraints.
2. Matches how users actually operate HA (events, automations, helpers).
3. Avoids stale descendant lock-copy state and unlock fanout complexity.
4. Preserves deterministic source-aware lock ownership.

**Consequences**:
- ✅ Away/security flow can block occupied transitions for selected scopes
- ✅ Party/manual flow can hold occupied transitions for selected scopes
- ✅ Existing local lock calls remain backward compatible (`freeze`, `self`)
- ✅ Explicit global reset path exists via `unlock_all`
- ⚠️ Additional service fields require updated docs and blueprint guidance
- ⚠️ Mixed lock modes from different sources require clear operator naming conventions

---

### ADR-HA-030: Managed Action "Only When Dark" Uses Sun-Based Guard First (2026-02-26)

**Status**: ✅ APPROVED

**Context**:
Users need a simple way to prevent occupied/vacant action automations from running
in daylight without introducing more Topomation entities. Ambient/lux-based logic
is useful but requires additional UX and calibration rules that are not finalized.

**Decision**:
Add an inline `Only when dark` checkbox for managed action rows (On Occupied and
On Vacant). When enabled, Topomation writes a Home Assistant automation condition:

1. `condition: state`
2. `entity_id: sun.sun`
3. `state: below_horizon`

The guard is stored in managed automation metadata (`require_dark`) and reflected
from automation config on load. Lux/entity-based dark guards are deferred.

**Rationale**:
1. Provides immediate user value with minimal complexity.
2. Avoids creating additional entity surface while dark-mode semantics are still evolving.
3. Uses a stable built-in HA signal (`sun.sun`) available on all installs.
4. Keeps managed rule behavior transparent in native HA automation editor/config.

**Consequences**:
- ✅ Users can gate managed actions to nighttime with one checkbox per device action.
- ✅ No new Topomation entities are required for this feature.
- ✅ Existing managed actions remain backward compatible (no condition by default).
- ⚠️ Sun position is a coarse proxy and does not represent room-specific darkness.
- ℹ️ Future enhancement path: optional lux-based dark guards with explicit sensor/threshold config.

---

### ADR-HA-031: CI Gate De-duplication with Runtime Bundle Parity Contract (2026-02-26)

**Status**: ✅ APPROVED

**Context**:
CI and release latency increased because the pipeline executed duplicated work:

1. Backend checks ran in the `backend` job and again inside the comprehensive job.
2. Frontend unit/build checks ran in the `frontend` job and again inside the comprehensive job.
3. A stale committed runtime bundle (`frontend/topomation-panel.js`) can pass local tests
   unless parity with `dist/topomation-panel.js` is explicitly verified.

This caused slow release feedback loops and allowed bundle drift until CI failed.

**Decision**:
Split CI responsibilities and make parity explicit:

1. Keep `backend` job as the single source for Python checks (`hassfest`, lint, mypy, pytest).
2. Keep `frontend` job as the single source for frontend unit/build/parity checks.
3. Keep `comprehensive` job, but scope it to browser suites only (`Web Test Runner` + `Playwright`).
4. Add workflow `concurrency` cancellation for CI and auto-release to avoid stale queued runs.
5. Preserve full local `./scripts/test-comprehensive.sh` for release-candidate validation.

**Rationale**:
1. Maintains test coverage while removing redundant environment bootstrap.
2. Reduces wall-clock release time on push-to-main.
3. Converts bundle drift into a deterministic, early failure condition.
4. Improves contributor feedback speed without weakening gates.

**Consequences**:
- ✅ Faster CI and release turnaround with no loss of test categories.
- ✅ Clear contract: `dist/topomation-panel.js` must match committed runtime bundle.
- ✅ Less duplicated Python/Node setup in GitHub Actions.
- ⚠️ Browser-suite failures now isolate to comprehensive job and require Playwright/WTR triage.
- ℹ️ Local contributors should run `./scripts/test-comprehensive.sh` before release-cut commits.

---

### ADR-HA-032: Managed Action Rules Must Survive Registry Permission Gaps and External Drift (2026-02-26)

**Status**: ✅ APPROVED

**Context**:
Live installs reported a repeatable failure mode for `On Occupied`/`On Vacant`
managed action toggles:

1. Checkbox showed `Saving...`, then reverted to unchecked.
2. Behavior reproduced on production installs despite mock/dev success.
3. Some environments restrict panel access to `config/entity_registry/list`.
4. External HA edits/deletes of managed automations could leave inspector rows stale.

The integration must remain reliable under these real-world conditions.

**Decision**:

1. Keep managed actions automation-first (HA automation config API is the source of truth).
2. Add entity-registry fallback:
   - If `config/entity_registry/list` fails, discover automations from `hass.states`.
3. Add optimistic UI write-through for managed action toggles/selectors:
   - Preserve intended state locally while backend registry/config converges.
4. Subscribe inspector to `state_changed` for `automation.*` and debounce reloads so
   external add/delete/edit changes reconcile without manual refresh.
5. Add both local and live test gates for this contract:
   - frontend unit/component + production smoke failure modes
   - live HA managed-action API contract test.

**Rationale**:

1. Registry permission variability is common in production HA setups.
2. Eventual consistency and async registry updates should not break UX intent.
3. External automation mutations are unavoidable and must be reflected quickly.
4. Contract-level live testing prevents mock-only blind spots.

**Consequences**:

- ✅ Managed action saves no longer depend on registry list permissions.
- ✅ UI remains stable through backend consistency windows.
- ✅ External automation changes are reconciled while inspector is open.
- ✅ Release gate now includes failure-mode coverage matching production issues.
- ⚠️ Subscribing to all `automation.*` state changes increases reload frequency while inspector is open (mitigated by debounce).
- ℹ️ Live contract test remains opt-in locally and requires HA token/config.

---

### ADR-HA-033: Managed Action Verification Must Not Silently Revert on Automation Config Read Failures (2026-02-26)

**Status**: ✅ APPROVED

**Context**:
Live installs still reported `Saving...` followed by unchecked managed actions even after ADR-HA-032.
Investigation showed two practical blind spots:

1. Live contract assumptions treated entity IDs as `automation.<config_id>`, but HA entity IDs are alias-slug based while `config.id` maps to registry `unique_id`.
2. When `automation/config` reads fail across candidates, the frontend previously returned an empty rule list instead of surfacing a read failure, which could visually revert toggles despite successful writes.

**Decision**:

1. Treat registry `unique_id` as the source of truth for config ID correlation in live tests and verification flow.
2. In managed rule enumeration, throw an explicit error when all candidate `automation/config` reads fail and Topomation automation evidence exists.
3. Keep optimistic managed-action state on read failures by reusing existing `_loadActionRules` error-preservation behavior.
4. Add stage-level diagnostics in inspector save handlers (start/complete/error with context + duration) for toggle/service/dark updates.
5. Update release runbook live gate command to `--no-cov` for single-test local validation.

**Rationale**:

1. Aligns tests and runtime behavior with HA’s real entity/registry model.
2. Converts silent false-negative verification into actionable failure signal.
3. Prevents UX rollback when writes succeeded but reads are temporarily/permission blocked.
4. Shortens production triage cycles with deterministic console evidence.

**Consequences**:

- ✅ Managed action UI no longer silently “reverts” on total config-read failures.
- ✅ Browser logs show exact save stage and elapsed time for triage.
- ✅ Live contract test now mirrors HA entity registration semantics.
- ⚠️ When verification reads are blocked, users see explicit error messaging instead of implicit success.

---

### ADR-HA-034: No-Mock Release Gate Requires Real HA Contract Pass (2026-02-26)

**Status**: ✅ APPROVED

**Context**:
Mock and browser-harness tests provide broad coverage but cannot prove Home Assistant
runtime API/registry behavior on production-like installs. Recent regressions showed
that shipping from mock-only evidence leads to costly deploy-test-iterate loops.

**Decision**:

1. Define a mandatory live release gate for all version/tag cuts.
2. Keep HA token material local only in `tests/ha-config.env` (gitignored).
3. Add `make test-release-live` as the canonical release-prep command.
4. Require the live managed-action contract test to pass before bump/tag:
   `tests/test-live-managed-actions-contract.py --live-ha --no-cov`.

**Rationale**:

1. Validates the exact HA endpoints that managed actions depend on.
2. Prevents mock-only green builds from being treated as release-ready.
3. Creates a repeatable operator workflow across contributors and environments.

**Consequences**:

- ✅ Releases now require proof against real running HA software.
- ✅ Token handling is explicit and safer (local gitignored secret file).
- ✅ Trial-and-error knowledge is captured as a repeatable runbook command.
- ⚠️ Release prep now requires accessible live HA credentials.

---

### ADR-HA-035: Topomation Panel Routes Must Be Admin-Only (2026-02-26)

**Status**: ✅ APPROVED

**Context**:
Managed action create/update/delete flows are backed by Home Assistant config APIs
(`config/automation/config/*`) that are admin-gated in core. Topomation routes were
registered with `require_admin=False`, allowing non-admin sessions into a panel that
could attempt writes and fail at runtime with no deterministic up-front guardrail.

**Decision**:

1. Register all Topomation panel routes with `require_admin=True`.
2. Keep managed-action release validation focused on admin-session execution.
3. Document admin requirement in installation, contracts, and release triage docs.

**Rationale**:

1. Aligns integration UX with HA core authorization model.
2. Prevents non-admin users from entering a write-dependent panel and hitting
   confusing save failures.
3. Reduces production ambiguity when diagnosing "rules not created" reports.

**Consequences**:

- ✅ Deterministic permission boundary for panel and managed-action writes.
- ✅ Fewer false debugging paths around payload/consistency when issue is auth.
- ⚠️ Non-admin users lose panel access unless promoted or proxied through an admin workflow.

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
