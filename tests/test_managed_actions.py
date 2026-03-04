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
        "version": 3,
        "location_id": "bathroom",
        "trigger_type": "on_vacant",
        "ambient_condition": "dark",
        "must_be_occupied": False,
        "time_condition_enabled": False,
        "start_time": "18:00",
        "end_time": "23:59",
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
    assert rule["trigger_type"] == "on_vacant"
    assert rule["action_entity_id"] == "light.bathroom"
    assert rule["action_service"] == "turn_off"
    assert rule["ambient_condition"] == "dark"
    assert rule["must_be_occupied"] is False
    assert rule["time_condition_enabled"] is False
    assert rule["require_dark"] is True
    assert rule["enabled"] is False


@pytest.mark.asyncio
async def test_async_delete_rules_for_location_deletes_only_matching_automations(
    hass: HomeAssistant,
) -> None:
    """Delete helper should only delete Topomation automations for target location."""
    manager = TopomationManagedActions(hass)
    metadata_kitchen = {
        "version": 3,
        "location_id": "kitchen",
        "trigger_type": "on_occupied",
        "ambient_condition": "any",
        "must_be_occupied": False,
        "time_condition_enabled": False,
        "start_time": "18:00",
        "end_time": "23:59",
    }
    metadata_bedroom = {
        "version": 3,
        "location_id": "bedroom",
        "trigger_type": "on_vacant",
        "ambient_condition": "any",
        "must_be_occupied": False,
        "time_condition_enabled": False,
        "start_time": "18:00",
        "end_time": "23:59",
    }
    kitchen_description = (
        "Managed by Topomation.\n"
        f"{TOPOMATION_AUTOMATION_METADATA_PREFIX} {json.dumps(metadata_kitchen)}"
    )
    bedroom_description = (
        "Managed by Topomation.\n"
        f"{TOPOMATION_AUTOMATION_METADATA_PREFIX} {json.dumps(metadata_bedroom)}"
    )

    hass.data[AUTOMATION_DATA_COMPONENT] = SimpleNamespace(
        entities=[
            SimpleNamespace(
                entity_id="automation.kitchen_occupied",
                raw_config={
                    CONF_ID: "topomation_kitchen_occupied_light_kitchen",
                    "description": kitchen_description,
                },
                unique_id="topomation_kitchen_occupied_light_kitchen",
            ),
            SimpleNamespace(
                entity_id="automation.bedroom_vacant",
                raw_config={
                    CONF_ID: "topomation_bedroom_vacant_light_bedroom",
                    "description": bedroom_description,
                },
                unique_id="topomation_bedroom_vacant_light_bedroom",
            ),
            SimpleNamespace(
                entity_id="automation.unmanaged",
                raw_config={
                    CONF_ID: "unmanaged_rule",
                    "description": "Plain automation",
                },
                unique_id="unmanaged_rule",
            ),
        ]
    )

    deleted: list[str] = []

    async def _fake_delete_rule(*, automation_id: str, entity_id: str | None = None) -> None:
        deleted.append(automation_id)

    manager.async_delete_rule = _fake_delete_rule  # type: ignore[method-assign]

    deleted_ids = await manager.async_delete_rules_for_location("kitchen")

    assert deleted_ids == ["topomation_kitchen_occupied_light_kitchen"]
    assert deleted == ["topomation_kitchen_occupied_light_kitchen"]


def test_private_helpers_parse_and_mutate_config() -> None:
    """Internal helper functions preserve managed metadata and config ids."""
    manager = TopomationManagedActions(cast(HomeAssistant, SimpleNamespace()))

    metadata_line = manager._metadata_line(  # noqa: SLF001
        {
            "version": 2,
            "location_id": "bathroom",
            "trigger_type": "on_occupied",
            "ambient_condition": "any",
            "must_be_occupied": False,
            "time_condition_enabled": False,
            "start_time": "18:00",
            "end_time": "23:59",
        }
    )
    parsed = manager._parse_metadata(f"Managed by Topomation.\n{metadata_line}")  # noqa: SLF001
    assert parsed is not None
    assert parsed.location_id == "bathroom"
    assert parsed.trigger_type == "on_occupied"
    assert parsed.ambient_condition == "any"
    assert parsed.must_be_occupied is False
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


@pytest.mark.asyncio
async def test_resolve_created_entity_id_retries_registry_lookup(
    hass: HomeAssistant,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Entity resolution retries registry lookup before giving up."""
    manager = TopomationManagedActions(hass)

    class _FakeRegistry:
        def __init__(self) -> None:
            self.calls = 0

        def async_get_entity_id(self, domain: str, platform: str, unique_id: str) -> str | None:
            self.calls += 1
            if self.calls < 3:
                return None
            assert domain == "automation"
            assert platform == "automation"
            assert unique_id == "topomation_kitchen_occupied_light_kitchen"
            return "automation.kitchen_occupied"

    fake_registry = _FakeRegistry()

    async def _no_sleep(_: float) -> None:
        return None

    monkeypatch.setattr("custom_components.topomation.managed_actions.er.async_get", lambda _: fake_registry)
    monkeypatch.setattr("custom_components.topomation.managed_actions.asyncio.sleep", _no_sleep)

    entity_id = await manager._resolve_created_entity_id(  # noqa: SLF001
        "topomation_kitchen_occupied_light_kitchen",
        max_attempts=5,
        wait_seconds=0.01,
    )

    assert entity_id == "automation.kitchen_occupied"
    assert fake_registry.calls == 3


def test_apply_topomation_grouping_uses_topomation_labels_and_category(
    hass: HomeAssistant,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Grouping writes TopoMation labels/category while preserving existing metadata."""
    manager = TopomationManagedActions(hass)
    captured: dict[str, object] = {}
    requested_label_names: list[str] = []

    registry_entry = SimpleNamespace(
        labels=("existing_label",),
        categories={"diagnostic": "category_existing"},
    )

    class _FakeRegistry:
        def async_get(self, entity_id: str) -> SimpleNamespace | None:
            if entity_id == "automation.kitchen_occupied":
                return registry_entry
            return None

        def async_update_entity(self, entity_id: str, **kwargs: object) -> None:
            captured["entity_id"] = entity_id
            captured.update(kwargs)

    fake_registry = _FakeRegistry()

    def _ensure_label(name: str) -> str:
        requested_label_names.append(name)
        if name == "TopoMation":
            return "label_topomation"
        if name == "TopoMation - On Occupied":
            return "label_occupied"
        return "label_unknown"

    monkeypatch.setattr("custom_components.topomation.managed_actions.er.async_get", lambda _: fake_registry)
    monkeypatch.setattr(manager, "_ensure_label", _ensure_label)
    monkeypatch.setattr(manager, "_ensure_automation_category", lambda _: "category_topomation")

    manager._apply_topomation_grouping(  # noqa: SLF001
        "automation.kitchen_occupied",
        "on_occupied",
        area_id="area_kitchen",
    )

    assert requested_label_names == ["TopoMation", "TopoMation - On Occupied"]
    assert captured["entity_id"] == "automation.kitchen_occupied"
    assert set(cast(set[str], captured["labels"])) == {
        "existing_label",
        "label_topomation",
        "label_occupied",
    }
    assert cast(dict[str, str], captured["categories"]) == {
        "diagnostic": "category_existing",
        "automation": "category_topomation",
    }
    assert captured["area_id"] == "area_kitchen"
