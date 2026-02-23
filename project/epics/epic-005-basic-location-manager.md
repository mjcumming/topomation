# Epic: [EPIC-005] Basic Location Manager - Get It Working

**Status**: Active
**Created**: 2025-12-10
**Target**: v0.1.0-alpha (Week of 2025-12-16)

---

## Summary

Get the basic location manager UI working with mock data. Focus on core functionality: panel loads, displays locations, and supports CRUD operations. Skip occupancy/config for now - just get location management working first.

---

## Goals

- [ ] Panel initializes and loads mock location data
- [ ] Tree displays location hierarchy correctly
- [ ] Create location works (dialog + WebSocket call)
- [ ] Update location works (inline rename + WebSocket call)
- [ ] Delete location works (confirmation + WebSocket call)
- [ ] Move locations in tree (drag-and-drop + WebSocket call)
- [ ] Inspector shows selected location details
- [ ] All operations work with mock WebSocket backend

---

## Architecture Alignment

**Relevant ADRs**:

- ADR-HA-001: Lit for Frontend
- ADR-HA-005: Location Type Storage via `_meta` Module

**Constraints**:

- Use mock-harness.html for development
- Follow frontend patterns from `.cursor/rules/frontend-patterns.mdc`
- Use `shouldUpdate` filtering to prevent performance issues
- Use HA components where possible (ha-form, ha-dialog, etc.)

**Required Patterns**:

- Mock WebSocket in mock-hass.ts
- Component lifecycle (shouldUpdate, firstUpdated)
- Event handling (CustomEvent with bubbles/composed)
- Error handling with user-friendly messages

---

## Issue Breakdown

| Issue     | Title                                      | Status  | Priority |
| --------- | ------------------------------------------ | ------- | -------- |
| ISSUE-040 | Panel initialization and mock data loading | Pending | High     |
| ISSUE-041 | Tree display and hierarchy rendering       | Pending | High     |
| ISSUE-042 | Create location dialog and WebSocket call  | Pending | High     |
| ISSUE-043 | Update location (inline rename)            | Pending | High     |
| ISSUE-044 | Delete location with confirmation          | Pending | High     |
| ISSUE-045 | Drag-and-drop tree reordering              | Pending | High     |
| ISSUE-046 | Inspector panel for selected location      | Pending | Medium   |

---

## Completion Definition

This epic is complete when:

- [ ] Panel loads without errors in mock-harness
- [ ] Tree displays mock locations in correct hierarchy
- [ ] Can create new locations via dialog
- [ ] Can rename locations inline
- [ ] Can delete locations with confirmation
- [ ] Can drag-and-drop to reorder/move locations
- [ ] Inspector shows location details when selected
- [ ] All operations work with mock WebSocket (no real backend needed yet)

---

## Notes

**Current State**:

- UI components exist but "mostly don't work"
- Mock harness exists and is set up
- WebSocket backend is wired (ISSUE-001) but not needed for this epic
- Focus on mock data first, then wire to real backend later

**What We're NOT Doing** (yet):

- Occupancy configuration
- Entity configuration
- Actions/automation rules
- Real backend integration (that's later)

**What We ARE Doing**:

- Basic location CRUD
- Tree manipulation
- Mock data only
- Get it working, then make it pretty

**Key Files**:

- `custom_components/home_topology/frontend/mock-harness.html`
- `custom_components/home_topology/frontend/mock-hass.ts`
- `custom_components/home_topology/frontend/home-topology-panel.ts`
- `custom_components/home_topology/frontend/ht-location-tree.ts`
- `custom_components/home_topology/frontend/ht-location-inspector.ts`
- `custom_components/home_topology/frontend/ht-location-dialog.ts`

**Best Practices to Follow**:

- See `docs/frontend-dev-workflow.md`
- See `.cursor/rules/frontend-patterns.mdc`
- See `.cursor/rules/ha-components.mdc`
- Use `shouldUpdate` filtering
- Use HA components (ha-form, ha-dialog)
- Follow Lit patterns from documentation

---

**Owner**: Mike
**Review Frequency**: Daily during active development
