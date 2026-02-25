# Epic: [EPIC-004] UI Integration Testing & Real-World Validation

**Status**: Active
**Created**: 2025-12-10
**Target**: v0.1.0-alpha (Week of 2025-12-16)

---

## Summary

Test the UI with real backend data to discover design mismatches, missing features, and integration issues. Automate as much testing as possible to catch regressions and validate the UI design spec against actual implementation.

---

## Goals

- [ ] All UI components tested with real WebSocket backend
- [ ] Automated test suite covering critical user flows
- [ ] Visual regression testing for UI components
- [ ] All design spec requirements validated
- [ ] Discovered issues documented and prioritized
- [ ] Backend fixes created as issues when UI reveals problems

---

## Architecture Alignment

**Relevant ADRs**:

- ADR-HA-001: Lit for Frontend
- ADR-HA-002: Entity Scope - Area Entities Only
- ADR-HA-003: Two Trigger Modes for Entity Configuration

**Constraints**:

- Tests must work with real WebSocket API (not mocks)
- Must test in actual HA environment or realistic simulation
- Follow "NO BS MOCK TESTS" philosophy from .github/copilot-instructions.md

**Required Patterns**:

- Use web-test-runner for unit/component tests
- Use Playwright for E2E tests
- Test with real LocationManager data
- Visual regression with screenshot comparison

---

## Issue Breakdown

| Issue     | Title                                      | Status  | Priority |
| --------- | ------------------------------------------ | ------- | -------- |
| ISSUE-030 | Test UI with real WebSocket backend        | Pending | High     |
| ISSUE-031 | Document UI/backend mismatches             | Pending | High     |
| ISSUE-032 | Create automated component tests           | Pending | High     |
| ISSUE-033 | Set up Playwright E2E testing              | Pending | Medium   |
| ISSUE-034 | Visual regression testing                  | Pending | Medium   |
| ISSUE-035 | Validate design spec requirements          | Pending | Medium   |
| ISSUE-036 | Create issues for discovered backend fixes | Pending | High     |

---

## Completion Definition

This epic is complete when:

- [ ] All UI components tested with real backend data
- [ ] Critical user flows have automated tests
- [ ] All design spec mismatches documented
- [ ] Issues created for all discovered backend problems
- [ ] Test suite runs in CI
- [ ] Visual regression baseline established

---

## Notes

**Current State**:

- UI components built with mock data
- WebSocket handlers now wired to real LocationManager (ISSUE-001 complete)
- Minimal test coverage exists
- Design spec is comprehensive but untested against real data

**Key Testing Areas** (from ui-design.md):

1. Tree Panel - hierarchy display, expand/collapse, selection
2. Details Panel - occupancy config, actions tab
3. Dialogs - location create/edit, entity config, rule editor
4. Drag-and-drop - reordering, reparenting
5. Inline editing - rename locations
6. Real-time updates - occupancy state changes
7. Error handling - network errors, validation errors
8. Responsive design - mobile/tablet/desktop

**Testing Philosophy**:

- Test with real data, not mocks
- Focus on user flows, not implementation details
- Catch design mismatches early
- Document everything discovered

---

**Owner**: Mike
**Review Frequency**: Daily during active testing
