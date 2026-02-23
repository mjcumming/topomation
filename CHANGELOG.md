# Changelog

All notable changes to `home-topology-ha` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

- Topology persistence for location tree + module configs now includes sibling
  ordering (`order`) and entity mappings.
- New persistence tests in `tests/test_persistence.py`.
- Sync policy tests for topology-owned and sync-disabled locations in
  `tests/test_sync_manager.py`.
- WebSocket reorder contract test in `tests/test_websocket_contract.py`.

### Changed

- SyncManager now uses explicit authority rules:
  - `sync_source=homeassistant` + `sync_enabled=true` allows sync
  - `sync_source=topology` or `sync_enabled=false` blocks cross-boundary writes
- Topology rename/parent/delete synchronization now consumes core mutation
  events from `home-topology` instead of integration-level method wrapping.
- `locations/reorder` now uses core indexed reorder support and persists
  canonical sibling ordering.

### Fixed

- Unload/teardown safety for event unsubscription.
- Coordinator timeout scheduling now ignores invalid non-datetime module values.
- Duplicate pytest fixture definition cleanup in `tests/conftest.py`.
