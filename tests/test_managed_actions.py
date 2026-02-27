"""Tests for managed automation rule backend helpers."""

from __future__ import annotations

import json
from types import SimpleNamespace
from typing import cast

import pytest
from homeassistant.components.automation import DATA_COMPONENT as AUTOMATION_DATA_COMPONENT
from homeassistant.const import CONF_ID
from homeassistant.core import HomeAssistant
from homeassistant.util.yaml import load_yaml

from custom_components.topomation.const import TOPOMATION_AUTOMATION_METADATA_PREFIX
from custom_components.topomation.managed_actions import (
    TopomationManagedActions,
    _detect_automation_storage_strategy,
    _delete_automation_include_rule_file,
    _read_automation_config_file,
    _write_automation_include_rule_file,
    _write_automation_config_file,
)


@pytest.mark.asyncio
async def test_async_list_rules_filters_to_location_and_extracts_summary(
    hass: HomeAssistant,
) -> None:
    """List endpoint returns only matching location rules with action summary."""
    manager = TopomationManagedActions(hass)
    metadata = {
        "version": 2,
        "location_id": "bathroom",
        "trigger_type": "vacant",
        "require_dark": True,
    }
    description = f"Managed by Topomation.\n{TOPOMATION_AUTOMATION_METADATA_PREFIX} {json.dumps(metadata)}"

    matching_config = {
        CONF_ID: "topomation_bathroom_vacant",
        "alias": "Bathroom Vacant: Bathroom Light (turn off)",
        "description": description,
        "actions": [
            {
                "action": "light.turn_off",
                "target": {"entity_id": "light.bathroom"},
            }
        ],
    }
    other_config = {
        CONF_ID: "topomation_kitchen_vacant",
        "alias": "Kitchen Vacant: Kitchen Light (turn off)",
        "description": (
            "Managed by Topomation.\n"
            f"{TOPOMATION_AUTOMATION_METADATA_PREFIX} "
            '{"version":2,"location_id":"kitchen","trigger_type":"vacant","require_dark":false}'
        ),
        "actions": [
            {
                "action": "light.turn_off",
                "target": {"entity_id": "light.kitchen"},
            }
        ],
    }

    hass.data[AUTOMATION_DATA_COMPONENT] = SimpleNamespace(
        entities=[
            SimpleNamespace(
                entity_id="automation.bathroom_vacant",
                raw_config=matching_config,
                unique_id="topomation_bathroom_vacant",
            ),
            SimpleNamespace(
                entity_id="automation.kitchen_vacant",
                raw_config=other_config,
                unique_id="topomation_kitchen_vacant",
            ),
        ]
    )
    hass.states.async_set("automation.bathroom_vacant", "off")
    hass.states.async_set("automation.kitchen_vacant", "on")

    rules = await manager.async_list_rules("bathroom")

    assert len(rules) == 1
    rule = rules[0]
    assert rule["id"] == "topomation_bathroom_vacant"
    assert rule["entity_id"] == "automation.bathroom_vacant"
    assert rule["trigger_type"] == "vacant"
    assert rule["action_entity_id"] == "light.bathroom"
    assert rule["action_service"] == "turn_off"
    assert rule["require_dark"] is True
    assert rule["enabled"] is False


def test_private_helpers_parse_and_mutate_config() -> None:
    """Internal helper functions preserve managed metadata and config ids."""
    manager = TopomationManagedActions(cast(HomeAssistant, SimpleNamespace()))

    metadata_line = manager._metadata_line(  # noqa: SLF001
        {
            "version": 2,
            "location_id": "bathroom",
            "trigger_type": "occupied",
            "require_dark": False,
        }
    )
    parsed = manager._parse_metadata(f"Managed by Topomation.\n{metadata_line}")  # noqa: SLF001
    assert parsed is not None
    assert parsed.location_id == "bathroom"
    assert parsed.trigger_type == "occupied"
    assert parsed.require_dark is False
    assert manager._parse_metadata("Managed by Topomation") is None  # noqa: SLF001

    action_entity, action_service = manager._extract_action_summary(  # noqa: SLF001
        {
            "actions": [
                {
                    "action": "light.turn_on",
                    "target": {"entity_id": "light.bathroom"},
                }
            ]
        }
    )
    assert action_entity == "light.bathroom"
    assert action_service == "turn_on"

    fallback_entity, fallback_service = manager._extract_action_summary(  # noqa: SLF001
        {
            "action": {
                "action": "switch.turn_off",
                "data": {"entity_id": "switch.fan"},
            }
        }
    )
    assert fallback_entity == "switch.fan"
    assert fallback_service == "turn_off"

    assert manager._has_sun_dark_condition(  # noqa: SLF001
        {
            "conditions": [
                {
                    "condition": "or",
                    "conditions": [
                        {
                            "condition": "state",
                            "entity_id": "sun.sun",
                            "state": "below_horizon",
                        }
                    ],
                }
            ]
        }
    )
    assert not manager._has_sun_dark_condition({"conditions": []})  # noqa: SLF001

    config_entries = [{"id": "first", "alias": "First"}]
    manager._upsert_automation_config(config_entries, "second", {"alias": "Second"})  # noqa: SLF001
    assert {item["id"] for item in config_entries} == {"first", "second"}
    manager._upsert_automation_config(config_entries, "second", {"alias": "Second Updated"})  # noqa: SLF001
    updated = next(item for item in config_entries if item["id"] == "second")
    assert updated["alias"] == "Second Updated"
    assert manager._delete_automation_config(config_entries, "second")  # noqa: SLF001
    assert not manager._delete_automation_config(config_entries, "missing")  # noqa: SLF001


def test_automation_config_file_roundtrip(tmp_path) -> None:
    """Automation config file helpers write/read yaml lists with generated ids."""
    path = tmp_path / "automations.yaml"

    _write_automation_config_file(
        str(path),
        [
            {"id": "rule_1", "alias": "Rule 1"},
            {"alias": "Rule without id"},
        ],
    )

    loaded = _read_automation_config_file(str(path))
    assert len(loaded) == 2
    assert loaded[0]["id"] == "rule_1"
    assert loaded[1]["id"]


def test_automation_config_file_requires_yaml_list(tmp_path) -> None:
    """Non-list YAML structures raise an actionable error."""
    path = tmp_path / "automations.yaml"
    path.write_text("id: not-a-list\nalias: invalid\n", encoding="utf-8")

    with pytest.raises(ValueError, match="must contain a YAML list"):
        _read_automation_config_file(str(path))


def test_detect_automation_storage_strategy_include_dir_list(tmp_path) -> None:
    """Include-dir automation config is detected from configuration.yaml."""
    configuration = tmp_path / "configuration.yaml"
    configuration.write_text("automation: !include_dir_list automations/\n", encoding="utf-8")

    strategy = _detect_automation_storage_strategy(
        str(configuration),
        str(tmp_path / "automations.yaml"),
    )

    assert strategy.mode == "include_dir_list"
    assert strategy.path == str(tmp_path / "automations")


def test_write_and_delete_include_rule_file(tmp_path) -> None:
    """Managed include-dir rule files are written and deleted by automation id."""
    include_dir = tmp_path / "automations"
    payload = {"id": "topomation_test_rule", "alias": "Managed Rule"}

    _write_automation_include_rule_file(
        str(include_dir),
        "topomation_test_rule",
        payload,
        wrap_in_list=False,
    )
    rule_file = include_dir / "topomation_test_rule.yaml"
    loaded = load_yaml(str(rule_file))
    assert isinstance(loaded, dict)
    assert loaded["id"] == "topomation_test_rule"
    assert loaded["alias"] == "Managed Rule"

    assert _delete_automation_include_rule_file(str(include_dir), "topomation_test_rule")
    assert not rule_file.exists()


@pytest.mark.asyncio
async def test_async_create_rule_rolls_back_when_registration_never_appears(
    hass: HomeAssistant,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Create fails fast and rolls back if HA never registers the new automation."""
    manager = TopomationManagedActions(hass)
    location = SimpleNamespace(id="bathroom", name="Bathroom")

    monkeypatch.setattr(
        manager,
        "_find_occupancy_entity_id",
        lambda _location_id: "binary_sensor.bathroom_occupancy",
    )

    async def _validate(*_args, **_kwargs):
        return {}

    monkeypatch.setattr(
        "custom_components.topomation.managed_actions.async_validate_config_item",
        _validate,
    )

    writes: list[list[dict[str, object]]] = []

    async def _read(*_args, **_kwargs):
        return []

    async def _write(entries, *_args, **_kwargs):
        writes.append(list(entries))

    async def _reload(*_args, **_kwargs):
        return None

    async def _wait(*_args, **_kwargs):
        return None

    rolled_back = {"value": False}

    async def _rollback(_automation_id: str):
        rolled_back["value"] = True

    monkeypatch.setattr(manager, "_async_read_automation_config_file", _read)
    monkeypatch.setattr(manager, "_async_write_automation_config_file", _write)
    monkeypatch.setattr(manager, "_async_reload_automation", _reload)
    monkeypatch.setattr(manager, "_wait_for_entity_id", _wait)
    monkeypatch.setattr(manager, "_async_rollback_rule", _rollback)

    with pytest.raises(ValueError, match="could not verify automation registration"):
        await manager.async_create_rule(
            location=location,
            name="Bathroom Vacant: Bathroom Light (turn off)",
            trigger_type="vacant",
            action_entity_id="light.bathroom",
            action_service="turn_off",
            require_dark=False,
        )

    assert writes, "Expected automation config write before rollback"
    assert rolled_back["value"] is True


@pytest.mark.asyncio
async def test_async_reload_automation_times_out_with_actionable_error(
    hass: HomeAssistant,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Reload timeout surfaces ValueError so frontend can show explicit failure."""
    manager = TopomationManagedActions(hass)

    class _TimeoutContext:
        async def __aenter__(self):
            raise TimeoutError("timeout")

        async def __aexit__(self, exc_type, exc, tb):
            return False

    monkeypatch.setattr("custom_components.topomation.managed_actions.asyncio.timeout", lambda _seconds: _TimeoutContext())

    with pytest.raises(ValueError, match="Timed out waiting for Home Assistant automation reload"):
        await manager._async_reload_automation("rule_1")  # noqa: SLF001
