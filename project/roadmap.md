# Roadmap - home-topology-ha

> High-level multi-week plan for the Home Assistant integration.

**Last Updated**: 2026-02-23

---

## Current Status

| Metric | Status |
|--------|--------|
| Overall Completion | ~82% |
| Documentation | 90% |
| Frontend UI | 95% |
| Frontend Infrastructure | 100% |
| Backend Integration | ~90% |
| Testing | ~65% |

---

## Release Timeline

```
Dec 2025                          Jan 2026                    Feb-Mar 2026
    |                                 |                           |
    v                                 v                           v
[EPIC-001]─────────────>        [EPIC-002]──────>          [EPIC-003]────>
Backend Integration              Testing                    Production
    |                                 |                           |
    v                                 v                           v
v0.1.0-alpha                    v0.2.0-beta                 v1.0.0
```

---

## Milestones

### v0.1.0-alpha - Completed

**Goal**: Working integration with real backend

**Epic**: [EPIC-001] Backend Integration

- [x] WebSocket handlers connected to LocationManager
- [x] Location persistence working
- [x] Event bridge translating HA state changes (v3 `occupancy.signal`)
- [x] Timeout coordinator scheduling correctly
- [ ] Manual testing successful in live HA

**Success Criteria**: Can create locations, add entities, and see occupancy changes in live HA instance.

---

### v0.2.0-beta - Target: March 2026

**Goal**: Tested and stable for early adopters

**Epic**: [EPIC-002] Testing Coverage

- [x] Unit tests for event bridge and coordinator
- [x] Integration/contract tests for backend flows
- [ ] Frontend tests expanded for new UI interactions
- [ ] Visual regression baseline stabilized
- [ ] All tests passing in CI

**Success Criteria**: Confident enough to share with beta testers.

---

### v1.0.0-stable - Target: Q2 2026

**Goal**: Production-ready for HACS

**Epic**: [EPIC-003] Production Release

- [ ] HACS compatible
- [ ] User documentation complete
- [ ] Release workflow automated
- [ ] Beta user validation complete

**Success Criteria**: Any HA user can install via HACS and configure without developer assistance.

---

## Active Work

**Current Sprint**: v3 Core API Alignment & UI Stabilization (2026-02-23 onward)
- Status: In Progress
- See `/docs/work-tracking.md` for details

**Next Focus**: UI reliability + integration polish
- Resolve known panel interaction issues
- Expand frontend interaction tests (dialogs, drag/drop, state sync)
- Run live-HA validation for v3 event flow

---

## Dependencies

```
                    ┌─────────────────┐
                    │  home-topology  │
                    │  (core library) │
                    └────────┬────────┘
                             │
                             │ depends on
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                      home-topology-ha                        │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  EPIC-001    │───▶│  EPIC-002    │───▶│  EPIC-003    │  │
│  │  Backend     │    │  Testing     │    │  Production  │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| HA API changes in 2025.x | High | Pin minimum HA version, test on multiple versions |
| Kernel API changes | Medium | Coordinate releases, maintain compatibility layer |
| HACS requirements change | Low | Monitor HACS changelog, update before submission |

---

## Notes

- Core library now targets v3 occupancy signal model
- Backend integration is largely complete and aligned to core v3 APIs
- Priority is UI completion and test hardening for beta readiness
- Testing philosophy: Real tests, not mock tests

---

**Owner**: Mike
**Review Frequency**: Weekly
