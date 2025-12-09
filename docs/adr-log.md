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
