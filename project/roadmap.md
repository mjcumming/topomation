# Roadmap - topomation

**Last Updated**: 2026-02-24
**Purpose**: strategic release direction and milestone sequencing.

Detailed execution status is tracked in `docs/work-tracking.md` and `project/issues/`.

## Release Direction

### v0.1.0-alpha (Current Release Gate)

Goal: reliable live-HA validation of topology + occupancy flow.

Exit criteria:
- Live validation checklist passes end-to-end
- No blocking runtime errors in HA logs
- Installation and release notes are aligned with shipped behavior

### v0.2.0-beta (Next)

Goal: increase confidence and test depth for broader early adopters.

Focus areas:
- Expand frontend interaction coverage
- Stabilize integration/e2e and visual validation workflows
- Tighten CI signal for regression prevention

### v1.0.0-stable (Future)

Goal: production-ready distribution and supportability.

Focus areas:
- HACS readiness and release automation
- User-facing documentation completeness
- Validation with real user environments

## Sequencing

1. EPIC-001 Backend Integration (substantially complete)
2. EPIC-002 Testing Coverage (active for release confidence)
3. EPIC-003 Production Release (after validation confidence)

## Risks To Monitor

- Home Assistant API changes across releases
- Kernel API contract changes and compatibility handling
- Release/distribution requirements drift (HACS and packaging)
