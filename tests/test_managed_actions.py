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
from custom_components.topomation.managed_actions import TopomationManagedActions


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
