# Issue [ISSUE-001]: Wire WebSocket Handlers to LocationManager

**Epic**: [EPIC-001] Backend Integration
**Status**: Complete
**Created**: 2025-12-10
**Priority**: High

---

## Objective

Connect the existing WebSocket API handlers in `websocket_api.py` to the actual `LocationManager` instance from the home-topology kernel, replacing the current stub implementations with real CRUD operations on the location hierarchy.

---

## Requirements

### Functional Requirements

- WebSocket command `topomation/locations/list` returns actual locations from LocationManager
- WebSocket command `topomation/locations/create` creates real locations in the hierarchy
- WebSocket command `topomation/locations/update` modifies existing locations
- WebSocket command `topomation/locations/delete` removes locations from the hierarchy
- WebSocket command `topomation/locations/move` changes parent-child relationships
- All WebSocket responses include proper error handling
- Changes trigger appropriate events on the kernel's EventBus

### Constraints

- Integration is a thin adapter - no behavior logic here
- Must use async/await for all operations
- Must access LocationManager through the integration's entry data
- Must preserve existing WebSocket API contract (tests/test_websocket_contract.py)
- No breaking changes to frontend expectations

### Edge Cases

- Location not found (return proper error)
- Invalid parent ID (return validation error)
- Attempting to delete location with children (prevent or cascade per kernel rules)
- Concurrent modifications (kernel should handle, but test)
- Missing required fields in WebSocket payload

---

## Architecture Notes

**Relevant ADRs**:

- ADR-HA-004: Host-Controlled Timeout Scheduling
- ADR-HA-005: Location Type Storage via `_meta` Module

**Dependencies**:

- None - this is the foundational task that unblocks others
- home-topology kernel must be installed (already is)
- Frontend components are complete and waiting for real data

**Affected Files**:

- `custom_components/topomation/__init__.py` - Store LocationManager in entry data
- `custom_components/topomation/websocket_api.py` - Replace stub handlers with real implementations
- `custom_components/topomation/const.py` - May need constants for data keys

---

## Acceptance Criteria

- [ ] `topomation/locations/list` returns actual hierarchy from LocationManager
- [ ] `topomation/locations/create` creates location and returns new location data
- [ ] `topomation/locations/update` modifies location properties (name, parent, etc.)
- [ ] `topomation/locations/delete` removes location from hierarchy
- [ ] `topomation/locations/move` changes parent-child relationships
- [ ] All handlers include proper error handling with meaningful messages
- [ ] Location type metadata stored via `_meta` module per ADR-HA-005
- [ ] Existing WebSocket contract tests pass (`tests/test_websocket_contract.py`)
- [ ] Manual testing in mock harness shows real data flow
- [ ] No behavior logic implemented in integration (kernel handles all logic)

---

## Agent Instructions

1. Load this issue, EPIC-001, and relevant ADRs (ADR-HA-004, ADR-HA-005)
2. Review existing code:
   - `custom_components/topomation/websocket_api.py` (current stubs)
   - `tests/test_websocket_contract.py` (contract expectations)
   - Home topology kernel LocationManager API
3. Generate a plan for the implementation:
   - How to store/access LocationManager in entry data
   - How each WebSocket handler maps to LocationManager methods
   - How to handle location type metadata via `_meta`
   - Error handling strategy
4. Implement incrementally (one handler at a time if needed)
5. Perform self-review per `/project/agent/review-protocol.md`
6. Test with both automated tests and manual testing
7. Update this issue status to Complete
8. Update `/docs/work-tracking.md` Backend Integration percentage

---

## Notes

**Current State**:

- WebSocket handlers exist but return stub data
- Frontend components are functional and waiting for real backend
- LocationManager API is well-defined in kernel library

**Key LocationManager Methods** (from kernel):

```python
location_manager.get_location(location_id: str) -> Location | None
location_manager.create_location(name: str, parent_id: str | None, ...) -> Location
location_manager.update_location(location_id: str, **updates) -> Location
location_manager.delete_location(location_id: str) -> None
location_manager.move_location(location_id: str, new_parent_id: str | None) -> None
location_manager.get_children(location_id: str) -> list[Location]
location_manager.get_hierarchy() -> dict
```

**Location Type Storage Pattern** (per ADR-HA-005):

```python
# Store type/icon in _meta module
location_manager.set_module_config(
    location_id=loc_id,
    module_id="_meta",
    config={
        "type": "room",
        "category": "living_room",
        "icon": "mdi:sofa"
    }
)
```

**Reference Implementation**:
Study official HA integrations for WebSocket + storage patterns:

- `zha` - Entity management via coordinator
- `mqtt` - WebSocket API patterns
- `lovelace` - Config storage patterns

---

**Ready for implementation!**
