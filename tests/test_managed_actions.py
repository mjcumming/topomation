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
        "run_on_startup": True,
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
    assert rule["actions"] == [{"entity_id": "light.bathroom", "service": "turn_off"}]
    assert rule["action_entity_id"] == "light.bathroom"
    assert rule["action_service"] == "turn_off"
    assert rule["ambient_condition"] == "dark"
    assert rule["must_be_occupied"] is False
    assert rule["time_condition_enabled"] is False
    assert rule["run_on_startup"] is True
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


@pytest.mark.asyncio
async def test_async_list_rules_snapshots_entity_mapping_before_awaits(
    hass: HomeAssistant,
) -> None:
    """Listing should not fail when the automation entity mapping mutates mid-iteration."""
    manager = TopomationManagedActions(hass)
    metadata = {
        "version": 3,
        "location_id": "kitchen",
        "trigger_type": "on_occupied",
        "ambient_condition": "any",
        "must_be_occupied": False,
        "time_condition_enabled": False,
        "start_time": "18:00",
        "end_time": "23:59",
    }
    description = f"Managed by Topomation.\n{TOPOMATION_AUTOMATION_METADATA_PREFIX} {json.dumps(metadata)}"

    first_config = {
        CONF_ID: "topomation_kitchen_occupied_ceiling",
        "alias": "Kitchen Occupied: Kitchen Ceiling (turn on)",
        "description": description,
        "actions": [
            {
                "action": "light.turn_on",
                "target": {"entity_id": "light.kitchen_ceiling"},
            }
        ],
    }
    second_config = {
        CONF_ID: "topomation_kitchen_occupied_island",
        "alias": "Kitchen Occupied: Kitchen Island (turn on)",
        "description": description,
        "actions": [
            {
                "action": "light.turn_on",
                "target": {"entity_id": "light.kitchen_island"},
            }
        ],
    }

    first_entity = SimpleNamespace(
        entity_id="automation.kitchen_occupied_ceiling",
        raw_config=first_config,
        unique_id="topomation_kitchen_occupied_ceiling",
    )
    second_entity = SimpleNamespace(
        entity_id="automation.kitchen_occupied_island",
        raw_config=second_config,
        unique_id="topomation_kitchen_occupied_island",
    )
    component = SimpleNamespace(
        entities={
            first_entity.entity_id: first_entity,
            second_entity.entity_id: second_entity,
        }
    )
    hass.data[AUTOMATION_DATA_COMPONENT] = component
    hass.states.async_set(first_entity.entity_id, "on")
    hass.states.async_set(second_entity.entity_id, "on")

    async def _fake_get(method: str, automation_id: str, payload: dict[str, object] | None = None) -> dict[str, object]:
        del method, payload
        component.entities["automation.transient"] = SimpleNamespace(
            entity_id="automation.transient",
            raw_config={CONF_ID: "transient"},
            unique_id="transient",
        )
        if automation_id == "topomation_kitchen_occupied_ceiling":
            return {"config": first_config}
        if automation_id == "topomation_kitchen_occupied_island":
            return {"config": second_config}
        return {}

    manager._call_automation_config_api = _fake_get  # type: ignore[method-assign]

    rules = await manager.async_list_rules("kitchen")

    assert [rule["id"] for rule in rules] == [
        "topomation_kitchen_occupied_ceiling",
        "topomation_kitchen_occupied_island",
    ]


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
            "run_on_startup": True,
        }
    )
    parsed = manager._parse_metadata(f"Managed by Topomation.\n{metadata_line}")  # noqa: SLF001
    assert parsed is not None
    assert parsed.location_id == "bathroom"
    assert parsed.trigger_type == "on_occupied"
    assert parsed.ambient_condition == "any"
    assert parsed.must_be_occupied is False
    assert parsed.run_on_startup is True
    assert manager._parse_metadata("Managed by Topomation") is None  # noqa: SLF001
    assert parsed.rule_uuid == ""

    generated_id = manager._build_stable_automation_id(  # noqa: SLF001
        "kitchen",
        ("on_dark",),
        "fan.kitchen_hood",
        "Kitchen dark safety",
        "rule_abc12345",
    )
    assert generated_id.endswith("_rule_abc12345")
    with pytest.raises(ValueError, match="cannot include both on_dark and on_bright"):
        manager._normalize_trigger_types(["on_dark", "on_bright"])  # noqa: SLF001
    with pytest.raises(ValueError, match="cannot include both on_occupied and on_vacant"):
        manager._normalize_trigger_types(["on_occupied", "on_vacant"])  # noqa: SLF001
    assert manager._normalize_existing_automation_id("automation.kitchen dark safety") == "kitchen_dark_safety"  # noqa: SLF001
    assert manager._normalize_rule_uuid("Rule-ABC_12345678") == "rule-abc_12345678"  # noqa: SLF001

    extracted_actions = manager._extract_actions(  # noqa: SLF001
        {
            "actions": [
                {
                    "action": "light.turn_on",
                    "target": {"entity_id": "light.bathroom"},
                }
            ]
        }
    )
    assert extracted_actions == [{"entity_id": "light.bathroom", "service": "turn_on"}]

    extracted_only_if_off_actions = manager._extract_actions(  # noqa: SLF001
        {
            "actions": [
                {
                    "choose": [
                        {
                            "conditions": [
                                {
                                    "condition": "state",
                                    "entity_id": "light.bathroom",
                                    "state": "off",
                                }
                            ],
                            "sequence": [
                                {
                                    "action": "light.turn_on",
                                    "target": {"entity_id": "light.bathroom"},
                                    "data": {"brightness_pct": 25},
                                }
                            ],
                        }
                    ]
                }
            ]
        }
    )
    assert extracted_only_if_off_actions == [
        {
            "entity_id": "light.bathroom",
            "service": "turn_on",
            "data": {"brightness_pct": 25},
            "only_if_off": True,
        }
    ]

    fallback_actions = manager._extract_actions(  # noqa: SLF001
        {
            "action": {
                "action": "switch.turn_off",
                "data": {"entity_id": "switch.fan"},
            }
        }
    )
    assert fallback_actions == [{"entity_id": "switch.fan", "service": "turn_off"}]

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


@pytest.mark.asyncio
async def test_async_create_rule_rolls_back_when_registration_does_not_converge(
    hass: HomeAssistant,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Create must rollback and fail when HA never registers the automation."""
    manager = TopomationManagedActions(hass)
    api_calls: list[tuple[str, str, dict[str, object] | None]] = []

    async def _fake_validate(
        _hass: HomeAssistant,
        automation_id: str,
        config_payload: dict[str, object],
    ) -> dict[str, object]:
        assert automation_id == config_payload[CONF_ID]
        return config_payload

    async def _fake_call(
        method: str,
        automation_id: str,
        payload: dict[str, object] | None = None,
    ) -> dict[str, object]:
        api_calls.append((method, automation_id, payload))
        return {}

    async def _never_resolve_entity_id(
        automation_id: str,
        *,
        max_attempts: int,
        wait_seconds: float,
    ) -> str | None:
        assert automation_id.startswith("topomation_kitchen_dark")
        assert max_attempts > 0
        assert wait_seconds > 0
        return None

    monkeypatch.setattr(
        "custom_components.topomation.managed_actions.async_validate_config_item",
        _fake_validate,
    )
    monkeypatch.setattr(manager, "_call_automation_config_api", _fake_call)
    monkeypatch.setattr(manager, "_resolve_created_entity_id", _never_resolve_entity_id)

    location = SimpleNamespace(id="kitchen", name="Kitchen", modules={})

    with pytest.raises(ValueError, match="Topomation rolled back the attempted write"):
        await manager.async_create_rule(
            location=location,
            name="Kitchen dark safety",
            trigger_type="on_dark",
            action_entity_id="light.kitchen_ceiling",
            action_service="turn_on",
            run_on_startup=True,
        )

    assert len(api_calls) == 2
    assert api_calls[0][0] == "POST"
    assert api_calls[0][2] is not None
    assert '"run_on_startup": true' in str(api_calls[0][2]["description"]).lower()
    assert api_calls[1] == ("DELETE", api_calls[0][1], None)
    assert manager._recent_rule_snapshots == {}  # noqa: SLF001


@pytest.mark.asyncio
async def test_async_create_rule_wraps_only_if_off_light_turn_on_action(
    hass: HomeAssistant,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Only-if-off light turn_on actions should persist as guarded choose blocks."""
    manager = TopomationManagedActions(hass)
    api_calls: list[tuple[str, str, dict[str, object] | None]] = []

    async def _fake_validate(
        _hass: HomeAssistant,
        automation_id: str,
        config_payload: dict[str, object],
    ) -> dict[str, object]:
        assert automation_id == config_payload[CONF_ID]
        return config_payload

    async def _fake_call(
        method: str,
        automation_id: str,
        payload: dict[str, object] | None = None,
    ) -> dict[str, object]:
        api_calls.append((method, automation_id, payload))
        return {}

    async def _fake_resolve_entity_id(
        automation_id: str,
        *,
        max_attempts: int,
        wait_seconds: float,
    ) -> str | None:
        assert max_attempts > 0
        assert wait_seconds > 0
        return f"automation.{automation_id}"

    monkeypatch.setattr(
        "custom_components.topomation.managed_actions.async_validate_config_item",
        _fake_validate,
    )
    monkeypatch.setattr(manager, "_call_automation_config_api", _fake_call)
    monkeypatch.setattr(manager, "_resolve_created_entity_id", _fake_resolve_entity_id)
    monkeypatch.setattr(manager, "_apply_topomation_grouping", lambda *args, **kwargs: None)

    location = SimpleNamespace(id="kitchen", name="Kitchen", modules={})

    rule = await manager.async_create_rule(
        location=location,
        name="Kitchen dark",
        trigger_type="on_dark",
        actions=[
            {
                "entity_id": "light.kitchen_ceiling",
                "service": "turn_on",
                "data": {"brightness_pct": 40},
                "only_if_off": True,
            },
            {
                "entity_id": "light.kitchen_island",
                "service": "turn_off",
            },
        ],
    )

    assert rule["actions"] == [
        {
            "entity_id": "light.kitchen_ceiling",
            "service": "turn_on",
            "data": {"brightness_pct": 40},
            "only_if_off": True,
        },
        {
            "entity_id": "light.kitchen_island",
            "service": "turn_off",
        },
    ]
    assert len(api_calls) == 1
    assert api_calls[0][0] == "POST"
    payload = cast(dict[str, object], api_calls[0][2])
    actions = cast(list[dict[str, object]], payload["actions"])
    assert actions[0] == {
        "choose": [
            {
                "conditions": [
                    {
                        "condition": "state",
                        "entity_id": "light.kitchen_ceiling",
                        "state": "off",
                    }
                ],
                "sequence": [
                    {
                        "action": "light.turn_on",
                        "target": {"entity_id": "light.kitchen_ceiling"},
                        "data": {"brightness_pct": 40},
                    }
                ],
            }
        ]
    }
    assert actions[1] == {
        "action": "light.turn_off",
        "target": {"entity_id": "light.kitchen_island"},
    }


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


def test_apply_topomation_grouping_skips_registry_write_when_metadata_is_unchanged(
    hass: HomeAssistant,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Grouping should not emit registry churn when labels/category/area already match."""
    manager = TopomationManagedActions(hass)
    update_calls: list[dict[str, object]] = []

    registry_entry = SimpleNamespace(
        labels=("existing_label", "label_topomation", "label_occupied"),
        categories={"diagnostic": "category_existing", "automation": "category_topomation"},
        area_id="area_kitchen",
    )

    class _FakeRegistry:
        def async_get(self, entity_id: str) -> SimpleNamespace | None:
            if entity_id == "automation.kitchen_occupied":
                return registry_entry
            return None

        def async_update_entity(self, entity_id: str, **kwargs: object) -> None:
            update_calls.append({"entity_id": entity_id, **kwargs})

    fake_registry = _FakeRegistry()

    def _ensure_label(name: str) -> str:
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

    assert update_calls == []
