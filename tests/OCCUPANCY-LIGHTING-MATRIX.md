# Occupancy, grouping, and managed lighting — integration test matrix

**Purpose**: Trace **Topomation integration** behavior to tests. This is the deliverable checklist for backend coverage of occupancy wiring, floor groups, event translation, and managed-automation **compilation** (triggers/conditions/actions sent to Home Assistant).

**Last reviewed**: 2026-04-10

---

## 1. Scope boundaries (do not duplicate upstream suites)

| Layer | Owned by | Topomation tests should … |
| --- | --- | --- |
| Occupancy math (timeouts, mixed sources, group canonical state) | `home-topology` (`OccupancyModule`, etc.) | **Not** re-prove kernel algorithms. Use the loaded module in HA tests only as a **fixture** to assert integration wiring. |
| HA automation **runtime** (firing, race conditions, device behavior) | Home Assistant core + devices | **Not** replace HA’s own tests. Use **live** tests sparingly (see `test-live-managed-actions-contract.py`). |
| **Event translation** (`EventBridge`: `state_changed` → kernel `Event`) | Topomation | **Yes** — table coverage per source profile. |
| **WS / config / entities** (groups, module config, occupancy entities) | Topomation | **Yes** — `test_websocket_contract.py` and related. |
| **Managed rule compilation** (`TopomationManagedActions`: triggers/conditions list) | Topomation | **Yes** — `test_managed_action_config_build_matrix.py`. |
| **Managed rule execution in HA** (automation component evaluates triggers/conditions/actions) | Home Assistant core | **Sparingly** — `test_managed_lighting_automation_runtime.py` checks that compiled rules actually fire in pytest-hc; does not replace HA core automation tests. |
| **Lock policy semantics** (whether `block_vacant` stops vacate, freeze behavior, etc.) | `home-topology` (`OccupancyModule`) | **Not** duplicated here beyond wiring checks. |
| **Lock service wiring** (`topomation.lock` / `unlock` / `unlock_all` → module; `entry_id` routing) | Topomation | **Yes** — `test_services.py`. |
| **Occupancy entity reflects lock state** (attributes on `binary_sensor.*` from kernel payloads / events) | Topomation | **Yes** — `test_binary_sensor.py`, `test_lock_services_integration.py`. |

---

## 2. Host-local occupancy groups (integration)

| Requirement / behavior | Test(s) |
| --- | --- |
| `occupancy_group_id` normalized on set_module_config (areas only) | `test_set_module_config_accepts_occupancy_group_id_for_building_child_areas`, `test_set_module_config_rejects_occupancy_group_id_for_floor_locations` |
| Grouped areas share runtime occupancy; trigger from one member; `origin_location_id` preserved | `test_set_module_config_occupancy_group_id_uses_shared_runtime_state_for_building_child_areas` |
| Member occupancy **binary sensors** stay aligned on group timeout | `test_grouped_area_binary_sensors_timeout_together` |
| `vacate_area` clears grouped occupancy | `test_grouped_area_vacate_area_service_clears_all_members` |
| Sync peer reconciliation with groups (if applicable) | `test_set_module_config_reconciles_current_sync_peer_occupancy_immediately` (and related in same file) |

---

## 3. Occupancy sources → kernel events (`EventBridge`)

Contract reference: `docs/contracts.md` **C-012** (detection source enumeration).  
Implementation: `custom_components/topomation/event_bridge.py`.

| Category | Representative test(s) in `test_event_bridge.py` |
| --- | --- |
| Motion / binary `state_changed` → trigger | `test_state_change_publishes_kernel_event`, adjacency variant `test_state_change_publishes_adjacency_handoff_events` |
| Light power / level / color signals | `test_light_state_to_signal_mapping`, `test_dimmer_*`, `test_light_color_change_publishes_color_signal` |
| Media playback / volume / mute | `test_media_state_changed_end_to_end_with_module_config`, `test_media_volume_change_publishes_trigger`, `test_media_mute_change_publishes_trigger`, `test_media_paused_state_publishes_clear`, `test_media_non_interaction_attribute_change_ignored` |
| Policy / alarm sources | `test_policy_source_*`, `test_policy_reconciliation_*` |
| WIAB / door semantics | `test_wiab_enclosed_room_handles_binary_door_states`, `test_wiab_home_containment_runs_for_unmapped_entity` |

**Gap policy**: When a new **source profile** or `event_bridge.py` branch ships, add one focused test here and a row in this table.

---

## 4. Managed lighting rules — config build matrix (integration)

Contract reference: `docs/contracts.md` **C-008**, **C-009**, **C-014A**.  
Implementation: `TopomationManagedActions._build_trigger_definitions`, `_build_condition_definitions`, `_ambient_condition_clause`.

| Dimension | Covered by |
| --- | --- |
| Trigger: `on_occupied` / `on_vacant` | `test_managed_action_trigger_build_matrix` |
| Trigger: `on_dark` / `on_bright` (lux only, sun only, lux + sun) | `test_managed_action_trigger_build_matrix` |
| Condition: ambient `any` / `dark` / `bright` (sun vs lux OR) | `test_managed_action_condition_build_matrix` |
| Condition: `must_be_occupied` true / false / omitted | `test_managed_action_condition_build_matrix` |
| Condition: time window enabled (same-day + overnight **payload shape**) | `test_managed_action_condition_build_matrix` |
| Occupancy condition without entity id → error | `test_managed_action_condition_requires_entity_for_occupancy_guard` |
| `require_dark` / `ambient_condition` normalization | `test_normalize_ambient_condition_matrix` |

**Note**: These tests assert **YAML-shaped dicts** Topomation generates. They do not assert that HA evaluates overnight `time` conditions the way a user expects; that remains HA’s contract.

### Managed lighting — HA runtime (pytest-homeassistant-custom-component)

Loads validated automation configs built like production (including `only_if_off` `choose` branches), then fires `occupancy_module.trigger` / `check_timeouts` and asserts test `light` entities. Time-window cases call `await hass.config.async_set_time_zone("UTC")` so `condition: time` matches frozen instants.

| Behavior | Test(s) in `test_managed_lighting_automation_runtime.py` |
| --- | --- |
| `on_occupied` → `light.turn_on` | `test_on_occupied_turn_on_runs` |
| `only_if_off` skips turn-on when light already on | `test_on_occupied_only_if_off_skips_when_light_already_on` |
| `on_vacant` → `light.turn_off` | `test_on_vacant_turn_off_runs` |
| `on_dark` / `on_bright` (sun elevation triggers) | `test_on_dark_sun_trigger_turns_on`, `test_on_bright_sun_trigger_turns_off` |
| Time condition inside / outside same-day window | `test_time_condition_allows_inside_window`, `test_time_condition_blocks_outside_window` |
| Lux `on_dark` + `must_be_occupied` | `test_on_dark_lux_numeric_trigger_with_must_be_occupied` |
| Ambient dark condition blocks when sun is up | `test_ambient_dark_condition_blocks_when_sun_up` |
| Grouped vacancy: one timeout, each room’s light off | `test_grouped_occupancy_vacant_turns_off_each_room_light` |

---

## 5. Lock and unlock (integration)

Contract reference: `docs/contracts.md` **C-001**, **C-004** (service surface, lock modes/scopes).

| Requirement / behavior | Test(s) |
| --- | --- |
| `lock` / `unlock` / `unlock_all` / `vacate_area` delegate to `OccupancyModule` with correct arguments | `test_lock_and_unlock_use_source_id`, `test_lock_defaults_mode_and_scope`, `test_lock_passes_mode_and_scope`, `test_unlock_all_forces_clear_all_lock_sources`, `test_vacate_area_passes_source_and_include_locked` in `test_services.py` |
| Loaded integration: services update occupancy entity **attributes** (`is_locked`, `locked_by`, …) via real kernel + `occupancy.changed` | `test_lock_unlock_and_unlock_all_update_occupancy_entity` in `test_lock_services_integration.py` |
| Binary sensor maps lock fields from module state / events | `test_binary_sensor_hydrates_startup_state_from_occupancy_module`, `test_binary_sensor_updates_lock_attributes_on_occupancy_changed` in `test_binary_sensor.py` |
| WIAB / enclosed room applies `block_vacant` lock + unlock on door | `test_wiab_enclosed_room_handles_binary_door_states` in `test_event_bridge.py` |

---

## 6. Live / release gates

| Gate | File / command |
| --- | --- |
| Managed rule WS + registry + delete | `test-live-managed-actions-contract.py` (`pytest --live-ha`, see `docs/agent-quickstart.md`) |
| Frontend floor groups save | `custom_components/topomation/frontend/playwright/live-automation-ui.spec.ts` |
| Room inspector device tabs (Lighting / Appliances / Media / HVAC) and fan target split (standalone vs climate-linked on same HA device) | `ht-location-inspector.test.ts`, `topomation-panel.test.ts`, `playwright/panel.spec.ts`, `playwright/live-automation-ui.spec.ts` |

---

## 7. Maintenance

- When `docs/contracts.md` changes for occupancy, groups, managed actions, or locks, update **§2–§5** in the same change.
- Prefer **parametrized** tests over copy-paste cases; keep this file as the **index**, not a prose duplicate of every `id`.
