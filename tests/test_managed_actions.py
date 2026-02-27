"""Tests for managed automation rule backend helpers."""

from __future__ import annotations

import json
from types import SimpleNamespace
from typing import cast

import pytest
from homeassistant.components.automation import DATA_COMPONENT as AUTOMATION_DATA_COMPONENT
from homeassistant.const import CONF_ID
from homeassistant.core import HomeAssistant

from custom_components.topomation.const import TOPOMATION_AUTOMATION_METADATA_PREFIX
from custom_components.topomation.managed_actions import (
    TopomationManagedActions,
    _delete_entry,
    _read_config,
    _upsert_entry,
    _write_config,
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
    _upsert_entry(config_entries, "second", {"alias": "Second"})
    assert {item["id"] for item in config_entries} == {"first", "second"}
    _upsert_entry(config_entries, "second", {"alias": "Second Updated"})
    updated = next(item for item in config_entries if item["id"] == "second")
    assert updated["alias"] == "Second Updated"
    assert _delete_entry(config_entries, "second")
    assert not _delete_entry(config_entries, "missing")


def test_automation_config_roundtrip(tmp_path) -> None:
    """Config file helpers write/read YAML lists (HA EditIdBasedConfigView pattern)."""
    path = tmp_path / "automations.yaml"
    data = [
        {"id": "rule_1", "alias": "Rule 1"},
        {"alias": "Rule without id"},
    ]
    _write_config(str(path), data)
    loaded = _read_config(str(path))
    assert len(loaded) == 2
    assert loaded[0]["id"] == "rule_1"
    assert loaded[0]["alias"] == "Rule 1"
    assert loaded[1]["alias"] == "Rule without id"


def test_automation_config_requires_yaml_list(tmp_path) -> None:
    """Non-list YAML structures raise an actionable error."""
    path = tmp_path / "automations.yaml"
    path.write_text("id: not-a-list\nalias: invalid\n", encoding="utf-8")

    with pytest.raises(ValueError, match="must contain a YAML list"):
        _read_config(str(path))


def test_read_config_returns_empty_for_missing_file(tmp_path) -> None:
    """Missing file returns empty list."""
    assert _read_config(str(tmp_path / "nonexistent.yaml")) == []
