# Epic: [EPIC-001] Backend Integration

**Status**: Substantially Complete
**Created**: 2025-12-10
**Target**: v0.1.0-alpha (Completed), live-HA validation remaining

---

## Summary

Complete the backend integration layer that connects the home-topology kernel to Home Assistant. This includes wiring WebSocket handlers to the actual LocationManager, implementing storage persistence, creating the event bridge for HA state changes, and building the coordinator for timeout scheduling.

---

## Goals

- [x] WebSocket API handlers communicate with real LocationManager (not stubs)
- [x] Location hierarchy persists across HA restarts
- [x] HA entity state changes translate to kernel occupancy v3 signals
- [x] Timeout scheduling works via HA's async scheduler

---

## Architecture Alignment

**Relevant ADRs**:

- ADR-HA-004: Host-Controlled Timeout Scheduling
- ADR-HA-005: Location Type Storage via `_meta` Module

**Constraints**:

- Integration is a thin adapter - no behavior logic
- Must use async/await for all I/O operations
- Must use HA's storage APIs for persistence

**Required Patterns**:

- DataUpdateCoordinator pattern for timeout scheduling
- Event translation via event_bridge.py
- Storage via HA's Store API

---

## Issue Breakdown

| Issue     | Title                                      | Status  | Priority |
| --------- | ------------------------------------------ | ------- | -------- |
| ISSUE-001 | Wire WebSocket handlers to LocationManager | Complete | High     |
| ISSUE-002 | Implement location storage persistence     | Complete | High     |
| ISSUE-003 | Create event bridge (HA state → kernel)    | Complete | High     |
| ISSUE-004 | Build timeout coordinator                  | Complete | Medium   |
| ISSUE-005 | Integration testing with live HA           | In Progress | Medium   |

---

## Completion Definition

This epic is complete when:

- [x] All WebSocket operations (CRUD) work with real data
- [x] Locations survive HA restart
- [x] Entity state changes trigger kernel events
- [x] Occupancy timeouts fire correctly
- [ ] Manual testing in live HA instance succeeds
- [ ] `/docs/work-tracking.md` shows Backend Integration at 100%

---

## Notes

**Current State**:

- Backend Integration: ~90%
- Frontend UI: 95% complete
- Event bridge aligned to core v3 (`occupancy.signal`)
- Remaining item is live-HA manual validation

**Key Files**:

- `custom_components/home_topology/__init__.py` - Integration setup
- `custom_components/home_topology/websocket_api.py` - WS handlers
- `custom_components/home_topology/coordinator.py` - Timeout scheduling
- `custom_components/home_topology/event_bridge.py` - Event translation

**Dependencies**:

- home-topology kernel library must be installed
- Frontend components are ready and waiting for real data

---

**Owner**: Mike
**Review Frequency**: Daily during active development
