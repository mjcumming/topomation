# Epic: [EPIC-002] Testing Coverage

**Status**: Active
**Created**: 2025-12-10
**Target**: v0.2.0-beta (March 2026)

---

## Summary

Establish comprehensive test coverage for the integration layer. This includes unit tests for the event bridge and coordinator, integration tests for the full flow, expanded frontend component tests, and visual regression testing with Playwright.

---

## Goals

- [ ] Unit test coverage for all backend modules
- [ ] Integration tests verify end-to-end flow
- [ ] Frontend components have meaningful tests
- [ ] Visual regression catches UI breakage

---

## Architecture Alignment

**Relevant ADRs**:
- None specific - follows testing philosophy in `.github/copilot-instructions.md`

**Constraints**:
- NO BS MOCK TESTS - Write real tests that test real functionality
- Avoid excessive mocking that makes tests meaningless
- Mocks only for external services (HA core, hardware)

**Required Patterns**:
- pytest for Python tests
- Real dependencies where possible
- Playwright for visual regression

---

## Issue Breakdown

| Issue | Title | Status | Priority |
|-------|-------|--------|----------|
| ISSUE-010 | Unit tests for event_bridge.py | Complete | High |
| ISSUE-011 | Unit tests for coordinator.py | Complete | High |
| ISSUE-012 | Integration tests for full flow | In Progress | High |
| ISSUE-013 | Expand frontend component tests | Pending | Medium |
| ISSUE-014 | Visual regression with Playwright | Pending | Low |

---

## Completion Definition

This epic is complete when:

- [x] event_bridge.py has >80% coverage
- [x] coordinator.py has >80% coverage
- [ ] At least 3 integration tests cover happy path
- [ ] Frontend tests exist for key interactions
- [ ] Visual regression baseline established
- [ ] All tests pass in CI

---

## Notes

**Current State**:
- Tests: ~65%
- Backend-focused suites (event bridge/coordinator/init/persistence/sync/ws/services) pass locally
- Coverage threshold is near-pass on backend subset; UI and additional suites still needed

**Testing Philosophy** (from .github/copilot-instructions.md):
> Write integration tests that actually test real functionality. Avoid excessive mocking that makes tests meaningless.

**Blocked By**:
- Frontend interaction stability work before full UI regression baselines

---

**Owner**: Mike
**Review Frequency**: Weekly
