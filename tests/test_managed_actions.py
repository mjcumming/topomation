"""Tests for managed automation rule backend helpers."""

from __future__ import annotations

import json
from types import SimpleNamespace
from typing import cast

import pytest
from homeassistant.components.automation import DATA_COMPONENT as AUTOMATION_DATA_COMPONENT
from homeassistant.const import CONF_ID
from homeassistant.core import HomeAssistant
from homeassistant.helpers import area_registry as ar

from custom_components.topomation.const import TOPOMATION_AUTOMATION_METADATA_PREFIX
from custom_components.topomation.managed_actions import TopomationManagedActions


def test_automation_api_bases_include_loopback_fallback(
    hass: HomeAssistant,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Managed actions should retry HA automation API calls against loopback in dev."""
    manager = TopomationManagedActions(hass)
    monkeypatch.setattr(
        "custom_components.topomation.managed_actions.get_url",
        lambda _hass, allow_external=False: "http://192.168.1.254:8123",
    )

    assert manager._automation_api_bases() == [
        "http://127.0.0.1:8123",
        "http://localhost:8123",
        "http://192.168.1.254:8123",
    ]


@pytest.mark.asyncio
async def test_async_list_rules_filters_to_location_and_extracts_actions(
    hass: HomeAssistant,
) -> None:
    """List endpoint returns only matching location rules with action payloads."""
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
    description = (
        f"Managed by Topomation.\n{TOPOMATION_AUTOMATION_METADATA_PREFIX} {json.dumps(metadata)}"
    )

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
            '{"version":3,"location_id":"kitchen","trigger_type":"on_vacant","ambient_condition":"any"}'
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
    assert rule["ambient_condition"] == "dark"
    assert rule["must_be_occupied"] is False
    assert rule["time_condition_enabled"] is False
    assert rule["run_on_startup"] is True
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
    description = (
        f"Managed by Topomation.\n{TOPOMATION_AUTOMATION_METADATA_PREFIX} {json.dumps(metadata)}"
    )

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

    async def _fake_get(
        method: str, automation_id: str, payload: dict[str, object] | None = None
    ) -> dict[str, object]:
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
    assert parsed.version == 2
    assert manager._parse_metadata("Managed by Topomation") is None  # noqa: SLF001
    assert parsed.rule_uuid == ""
    # Older metadata without the field defaults to False (ADR-HA-091).
    assert parsed.daily_gating_enabled is False


def test_metadata_round_trip_preserves_daily_gating_enabled() -> None:
    """daily_gating_enabled survives serialize -> parse when set (ADR-HA-091)."""
    manager = TopomationManagedActions(cast(HomeAssistant, SimpleNamespace()))

    line = manager._metadata_line(  # noqa: SLF001
        {
            "version": 4,
            "location_id": "main_floor",
            "trigger_type": "on_vacant",
            "ambient_condition": "any",
            "time_condition_enabled": False,
            "start_time": "10:00",
            "end_time": "16:00",
            "rule_uuid": "rule-vacuum-001",
            "user_named": True,
            "daily_gating_enabled": True,
        }
    )
    parsed = manager._parse_metadata(f"Managed by Topomation.\n{line}")  # noqa: SLF001
    assert parsed is not None
    assert parsed.version == 4
    assert parsed.daily_gating_enabled is True


def test_metadata_round_trip_rejects_non_bool_daily_gating_enabled() -> None:
    """Non-bool daily_gating_enabled is coerced to False (tolerant parse)."""
    manager = TopomationManagedActions(cast(HomeAssistant, SimpleNamespace()))

    for bad_value in ("true", 1, None, ["yes"]):
        line = manager._metadata_line(  # noqa: SLF001
            {
                "version": 4,
                "location_id": "main_floor",
                "trigger_type": "on_vacant",
                "ambient_condition": "any",
                "time_condition_enabled": False,
                "start_time": "10:00",
                "end_time": "16:00",
                "rule_uuid": "rule-vacuum-002",
                "daily_gating_enabled": bad_value,
            }
        )
        parsed = manager._parse_metadata(f"Managed by Topomation.\n{line}")  # noqa: SLF001
        assert parsed is not None
        assert (
            parsed.daily_gating_enabled is False
        ), f"non-bool {bad_value!r} should coerce to False"

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
    assert (
        manager._normalize_existing_automation_id("automation.kitchen dark safety")
        == "kitchen_dark_safety"
    )  # noqa: SLF001
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

    monkeypatch.setattr(
        "custom_components.topomation.managed_actions.er.async_get", lambda _: fake_registry
    )
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
    monkeypatch.setattr(
        manager, "_resolve_managed_rule_ha_area_id", lambda _location: "area_kitchen"
    )

    location = SimpleNamespace(id="kitchen", name="Kitchen", modules={})

    with pytest.raises(ValueError, match="Topomation rolled back the attempted write"):
        await manager.async_create_rule(
            location=location,
            name="Kitchen dark safety",
            trigger_type="on_dark",
            actions=[{"entity_id": "light.kitchen_ceiling", "service": "turn_on"}],
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
    monkeypatch.setattr(
        manager, "_resolve_managed_rule_ha_area_id", lambda _location: "area_kitchen"
    )
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
    """Grouping writes one Topomation label/category and removes old rule labels."""
    manager = TopomationManagedActions(hass)
    captured: dict[str, object] = {}
    requested_label_names: list[str] = []

    registry_entry = SimpleNamespace(
        labels=("existing_label", "label_occupied"),
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
        if name == "Topomation":
            return "label_topomation"
        return "label_unknown"

    monkeypatch.setattr(
        "custom_components.topomation.managed_actions.er.async_get", lambda _: fake_registry
    )
    monkeypatch.setattr(manager, "_ensure_label", _ensure_label)
    monkeypatch.setattr(manager, "_label_ids_by_name", lambda _: {"label_occupied"})
    monkeypatch.setattr(manager, "_ensure_automation_category", lambda _: "category_topomation")

    manager._apply_topomation_grouping(  # noqa: SLF001
        "automation.kitchen_occupied",
        "on_occupied",
        area_id="area_kitchen",
        icon="mdi:lightbulb-group",
    )

    assert requested_label_names == ["Topomation"]
    assert captured["entity_id"] == "automation.kitchen_occupied"
    assert set(cast(set[str], captured["labels"])) == {
        "existing_label",
        "label_topomation",
    }
    assert cast(dict[str, str], captured["categories"]) == {
        "diagnostic": "category_existing",
        "automation": "category_topomation",
    }
    assert captured["area_id"] == "area_kitchen"
    assert captured["icon"] == "mdi:lightbulb-group"


def test_apply_topomation_grouping_skips_registry_write_when_metadata_is_unchanged(
    hass: HomeAssistant,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Grouping should not emit registry churn when labels/category/area already match."""
    manager = TopomationManagedActions(hass)
    update_calls: list[dict[str, object]] = []

    registry_entry = SimpleNamespace(
        labels=("existing_label", "label_topomation"),
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
        if name == "Topomation":
            return "label_topomation"
        return "label_unknown"

    monkeypatch.setattr(
        "custom_components.topomation.managed_actions.er.async_get", lambda _: fake_registry
    )
    monkeypatch.setattr(manager, "_ensure_label", _ensure_label)
    monkeypatch.setattr(manager, "_label_ids_by_name", lambda _: {"label_occupied"})
    monkeypatch.setattr(manager, "_ensure_automation_category", lambda _: "category_topomation")

    manager._apply_topomation_grouping(  # noqa: SLF001
        "automation.kitchen_occupied",
        "on_occupied",
        area_id="area_kitchen",
    )

    assert update_calls == []


def test_daily_gating_condition_omitted_when_disabled() -> None:
    """No template condition is emitted when daily_gating_enabled is False (ADR-HA-091)."""
    manager = TopomationManagedActions(cast(HomeAssistant, SimpleNamespace()))
    conditions = manager._build_condition_definitions(  # noqa: SLF001
        ambient_condition="any",
        must_be_occupied=None,
        occupancy_entity_id=None,
        time_condition_enabled=False,
        start_time="00:00",
        end_time="23:59",
        ambient_config={},
        daily_gating_enabled=False,
        automation_id="topomation_main_floor_vacant_vacuum_x",
    )
    assert all(c.get("condition") != "template" for c in conditions)


def test_ambient_condition_ignores_local_lux_while_local_lights_are_on() -> None:
    """Dark/bright guards require local lights off before trusting local lux."""
    manager = TopomationManagedActions(cast(HomeAssistant, SimpleNamespace()))

    conditions = manager._build_condition_definitions(  # noqa: SLF001
        ambient_condition="bright",
        must_be_occupied=None,
        occupancy_entity_id=None,
        time_condition_enabled=False,
        start_time="00:00",
        end_time="23:59",
        ambient_config={
            "lux_sensor": "sensor.room_lux",
            "dark_threshold": 800,
            "bright_threshold": 1200,
            "fallback_to_sun": False,
            "local_light_entity_ids": ["light.room_ceiling", "light.room_lamp"],
        },
    )

    assert conditions == [
        {
            "condition": "and",
            "conditions": [
                {"condition": "state", "entity_id": "light.room_ceiling", "state": "off"},
                {"condition": "state", "entity_id": "light.room_lamp", "state": "off"},
                {
                    "condition": "numeric_state",
                    "entity_id": "sensor.room_lux",
                    "above": 1200.0,
                },
            ],
        }
    ]


def test_ambient_condition_falls_back_to_parent_when_local_lux_is_contaminated() -> None:
    """Managed rules use inherited lux when local lux is contaminated."""
    manager = TopomationManagedActions(cast(HomeAssistant, SimpleNamespace()))

    conditions = manager._build_condition_definitions(  # noqa: SLF001
        ambient_condition="dark",
        must_be_occupied=None,
        occupancy_entity_id=None,
        time_condition_enabled=False,
        start_time="00:00",
        end_time="23:59",
        ambient_config={
            "lux_sensor": "sensor.room_lux",
            "inherited_lux_sensor": "sensor.outdoor_lux",
            "dark_threshold": 800,
            "bright_threshold": 1200,
            "fallback_to_sun": False,
            "local_light_entity_ids": ["light.room_ceiling"],
        },
    )

    assert conditions == [
        {
            "condition": "or",
            "conditions": [
                {
                    "condition": "and",
                    "conditions": [
                        {
                            "condition": "state",
                            "entity_id": "light.room_ceiling",
                            "state": "off",
                        },
                        {
                            "condition": "numeric_state",
                            "entity_id": "sensor.room_lux",
                            "below": 800.0,
                        },
                    ],
                },
                {
                    "condition": "and",
                    "conditions": [
                        {
                            "condition": "or",
                            "conditions": [
                                {
                                    "condition": "template",
                                    "value_template": "{{ states('sensor.room_lux') | float(none) is none }}",
                                },
                                {
                                    "condition": "state",
                                    "entity_id": "light.room_ceiling",
                                    "state": "on",
                                },
                            ],
                        },
                        {
                            "condition": "numeric_state",
                            "entity_id": "sensor.outdoor_lux",
                            "below": 800.0,
                        },
                    ],
                },
            ],
        }
    ]


def test_ambient_condition_uses_inherited_lux_when_no_local_sensor_is_configured() -> None:
    """A location without local lux can use its inherited parent lux source."""
    manager = TopomationManagedActions(cast(HomeAssistant, SimpleNamespace()))

    conditions = manager._build_condition_definitions(  # noqa: SLF001
        ambient_condition="dark",
        must_be_occupied=None,
        occupancy_entity_id=None,
        time_condition_enabled=False,
        start_time="00:00",
        end_time="23:59",
        ambient_config={
            "lux_sensor": None,
            "inherited_lux_sensor": "sensor.outdoor_lux",
            "dark_threshold": 800,
            "bright_threshold": 1200,
            "fallback_to_sun": True,
            "local_light_entity_ids": ["light.room_ceiling"],
        },
    )

    assert conditions == [
        {
            "condition": "numeric_state",
            "entity_id": "sensor.outdoor_lux",
            "below": 800.0,
        }
    ]


def test_ambient_condition_falls_back_to_sun_when_local_lux_is_contaminated() -> None:
    """Managed rules use sun fallback when local lux is contaminated and no parent lux exists."""
    manager = TopomationManagedActions(cast(HomeAssistant, SimpleNamespace()))

    conditions = manager._build_condition_definitions(  # noqa: SLF001
        ambient_condition="bright",
        must_be_occupied=None,
        occupancy_entity_id=None,
        time_condition_enabled=False,
        start_time="00:00",
        end_time="23:59",
        ambient_config={
            "lux_sensor": "sensor.room_lux",
            "inherited_lux_sensor": None,
            "dark_threshold": 800,
            "bright_threshold": 1200,
            "fallback_to_sun": True,
            "local_light_entity_ids": ["light.room_ceiling"],
        },
    )

    assert conditions == [
        {
            "condition": "or",
            "conditions": [
                {
                    "condition": "and",
                    "conditions": [
                        {
                            "condition": "state",
                            "entity_id": "light.room_ceiling",
                            "state": "off",
                        },
                        {
                            "condition": "numeric_state",
                            "entity_id": "sensor.room_lux",
                            "above": 1200.0,
                        },
                    ],
                },
                {
                    "condition": "and",
                    "conditions": [
                        {
                            "condition": "or",
                            "conditions": [
                                {
                                    "condition": "template",
                                    "value_template": "{{ states('sensor.room_lux') | float(none) is none }}",
                                },
                                {
                                    "condition": "state",
                                    "entity_id": "light.room_ceiling",
                                    "state": "on",
                                },
                            ],
                        },
                        {
                            "condition": "state",
                            "entity_id": "sun.sun",
                            "state": "above_horizon",
                        },
                    ],
                },
            ],
        }
    ]


def test_ambient_trigger_arbitration_preserves_combined_occupancy_trigger_path() -> None:
    """Combined occupancy + ambient rules should not globally require ambient to match."""
    manager = TopomationManagedActions(cast(HomeAssistant, SimpleNamespace()))

    conditions = manager._build_condition_definitions(  # noqa: SLF001
        ambient_condition="any",
        must_be_occupied=None,
        occupancy_entity_id="binary_sensor.room_occupancy",
        time_condition_enabled=False,
        start_time="00:00",
        end_time="23:59",
        ambient_config={
            "lux_sensor": "sensor.room_lux",
            "dark_threshold": 800,
            "bright_threshold": 1200,
            "fallback_to_sun": True,
            "local_light_entity_ids": ["light.room_ceiling"],
        },
        trigger_types=("on_occupied", "on_bright"),
    )

    assert conditions == [
        {
            "condition": "or",
            "conditions": [
                {
                    "condition": "template",
                    "value_template": "{{ trigger is not defined or trigger.id in ['on_occupied'] }}",
                },
                {
                    "condition": "and",
                    "conditions": [
                        {
                            "condition": "state",
                            "entity_id": "light.room_ceiling",
                            "state": "off",
                        },
                        {
                            "condition": "numeric_state",
                            "entity_id": "sensor.room_lux",
                            "above": 1200.0,
                        },
                    ],
                },
                {
                    "condition": "and",
                    "conditions": [
                        {
                            "condition": "or",
                            "conditions": [
                                {
                                    "condition": "template",
                                    "value_template": "{{ states('sensor.room_lux') | float(none) is none }}",
                                },
                                {
                                    "condition": "state",
                                    "entity_id": "light.room_ceiling",
                                    "state": "on",
                                },
                            ],
                        },
                        {
                            "condition": "state",
                            "entity_id": "sun.sun",
                            "state": "above_horizon",
                        },
                    ],
                },
            ],
        }
    ]


@pytest.mark.asyncio
async def test_rebuild_rules_before_metadata_version_rewrites_only_old_rules(
    hass: HomeAssistant,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Versioned rebuild rewrites old managed rules and preserves disabled state."""
    location = SimpleNamespace(id="kitchen", name="Kitchen", modules={})
    loc_mgr = SimpleNamespace(all_locations=lambda: [location])
    manager = TopomationManagedActions(hass, loc_mgr)
    created: list[dict[str, object]] = []
    enabled_updates: list[tuple[str, bool]] = []

    async def _fake_list_rules(location_id: str) -> list[dict[str, object]]:
        assert location_id == "kitchen"
        return [
            {
                "id": "topomation_kitchen_old",
                "entity_id": "automation.topomation_kitchen_old",
                "name": "Kitchen old",
                "metadata_version": 4,
                "trigger_type": "on_dark",
                "trigger_types": ["on_dark"],
                "actions": [{"entity_id": "light.kitchen", "service": "turn_on"}],
                "ambient_condition": "dark",
                "must_be_occupied": True,
                "time_condition_enabled": False,
                "start_time": "18:00",
                "end_time": "23:59",
                "run_on_startup": True,
                "rule_uuid": "rule-old-001",
                "user_named": True,
                "enabled": False,
            },
            {
                "id": "topomation_kitchen_new",
                "metadata_version": 10,
                "trigger_type": "on_dark",
                "actions": [{"entity_id": "light.kitchen", "service": "turn_on"}],
            },
        ]

    async def _fake_create_rule(**kwargs: object) -> dict[str, object]:
        created.append(kwargs)
        return {"entity_id": "automation.topomation_kitchen_old"}

    async def _fake_set_enabled(*, entity_id: str, enabled: bool) -> None:
        enabled_updates.append((entity_id, enabled))

    monkeypatch.setattr(manager, "async_list_rules", _fake_list_rules)
    monkeypatch.setattr(manager, "async_create_rule", _fake_create_rule)
    monkeypatch.setattr(manager, "async_set_rule_enabled", _fake_set_enabled)

    summary = await manager.async_rebuild_rules_before_metadata_version()

    assert summary == {"checked": 2, "rebuilt": 1, "failed": 0}
    assert len(created) == 1
    assert created[0]["location"] is location
    assert created[0]["automation_id"] == "topomation_kitchen_old"
    assert created[0]["trigger_types"] == ["on_dark"]
    assert created[0]["ambient_condition"] == "dark"
    assert enabled_updates == [("automation.topomation_kitchen_old", False)]


def test_managed_rule_area_resolution_uses_direct_room_area(
    hass: HomeAssistant,
) -> None:
    """Room-like locations assign managed automations to their direct HA area."""
    manager = TopomationManagedActions(hass)
    area_registry = ar.async_get(hass)
    kitchen_area = area_registry.async_create("Kitchen")
    location = SimpleNamespace(
        id="area_kitchen_location",
        name="Kitchen",
        ha_area_id=kitchen_area.id,
        modules={"_meta": {"type": "area"}},
    )

    assert manager._resolve_managed_rule_ha_area_id(location) == kitchen_area.id  # noqa: SLF001


def test_managed_rule_area_resolution_uses_structural_shadow_area(
    hass: HomeAssistant,
) -> None:
    """Structural hosts assign managed automations to their managed-shadow HA area."""
    area_registry = ar.async_get(hass)
    shadow_area = area_registry.async_create("Main Floor")
    host = SimpleNamespace(
        id="floor_main",
        name="Main Floor",
        ha_area_id=None,
        modules={"_meta": {"type": "floor"}},
    )
    shadow = SimpleNamespace(
        id="shadow_floor_main",
        name="Main Floor Shadow",
        ha_area_id=shadow_area.id,
        modules={
            "_meta": {
                "type": "area",
                "role": "managed_shadow",
                "shadow_for_location_id": "floor_main",
            }
        },
    )
    loc_mgr = SimpleNamespace(all_locations=lambda: [host, shadow])
    manager = TopomationManagedActions(hass, loc_mgr)

    assert manager._resolve_managed_rule_ha_area_id(host) == shadow_area.id  # noqa: SLF001


def test_managed_rule_area_resolution_fails_when_area_missing(
    hass: HomeAssistant,
) -> None:
    """Saving a managed rule fails instead of creating an unscoped automation."""
    manager = TopomationManagedActions(hass)
    location = SimpleNamespace(
        id="area_missing",
        name="Missing",
        ha_area_id="area_missing",
        modules={"_meta": {"type": "area"}},
    )

    with pytest.raises(ValueError, match="No valid HA area"):
        manager._resolve_managed_rule_ha_area_id(location)  # noqa: SLF001


@pytest.mark.parametrize(
    ("action", "expected_icon"),
    [
        ({"entity_id": "light.kitchen", "service": "turn_on"}, "mdi:lightbulb-group"),
        ({"entity_id": "light.kitchen", "service": "turn_off"}, "mdi:lightbulb-off"),
        ({"entity_id": "fan.bath", "service": "turn_on"}, "mdi:fan"),
        ({"entity_id": "switch.coffee", "service": "turn_on"}, "mdi:power-plug"),
        ({"entity_id": "media_player.den", "service": "media_play"}, "mdi:play"),
        ({"entity_id": "media_player.den", "service": "volume_set"}, "mdi:volume-high"),
        ({"entity_id": "climate.hall", "service": "set_hvac_mode"}, "mdi:thermostat"),
        ({"entity_id": "vacuum.main", "service": "start"}, "mdi:robot-vacuum"),
        ({"entity_id": "vacuum.main", "service": "pause"}, "mdi:pause"),
    ],
)
def test_generated_icon_selection(action: dict[str, str], expected_icon: str) -> None:
    """Generated automation icons come from target domain and primary action."""
    manager = TopomationManagedActions(cast(HomeAssistant, SimpleNamespace()))
    assert manager._select_generated_icon([action]) == expected_icon  # noqa: SLF001


@pytest.mark.asyncio
async def test_cleanup_legacy_grouping_reapplies_grouping_to_existing_rules(
    hass: HomeAssistant,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Startup grouping cleanup re-tags existing managed automations."""
    locations = [
        SimpleNamespace(id="kitchen", name="Kitchen", modules={}),
        SimpleNamespace(id="hall", name="Hall", modules={}),
    ]
    loc_mgr = SimpleNamespace(all_locations=lambda: locations)
    manager = TopomationManagedActions(hass, loc_mgr)
    grouped: list[tuple[str, str]] = []

    async def _fake_list_rules(location_id: str) -> list[dict[str, object]]:
        if location_id == "kitchen":
            return [
                {
                    "entity_id": "automation.topomation_kitchen_dark",
                    "trigger_type": "on_dark",
                },
                {
                    "entity_id": "automation.topomation_kitchen_vacant",
                    "trigger_type": "on_vacant",
                },
            ]
        if location_id == "hall":
            return [{"entity_id": "automation.topomation_hall_bright"}]
        return []

    def _fake_apply(entity_id: str, trigger_type: str, **_: object) -> bool:
        grouped.append((entity_id, trigger_type))
        return entity_id != "automation.topomation_kitchen_vacant"

    monkeypatch.setattr(manager, "async_list_rules", _fake_list_rules)
    monkeypatch.setattr(manager, "_apply_topomation_grouping", _fake_apply)

    summary = await manager.async_cleanup_legacy_grouping()

    assert summary == {"checked": 3, "updated": 2, "failed": 0}
    assert grouped == [
        ("automation.topomation_kitchen_dark", "on_dark"),
        ("automation.topomation_kitchen_vacant", "on_vacant"),
        ("automation.topomation_hall_bright", "on_occupied"),
    ]


def test_daily_gating_condition_emitted_for_vacuum_target_without_paused_carveout() -> None:
    """Daily-gated vacuum targets use a strict once-per-day date check."""
    manager = TopomationManagedActions(cast(HomeAssistant, SimpleNamespace()))
    conditions = manager._build_condition_definitions(  # noqa: SLF001
        ambient_condition="any",
        must_be_occupied=None,
        occupancy_entity_id=None,
        time_condition_enabled=False,
        start_time="00:00",
        end_time="23:59",
        ambient_config={},
        daily_gating_enabled=True,
        automation_id="topomation_main_floor_vacant_vacuum_main",
    )
    template_clauses = [c for c in conditions if c.get("condition") == "template"]
    assert len(template_clauses) == 1
    body = template_clauses[0]["value_template"]
    assert "automation.topomation_main_floor_vacant_vacuum_main" in body
    assert "last_triggered" in body
    assert "as_local(now()).date()" in body
    assert "paused" not in body
    assert "is_state(" not in body


def test_daily_gating_condition_emitted_for_non_vacuum_target() -> None:
    """Non-vacuum daily-gated rules get the same date check."""
    manager = TopomationManagedActions(cast(HomeAssistant, SimpleNamespace()))
    conditions = manager._build_condition_definitions(  # noqa: SLF001
        ambient_condition="any",
        must_be_occupied=None,
        occupancy_entity_id=None,
        time_condition_enabled=False,
        start_time="00:00",
        end_time="23:59",
        ambient_config={},
        daily_gating_enabled=True,
        automation_id="topomation_kitchen_vacant_switch_x",
    )
    template_clauses = [c for c in conditions if c.get("condition") == "template"]
    assert len(template_clauses) == 1
    body = template_clauses[0]["value_template"]
    assert "as_local(now()).date()" in body
    assert "paused" not in body
    assert "is_state(" not in body


def test_daily_gating_condition_omitted_when_automation_id_missing() -> None:
    """Without automation_id we cannot build the template — silently skip."""
    manager = TopomationManagedActions(cast(HomeAssistant, SimpleNamespace()))
    conditions = manager._build_condition_definitions(  # noqa: SLF001
        ambient_condition="any",
        must_be_occupied=None,
        occupancy_entity_id=None,
        time_condition_enabled=False,
        start_time="00:00",
        end_time="23:59",
        ambient_config={},
        daily_gating_enabled=True,
        automation_id=None,
    )
    assert all(c.get("condition") != "template" for c in conditions)


def test_daily_gating_condition_appears_after_time_condition() -> None:
    """Daily-gating clause is appended after time-window clause for stable order."""
    manager = TopomationManagedActions(cast(HomeAssistant, SimpleNamespace()))
    conditions = manager._build_condition_definitions(  # noqa: SLF001
        ambient_condition="any",
        must_be_occupied=None,
        occupancy_entity_id=None,
        time_condition_enabled=True,
        start_time="10:00",
        end_time="16:00",
        ambient_config={},
        daily_gating_enabled=True,
        automation_id="topomation_main_floor_vacant_vacuum_main",
    )
    kinds = [c.get("condition") for c in conditions]
    assert kinds == ["time", "template"]


def test_find_occupancy_entity_id_resolves_via_managed_shadow_for_host(
    hass: HomeAssistant,
) -> None:
    """Floor host has no own binary_sensor; lookup falls back to its shadow location.

    Regression for ADR-HA-091 vacuum-rule create on a floor host failing with
    'No occupancy binary sensor found': occupancy lookup checked only the
    host's own location_id but the binary_sensor lives on the managed-shadow
    location per ADR-HA-077.
    """
    host_id = "floor_main_floor"
    shadow_id = "area_main_floor_shadow"

    shadow_location = SimpleNamespace(
        id=shadow_id,
        modules={
            "_meta": {
                "role": "managed_shadow",
                "shadow_for_location_id": host_id,
            }
        },
    )
    other_location = SimpleNamespace(
        id="area_kitchen",
        modules={"_meta": {"type": "area"}},
    )
    fake_loc_mgr = SimpleNamespace(all_locations=lambda: [shadow_location, other_location])

    manager = TopomationManagedActions(hass, fake_loc_mgr)

    # Direct match misses (no binary_sensor for the host itself).
    hass.states.async_set(
        "binary_sensor.main_floor_shadow_occupancy",
        "on",
        {"device_class": "occupancy", "location_id": shadow_id},
    )

    resolved = manager._find_occupancy_entity_id(host_id)  # noqa: SLF001
    assert resolved == "binary_sensor.main_floor_shadow_occupancy"


def test_find_occupancy_entity_id_returns_none_when_no_loc_mgr_and_no_direct_match(
    hass: HomeAssistant,
) -> None:
    """Without a loc_mgr we can't resolve the shadow; degrade to direct-only."""
    manager = TopomationManagedActions(hass, None)
    hass.states.async_set(
        "binary_sensor.kitchen_occupancy",
        "on",
        {"device_class": "occupancy", "location_id": "area_kitchen"},
    )
    assert manager._find_occupancy_entity_id("floor_main_floor") is None  # noqa: SLF001
    assert (
        manager._find_occupancy_entity_id("area_kitchen") == "binary_sensor.kitchen_occupancy"
    )  # noqa: SLF001
