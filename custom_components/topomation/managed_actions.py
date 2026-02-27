"""Backend managed-action automation lifecycle for Topomation."""

from __future__ import annotations

import asyncio
import json
import logging
import os
import time
import uuid
from collections.abc import Mapping
from dataclasses import dataclass
from typing import Any, Literal

from homeassistant.components.automation import (
    DATA_COMPONENT as AUTOMATION_DATA_COMPONENT,
)
from homeassistant.components.automation import (
    DOMAIN as AUTOMATION_DOMAIN,
)
from homeassistant.components.automation.config import async_validate_config_item
from homeassistant.config import AUTOMATION_CONFIG_PATH
from homeassistant.const import CONF_ID, SERVICE_RELOAD
from homeassistant.core import HomeAssistant
from homeassistant.helpers import category_registry as cr
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers import label_registry as lr
from homeassistant.util.file import write_utf8_file_atomic
from homeassistant.util.yaml import dump, load_yaml

from .const import TOPOMATION_AUTOMATION_METADATA_PREFIX

ActionTriggerType = Literal["occupied", "vacant"]

_TOPOMATION_AUTOMATION_ID_PREFIX = "topomation_"
_TOPOMATION_LABEL_NAME = "Topomation"
_TOPOMATION_OCCUPIED_LABEL_NAME = "Topomation - On Occupied"
_TOPOMATION_VACANT_LABEL_NAME = "Topomation - On Vacant"
_TOPOMATION_CATEGORY_NAME = "Topomation"

_LOGGER = logging.getLogger(__name__)


@dataclass(slots=True)
class _TopomationMetadata:
    """Metadata embedded in Topomation-managed automation descriptions."""

    location_id: str
    trigger_type: ActionTriggerType
    require_dark: bool


class TopomationManagedActions:
    """Create/list/update/delete Topomation managed automations inside HA backend."""

    def __init__(self, hass: HomeAssistant) -> None:
        """Initialize managed automation helper."""
        self.hass = hass
        self._mutation_lock = asyncio.Lock()

    async def async_list_rules(self, location_id: str) -> list[dict[str, Any]]:
        """List managed action rules for one location."""
        rules: list[dict[str, Any]] = []
        entity_registry = er.async_get(self.hass)

        component = self.hass.data.get(AUTOMATION_DATA_COMPONENT)
        entities = getattr(component, "entities", []) if component is not None else []
        for automation_entity in entities:
            entity_id = getattr(automation_entity, "entity_id", None)
            raw_config = getattr(automation_entity, "raw_config", None)
            unique_id = getattr(automation_entity, "unique_id", None)
            if not isinstance(entity_id, str) or not entity_id:
                continue
            if not isinstance(raw_config, Mapping):
                continue

            metadata = self._parse_metadata(raw_config.get("description"))
            if metadata is None or metadata.location_id != location_id:
                continue

            automation_id = self._resolve_automation_id(
                entity_registry,
                entity_id,
                raw_config,
                unique_id,
            )
            name = self._resolve_rule_name(entity_id, raw_config)
            action_entity_id, action_service = self._extract_action_summary(raw_config)
            enabled = self._is_automation_enabled(entity_id)

            rules.append(
                {
                    "id": automation_id or entity_id,
                    "entity_id": entity_id,
                    "name": name,
                    "trigger_type": metadata.trigger_type,
                    "action_entity_id": action_entity_id,
                    "action_service": action_service,
                    "require_dark": metadata.require_dark
                    if metadata is not None
                    else self._has_sun_dark_condition(raw_config),
                    "enabled": enabled,
                }
            )

        rules.sort(key=lambda rule: str(rule.get("name", "")))
        return rules

    async def async_create_rule(
        self,
        *,
        location: Any,
        name: str,
        trigger_type: ActionTriggerType,
        action_entity_id: str,
        action_service: str,
        require_dark: bool,
    ) -> dict[str, Any]:
        """Create or replace one managed action automation."""
        location_id = str(getattr(location, "id", "")).strip()
        location_name = str(getattr(location, "name", "Location")).strip() or "Location"
        if not location_id:
            raise ValueError("Location id is required")

        occupancy_entity_id = self._find_occupancy_entity_id(location_id)
        if occupancy_entity_id is None:
            raise ValueError(
                f'No occupancy binary sensor found for location "{location_name}" ({location_id})'
            )

        automation_id = self._build_automation_id(location_id, trigger_type)
        trigger_state = "on" if trigger_type == "occupied" else "off"
        action_domain = action_entity_id.split(".", 1)[0] if "." in action_entity_id else "homeassistant"

        metadata_payload = {
            "version": 2,
            "location_id": location_id,
            "trigger_type": trigger_type,
            "require_dark": bool(require_dark),
        }
        description = "Managed by Topomation.\n" + self._metadata_line(metadata_payload)

        config_payload: dict[str, Any] = {
            "alias": name,
            "description": description,
            "triggers": [
                {
                    "trigger": "state",
                    "entity_id": occupancy_entity_id,
                    "to": trigger_state,
                }
            ],
            "conditions": [
                {
                    "condition": "state",
                    "entity_id": "sun.sun",
                    "state": "below_horizon",
                }
            ]
            if require_dark
            else [],
            "actions": [
                {
                    "action": f"{action_domain}.{action_service}",
                    "target": {
                        "entity_id": action_entity_id,
                    },
                }
            ],
            "mode": "single",
        }

        validated = await async_validate_config_item(self.hass, automation_id, config_payload)
        if validated is None:
            raise ValueError("Automation config validation returned no result")

        async with self._mutation_lock:
            config_entries = await self._async_read_automation_config_file()
            self._upsert_automation_config(config_entries, automation_id, config_payload)
            await self._async_write_automation_config_file(config_entries)

        await self._async_reload_automation(automation_id=automation_id)

        entity_id = await self._wait_for_entity_id(automation_id)
        if entity_id is not None:
            self._apply_topomation_grouping(entity_id, trigger_type)

        return {
            "id": automation_id,
            "entity_id": entity_id or f"automation.{automation_id}",
            "name": name,
            "trigger_type": trigger_type,
            "action_entity_id": action_entity_id,
            "action_service": action_service,
            "require_dark": bool(require_dark),
            "enabled": True,
        }

    async def async_delete_rule(
        self,
        *,
        automation_id: str,
        entity_id: str | None = None,
    ) -> None:
        """Delete a managed action automation by config id."""
        config_id = automation_id.strip()
        if not config_id and entity_id:
            config_id = self._config_id_for_entity_id(entity_id)

        if not config_id:
            raise ValueError("Automation id is required")

        async with self._mutation_lock:
            config_entries = await self._async_read_automation_config_file()
            deleted = self._delete_automation_config(config_entries, config_id)
            if not deleted:
                raise ValueError(f"Automation '{config_id}' not found")
            await self._async_write_automation_config_file(config_entries)

        await self._async_reload_automation()

        entity_registry = er.async_get(self.hass)
        resolved_entity_id = entity_registry.async_get_entity_id(
            AUTOMATION_DOMAIN,
            AUTOMATION_DOMAIN,
            config_id,
        )
        if resolved_entity_id is not None:
            entity_registry.async_remove(resolved_entity_id)

        if entity_id and entity_registry.async_get(entity_id) is not None:
            entity_registry.async_remove(entity_id)

    async def async_set_rule_enabled(self, *, entity_id: str, enabled: bool) -> None:
        """Enable or disable one automation entity."""
        await self.hass.services.async_call(
            AUTOMATION_DOMAIN,
            "turn_on" if enabled else "turn_off",
            {"entity_id": entity_id},
            blocking=True,
        )

    def _find_occupancy_entity_id(self, location_id: str) -> str | None:
        """Resolve occupancy binary sensor entity_id for a location id."""
        for state in self.hass.states.async_all("binary_sensor"):
            if state.attributes.get("device_class") != "occupancy":
                continue
            if state.attributes.get("location_id") != location_id:
                continue
            return state.entity_id
        return None

    def _build_automation_id(self, location_id: str, trigger_type: ActionTriggerType) -> str:
        """Build a unique Topomation automation id."""
        now_ms = time.time_ns() // 1_000_000
        suffix = uuid.uuid4().hex[:6]
        return (
            f"{_TOPOMATION_AUTOMATION_ID_PREFIX}"
            f"{self._slugify(location_id)}_{trigger_type}_{now_ms}_{suffix}"
        )

    @staticmethod
    def _slugify(value: str) -> str:
        """Slugify ID values to automation id safe segments."""
        slug = "".join(ch if ch.isalnum() else "_" for ch in value.strip().lower())
        slug = "_".join(part for part in slug.split("_") if part)
        return slug or "location"

    @staticmethod
    def _metadata_line(metadata_payload: Mapping[str, Any]) -> str:
        """Render metadata line stored in automation description."""
        return f"{TOPOMATION_AUTOMATION_METADATA_PREFIX} {json.dumps(dict(metadata_payload))}"

    def _parse_metadata(self, description: Any) -> _TopomationMetadata | None:
        """Parse Topomation metadata from automation description."""
        if not isinstance(description, str):
            return None
        if TOPOMATION_AUTOMATION_METADATA_PREFIX not in description:
            return None

        for line in (line.strip() for line in description.splitlines()):
            if not line.startswith(TOPOMATION_AUTOMATION_METADATA_PREFIX):
                continue

            raw_payload = line[len(TOPOMATION_AUTOMATION_METADATA_PREFIX) :].strip()
            if not raw_payload:
                return None
            try:
                parsed = json.loads(raw_payload)
            except json.JSONDecodeError:
                return None

            location_id = parsed.get("location_id")
            trigger_type = parsed.get("trigger_type")
            if not isinstance(location_id, str) or not location_id:
                return None
            if trigger_type not in ("occupied", "vacant"):
                return None
            require_dark = bool(parsed.get("require_dark", False))
            return _TopomationMetadata(
                location_id=location_id,
                trigger_type=trigger_type,
                require_dark=require_dark,
            )

        return None

    def _resolve_automation_id(
        self,
        entity_registry: er.EntityRegistry,
        entity_id: str,
        raw_config: Mapping[str, Any],
        unique_id: Any,
    ) -> str | None:
        """Resolve automation config id from config/entity registry metadata."""
        config_id = raw_config.get(CONF_ID)
        if isinstance(config_id, str) and config_id.strip():
            return config_id.strip()

        if isinstance(unique_id, str) and unique_id.strip():
            return unique_id.strip()

        entity_entry = entity_registry.async_get(entity_id)
        if entity_entry is not None and entity_entry.unique_id:
            return str(entity_entry.unique_id)

        return None

    def _resolve_rule_name(self, entity_id: str, raw_config: Mapping[str, Any]) -> str:
        """Resolve display name for one managed automation rule."""
        alias = raw_config.get("alias")
        if isinstance(alias, str) and alias.strip():
            return alias.strip()

        state = self.hass.states.get(entity_id)
        if state is not None:
            friendly_name = state.attributes.get("friendly_name")
            if isinstance(friendly_name, str) and friendly_name.strip():
                return friendly_name.strip()

        return entity_id

    def _extract_action_summary(self, raw_config: Mapping[str, Any]) -> tuple[str | None, str | None]:
        """Extract action entity/service from raw automation config."""
        action_block = raw_config.get("actions", raw_config.get("action"))
        first_action: Any
        if isinstance(action_block, list):
            first_action = action_block[0] if action_block else None
        else:
            first_action = action_block

        if not isinstance(first_action, Mapping):
            return None, None

        action_service_name: str | None = None
        raw_service = first_action.get("action")
        if isinstance(raw_service, str) and raw_service:
            action_service_name = raw_service.split(".", 1)[1] if "." in raw_service else raw_service

        target = first_action.get("target")
        if isinstance(target, Mapping):
            target_entity = target.get("entity_id")
            if isinstance(target_entity, str) and target_entity:
                return target_entity, action_service_name
            if isinstance(target_entity, list) and target_entity:
                first_target = target_entity[0]
                if isinstance(first_target, str) and first_target:
                    return first_target, action_service_name

        data = first_action.get("data")
        if isinstance(data, Mapping):
            data_entity = data.get("entity_id")
            if isinstance(data_entity, str) and data_entity:
                return data_entity, action_service_name

        return None, action_service_name

    def _has_sun_dark_condition(self, raw_config: Mapping[str, Any]) -> bool:
        """Return True when automation config has sun below_horizon condition."""
        root = raw_config.get("conditions", raw_config.get("condition"))
        stack: list[Any] = list(root) if isinstance(root, list) else ([root] if root is not None else [])

        while stack:
            condition = stack.pop()
            if not isinstance(condition, Mapping):
                continue

            if (
                condition.get("condition") == "state"
                and condition.get("entity_id") == "sun.sun"
                and condition.get("state") == "below_horizon"
            ):
                return True

            nested = condition.get("conditions")
            if isinstance(nested, list):
                stack.extend(nested)

        return False

    def _is_automation_enabled(self, entity_id: str) -> bool:
        """Return True when automation entity state is enabled."""
        state = self.hass.states.get(entity_id)
        if state is None:
            return True
        return state.state != "off"

    async def _wait_for_entity_id(
        self,
        automation_id: str,
        attempts: int = 20,
        delay_seconds: float = 0.2,
    ) -> str | None:
        """Resolve entity id for config id as registries/components converge."""
        entity_registry = er.async_get(self.hass)
        for _ in range(attempts):
            entity_id = entity_registry.async_get_entity_id(
                AUTOMATION_DOMAIN,
                AUTOMATION_DOMAIN,
                automation_id,
            )
            if entity_id is not None:
                return entity_id

            from_component = self._entity_id_from_component_config_id(automation_id)
            if from_component is not None:
                return from_component

            await asyncio.sleep(delay_seconds)

        return None

    def _entity_id_from_component_config_id(self, automation_id: str) -> str | None:
        """Resolve entity id by walking loaded automation component entities."""
        component = self.hass.data.get(AUTOMATION_DATA_COMPONENT)
        entities = getattr(component, "entities", []) if component is not None else []
        for automation_entity in entities:
            entity_id = getattr(automation_entity, "entity_id", None)
            raw_config = getattr(automation_entity, "raw_config", None)
            unique_id = getattr(automation_entity, "unique_id", None)
            if not isinstance(entity_id, str) or not entity_id:
                continue
            if isinstance(unique_id, str) and unique_id == automation_id:
                return entity_id
            if isinstance(raw_config, Mapping):
                config_id = raw_config.get(CONF_ID)
                if isinstance(config_id, str) and config_id == automation_id:
                    return entity_id
        return None

    def _apply_topomation_grouping(self, entity_id: str, trigger_type: ActionTriggerType) -> None:
        """Apply label/category grouping metadata to an automation entity."""
        entity_registry = er.async_get(self.hass)
        entry = entity_registry.async_get(entity_id)
        if entry is None:
            return

        labels = set(entry.labels)
        primary_label = self._ensure_label(_TOPOMATION_LABEL_NAME)
        trigger_label = self._ensure_label(
            _TOPOMATION_OCCUPIED_LABEL_NAME
            if trigger_type == "occupied"
            else _TOPOMATION_VACANT_LABEL_NAME
        )
        if primary_label is not None:
            labels.add(primary_label)
        if trigger_label is not None:
            labels.add(trigger_label)

        categories = dict(entry.categories)
        category_id = self._ensure_automation_category(_TOPOMATION_CATEGORY_NAME)
        if category_id is not None:
            categories["automation"] = category_id

        try:
            entity_registry.async_update_entity(entity_id, labels=labels, categories=categories)
        except Exception:  # pragma: no cover - defensive around HA registry edge cases
            _LOGGER.debug("Failed to apply Topomation labels/categories for %s", entity_id, exc_info=True)

    def _ensure_label(self, name: str) -> str | None:
        """Create label if needed and return label_id."""
        label_registry = lr.async_get(self.hass)
        existing = label_registry.async_get_label_by_name(name)
        if existing is not None:
            return existing.label_id

        try:
            created = label_registry.async_create(name=name)
        except ValueError:
            existing_after_create = label_registry.async_get_label_by_name(name)
            return existing_after_create.label_id if existing_after_create is not None else None
        except Exception:  # pragma: no cover - defensive around HA registry edge cases
            _LOGGER.debug("Failed to ensure label %s", name, exc_info=True)
            return None

        return created.label_id

    def _ensure_automation_category(self, name: str) -> str | None:
        """Create automation category if needed and return category_id."""
        category_registry = cr.async_get(self.hass)
        for entry in category_registry.async_list_categories(scope="automation"):
            if entry.name == name:
                return entry.category_id

        try:
            created = category_registry.async_create(
                scope="automation",
                name=name,
                icon="mdi:home-automation",
            )
        except ValueError:
            for entry in category_registry.async_list_categories(scope="automation"):
                if entry.name == name:
                    return entry.category_id
            return None
        except Exception:  # pragma: no cover - defensive around HA registry edge cases
            _LOGGER.debug("Failed to ensure automation category %s", name, exc_info=True)
            return None

        return created.category_id

    async def _async_reload_automation(self, automation_id: str | None = None) -> None:
        """Reload automation integration after config mutation."""
        service_data: dict[str, Any]
        if automation_id:
            service_data = {CONF_ID: automation_id}
        else:
            service_data = {}

        try:
            await self.hass.services.async_call(
                AUTOMATION_DOMAIN,
                SERVICE_RELOAD,
                service_data,
                blocking=True,
            )
        except Exception:
            if automation_id is None:
                raise
            await self.hass.services.async_call(
                AUTOMATION_DOMAIN,
                SERVICE_RELOAD,
                {},
                blocking=True,
            )

    async def _async_read_automation_config_file(self) -> list[dict[str, Any]]:
        """Read automations.yaml-like config list."""
        path = self.hass.config.path(AUTOMATION_CONFIG_PATH)
        return await self.hass.async_add_executor_job(_read_automation_config_file, path)

    async def _async_write_automation_config_file(self, config_entries: list[dict[str, Any]]) -> None:
        """Persist automations config list."""
        path = self.hass.config.path(AUTOMATION_CONFIG_PATH)
        await self.hass.async_add_executor_job(_write_automation_config_file, path, config_entries)

    def _upsert_automation_config(
        self,
        config_entries: list[dict[str, Any]],
        automation_id: str,
        payload: dict[str, Any],
    ) -> None:
        """Insert or update one automation config payload by id."""
        updated_payload = {CONF_ID: automation_id, **payload}

        updated = False
        for index, current in enumerate(config_entries):
            current_id = current.get(CONF_ID)
            if isinstance(current_id, str) and current_id == automation_id:
                config_entries[index] = updated_payload
                updated = True
                break

        if not updated:
            config_entries.append(updated_payload)

    def _delete_automation_config(self, config_entries: list[dict[str, Any]], automation_id: str) -> bool:
        """Delete one automation config by id and report whether deletion happened."""
        before = len(config_entries)
        config_entries[:] = [
            item
            for item in config_entries
            if not (isinstance(item.get(CONF_ID), str) and item.get(CONF_ID) == automation_id)
        ]
        return len(config_entries) < before

    def _config_id_for_entity_id(self, entity_id: str) -> str:
        """Resolve automation config id from entity id when available."""
        component = self.hass.data.get(AUTOMATION_DATA_COMPONENT)
        entities = getattr(component, "entities", []) if component is not None else []
        for automation_entity in entities:
            current_entity_id = getattr(automation_entity, "entity_id", None)
            raw_config = getattr(automation_entity, "raw_config", None)
            unique_id = getattr(automation_entity, "unique_id", None)
            if current_entity_id != entity_id:
                continue
            if isinstance(raw_config, Mapping):
                config_id = raw_config.get(CONF_ID)
                if isinstance(config_id, str) and config_id:
                    return config_id
            if isinstance(unique_id, str) and unique_id:
                return unique_id

        entity_registry = er.async_get(self.hass)
        entry = entity_registry.async_get(entity_id)
        if entry is not None and entry.unique_id:
            return str(entry.unique_id)

        return ""


def _read_automation_config_file(path: str) -> list[dict[str, Any]]:
    """Read automation config YAML list from disk."""
    if not os.path.isfile(path):
        return []

    raw = load_yaml(path)
    if raw is None:
        return []
    if not isinstance(raw, list):
        raise ValueError("Automation config file must contain a list")

    normalized: list[dict[str, Any]] = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        copied = dict(item)
        config_id = copied.get(CONF_ID)
        if not isinstance(config_id, str) or not config_id.strip():
            copied[CONF_ID] = uuid.uuid4().hex
        normalized.append(copied)

    return normalized


def _write_automation_config_file(path: str, data: list[dict[str, Any]]) -> None:
    """Write automation config YAML list to disk atomically."""
    contents = dump(data)
    write_utf8_file_atomic(path, contents)
