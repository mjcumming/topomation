# Architecture Decision Records (ADR) - topomation

> Decisions specific to the Home Assistant integration layer.
> For core library decisions, see the Topomation core ADR log.

**Purpose**: Track significant decisions for the HA integration.

**Interpretation rule**:

1. ADRs are historical records; older entries may intentionally describe behavior
   that has since changed.
2. When ADRs conflict on the same concern, the most recent approved ADR (or an
   explicit lifecycle note such as "superseded by ...") wins.
3. Current enforceable behavior remains `docs/contracts.md` and
   `docs/architecture.md`, with ADRs providing the decision rationale/history.

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

### ADR-HA-036: Managed Action Writes Move to Integration-Backend WebSocket Commands (2026-02-27)

**Status**: ✅ APPROVED

**Context**:
Managed action edits previously relied on browser-driven automation-config writes.
This made production debugging difficult because panel sessions could diverge from
integration runtime behavior and permission boundaries.

**Decision**:

1. Make managed action operations WS-first with explicit Topomation commands:
   - `topomation/actions/rules/list`
   - `topomation/actions/rules/create`
   - `topomation/actions/rules/delete`
   - `topomation/actions/rules/set_enabled`
2. Move HA automation mutation logic into integration backend code
   (`managed_actions.py`) running inside Home Assistant.
3. Keep frontend legacy fallback only for compatibility with older installs that do
   not expose the new WS command set.
4. Add backend contract tests for the new WS handlers plus managed-actions helper tests.

**Rationale**:

1. Ensures the same code path is used in dev and real HA installs.
2. Keeps automation mutation authority in HA backend runtime where validation/reload/logging are native.
3. Reduces false confidence from browser-only/mock paths.
4. Improves observability and deterministic failure modes for `Saving...` regressions.

**Consequences**:

- ✅ Panel save flows now exercise integration backend logic directly.
- ✅ Live contract testing better reflects production behavior.
- ✅ Backend can centrally enforce metadata/tag/category conventions on managed rules.
- ⚠️ Requires WebSocket API parity between frontend bundle and backend integration version.

---

### ADR-HA-037: Managed Action Registration Must Be Verified In-Instance (2026-02-27)

**Status**: ✅ APPROVED

**Context**:
Repeated production reports still showed `Saving...` followed by unchecked managed
actions. Root causes were amplified by two behaviors:

1. Backend create path could report success before Home Assistant had actually
   registered the automation entity.
2. Frontend create/delete/enable paths still had compatibility fallbacks that
   could drift from the intended in-instance integration contract.

This created ambiguous signals and expensive deploy-test-iterate loops.

**Decision**:

1. Enforce registration verification in backend create flow:
   - after write + reload, require automation registration convergence.
   - if convergence fails, rollback the write and return explicit failure.
2. Enforce timeout-bound reload handling with clear error messaging.
3. Remove managed-action browser fallback behavior for create/delete/enable:
   - if Topomation WS backend commands are unavailable, fail fast with explicit
     operator guidance instead of trying alternate browser paths.
4. Document the workflow rule: managed-action validation is run in the local
   `hass` runtime in this dev container (no remote probing).

**Rationale**:

1. A write is not successful until HA runtime registration is confirmed.
2. Failing fast is safer than silent fallback divergence.
3. In-instance runtime tests match deployment architecture and reduce false confidence.
4. Explicit errors shorten triage time and reduce repeated blind iterations.

**Consequences**:

- ✅ Managed action saves now surface deterministic failures when HA does not register rules.
- ✅ Failed create attempts are rolled back to avoid stale unmanaged config entries.
- ✅ Frontend paths now consistently exercise integration backend commands.
- ✅ Workflow guidance is aligned with process-managed dev HA constraints.
- ⚠️ Older installs lacking the new WS commands now fail explicitly instead of using fallback behavior.

---

### ADR-HA-038: Managed Actions REST API and Configuration Requirements (2026-02-27)

**Status**: ✅ APPROVED

**Context**:

Managed-action rules appeared to fail in production ("Saving..." then unchecked, rules
not created) despite multiple implementation attempts (direct file I/O, include-path
detection, rollback logic). Root cause turned out to be a **configuration issue** on
the production machine: `configuration.yaml` did not include `automations.yaml`, so the
REST API wrote successfully but the automation component never loaded the file.

**Decision**:

1. Use Home Assistant's config REST API (`POST`/`GET`/`DELETE`
   `/api/config/automation/config/<id>`) exclusively. No direct file I/O.
2. Document that `automation: !include automations.yaml` must be present in
   `configuration.yaml` for managed-action (and HA UI–created) automations to load.
3. Use stable automation IDs (location + trigger + action) so saves update in place
   instead of duplicating rules.
4. Include entities whose area is inherited from their device in location entity sync
   (not only entities with direct `entity.area_id`).
5. Set area, category, and labels on created automations to match the HA UI Save dialog.

**Rationale**:

1. The REST API is the canonical path; HA handles validation, write, and reload.
2. Configuration is outside our control; clear documentation reduces support burden.
3. Stable IDs prevent duplicate-rule accumulation from repeated saves.
4. Many entities inherit area from device; omission caused incomplete SOURCES lists.
5. Matching UI metadata improves discoverability and consistency.

**Consequences**:

- ✅ REST API approach works when configuration is correct; no integration bugs.
- ✅ Stable IDs eliminate duplicate rules; cleanup script available for migration.
- ✅ Entity enumeration now includes device-inherited area assignments.
- ⚠️ Users with non-default automation include must add `automations.yaml`.
- ℹ️ Verification scripts (`verify-automation-crud.py`, `query-area-entities.py`)
  aid diagnosis.

---

### ADR-HA-039: Tree DnD — Explicit Drop Targets, No Heuristic Intent (2026-02-28)

**Status**: ✅ APPROVED

**Context**:

Tree drag-and-drop used a flat-list engine (SortableJS) and inferred tree intent from pointer position (x-offset, related row, collapsed state). That led to:

- Heuristic drift and edge cases (wrong sibling vs child vs outdent).
- Domain constraints (floor/building/area + HA sync) making wrong drops very visible and disruptive.
- Fixes that addressed symptoms rather than a single deterministic contract.

**Decision**:

1. **Strict drag contract** (see C-011): Drop outcome is determined only by which **explicit drop zone** the user releases over (before / inside / after), not by pointer x-offset or related-row heuristics.
2. **Explicit drop targets per row**: Each tree row exposes three (or four, if outdent is a zone) discrete drop targets; the UI highlights the active zone during drag. Intent = zone hovered at drop.
3. **SortableJS role**: Use SortableJS only for list reorder mechanics and pointer capture. Map final drop to (parentId, siblingIndex) from the **active drop zone** at drop time, not from flat index + heuristics.
4. **No new heuristic inference**: Remove or freeze x-offset / relatedLeft / childIntent / outdentIntent logic from intent resolution. Outdent is either an explicit zone (e.g. when hovering current parent) or a separate control.
5. **Regression coverage**: Add screenshot-based or DOM-state e2e scenarios for before/after/inside/outdent and invalid moves so DnD behavior does not regress.

**Rationale**:

1. Deterministic behavior: one drop zone → one outcome.
2. Domain rules stay in hierarchy-rules; UI only exposes valid zones (or disables invalid ones).
3. Stops “fix one edge case, break another” by eliminating inference.
4. E2E locks the contract so future changes are safe.

**Consequences**:

- ✅ Single source of truth for DnD (contract + drop-zone implementation).
- ✅ Predictable UX; no surprise “it dropped as child when I wanted sibling.”
- ⚠️ Requires refactor: replace pointer-based intent with zone-based hit-testing and optional visual zones.
- ℹ️ Implementation plan: see `docs/tree-dnd-stabilization-plan.md`.

---

### ADR-HA-040: Device Assignment Workspace Uses Single-Depth Grouped List + Left-Tree Targets (2026-03-01)

**Status**: ✅ APPROVED

**Context**:

Device assignment UX needed to support both HA-backed areas and integration-owned
structural nodes (`floor`/`building`/`grounds`) without introducing a second
recursive tree in the right panel. Prior discussions identified two risks:

- Tree-on-tree interaction complexity and accidental drag/drop errors.
- Loss of visibility when showing only unassigned devices.

**Decision**:

1. Keep a single recursive hierarchy control on the left (`ht-location-tree`).
2. Add a right-side **grouped device list** (single depth), not a recursive tree:
   `Unassigned` + assigned groups by Topomation location.
3. Support assignment by:
   - Dragging a device row (right) and dropping on a left tree location row.
   - Single-click assign from device row to currently selected left location.
4. Enforce single assignment with a dedicated backend command:
   `topomation/locations/assign_entity`.
5. Preserve integration-owned non-area assignments during HA area reconciliation:
   sync manager excludes explicitly assigned non-HA entities from HA area wrapper
   remapping.
6. If assignment target is HA-backed area, update HA entity registry `area_id`.
   For non-area targets, assignment remains Topomation metadata.

**Rationale**:

1. One hierarchy widget reduces DnD cognitive load and implementation risk.
2. Grouped list preserves full device visibility without right-side recursion.
3. Dedicated assign command clarifies contract and keeps assignment logic server-side.
4. Sync exclusion prevents HA canonical area mapping from overwriting explicit
   Topomation floor/building/grounds placement.

**Consequences**:

- ✅ Assignment UX remains simple: source list on right, targets on left.
- ✅ Supports locations Home Assistant cannot model directly.
- ✅ No sync-status/reassignment banner noise; reconciliation is silent.
- ⚠️ Topology-owned non-area assignments can diverge from HA area placement by design.
- ℹ️ Future enhancement can add bulk assignment on top of the same command.

---

### ADR-HA-041: Detection Source Enumeration Is Curated; Add Source Handles Edge Cases (2026-03-01)

**Status**: ✅ APPROVED

**Context**:

Detection source auto-enumeration in the panel regressed toward a broad
"show everything in area" list. This surfaced non-core entities (for example
`climate.*`, `vacuum.*`) and integration-owned occupancy entities in the same
list users rely on for common occupancy detection setup. It also blurred intent
between default behavior and explicit opt-in edge cases.

In parallel, `On Vacant` exposed a dark-condition toggle that is not part of
intended vacant semantics.

**Decision**:

1. Curate Detection tab in-area source enumeration to core occupancy signals:
   - `light.*`
   - `fan.*`
   - `media_player.*`
   - `binary_sensor.*` for motion/presence/occupancy/door/opening/window/lock,
     plus no-device-class camera-style binaries
   - `switch.*` only when explicitly light-classified (`device_class: light`)
2. Exclude Topomation-created occupancy entities from source selection
   (`device_class: occupancy` with `location_id`).
3. Exclude non-core appliance/control domains from core auto-enumeration
   (including `climate`, `vacuum`, `cover`).
4. Keep explicit **Add Source** broader so users can opt into edge-case/manual
   entities (for example generic switches) without cluttering default discovery.
5. Restrict dark-condition UI/behavior to **On Occupied**; **On Vacant** does
   not show dark toggle and persists `require_dark: false`.

**Rationale**:

1. Default list should reflect high-signal, common occupancy inputs.
2. Integration-owned occupancy entities are outputs and must not be looped back
   into source discovery.
3. A curated default reduces accidental misconfiguration and noisy UX.
4. Add Source preserves flexibility without weakening core defaults.
5. Vacant behavior should be deterministic and not gated by ambient light.

**Consequences**:

- ✅ Detection list now matches documented core-device policy.
- ✅ Non-core entities no longer appear in default in-area source list.
- ✅ Users still retain edge-case flexibility through Add Source.
- ✅ On Vacant actions are simpler and consistent (`require_dark: false`).
- ⚠️ Some users may need to use Add Source more often for uncommon devices.

---

### ADR-HA-042: Detection Must Exclude Occupancy-Class Inputs and Expose Full Signal Variants (2026-03-01)

**Status**: ✅ APPROVED

**Context**:

After ADR-HA-041 shipped, two UX/contract gaps remained:

1. The detection source list still allowed `binary_sensor` entities with
   `device_class: occupancy` unless they were explicitly Topomation-owned
   (`location_id` present), causing confusing rows such as
   `binary_sensor.*_occupancy • unavailable`.
2. Multi-signal entities (dimmers/media) were internally modeled with explicit
   `signal_key` variants but the UI only showed each entity's default signal in
   the core list, making `light::level` and media `volume`/`mute` effectively
   undiscoverable from the normal Detection flow.

**Decision**:

1. Exclude all occupancy-class binary sensors from source auto-enumeration
   (`device_class: occupancy`), not just Topomation-owned outputs.
2. Keep dimmer/media signal decomposition explicit in UI and always show all
   supported signal rows in the Detection core list:
   - light: `power`, `level`, `color` (as supported)
   - media: `playback`, `volume`, `mute`
3. Keep **Add Source** as the edge-case path for uncommon domains, but apply the
   same occupancy-class exclusion there.

**Rationale**:

1. Occupancy sensors are derived state and should not be treated as primary
   occupancy inputs by default.
2. Users need first-class access to dimmer-level/media interaction signals
   without hidden or implicit configuration paths.
3. This keeps the panel behavior aligned with the explicit signal-key contract
   from ADR-HA-018.

**Consequences**:

- ✅ `device_class: occupancy` no longer appears in Detection source pickers.
- ✅ Dimmers and media entities expose all configured event channels directly.
- ✅ Source discovery behavior now matches expected "on/off + level change" flows.
- ⚠️ Detection lists can show more rows for rich devices (intentional).

---

### ADR-HA-043: Detection Re-allows External Occupancy-Class Sensors (2026-03-01)

**Status**: ✅ APPROVED

**Context**:

Some integrations expose primary motion/presence intent only as
`binary_sensor.*` with `device_class: occupancy`. Excluding all occupancy-class
sensors prevented these devices from being configured in Detection.

**Decision**:

1. Keep excluding Topomation-managed occupancy outputs from Detection source
   selection (`device_class: occupancy` with `location_id`).
2. Re-allow external occupancy-class sensors in Detection source candidates
   (core list and Add Source picker) when they are not Topomation-managed
   outputs.
3. Keep ADR-HA-042 signal-variant behavior unchanged for light/media entities.

**Rationale**:

1. Topomation occupancy entities are outputs and must not loop back as inputs.
2. External occupancy-class entities can represent valid upstream detectors and
   should be selectable.
3. This preserves no-loop safety while restoring compatibility for
   occupancy-only integrations.

**Consequences**:

- ✅ Occupancy-only detectors can be configured as Detection sources.
- ✅ Topomation occupancy outputs remain excluded.
- ⚠️ Occupancy-class entities may appear in candidate lists if they are
  external to Topomation.

---

### ADR-HA-044: WIAB Presets Use Occupancy Lock Primitives; Topology Stores Structure Only (2026-03-01)

**Status**: ✅ APPROVED

**Context**:

Operators needed practical WIAB behavior for enclosed rooms and whole-home
containment without introducing confidence scoring or a separate occupancy
state model. We also needed clear boundaries between topology storage and
inference behavior.

**Decision**:

1. Add per-location WIAB preset config in occupancy module config:
   - `off`
   - `enclosed_room`
   - `home_containment`
   - `hybrid`
2. Implement preset behavior in the integration event bridge using existing
   occupancy runtime APIs:
   - `trigger`
   - `clear`
   - `lock(mode="block_vacant", scope="self")`
   - `unlock`
3. Keep topology layer responsibilities structural only (locations, adjacency,
   crossing sources). Do not move WIAB inference logic into topology.
4. Keep occupancy state binary (`occupied`/`vacant`); do not add confidence or
   unknown-state transitions for WIAB v1.

**Rationale**:

1. Reuses proven occupancy semantics and avoids parallel state machines.
2. Preserves a clean architecture boundary: topology data vs inference policy.
3. Minimizes complexity while covering primary WIAB use-cases.
4. Keeps behavior deterministic and explainable through runtime events.

**Consequences**:

- ✅ WIAB can be configured directly in Detection UI per location.
- ✅ Enclosed-room and home-containment latching behavior is now available.
- ✅ Root-level/home WIAB scenarios can operate even when trigger entities are
  not directly mapped to the root location.
- ⚠️ Preset logic is intentionally opinionated; advanced custom heuristics
  still require explicit occupancy source tuning and automations.

---

### ADR-HA-045: Detection Prioritizes Directional Linked Rooms; Adjacency Moves Behind Advanced Disclosure (2026-03-02)

**Status**: ✅ APPROVED

**Context**:

The adjacency editor exposed movement-handoff concepts (`crossing_sources`,
`handoff_window_sec`, `priority`) before most users had boundary sensors or a
need for graph tuning. For common open-plan homes, users primarily need simple
"these rooms should contribute to each other" behavior with minimal setup.

**Decision**:

1. Add directional linked-room contributors in occupancy config:
   - `linked_locations: string[]`
2. Implement runtime propagation on `occupancy.changed`:
   - source occupied -> trigger each configured target using
     `source_id="linked:<source_location_id>"`, `timeout=0`
   - source vacant -> clear that source contribution on each target with
     trailing timeout `0`
3. Require explicit reciprocal setup:
   - reverse direction is configured from the other location inspector.
4. Add feedback guard for reciprocal links:
   - do not propagate from source -> target when source is currently occupied
     by target's linked contribution (`linked:<target_location_id>`).
5. Keep adjacency/handoff implementation available, but move its UI behind an
   explicit Detection-tab advanced disclosure.
6. Constrain advanced adjacency neighbor selection to same-parent room-level
   siblings (`area`/`subarea`) to avoid cross-structure graph mistakes.
7. Constrain linked rooms to practical room topology:
   - only `area` targets directly under a `floor`
   - only immediate sibling `area` contributors under the same floor.

**Rationale**:

1. Matches real-world user constraints: use existing sensors, not lab-grade
   crossing instrumentation.
2. Preserves occupancy multi-source correctness by using source-scoped
   contributions, not hard mirroring/vacate overrides.
3. Prevents bidirectional self-latching loops while still supporting directional
   composition.
4. Reduces cognitive load in the primary Detection workflow.

**Consequences**:

- ✅ Users get a simple first-class model for shared/open-plan room behavior.
- ✅ Linked-room behavior composes with existing occupancy sources and locks.
- ✅ Advanced adjacency remains available for movement-inference workflows.
- ⚠️ Adjacency graph tuning is now a secondary path and may be discovered less
  often without explicit advanced expansion.

---

### ADR-HA-046: Dev-Container HA Commands Must Target Local Runtime Explicitly (2026-03-02)

**Status**: ✅ APPROVED

**Context**:

`tests/ha-config.env` supports multiple environments (dev/prod/local). In
dev-container workflows, Topomation policy requires process-managed local HA
validation only. Using generic `HA_URL`/`HA_TOKEN` without explicit local
binding can accidentally target a remote node for restart or release-gate
operations.

**Decision**:

1. In dev-container runbooks, commands that restart HA, probe API health, or run
   live contract tests must bind explicitly to local aliases:
   - `HA_URL_LOCAL`
   - `HA_TOKEN_LOCAL`
2. For release gate commands in dev-container workflows, pass explicit local dev
   overrides:
   - `HA_URL_DEV="$HA_URL_LOCAL" HA_TOKEN_DEV="$HA_TOKEN_LOCAL" make test-release-live`
3. Keep production validation opt-in and explicit:
   - `HA_TARGET=prod ...`
4. Update operational docs in the same change when this prerequisite is
   discovered or corrected.

**Rationale**:

1. Prevents accidental remote environment mutation from local development loops.
2. Keeps runbook behavior deterministic and reproducible across contributors and
   agents.
3. Aligns with existing policy: no remote probing/control in dev-container
   workflows unless explicitly requested.

**Consequences**:

- ✅ Local restart/release commands are safer and unambiguous.
- ✅ Release-gate runs match the intended in-container HA runtime.
- ⚠️ Commands become slightly more verbose due to explicit env binding.
- ℹ️ Production checks remain available through explicit `HA_TARGET=prod` flows.

---

### ADR-HA-047: Linked Rooms Adds Batch Editing + Optional Reciprocal Toggle (2026-03-02)

**Status**: ✅ APPROVED

**Context**:

ADR-HA-045 introduced directional linked rooms and required reverse setup from
the other location page. In real use, operators frequently tune multiple room
contributors in one pass and need fast reciprocal setup for paired rooms
(kitchen <-> family room) without repeated page switching. The first linked-room
UI iteration also temporarily locked editing during each save, creating avoidable
friction. This ADR refines ADR-HA-045 item 3 without changing the directional
runtime model.

**Decision**:

1. Keep directional linked-room semantics as the default behavior.
2. Allow queued batch editing in the linked-room checklist:
   - contributor checkboxes remain interactive while saves persist.
3. Add an optional per-row `2-way` checkbox:
   - enabled only when the forward contributor link is checked
   - when enabled, also write reverse `linked_locations` on the contributor.
4. Disabling `2-way` only removes the reverse direction, preserving forward
   direction unless user also unchecks the contributor row.
5. Clarify timeout metadata fallback copy:
   - when no vacancy timeout is scheduled, render `Vacant at No timeout scheduled`
     (not `Unknown`).

**Rationale**:

1. Preserves explicit directional intent while reducing setup steps for common
   reciprocal pairs.
2. Eliminates one-at-a-time interaction bottlenecks for practical tuning flows.
3. Keeps reciprocal behavior opt-in, avoiding accidental global mirroring.
4. Improves operator trust by replacing ambiguous status wording.

**Consequences**:

- ✅ Linked-room configuration is faster and less error-prone for open-plan homes.
- ✅ Reciprocal links are available from a single page when desired.
- ✅ Directional model and source-scoped runtime propagation remain unchanged.
- ⚠️ Enabling `2-way` triggers additional config writes (both locations).

---

### ADR-HA-048: Floor Proxy Areas Use Explicit Tags + Backend Assignment Remap (2026-03-03)

**Status**: ✅ APPROVED (Superseded by ADR-HA-049)

**Context**:

Some floor-scoped/global devices must remain in Home Assistant's native
area model (`entity_registry.area_id`) for interoperability with HA features.
Topomation floor nodes do not carry `ha_area_id`, and assignment to a floor does
not currently write an HA area. A pure name-match proxy heuristic (for example,
`area.name == floor.name`) is fragile and can hide real user areas accidentally.

**Decision**:

1. Introduce explicit floor-proxy metadata, not name inference:
   - proxy area `_meta.role = "floor_proxy"`
   - proxy area `_meta.proxy_for_floor_id = <floor_location_id>`
   - floor `_meta.proxy_area_id = <proxy_location_id>`
2. Keep HA floor/area lifecycle as source of truth.
3. When assigning an entity to a floor, backend remaps target assignment to that
   floor's configured proxy area location.
4. Enforce one active proxy area per floor.
5. Proxy area must be an HA-backed `area` node parented under the same floor.
6. Missing/invalid proxy mapping returns explicit actionable errors (no silent fallback).
7. Tree visibility is presentation-level:
   - proxies are tagged and badged as system nodes
   - optional tree filtering may hide tagged proxies, but data model remains explicit.

**Rationale**:

1. Preserves HA-native area assignment behavior for shared floor devices.
2. Avoids hidden/implicit coupling based on mutable display names.
3. Keeps assignment semantics deterministic and debuggable.
4. Aligns with HA-authoritative lifecycle policy already used by wrapper nodes.

**Consequences**:

- ✅ Floor-target assignment can remain ergonomic while writing correct HA `area_id`.
- ✅ Proxy intent is machine-readable and recoverable after restart/import.
- ✅ UI can reduce clutter without relying on hidden implicit mappings.
- ⚠️ Adds metadata reconciliation and validation paths to sync/assignment flows.
- ⚠️ Requires migration/backfill strategy for existing manually-created "system areas".

**Alternatives Considered**:

- Name-match heuristic (`area.name == floor.name`): rejected as brittle under rename/localization.
- Integration-owned non-HA proxy (`subarea`): rejected for HA area interoperability requirements.

---

### ADR-HA-049: Managed Shadow Areas Are Integration-Owned and Mandatory for Aggregate Hosts (2026-03-03)

**Status**: ✅ APPROVED

**Context**:

The floor-proxy model in ADR-HA-048 still relied on optional/manual mapping and
did not cover aggregate wrappers consistently (`building`, `grounds`). During
active development we chose deterministic integration ownership over optional
operator wiring to reduce assignment ambiguity and lifecycle drift.

**Decision**:

1. Replace floor-proxy semantics with managed-shadow semantics:
   - host `_meta.shadow_area_id = <shadow_location_id>`
   - area `_meta.role = "managed_shadow"`
   - area `_meta.shadow_for_location_id = <host_location_id>`
2. Mandatory managed-shadow hosts are non-root:
   - `floor`
   - `building`
   - `grounds`
3. Topomation creates/recreates managed shadow HA areas automatically during
   startup and reconciliation; no name-match adoption heuristics are used.
   Name generation is deterministic with collision-safe ` [Topomation]` suffixing.
4. Assignment to managed-shadow hosts remaps to the host's shadow area before
   persistence and HA `entity_registry.area_id` writeback.
5. Managed-shadow metadata and wrappers are integration-owned:
   - websocket `_meta` writes for shadow keys are rejected
   - manual move/rename/delete of managed-shadow wrappers is rejected
6. UI treats these as system-owned nodes and reports status read-only.

**Rationale**:

1. Eliminates optional wiring paths that create inconsistent assignment semantics.
2. Makes lifecycle behavior deterministic when operators delete/reorder artifacts.
3. Extends one assignment model across all aggregate wrappers.
4. Reduces troubleshooting overhead by removing hidden/manual coupling.

**Consequences**:

- ✅ Aggregate-node assignment is deterministic and HA-interoperable.
- ✅ Deleted managed shadows are recreated automatically.
- ✅ UI semantics are clearer (`System Area`, integration-owned).
- ⚠️ Adds stricter guardrails that block direct user mutation of managed shadows.
- ⚠️ Migration cleanup is required for legacy `proxy_*` metadata keys.

**Alternatives Considered**:

- Optional/manual shadow binding: rejected for operational drift.
- Name-match adoption (`area.name == host.name`): rejected as ambiguous and non-deterministic.

---

### ADR-HA-050: Source-Off Signals Must Stay Source-Scoped; Vacate Is Explicit-Only (2026-03-03)

**Status**: ✅ APPROVED

**Context**:

Detection source OFF behavior was mapped as:
- `off_event=clear` + `off_trailing=0` -> `event_type=vacate` (location-wide)
- `off_trailing>0` -> `event_type=clear` (source-scoped)

This created correctness issues for multi-source occupancy. A single source OFF
event could vacate a location even when other active contributors still indicated
occupancy. That contradicts the intended model where each source contributes
independently and occupancy clears only when no active contributions remain.

**Decision**:

1. Keep detection source OFF semantics strictly source-scoped:
   - `off_event=clear` + `off_trailing<=0` -> `event_type=clear`, `timeout=0`
   - `off_event=clear` + `off_trailing>0` -> `event_type=clear`, `timeout=off_trailing`
2. Remove source-off mapping to `vacate` from event bridge and inspector `Test Off`.
3. Reserve authoritative vacant transitions for explicit operator/policy paths:
   - `topomation.vacate`
   - `topomation.vacate_area`
   - explicit policy actions that intentionally call vacate.
4. Codify multi-source timeout semantics: location vacancy is determined by the
   latest remaining active contribution (longest active hold wins).

**Rationale**:

1. Preserves OR-style multi-source occupancy correctness.
2. Prevents one source from clearing unrelated contributors.
3. Matches operator expectations for mixed signals (motion, lights, media, etc.).
4. Keeps vacate behavior explicit and auditable.

**Consequences**:

- ✅ Multi-source locations remain occupied while any contributor is active.
- ✅ Mixed timeout sources behave predictably (`5m` motion + `30m` light -> `30m` hold).
- ✅ `Test Off` now validates source release semantics without location-wide side effects.
- ⚠️ Users relying on legacy source-off vacate behavior must switch to explicit vacate actions.

**Alternatives Considered**:

- Keep `off_trailing=0` as vacate: rejected due to multi-source correctness violations.
- Add per-source opt-in vacate mode: rejected for now to keep source behavior simple and deterministic.

---

### ADR-HA-051: Re-entrant Occupancy Propagation Must Drain Iteratively (2026-03-03)

**Status**: ✅ APPROVED

**Context**:

Topomation uses the core `EventBus`, whose handlers are synchronous. Linked-room
and sync-room propagation handlers subscribe to `occupancy.changed`, and those
handlers may call `occupancy.trigger()` / `occupancy.clear()`, which emit new
`occupancy.changed` events immediately. Without a guard, this forms recursive
call chains on one stack. In larger live topologies, that can produce
`RecursionError` during startup/runtime event bursts and prevent Home Assistant
API/auth startup from completing reliably.

**Decision**:

1. Any handler subscribed to `occupancy.changed` that can emit another
   `occupancy.changed` must use iterative queue draining (not recursive
   re-entry).
2. Implement a per-handler re-entry guard:
   - queue incoming events
   - if already draining, return
   - drain queue in a loop
3. Add a per-drain safety cap (`max events`) to fail safe:
   - log a high-severity error
   - drop remaining queued events instead of risking process failure
4. Add regression coverage with re-entrant chains deep enough to exceed normal
   recursion thresholds.
5. Capture this requirement in coding standards/contracts so future handlers
   follow the same pattern by default.

**Rationale**:

1. Protects HA process availability; bounded degradation is preferable to
   startup crash loops.
2. Preserves existing linked/sync behavior while removing stack-depth coupling.
3. Makes the failure mode explicit and testable.
4. Keeps the fix local to integration runtime boundaries without requiring
   immediate core bus model changes.

**Consequences**:

- ✅ Re-entrant propagation no longer depends on Python recursion depth.
- ✅ Startup/runtime resilience improves under event storms and dense
  linked/sync topologies.
- ✅ Regression tests now cover deep re-entrant chains.
- ⚠️ When the drain cap is exceeded, remaining propagation events in that drain
  are intentionally dropped (with error logs) to preserve process health.
- ℹ️ The underlying event bus remains synchronous; this ADR standardizes safe
  integration-side handling for re-entrant workflows.

**Alternatives Considered**:

- Keep recursive propagation and rely on topology constraints: rejected; not
  robust against live config complexity.
- Make core `EventBus.publish()` asynchronous in this release: rejected; too
  broad for a hotfix/release patch and would change core semantics.
- Disable linked/sync propagation entirely on startup: rejected; functional
  regression.

---

### ADR-HA-052: Automation IA Splits by Domain Tabs; Startup Reapply Is Tab-Local UI (2026-03-04)

**Status**: ✅ APPROVED
**Lifecycle**: Partially superseded by ADR-HA-055 and ADR-HA-056.

**Context**:

The prior inspector IA mixed concerns across `Detection`, `Actions`, and an
explicit `Advanced` tab, while startup reapply was presented as one global strip.
As lighting rules became trigger/condition/action driven and non-light automations
expanded, this created UX ambiguity:

- "Actions" became a catch-all label with unclear domain ownership.
- Ambient controls and advanced occupancy controls competed for space/priority.
- Users expected startup/reapply settings inside the tab they were editing.
- Add/delete/save rule affordances diverged between lighting and non-light flows.

**Decision**:

1. Inspector top-level tabs are now:
   - `Detection`
   - `Ambient`
   - `Lighting`
   - `Appliances`
   - `Media`
   - `HVAC`
2. `Advanced` is no longer a top-level tab; advanced occupancy controls live
   inside `Detection` as in-tab advanced disclosure.
3. Startup reapply setting is rendered per automation tab (`Lighting`,
   `Appliances`, `Media`, `HVAC`) and all toggles persist to the same shared
   key: `modules.automation.reapply_last_state_on_startup`.
4. `Lighting` remains the sole owner of `light.*` policy editing
   (`modules.dusk_dawn`), while `Appliances`/`Media`/`HVAC` own non-light
   managed-action rules.
5. Rule-editor affordances are standardized across automation tabs:
   - clickable rule title rename
   - footer `Delete rule`
   - footer `Add rule`
   - header `Save changes` draft commit model.

**Rationale**:

1. Aligns IA with real domain ownership instead of trigger-centric legacy labels.
2. Improves user predictability: tab context matches the device class being automated.
3. Keeps advanced controls discoverable without promoting them to primary navigation.
4. Reduces accidental cross-authority overlap between lighting and managed actions.
5. Preserves one backend startup policy bit while improving where users edit it.

**Consequences**:

- ✅ Cleaner, domain-first navigation and fewer ambiguous "where should this rule live?" decisions.
- ✅ Consistent rule-card UX across automation tabs.
- ✅ Startup policy remains backward-compatible in stored config (single key).
- ⚠️ Alias routes/docs/tests must be kept in sync as top-level tab taxonomy evolves.
- ⚠️ Future domain additions (for example climate/humidifier) should follow this pattern
  and not reintroduce a generic catch-all actions tab.

**Alternatives Considered**:

- Keep `Actions` + `On Occupied`/`On Vacant` subtabs: rejected; too ambiguous as scope grew.
- Keep global startup strip in header: rejected; weak locality-of-reference.
- Keep `Advanced` as top-level tab: rejected; high-nav prominence for low-frequency controls.

---

### ADR-HA-053: Managed Rule Sync Is HA-Canonical with Stable Rule Identity (2026-03-05)

**Status**: ✅ APPROVED
**Lifecycle**: Extended by ADR-HA-056 to include Lighting-domain rule ownership.

**Context**:

Managed automation rules (`Appliances`, `Media`, `HVAC`) are authored in the
Topomation UI but executed/stored as native Home Assistant automations.
Two failure patterns still created drift and operator confusion:

1. Save flow used delete-all/recreate, which churned automation IDs and could
   duplicate/reorder rules during edits.
2. External HA edits/deletes could diverge from a local draft between loads.

We need HA to remain the single source of truth while preserving stable rule
identity and predictable in-place updates.

**Decision**:

1. Home Assistant automation entities/config remain canonical for managed rules.
   Topomation does not persist a parallel managed-rule database.
2. Managed rule metadata now carries a stable `rule_uuid` token
   (`[topomation] {..., "rule_uuid": ...}`).
3. Save path is upsert+diff (not delete-all/recreate):
   - update existing rules in place using explicit `automation_id`
   - create new rules with stable identity metadata
   - delete only rules removed from the draft
4. After save, inspector re-reads rules from HA and rehydrates UI from that
   canonical snapshot.
5. Reconciliation remains event-driven:
   - startup load from HA
   - debounced reload on `state_changed` for `automation.*` while inspector open
6. No periodic polling loop in this phase. Polling is deferred unless event-driven
   reconciliation proves insufficient in live operations.

**Rationale**:

1. Preserves native HA ownership and interoperability.
2. Prevents identity churn and unintended duplicates on edits.
3. Makes drift resolution deterministic and auditable.
4. Keeps runtime simpler than adding aggressive background polling.

**Consequences**:

- ✅ Rule edits are in-place when possible; IDs remain stable across rename/condition edits.
- ✅ UI state always converges back to what HA currently has registered.
- ✅ External HA changes are reflected while inspector is open.
- ⚠️ If HA changes while a local draft is dirty, draft may be discarded/reloaded to
  preserve canonical HA truth.
- ⚠️ Lighting (`modules.dusk_dawn`) remains separate from managed-action automation
  entities in this phase.

**Alternatives Considered**:

- Keep delete-all/recreate saves: rejected due ID churn and drift risk.
- Add periodic full polling: deferred; event-driven sync is sufficient for v1.
- Add local DB as source-of-truth: rejected; conflicts with HA-native automation model.

---

### ADR-HA-054: Sync Locations Uses Explicit Sibling Scope by Parent Type (2026-03-05)

**Status**: ✅ APPROVED

**Context**:

Detection currently presents room-sync as `Sync Rooms` with strict
area-under-floor-only eligibility. That is too narrow for real topologies where
areas may be grouped under a parent area or building, and it does not define
how floor-level sync should work when floor siblings exist under one building.

**Decision**:

1. Rename the primary sync surface from `Sync Rooms` to `Sync Locations`.
2. Sync candidate eligibility is sibling-scoped and explicit:
   - `area` <-> `area` sync is allowed when both are immediate children of the
     same parent and that parent type is one of:
     - `area`
     - `floor`
     - `building`
   - `floor` <-> `floor` sync is allowed only when both floors are immediate
     children of the same `building`.
3. Candidate set is strictly same-parent siblings (`parent_id` equality), with
   non-eligible/system-owned nodes excluded from candidate lists.
4. Reciprocal `sync_locations` write semantics remain unchanged
   (`A` checked with `B` writes both directions).
5. Directional linked contributors remain a separate advanced model and keep
   their own constrained scope.

**Rationale**:

1. Preserves predictable behavior by keeping sync local to one explicit sibling
   set.
2. Supports broader but still explainable topologies without opening arbitrary
   cross-structure coupling.
3. Keeps floor sync possible where it is structurally meaningful (inside one
   building) while avoiding global floor fan-out.

**Consequences**:

- ✅ Sync rules are now specific and testable across area/floor sibling sets.
- ✅ Labeling matches behavior (`Sync Locations` instead of room-only wording).
- ✅ Floor sync has a clear eligibility boundary.
- ⚠️ Existing UI/runtime validation constrained to area-under-floor will require
  migration to this broader sibling policy.

**Alternatives Considered**:

- Keep area-under-floor-only scope: rejected as unnecessarily restrictive.
- Allow arbitrary non-sibling sync: rejected due to debugging and propagation ambiguity.

---

### ADR-HA-055: Automation Workspace Uses Tabbed Modes + Explicit Save/Update Commit (2026-03-05)

**Status**: ✅ APPROVED

**Context**:

The workspace currently mixes two paradigms:

1. Right-panel mode controls (`Configure` / `Assign Devices`) rendered as
   button toggles rather than top-level tabs.
2. Mixed persistence behavior (auto-save in some tabs, explicit save in others).

This creates avoidable operator confusion and drifts from expected Home
Assistant interaction patterns.

**Decision**:

1. Render `Configure` and `Assign Devices` as top-level workspace tabs (same
   affordance family as inspector tabs), not mode buttons.
2. Standardize header status emphasis:
   - occupancy, lock state, and ambient are peer status indicators
   - lock state receives warning emphasis only when locked.
3. Detection information architecture:
   - keep source controls/config first
   - keep logging-oriented `Recent Occupancy Events` at the bottom.
4. Managed-system-area messaging must be actionable:
   - no vague "next reconciliation" copy without an explicit operator path.
5. Adopt one explicit commit model across editable inspector tabs
   (`Detection`, `Ambient`, `Lighting`, and non-light automation tabs):
   - edits create/modify local draft state
   - users commit with `Save changes`
   - users can discard draft state explicitly.
6. Rule-card destructive controls follow persistence state:
   - unsaved draft rule: `Discard draft` (no `Delete rule`)
   - persisted rule: `Delete rule`.
7. Home Assistant UI conventions are the baseline when designing control
   placement and save/update affordances.
   - deviations are permitted only when integration constraints or operator
     clarity require them.
   - deviations must be documented explicitly in active contracts/UI guide.

**Rationale**:

1. Reduces cross-tab behavior surprises.
2. Improves operator trust by requiring explicit commit for policy changes.
3. Keeps high-frequency configuration controls separated from diagnostics/logging.
4. Aligns panel behavior to HA-native editing expectations.

**Consequences**:

- ✅ Predictable save/update workflow across tabs.
- ✅ Cleaner IA between configuration and assignment workflows.
- ✅ Draft-vs-persisted rule lifecycle becomes explicit.
- ⚠️ Requires refactor of existing Detection/Ambient auto-save flows.
- ⚠️ Existing tests/contracts/docs referencing mixed auto-save behavior must be updated.

**Alternatives Considered**:

- Keep mixed auto-save + explicit-save model: rejected for inconsistency.
- Add per-control save prompts only: rejected as noisy and hard to reason about.

---

### ADR-HA-056: Lighting Rules Move to HA-Canonical Managed Automation Ownership (2026-03-05)

**Status**: ✅ APPROVED

**Context**:

Lighting rule editing currently uses local module config (`modules.dusk_dawn`)
while non-light domains use native HA automation ownership. This split model
conflicts with product direction and operator expectation that Topomation rules
are first-class HA automations with canonical HA sync/reconciliation behavior.

**Decision**:

1. Lighting rules become HA-canonical managed automations, consistent with
   managed non-light domains.
2. Lighting rule identity uses stable metadata (`rule_uuid`) and follows
   upsert+diff save behavior (update in place, create new, delete removed).
3. Backend integration remains the only automation writer; browser clients do
   not mutate HA automation config directly.
4. Remove Topomation-specific Lighting startup reapply toggle from the editor
   surface; startup behavior should rely on native HA automation semantics.
5. `modules.dusk_dawn` transitions to legacy migration compatibility only and is
   no longer the long-term source of truth for Lighting rule persistence.

**Rationale**:

1. Enforces one automation ownership model across domains.
2. Improves interoperability with HA tooling (automations list, traces, labels).
3. Eliminates contradictory rule-state expectations between tabs.
4. Reduces bespoke policy runtime surfaces that duplicate HA behavior.

**Consequences**:

- ✅ Lighting and non-light rules share one canonical persistence strategy.
- ✅ Rule tracking remains stable through `rule_uuid` metadata.
- ✅ Startup behavior expectations align with HA-native automation operation.
- ⚠️ Requires a migration path from existing `modules.dusk_dawn` data.
- ⚠️ Requires updated UI contracts, copy, and test coverage for Lighting save/delete flow.

**Alternatives Considered**:

- Keep Lighting on `modules.dusk_dawn`: rejected due to ownership inconsistency.
- Keep Lighting startup reapply toggle as Topomation-only control: rejected; duplicates native automation responsibility.

---

### ADR-HA-057: Rule-Card Lifecycle Colocation + Mandatory User Decision Gate for Ambiguity (2026-03-05)

**Status**: ✅ APPROVED

**Context**:

Recent automation UI iterations exposed two process failures:

1. Rule lifecycle controls became split across tab-level and card-level actions,
   creating unclear behavior (`Discard`/`Save changes` at tab level while
   `Delete rule` lived on each card).
2. When guide/contract language was ambiguous, implementation selected a pattern
   without explicit user decision, causing repeated mismatch against expected UX.

**Decision**:

1. Rule lifecycle controls are card-local for rule-authoring tabs
   (`Lighting`, `Appliances`, `Media`, `HVAC`):
   - unsaved draft: `Save rule` + `Remove rule`
   - persisted edited: `Update rule` + `Discard edits` + `Delete rule`
   - persisted clean: `Delete rule`.
2. Detection and Ambient remain tab-level draft-save workflows
   (`Save changes` / `Discard changes`).
3. For rule workflows, do not split lifecycle actions between tab-level save
   controls and card-level delete controls.
4. Ambiguity gate:
   - if contracts/guide/issue requirements conflict, stop and ask user before
     implementation
   - if multiple plausible UX patterns exist without explicit contract choice,
     stop and ask user
   - do not mark work complete without explicit user sign-off on that area.

**Rationale**:

1. Co-located lifecycle controls improve predictability and reduce accidental
   destructive actions.
2. Hard stop-and-ask behavior prevents silent drift from user intent.
3. Explicit sign-off gate makes "done" mean "implemented and aligned," not just
   "code changed."

**Consequences**:

- ✅ Rule workflow control placement is now explicit and testable.
- ✅ Ambiguity handling is explicit and enforceable in docs/contracts.
- ✅ Reduces repeat churn caused by implicit design assumptions.
- ⚠️ Existing rule-tab implementations may require refactor to fully match
  card-local lifecycle controls.
- ⚠️ Existing tests/checklists that assumed tab-level save for rule tabs must
  be updated.

**Alternatives Considered**:

- Keep mixed tab-level/card-level lifecycle controls: rejected for clarity and
  consistency risks.
- Allow implementer choice when docs are close-but-not-identical: rejected;
  this repeatedly produced misalignment.

---

### ADR-HA-058: Lighting Rules Support Multi-Target Actions + Trigger-Derived Locked Conditions (2026-03-05)

**Status**: ✅ APPROVED

**Context**:

Lighting rule editing regressed in two ways:

1. Rules were effectively limited to a single action target, despite prior UX
   supporting multi-target light actions on one rule card.
2. Trigger-derived conditions remained editable, even when trigger semantics
   already fixed the condition value (`on_dark`/`on_bright` ambient and
   `on_occupied`/`on_vacant` occupancy condition).

This caused UI ambiguity and behavior drift from agreed workflow.

**Decision**:

1. Lighting rules support multiple action targets per rule.
   - Frontend sends ordered `actions[]` payload for each rule.
   - Backend persists those as ordered HA automation action steps.
2. Compatibility fields remain for existing clients/tests:
   - `action_entity_id` / `action_service` / `action_data` mirror the first
     action target.
3. Trigger-derived conditions are locked and rendered read-only:
   - `on_dark` -> ambient `dark` (derived)
   - `on_bright` -> ambient `bright` (derived)
   - `on_occupied` -> `must_be_occupied=true` (derived)
   - `on_vacant` -> `must_be_occupied=false` (`Must be vacant`, derived)
4. Contracts/docs must explicitly encode both behaviors.

**Rationale**:

1. Restores the original lighting authoring model (single rule, multiple light
   actions).
2. Prevents contradictory UI states for trigger-locked semantics.
3. Keeps backend compatibility while enabling richer rule behavior.

**Consequences**:

- ✅ One lighting rule can drive multiple lights predictably.
- ✅ Condition editing now matches trigger semantics and avoids invalid combos.
- ✅ Existing integrations reading first-action summary fields keep working.
- ⚠️ Adds payload/model complexity (`actions[]` + compatibility fields).
- ⚠️ Requires regression tests across websocket, managed-actions runtime, and UI
  draft/save flows.

**Alternatives Considered**:

- Keep single-action model and ask users to create many duplicate rules:
  rejected due to UX friction and mismatch with established workflow.
- Keep trigger-locked values editable but normalized on save:
  rejected because UI still shows contradictory choices during editing.

---

### ADR-HA-059: Delivery Status Vocabulary + Live Validation Gate for Behavior Claims (2026-03-06)

**Status**: ✅ APPROVED

**Context**:

Recent automation/UI work exposed repeated confusion between four different
states:

1. what the docs/ADRs say the product should do,
2. what is implemented in the current worktree,
3. what is actually shipped in a built/released artifact, and
4. what has been re-run against a live Home Assistant instance.

This ambiguity allowed active docs to describe work as "complete" even while
live HA validation remained open and production still reflected older behavior.

**Decision**:

1. Active status docs must distinguish execution status from delivery status.
2. Delivery status vocabulary is:
   - `Target`
   - `Implemented`
   - `Released`
   - `Live-validated`
3. For behavior-changing work, `Complete` / `Completed` is not an acceptable
   standalone delivery claim in active docs.
4. Behavior work is not `Live-validated` until the required live HA checklist or
   release gate has run successfully against a real HA instance.
5. Active docs and consistency checks must keep issue status, current-work
   status, and live-validation state aligned.

**Rationale**:

1. Prevents target-state docs from being mistaken for shipped behavior.
2. Makes release confidence and live-runtime evidence explicit.
3. Turns status drift into a checkable repo policy instead of tribal memory.

**Consequences**:

- ✅ Status summaries become more precise and less misleading.
- ✅ Live-validation gaps remain visible after implementation lands.
- ✅ Doc consistency checks can block the exact contradiction pattern that
  caused churn here.
- ⚠️ Existing templates/status docs must be updated to use the new vocabulary.
- ⚠️ Maintainers need to keep execution and delivery states current together.

---

### ADR-HA-060: Automation Scope Narrows to Lighting / Media / HVAC; HVAC v1 Is Fans-First (2026-03-06)

**Status**: ✅ APPROVED

**Context**:

The prior automation IA exposed four visible rule-authoring tabs:
`Lighting`, `Appliances`, `Media`, and `HVAC`.

That structure drifted away from the actual product goal:
make common occupancy-driven actions easy without pretending to cover every Home
Assistant device/workflow.

Two practical issues drove the reset:

1. `Appliances` was only a thin label over generic `switch.*`, which is not a
   stable or meaningful Home Assistant product category.
2. Users still need common bathroom/ventilation cases where the target device is
   an exhaust fan exposed as either `fan.*` or `switch.*`.

At the same time, true thermostat automation belongs to `climate.*`, not
`fan.*`, and the repo does not yet have an agreed common-case contract for
occupancy-driven presets/setbacks/modes.

**Decision**:

1. Visible automation tabs are narrowed to:
   - `Lighting`
   - `Media`
   - `HVAC`
2. Remove the dedicated `Appliances` top-level tab from the active UI and
   policy docs.
3. `HVAC` in v1 is a fans-first workflow:
   - first-class `fan.*` support
   - compatibility support for switch-controlled exhaust/ventilation devices via
     `switch.*`
4. Do not expose `climate.*` editing in v1.
5. Existing legacy `/topomation-appliances` deep links may remain as a
   compatibility alias, but they must resolve into the narrowed active IA
   rather than resurrecting a separate product surface.

**Rationale**:

1. Keeps the visible IA aligned with real common user jobs.
2. Preserves the important bathroom exhaust-fan use case even when the device is
   modeled as a switch in Home Assistant.
3. Avoids overselling thermostat/HVAC support before preset-oriented
   `climate.*` semantics are defined.
4. Simplifies release/testing scope while keeping advanced use cases available
   through native HA automations triggered by Topomation occupancy state.

**Consequences**:

- ✅ The user-facing automation surface is smaller and clearer.
- ✅ Existing switch-based ventilation rules remain editable under `HVAC`.
- ✅ Docs can state the HVAC scope honestly: fans/ventilation now,
  thermostat presets later.
- ⚠️ Generic `switch.*` devices may still appear in the HVAC target list when
  assigned to a location; this is an accepted v1 tradeoff to keep the
  switch-controlled fan case simple.
- ⚠️ Older ADRs/reference docs that mention `Appliances` remain historical and
  should not be used as active policy.

---

### ADR-HA-061: Startup Replay Moves to Rule Cards; Harness Must Cover Reactive HA Churn (2026-03-06)

**Status**: ✅ APPROVED

**Context**:

The repo had drift between the active UI contract and the shipped behavior in
two ways:

1. Startup replay was still described and partially implemented as a
   tab-global toggle, while the real rule editor had moved to card-local
   lifecycle controls.
2. The `Add rule` path worked in the mock harness but failed in production
   because the inspector treated every reactive `hass` object replacement as a
   full reconnect, keeping rule reload state active under real Home Assistant
   event churn.

The result was a misleading startup UX and a production-only regression that
the old harness did not simulate.

**Decision**:

1. Remove tab-global startup reapply controls from `Lighting`, `Media`, and
   `HVAC`.
2. Add a per-rule `Run on startup` toggle on rule cards.
3. Persist startup opt-in in managed-rule metadata as `run_on_startup`.
4. Keep `modules.automation.reapply_last_state_on_startup` only as a legacy
   compatibility fallback for older occupied/vacant rules until those rules are
   re-saved with explicit metadata.
5. Frontend regression coverage must include same-connection reactive `hass`
   churn so UI controls are validated under Home Assistant-like update
   frequency, not just static mock snapshots.

**Rationale**:

1. Startup behavior belongs with the rule it affects, not as a disconnected
   tab-level strip.
2. Explicit metadata is easier to reason about than a shared location-global
   bit when rules span Lighting, Media, and HVAC.
3. The fallback path preserves existing occupancy startup behavior while the UI
   migrates saved rules to the explicit per-rule model.
4. The production regression was caused by harness realism, not just missing
   assertions, so the harness contract needed to change too.

**Consequences**:

- ✅ Startup replay is now authored and reviewed at the same scope as other
  rule conditions.
- ✅ Lighting, Media, and HVAC all share one coherent startup model.
- ✅ Mock-browser coverage now exercises the Add Rule path under HA-like
  reactive update churn.
- ⚠️ Older rules may still honor the legacy location-global startup flag until
  they are re-saved.
- ⚠️ Historical ADRs that mention per-tab startup toggles remain archival only.

---

### ADR-HA-062: Active Automation Development Runs Without Legacy Compatibility Paths (2026-03-06)

**Status**: ✅ APPROVED

**Context**:

The active automation branch was still carrying three kinds of compatibility
behavior after the HA-canonical rule migration:

1. Lighting editor startup/runtime behavior still mentioned or partially honored
   a location-global startup fallback.
2. The active Lighting editor still imported legacy `modules.dusk_dawn`
   payloads into current rule cards.
3. The frontend and panel surface still kept old alias/fallback behavior
   (`/topomation-appliances`, browser-side managed-rule fallback code) that no
   longer matched how we are developing and testing this feature.

That created repeated documentation drift and made production problems harder to
reason about because the active branch was not following a single source of
truth.

**Decision**:

1. The active automation development branch is dev-mode only and does not keep
   legacy compatibility behavior by default.
2. Startup replay in the active automation workflow only honors explicit
   per-rule managed metadata (`run_on_startup`).
3. The active Lighting editor ignores legacy `modules.dusk_dawn` payloads
   rather than migrating them into current rule cards.
4. Frontend managed-rule operations fail explicitly when the backend websocket
   contract is unavailable; no browser-side fallback path remains.
5. Remove legacy automation route aliases from the active panel surface when
   they no longer represent a contracted product workflow.
6. If compatibility or migration support is needed later, it must be added
   deliberately with a new ADR and explicit test/docs coverage.

**Rationale**:

1. One active behavior model is easier to implement, test, and debug than a
   dev branch that keeps transitional shims alive.
2. Explicit failure is better than silent fallback when the goal is contract
   hardening.
3. Removing compatibility paths eliminates a major source of contradictory docs
   and ambiguous expectations during iteration.

**Consequences**:

- ✅ The active automation UI/runtime now reflects only the current HA-canonical
  rule model.
- ✅ Test coverage can focus on the shipped dev path instead of migration logic.
- ✅ Docs can state the current workflow directly without compatibility caveats.
- ⚠️ Older saved payloads and old deep links are not part of the active dev
  branch contract.
- ⚠️ A fresh live HA rerun is required after this cleanup before restoring any
  `Live-validated` claim for the automation UX branch state.

---

### ADR-HA-063: Working Agreement + Exact Touched-Workflow Release Gate Reset (2026-03-06)

**Status**: ✅ APPROVED

**Context**:

The repo hit the same failure pattern repeatedly:

1. ambiguous UX decisions were implemented instead of escalated
2. legacy compatibility paths survived explicit instructions to remove them
3. broad test passes were treated as evidence for the exact workflow that
   changed
4. older live HA passes were implicitly carried forward across later behavior
   changes
5. status docs claimed more certainty than the exact branch state supported

The problem was no longer just one bug or one screen. It was the operating
model for how changes were being made and validated.

**Decision**:

1. Add an active repo working agreement in `docs/working-agreement.md`.
2. Add an active touched-workflow release gate in
   `docs/touched-workflow-release-gate.md`.
3. Tighten the active authority chain to:
   - `docs/working-agreement.md`
   - `docs/contracts.md`
   - `docs/automation-ui-guide.md`
   - `docs/architecture.md`
   - `docs/adr-log.md`
4. Active operational docs and issue checklists may not override that chain.
5. Dev-mode only remains the default; legacy compatibility is not preserved
   unless explicitly re-approved.
6. Release/live claims require exact-branch, exact-bundle, exact-workflow
   evidence.
7. If UX/workflow behavior is ambiguous, implementation must stop and ask.

**Rationale**:

1. A written operating contract is necessary because the same drift kept
   recurring.
2. Exact touched-workflow validation is the only reliable way to connect test
   evidence to the behavior that actually changed.
3. A tighter authority chain reduces room for “reasonable” but unapproved UI
   interpretation.
4. Honest status semantics are required to know what is implemented versus what
   is actually releasable.

**Consequences**:

- ✅ The repo now has an explicit operating contract, not just scattered
  expectations across chat history.
- ✅ Release/live claims are blocked unless exact workflow evidence is recorded.
- ✅ Old live validation can no longer be casually reused after later behavior
  changes.
- ✅ Ambiguous UX is now a mandatory stop condition.
- ⚠️ Current automation UX work remains `Implemented`, not `Released` or
  `Live-validated`, until the new gate is executed on the exact branch state.
- ⚠️ This ADR does not fix product bugs by itself; it fixes how the repo is
  allowed to move forward.

---

### ADR-HA-064: Inspector Explainability over Raw Occupancy Logging (2026-03-15)

**Status**: ✅ APPROVED

**Context**:

The Detection inspector had a bottom card labeled `Recent Occupancy Events`, but
the implementation was only a compact list of current occupancy contributors.
That mismatch made the panel weak at the job users actually need while testing a
 room:

1. understand why the room is occupied or vacant right now
2. confirm what just happened when a sensor fired or cleared
3. debug timing surprises without exposing raw internal telemetry

The question was whether to keep a generic log window, remove it, or define a
more explicit user-facing purpose.

**Decision**:

Adopt an inspector explainability model for occupancy v1:

1. Keep the section in the inspector.
2. Treat it as explainability, not a raw debug/event dump.
3. Split the content into:
   - `Current state`
   - `Recent changes`
4. `Current state` shows why the room is occupied/vacant now, active
   contributors, and next vacancy/timeout information when available.
5. `Recent changes` shows a small newest-first timeline of meaningful
   occupancy-related changes:
   - source-level `occupancy.signal` events
   - room-level occupied/vacant transitions
6. V1 scope is occupancy only. Lock/unlock timeline history and deeper engine
   traces are explicitly future work.

**Rationale**:

1. Users need a gut check while testing rooms, not a raw engineering log.
2. Current-state explainability and recent changes solve different questions and
   should not be collapsed into one mislabeled list.
3. A small normalized event buffer is enough for v1 and keeps the contract
   simple.
4. This keeps the inspector honest about what it can explain today while
   preserving room to add deeper traces later.

**Consequences**:

- ✅ The inspector now has a user-facing purpose for this section.
- ✅ Recent source activity that does not flip occupancy can still appear in the
  timeline.
- ✅ The UI contract aligns with the data model instead of pretending a
  contributor list is an event log.
- ⚠️ Recent-change history is intentionally shallow and optimized for operator
  understanding, not full forensic replay.
- ⚠️ Lock/unlock timeline history remains out of scope for v1.

**Alternatives Considered**:

- Keep the old panel as-is: rejected because the label and behavior did not
  match.
- Remove the section entirely: rejected because users still need state
  explainability in the inspector.
- Build a full raw diagnostic trace first: rejected for v1 because it is more
  expensive and less operator-friendly than the needed explainability surface.

### Follow-up note: runtime event log hard-disabled in primary workspace

The temporary header-level runtime event log affordance was later removed from
the main panel workspace.

Reasoning:

1. It competed with `Room Explainability` while serving a different audience.
2. It made the primary tree/inspector workflow feel debug-first.
3. The v1 contract is explainability, not a generic runtime log.

Policy:

1. `Room Explainability` remains the only user-facing occupancy diagnostic
   surface in the primary workspace.
2. Re-enabling a broader runtime log remains allowed in the future, but only as
   a clearly secondary diagnostics surface with its own explicit product
   rationale.

---

### ADR-HA-065: Lighting Rules Use Multi-Trigger Wake-Up Semantics (2026-03-15)

**Status**: ✅ APPROVED

**Context**:

Lighting rule editing previously treated trigger choice as a single-select field.
That model breaks common real-world occupancy lighting patterns:

1. turn lights on when a room becomes occupied while it is already dark
2. turn lights on when a room becomes dark while it is already occupied

Those are not two different user intents. They are one rule with one action set
and two valid wake-up events.

The single-trigger model forced either:

- duplicate rules with duplicated actions, or
- incomplete behavior where one of the two wake-up paths was missing.

**Decision**:

1. Lighting rules support multi-trigger wake-up semantics.
2. The Lighting editor presents triggers as two grouped families under a plain
   `Triggers` label:
   - `Occupancy`:
     - `On occupied`
     - `On vacant`
   - `Ambient`:
     - `On dark`
     - `On bright`
3. A rule may include at most one trigger from each family.
4. The rule fires when any selected trigger occurs.
5. Lighting conditions remain explicit user-editable filters:
   - ambient
   - occupancy
   - optional time window
6. Lighting no longer treats occupancy/ambient conditions as trigger-derived
   locked UI rows.
7. Media and HVAC remain single-trigger rule workflows in this phase.

**Rationale**:

1. It matches the real automation model: one intent, multiple wake-up events.
2. It avoids duplicated rule cards whose actions must stay manually in sync.
3. Grouping triggers by family preserves the strong engine model while avoiding
   nonsensical pairings like `On dark` + `On bright`.
4. It scales better than inventing many hybrid trigger labels.
5. It preserves a clean `Wake up when` -> `Only if` -> `Do this` authoring
   mental model.

**Consequences**:

- ✅ Common arrival/darken lighting scenarios fit naturally in one rule.
- ✅ Lighting actions stay shared across all selected wake-up events.
- ✅ The UI prevents conflicting trigger combinations instead of validating them
  after the fact.
- ✅ Conditions remain visible and understandable instead of being hidden by
  trigger-derived rules.
- ⚠️ Lighting persistence metadata now needs a trigger-set representation, not
  just one trigger token.
- ⚠️ Existing single-trigger Lighting rules need backward-compatible parsing and
  normalization.
- ⚠️ Media/HVAC remain intentionally narrower until their own rule model is
  revisited.

**Alternatives Considered**:

- Keep single-trigger rules and ask users to create duplicate sibling rules:
  rejected because it duplicates actions and creates drift risk.
- Add a preset that silently creates two rules:
  rejected because it hides the underlying model problem instead of fixing it.
- Create synthetic hybrid trigger labels:
  rejected because it becomes combinatorial and harder to explain.

---

### ADR-HA-066: Detection Uses Shared Space as the Primary Occupancy Relationship Model (2026-03-17)

**Status**: ✅ APPROVED

**Context**:

The Detection tab currently frames reciprocal room grouping as `Sync Locations`.
That language is implementation-oriented and nudges users toward thinking in
low-level mirroring instead of household behavior. In practice, the common
occupancy relationship needs are simpler:

1. treat adjacent/open-plan rooms as one occupied space
2. borrow sensor coverage from a nearby area via `Add Source`

Directional room-to-room contributor workflows are real, but they are rarer and
unnecessary in the primary authoring path for most homes.

**Decision**:

1. Replace the primary Detection relationship label `Sync Locations` with
   `Shared Space`.
2. Define the checklist as editing membership of one shared occupancy group, not
   local one-way links.
3. Saving shared-space edits normalizes membership across all selected members.
4. `Add Source` remains the answer for borrowed sensor coverage.
5. Keep the persisted config key `sync_locations` and existing reciprocal
   runtime propagation behavior for backward compatibility.
6. Hide directional linked contributors from the active Detection UI until that
   workflow is revalidated.

**Rationale**:

1. `Shared Space` matches how people think about open-plan areas in a house.
2. It keeps the common case understandable without asking users to reason about
   reciprocity, reverse setup, or sync internals.
3. Borrowed sensors are a different problem and already have a clearer place in
   the UI.
4. Retaining the underlying config/runtime avoids unnecessary migration churn.

**Consequences**:

- ✅ The primary occupancy relationship workflow now matches real household intent.
- ✅ Shared-space membership is presented consistently from any member page.
- ✅ Borrowed coverage stays separate from room-group semantics.
- ✅ Existing saved `sync_locations` data continues to work.
- ⚠️ Internal naming still uses `sync_locations`, so docs must be explicit about
  UI label vs stored config.
- ⚠️ Hidden directional contributor runtime remains in code until a future
  advanced workflow is deliberately reintroduced.

**Alternatives Considered**:

- Keep `Sync Locations` as the primary label:
  rejected because it over-exposes implementation language and leads users
  toward the wrong mental model.
- Reinterpret `Sync Locations` as one-way propagation:
  rejected because it conflates shared-space grouping with directional
  contribution.

---

### ADR-HA-067: Shared Space Runtime Is Binary-Sensor Authoritative and Uses Contribution-Union Semantics (2026-03-18)

**Status**: ✅ APPROVED

**Context**:

ADR-HA-066 established `Shared Space` as the primary user-facing occupancy
relationship model, but a critical contract gap remained:

1. the frontend could drift into showing an effective shared-space state that
   the room's actual occupancy binary sensor did not report
2. timeout behavior for mixed-duration events across one shared-space group was
   not written down explicitly enough
3. connected shared-space graphs could be interpreted as only one-hop peers
   instead of one occupied group

That drift is not acceptable because Home Assistant users and automations query
the occupancy binary sensors directly. If `Kitchen` is part of a shared space,
`binary_sensor.kitchen_occupancy` must reflect that runtime truth.

**Decision**:

1. Occupancy binary sensors are the authoritative public contract for room
   occupancy, including shared-space state.
2. Shared-space runtime is group-oriented:
   - any active contribution in one member contributes to every other member
   - mirrored sync contributors preserve the origin contribution's remaining
     timeout or indefinite hold
   - later shorter contributions never shorten a longer already-active hold
3. Effective shared-space membership for runtime propagation is the connected
   component of allowed `sync_locations` relationships, not only one-hop direct
   declarations.
4. Frontend UI must render the backend binary-sensor state and may only explain
   it, not override it with a separate occupied/vacant model.

**Rationale**:

1. Users expect open-plan/shared rooms to behave like one occupied space.
2. The binary sensor is what Home Assistant automations and dashboards consume,
   so it must be the only source of truth.
3. Preserving source contribution expirations reuses the occupancy module's
   existing "longest active contribution wins" behavior cleanly.
4. Connected-component semantics make shared space robust against historical or
   partially normalized config graphs.

**Consequences**:

- ✅ Shared-space occupancy now has one authoritative contract across backend,
  binary sensors, automations, and UI.
- ✅ Mixed timeout durations behave predictably:
  - 30-minute Kitchen motion gives the whole group 30 minutes
  - 45-minute Family Room activity extends the whole group to 45 minutes
  - 5-minute Back Hall activity adds coverage but does not shorten existing
    longer holds
- ✅ Frontend workarounds that invent occupancy from peer rooms are invalid and
  should be removed.
- ⚠️ Any future shared-space change must update backend tests, contracts, and
  release-gate coverage together.

**Alternatives Considered**:

- Keep shared-space aggregation as a frontend-only display rule:
  rejected because it breaks HA automation expectations and creates two
  conflicting occupancy truths.
- Use target-room default timeout for mirrored shared-space events:
  rejected because it would distort source intent and make one room's defaults
  silently rewrite another room's active occupancy hold.
- Add a separate group-creation manager:
  rejected because the existing checklist can author shared space membership
  directly with less UI overhead.

---

### ADR-HA-068: Mixed Presence + Motion Sources Use Additive Contribution Semantics (2026-03-18)

**Status**: ✅ APPROVED

**Context**:

The occupancy contract already established two important rules:

1. source `off` behavior is source-scoped `clear`, not location-wide vacate
2. occupancy remains active until the last active contribution clears or
   expires

That still left one operator-facing gap: the docs did not say explicitly what
happens when a location config includes both a direct-presence source and a
timed motion source. Users could reasonably assume presence should override
motion, while the runtime was treating both as independent contributors.

**Decision**:

1. Mixed direct-presence and motion sources are additive contributors for one
   location.
2. When direct presence turns off, Topomation clears only that direct-presence
   contribution.
3. Any still-active motion contribution remains valid until it clears or its
   hold expires.
4. Topomation does not apply hidden source-class precedence such as "presence
   always rules over motion."
5. If a user wants direct presence to be authoritative for a location, they
   must not also configure other occupancy sources that can independently hold
   that location occupied.

**Rationale**:

1. This preserves one deterministic additive model for all source types.
2. It avoids hidden precedence rules that users cannot see or reason about from
   configuration.
3. It matches the source-scoped clear contract already adopted in ADR-HA-050.
4. It keeps occupancy behavior aligned with the explicit configured source set
   instead of inventing special-case hierarchy after the fact.

**Consequences**:

- ✅ Mixed presence + motion rooms behave predictably under one additive model.
- ✅ Presence `off` never silently wipes out unrelated active motion evidence.
- ✅ Users have a clear configuration rule for authoritative presence rooms.
- ⚠️ A room may remain occupied after presence turns off if another configured
  source still has an active contribution.

**Alternatives Considered**:

- Make direct presence implicitly authoritative over motion:
  rejected because it introduces hidden precedence and breaks the general
  additive contribution model.
- Add a per-location or per-source precedence setting:
  rejected for now because the current product contract is intentionally
  simpler, and source selection already gives operators the needed control.

---

### ADR-HA-069: Floor Inspectors Manage Occupancy Groups; Room Occupancy Stays Room-Scoped (2026-04-03)

**Status**: ✅ APPROVED

**Context**:

`Shared Space` solved the "treat these rooms like one occupied space" use case,
but the active UI still authored that relationship from whichever location was
selected. That is awkward for the common case:

1. groups do not naturally "belong" to one room
2. selected floors showed mostly non-actionable Occupancy content
3. room-level occupancy authoring and multi-room grouping were being mixed into
   one workspace

For the product's primary use case, we want a constrained shared-occupancy
workflow without turning topology or adjacency into a general-purpose graph
editor.

**Decision**:

1. Replace floor-selected `Occupancy` authoring with `Occupancy Groups`.
2. `Occupancy Groups` are managed from the selected floor and operate on that
   floor's direct child `area` locations.
3. A location may belong to zero or one occupancy group.
4. A floor may have zero or more occupancy groups.
5. Floor group actions apply immediately instead of using tab-level
   `Save changes` / `Discard`.
6. Group creation is valid only when two or more ungrouped child areas are
   selected, and groups with fewer than two members are removed automatically.
7. Persisting floor group edits continues to write reciprocal `sync_locations`
   arrays on the member areas; no new runtime primitive is introduced in v1.
8. Area inspectors remain room-scoped for occupancy sources and `Add Source`;
   they may summarize group membership but do not own group editing.
9. Floor-selected occupancy UI does not expose WIAB, directional contributors,
   adjacency handoff, or floor-to-floor shared-space editing in the active
   workflow.

**Rationale**:

1. The grouping use case is valid and common enough to deserve a first-class UX.
2. Floor scope gives users a natural local context for open-plan/shared-space
   clusters without introducing whole-home graph complexity.
3. Keeping room occupancy authoring separate from group editing preserves a
   clearer mental model: rooms own sources, floors own room grouping.
4. Reusing `sync_locations` preserves runtime compatibility and keeps the change
   UI-first instead of migration-heavy.

**Consequences**:

- ✅ Floor inspectors now have an actionable occupancy workspace.
- ✅ The primary shared-space workflow becomes easier to reason about than
  pairwise room editing.
- ✅ Existing runtime semantics remain intact because group membership still
  persists through reciprocal `sync_locations`.
- ⚠️ Historical broader `sync_locations` validation/runtime support may remain in
  code for backward compatibility even though the active UI authors only
  floor-local child-area groups.

**Alternatives Considered**:

- Keep room-selected `Shared Space` editing as the primary workflow:
  rejected because the group concept does not naturally belong to one selected
  room.
- Model shared occupancy by inserting synthetic "common area" parents in the
  topology tree:
  rejected because it mixes behavioral grouping into structural topology.
- Expose arbitrary cross-floor/cross-structure grouping:
  rejected for v1 due to explainability and debugging complexity.

---

### ADR-HA-070: Occupancy Groups Are First-Class Runtime Objects, Not Mirrored Peer State (2026-04-06)

**Status**: ✅ APPROVED

**Context**:

ADR-HA-067 defined shared-space runtime as contribution mirroring across member
rooms using reciprocal `sync_locations`. That model evolved naturally from the
original feature, but it has an important weakness: it treats a group as many
independent rooms that copy state into one another instead of one canonical
occupancy object.

That distinction matters in practice:

1. copied peer state is easier to let drift during timeout, restore, config
   reconciliation, or partial propagation failures
2. the product intent is stronger than "these rooms often influence each
   other"; for grouped rooms we want one occupied/vacant/intent result
3. users think of the group as one effective space even though the member rooms
   remain separate for topology, devices, and automations

The current runtime pattern is therefore misaligned with the desired contract.
If a user creates an occupancy group, they expect all members to behave as if a
hidden common occupancy area exists behind them.

**Decision**:

1. Occupancy Groups become first-class runtime objects.
2. An Occupancy Group is a behavioral pseudo-area for occupancy only:
   - it has one canonical occupancy state
   - it has one canonical effective timeout / vacancy outcome
   - it has one canonical intent state
3. Member areas remain real topology nodes, but when grouped they no longer act
   as independent occupancy authorities.
4. Occupancy signals from any grouped member contribute to the group object,
   not to a copied mesh of mirrored per-room synthetic contributors.
5. Each member area projects the group's occupancy result as its public room
   occupancy state, so all members report the same occupied/vacant/intent
   outcome while grouped.
6. Group timeout behavior is singular:
   - the longest active contribution in the group governs the group's vacancy
   - shorter later events may extend coverage but must not shorten the active
     group hold
7. Explainability must preserve source origin through the group, for example:
   `Kitchen occupied via Main Floor Open Area group from Dining motion`.
8. Floor-scoped `Occupancy Groups` remains the active authoring model, but the
   persistence/runtime model must move away from reciprocal state mirroring.
9. Reciprocal `sync_locations` is no longer the target design pattern for
   active runtime semantics; it becomes legacy compatibility material to be
   migrated or retired.

**Rationale**:

1. A first-class group object matches the actual product intent better than a
   network of mirrored rooms.
2. One source of truth is easier to reason about, explain, test, and restore
   than many copied synthetic contributions.
3. The desired contract is "this group behaves like one area" and should be
   modeled that way directly.
4. Member rooms still need to exist independently for room-level devices,
   automations, and topology, but that does not require independent occupancy
   authority while grouped.

**Consequences**:

- ✅ Grouped rooms can no longer drift apart in occupied/vacant/intent state by
  design; they read from one canonical occupancy object.
- ✅ Timeout behavior becomes easier to express: one effective timeout per group.
- ✅ Explainability gets clearer because the system can answer both "which group
  is keeping this occupied?" and "which originating source inside the group did
  it?"
- ✅ The runtime model now matches the user's mental model of a hidden common
  area.
- ⚠️ This supersedes the contribution-mirroring runtime pattern described in
  ADR-HA-067 and will require backend/runtime refactoring.
- ⚠️ Existing persistence based on reciprocal `sync_locations` should be treated
  as transitional compatibility, not the desired end state.
- ⚠️ Contracts, architecture docs, restore behavior, and tests must be updated
  together before implementation is considered complete.

**Alternatives Considered**:

- Keep mirrored contributor union as the runtime model:
  rejected because it approximates one shared space using many copied states and
  is too easy to let drift.
- Model the group as a visible topology parent in the left tree:
  rejected because occupancy grouping is behavioral, not structural.
- Keep `sync_locations` as the permanent core primitive and only tighten the
  propagation code:
  rejected because it improves a brittle implementation rather than correcting
  the underlying model.

---

### ADR-HA-071: Occupancy Group Technical Contract Uses Group Authority, Member Projection, and Room-Local Sources (2026-04-06)

**Status**: ✅ APPROVED

**Context**:

ADR-HA-070 established that an Occupancy Group is a first-class runtime object,
not a mesh of mirrored peer state. We still need a concrete technical contract
for how group membership, runtime authority, room-local sources, manual actions,
and explainability should work.

Without this contract, implementation will drift into partial adapter logic,
unclear source routing, or accidental reintroduction of per-room occupancy
authority.

**Decision**:

1. Group membership lives explicitly on member rooms via `occupancy_group_id`.
2. Occupancy group runtime state lives in the occupancy runtime/core layer, not
   in the Home Assistant adapter.
3. The runtime owns one canonical state per group:
   - occupied / vacant
   - effective timeout / vacancy timing
   - lock behavior / intent behavior
4. Detection sources remain room-local in authoring:
   - sensors and detection config are still assigned to rooms
   - manual controls are still invoked from rooms
   - automations remain attached to rooms
5. When a room belongs to an occupancy group, occupancy-affecting events from
   that room are resolved to the group as the behavioral authority while
   preserving the originating room/source identity.
6. Member rooms project group authority as their public occupancy result:
   - all grouped members publish the same occupied/vacant result
   - all grouped members expose the same effective timeout behavior
   - all grouped members expose the same lock behavior
7. No new Home Assistant entity is introduced for the group in v1.
8. Explainability should name the group explicitly, using wording equivalent to
   `via occupancy group`, while preserving the originating room and source.
9. Legacy `sync_locations` compatibility is not a design constraint for the new
   model; alpha-stage implementation may replace it outright.

**Rationale**:

1. Explicit `occupancy_group_id` is easier to reason about than implicit graph
   reconstruction from reciprocal room arrays.
2. Room-local authoring preserves the user's mental model for sources and
   manual controls while allowing runtime authority to move to the group.
3. Projected member state gives Home Assistant and Topomation one clear answer
   per room without requiring new public entities.
4. Keeping group state in the occupancy runtime avoids adapter-only logic and
   aligns the primitive with the engine that already owns timeout and lock
   semantics.

**Consequences**:

- ✅ Grouped rooms remain normal rooms for devices, labels, sources, and room
  automations.
- ✅ Group occupancy becomes canonical and deterministic.
- ✅ Member binary sensors remain the only public occupancy entities while still
  reflecting one shared authority.
- ✅ Explainability can answer both "why is this room occupied?" and "which
  group/source is responsible?" in a stable way.
- ⚠️ Occupancy runtime will need a real group registry/model instead of
  deriving grouping from reciprocal room config arrays.
- ⚠️ The Home Assistant integration must translate room-local source activity to
  group-targeted occupancy events while preserving origin metadata.
- ⚠️ Contracts and architecture docs now need a follow-up rewrite to replace
  old `sync_locations`-centric language.

**Alternatives Considered**:

- Keep group membership implicit as reciprocal arrays on each room:
  rejected because the group itself is the authority and should be modeled
  directly.
- Create a new Home Assistant entity per occupancy group:
  rejected for v1 because the product wants group authority without adding HA
  entity clutter.
- Move room-local sources and manual controls onto the group object in the UI:
  rejected because sources and manual actions are still most understandable from
  the room context where they originate.

---

### ADR-HA-072: Building And Grounds Use Derived Occupancy + Universal Explainability (2026-04-06)

**Status**: ✅ APPROVED

**Context**:

The active inspector still treated `building` and `grounds` like editable room
occupancy nodes, exposing direct source assignment and room-centric
explainability language. That conflicted with the product model:

- `building` and `grounds` are structural rollup locations
- their occupancy should derive from descendant locations
- users still need to understand why those structural locations are occupied
  right now

This exposed two separate use cases that were being blended together:

1. occupancy configuration
2. occupancy explainability

For structural locations, explainability remains valuable, but direct occupancy
authoring does not.

**Decision**:

1. `building` and `grounds` use derived occupancy in the active UI.
2. Structural locations do not expose direct occupancy source authoring:
   - no `Sources`
   - no `Add Source`
   - no WIAB
   - no occupancy-group editor/summary
3. Structural locations keep a read-only occupancy summary in the occupancy tab.
4. Explainability is universal across location types, but its copy must be
   location-oriented rather than room-oriented.
5. The user-facing diagnostic panel is renamed from `Room Explainability` to
   `Occupancy Explainability`.
6. Explainability copy must use product language for propagation and internal
   contributors:
   - show child/parent/linked location names instead of raw internal source IDs
   - describe state changes as location changes, not room changes

**Rationale**:

1. A building should not be occupiable by direct sources while every child
   floor/area remains vacant.
2. Users still need to answer “why is Home occupied?” and “what changed?” for
   structural locations.
3. Explainability is a cross-location diagnostic surface; editing rules are
   type-specific.
4. Raw internal IDs such as `__child__.floor_second_floor` are implementation
   artifacts, not acceptable product language.

**Consequences**:

- ✅ `building` and `grounds` behave consistently as derived occupancy nodes.
- ✅ The occupancy page for structural locations becomes simpler and easier to
  trust.
- ✅ Explainability remains useful on all location types.
- ✅ Recent changes stay focused on meaningful occupancy transitions rather than
  becoming a generic debug log.
- ⚠️ Structural occupancy tabs now need a dedicated summary layout instead of
  reusing the room source editor.
- ⚠️ Explainability formatting must keep pace with runtime contributor naming so
  internal IDs do not leak into the UI.

**Alternatives Considered**:

- Keep direct source assignment on `building`/`grounds`:
  rejected because it breaks the derived structural occupancy model.
- Remove explainability entirely from structural locations:
  rejected because understanding aggregate occupancy is still a real user need.
- Keep `Room Explainability` wording everywhere:
  rejected because it is misleading for `floor`, `building`, and `grounds`.

### ADR-HA-073: Structural Nodes Are Informational Pages, Not Automation Editors (2026-04-07)

**Status**: ✅ APPROVED

**Context**:

After clarifying that `floor`, `building`, and `grounds` are structural nodes,
we still had the inspector presenting them with room-style automation tabs
(`Ambient`, `Lighting`, `Media`, `HVAC`). That created a misleading product
pattern:

- structural nodes looked like automation authoring targets
- users could infer that whole-home/floor actions were first-class Topomation
  configuration
- the right side of the page was optimized for editing rather than understanding

The actual use case for structural nodes is different:

1. understand aggregate occupancy
2. understand which descendants are active
3. understand what changed recently
4. in the case of `floor`, manage occupancy groups for child areas

Whole-home or whole-floor scenes remain possible in Home Assistant automations,
but they do not need a dedicated Topomation authoring surface.

**Decision**:

1. Structural nodes are informational pages in the active inspector.
2. `building` and `grounds` do not render room-style top tabs.
3. `building` and `grounds` show a summary surface instead:
   - derived occupancy
   - active child locations
   - structure summary
   - occupancy explainability
4. `floor` remains a special structural scope for occupancy-group management,
   but it also does not render room-style automation tabs.
5. Structural nodes do not expose `Ambient`, `Lighting`, `Media`, or `HVAC`
   editors in the active inspector.
6. If users want whole-home or floor-wide scenes/actions, they should author
   them as standard Home Assistant automations outside this panel.

**Rationale**:

1. Structural nodes are not rooms and should not behave like room editors.
2. Aggregate scene/action authoring at structural levels creates duplicate or
   conflicting control paths with room automation.
3. The product value of structural nodes is understanding occupancy and
   topology, not issuing macro actions.
4. Removing the room-style tabs creates space for more useful summary
   information on the right side.

**Consequences**:

- ✅ Structural pages become easier to understand and trust.
- ✅ The right pane can focus on summary and explainability instead of fake
  room controls.
- ✅ Floors remain the authoring scope for occupancy groups without carrying
  unrelated automation tabs.
- ⚠️ Aggregate scenes are no longer discoverable from structural nodes inside
  Topomation.
- ⚠️ Structural summary cards now need to surface enough information that users
  do not miss the removed tabs.

**Alternatives Considered**:

- Keep full automation tabs on structural nodes:
  rejected because it blurs the line between room behavior and aggregate
  topology.
- Keep only a subset of action tabs on structural nodes:
  rejected because it still implies structural nodes are primary automation
  targets.
- Replace structural tabs with a dedicated scene authoring surface:
  rejected for now because standard Home Assistant automations already cover
  that use case cleanly.

### ADR-HA-074: Lighting Rules Use Explicit Trigger Families, Not Generic Situations (2026-04-08)

**Status**: ✅ APPROVED

**Context**:

The active Lighting rule editor exposed a generic `Situation 1 / Situation 2`
model with `Add situation` controls. That implementation matched an internal
constraint, but it did not match the user’s mental model.

In practice, Lighting rules only need two trigger families:

1. an occupancy-edge trigger
2. an ambient-light-edge trigger

Each family can carry exactly one cross-dimension condition:

- occupancy edge conditioned by ambient state
- ambient edge conditioned by occupancy state

Users do not think in terms of arbitrary numbered situations. They think in
terms of:

- `When room becomes occupied, only if it is dark`
- `When it becomes bright, only if the room is vacant`

The editor also over-explained time windows and action rows, creating extra
labels (`Rule timing`, `Set room lights to`) that made the page feel heavier
than the underlying rule model.

**Decision**:

1. Lighting rules use two first-class trigger family rows in the UI:
   - `Occupancy change`
   - `Ambient light change`
2. Trigger family rows do not render a dedicated `Off` option.
3. A trigger family is inactive when no trigger in that family is selected.
4. Each trigger family row exposes only the relevant cross-dimension condition:
   - occupancy trigger: `Any`, `It is dark`, `It is bright`
   - ambient trigger: `Any`, `Room is occupied`, `Room is vacant`
5. The panel must not present numbered `Situation` cards for Lighting rules.
6. Lighting rules continue to support one optional time window only.
7. The time window editor is presented as one optional advanced filter, not as
   a separate timing sub-model.
8. The time window section header and enable checkbox are presented on one line.
9. Lighting rules continue to trigger on semantic ambient state
   (`dark` / `bright`), not raw lux thresholds.
10. Lux thresholds remain an Ambient configuration concern, not a per-rule
   Lighting trigger concern.
11. The action section is presented as a light target list, not as
   room-centered prose like `Set room lights to`.

**Rationale**:

1. The UI should reflect the real rule model users are authoring.
2. A flat trigger-family presentation is easier to scan and explain than
   generic numbered situations.
3. `dark` / `bright` are the right lighting-rule abstractions for most users;
   lux belongs in ambient calibration.
4. Time window is a secondary filter and should not dominate the rule editor.
5. The target section is fundamentally a list of lights plus actions, so the
   UI should present it that way.

**Consequences**:

- ✅ Lighting rules become easier to author and read.
- ✅ The editor better matches the backend trigger model already in use.
- ✅ We preserve support for combined occupancy + ambient triggers without
  pretending the rule model is open-ended.
- ⚠️ Users wanting raw-lux triggers must configure ambient thresholds instead
  of entering lux directly in the Lighting rule.
- ⚠️ Existing frontend tests and copy must be updated away from `Situation`
  language.

**Alternatives Considered**:

- Keep generic `Situation` cards and just rename them:
  rejected because the core abstraction would still be wrong.
- Expose raw lux trigger thresholds directly in Lighting rules:
  rejected for now because it duplicates Ambient calibration and makes the rule
  editor heavier.
- Collapse everything into one natural-language sentence builder:
  rejected for now because it would obscure the two trigger families that still
  exist underneath.

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
