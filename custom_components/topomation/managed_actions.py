"""Backend managed-action automation lifecycle for Topomation.

Uses Home Assistant's config/automation REST API (POST/GET/DELETE) so HA
handles validation, file write, and reload. No direct file I/O.
"""

from __future__ import annotations

import asyncio
import json
import logging
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
from homeassistant.const import CONF_ID
from homeassistant.core import HomeAssistant
from homeassistant.helpers import category_registry as cr
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers import label_registry as lr
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.network import get_url

from .const import DOMAIN, TOPOMATION_AUTOMATION_METADATA_PREFIX

ActionTriggerType = Literal["occupied", "vacant"]

_TOPOMATION_AUTOMATION_ID_PREFIX = "topomation_"
_TOPOMATION_LABEL_NAME = "Topomation"
_TOPOMATION_OCCUPIED_LABEL_NAME = "Topomation - On Occupied"
_TOPOMATION_VACANT_LABEL_NAME = "Topomation - On Vacant"
_TOPOMATION_CATEGORY_NAME = "Topomation"
_TOPOMATION_SYSTEM_USER_NAME = "Topomation"
_AUTOMATION_API_REFRESH_TOKEN_KEY = "_automation_api_refresh_token"  # noqa: S105

_LOGGER = logging.getLogger(__name__)


@dataclass(slots=True)
class _TopomationMetadata:
    """Metadata embedded in Topomation-managed automation descriptions."""

    location_id: str
    trigger_type: ActionTriggerType
    require_dark: bool


class TopomationManagedActions:
    """Create/list/update/delete Topomation managed automations via HA's config REST API."""

    def __init__(self, hass: HomeAssistant) -> None:
        """Initialize managed automation helper."""
        self.hass = hass
        self._token_lock = asyncio.Lock()

    async def _ensure_automation_api_token(self) -> str:
        """Get or create a system user and return an access token for the config API."""
        async with self._token_lock:
            domain_data = self.hass.data.get(DOMAIN)
            if domain_data is None:
                self.hass.data[DOMAIN] = {}
                domain_data = self.hass.data[DOMAIN]
            refresh_token = domain_data.get(_AUTOMATION_API_REFRESH_TOKEN_KEY)
            if refresh_token is not None:
                return self.hass.auth.async_create_access_token(refresh_token)
            try:
                from homeassistant.auth.const import GROUP_ID_ADMIN
            except ImportError:
                GROUP_ID_ADMIN = "admin"  # noqa: N806
            users = await self.hass.auth.async_get_users()
            for user in users:
                if getattr(user, "name", None) == _TOPOMATION_SYSTEM_USER_NAME and getattr(
                    user, "system_generated", False
                ):
                    for token in user.refresh_tokens.values():
                        domain_data[_AUTOMATION_API_REFRESH_TOKEN_KEY] = token
                        return self.hass.auth.async_create_access_token(token)
            user = await self.hass.auth.async_create_system_user(
                _TOPOMATION_SYSTEM_USER_NAME,
                group_ids=[GROUP_ID_ADMIN],
            )
            refresh_token = await self.hass.auth.async_create_refresh_token(user)
            domain_data[_AUTOMATION_API_REFRESH_TOKEN_KEY] = refresh_token
            return self.hass.auth.async_create_access_token(refresh_token)

    async def _call_automation_config_api(
        self,
        method: str,
        automation_id: str,
        payload: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Call HA config/automation/config REST API. Raises on error."""
        token = await self._ensure_automation_api_token()
        base = get_url(self.hass, allow_external=False).rstrip("/")
        url = f"{base}/api/config/automation/config/{automation_id}"
        session = async_get_clientsession(self.hass)
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }
        if method == "POST" and payload is not None:
            body = json.dumps(payload).encode("utf-8")
        else:
            body = None
        async with session.request(method, url, headers=headers, data=body, timeout=30) as resp:
            if resp.status >= 400:
                try:
                    err = await resp.json()
                    msg = err.get("message", await resp.text())
                except Exception:
                    msg = await resp.text()
                raise ValueError(f"Automation API {method} {resp.status}: {msg}")
            if resp.status == 204 or (method == "DELETE" and resp.status == 200):
                return {}
            return await resp.json()

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
                entity_registry, entity_id, raw_config, unique_id
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
                    "require_dark": (
                        metadata.require_dark
                        if metadata is not None
                        else self._has_sun_dark_condition(raw_config)
                    ),
                    "enabled": enabled,
                }
            )

        rules.sort(key=lambda r: str(r.get("name", "")))
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
        """Create or replace one managed action automation (HA config/automation.py pattern)."""
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
        action_domain = (
            action_entity_id.split(".", 1)[0]
            if "." in action_entity_id
            else "homeassistant"
        )

        metadata_payload = {
            "version": 2,
            "location_id": location_id,
            "trigger_type": trigger_type,
            "require_dark": bool(require_dark),
        }
        description = "Managed by Topomation.\n" + self._metadata_line(metadata_payload)

        config_payload: dict[str, Any] = {
            CONF_ID: automation_id,
            "alias": name,
            "description": description,
            "triggers": [
                {
                    "trigger": "state",
                    "entity_id": occupancy_entity_id,
                    "to": trigger_state,
                }
            ],
            "conditions": (
                [
                    {
                        "condition": "state",
                        "entity_id": "sun.sun",
                        "state": "below_horizon",
                    }
                ]
                if require_dark
                else []
            ),
            "actions": [
                {
                    "action": f"{action_domain}.{action_service}",
                    "target": {"entity_id": action_entity_id},
                }
            ],
            "mode": "single",
        }

        _LOGGER.info(
            "[managed_actions] Creating rule via REST API automation_id=%s location=%s",
            automation_id,
            location_id,
        )
        validated = await async_validate_config_item(
            self.hass, automation_id, config_payload
        )
        if validated is None:
            _LOGGER.error(
                "[managed_actions] Validation returned None for automation_id=%s",
                automation_id,
            )
            raise ValueError("Automation config validation returned no result")
        await self._call_automation_config_api("POST", automation_id, config_payload)

        entity_registry = er.async_get(self.hass)
        entity_id = entity_registry.async_get_entity_id(
            AUTOMATION_DOMAIN, AUTOMATION_DOMAIN, automation_id
        )
        if entity_id is None:
            _LOGGER.debug(
                "[managed_actions] Entity not in registry, checking component entities for automation_id=%s",
                automation_id,
            )
            component = self.hass.data.get(AUTOMATION_DATA_COMPONENT)
            entities = getattr(component, "entities", []) if component else []
            for ent in entities:
                if getattr(ent, "unique_id", None) == automation_id:
                    entity_id = getattr(ent, "entity_id", None)
                    break
        if entity_id:
            _LOGGER.info(
                "[managed_actions] Rule created automation_id=%s entity_id=%s",
                automation_id,
                entity_id,
            )
            self._apply_topomation_grouping(entity_id, trigger_type)
        else:
            _LOGGER.warning(
                "[managed_actions] Rule created but entity not found automation_id=%s (may appear after refresh)",
                automation_id,
            )

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
        """Delete a managed action automation via HA config REST API."""
        config_id = automation_id.strip()
        if not config_id and entity_id:
            config_id = self._config_id_for_entity_id(entity_id)

        if not config_id:
            raise ValueError("Automation id is required")

        await self._call_automation_config_api("DELETE", config_id)

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
            return _TopomationMetadata(
                location_id=location_id,
                trigger_type=trigger_type,
                require_dark=bool(parsed.get("require_dark", False)),
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
        entry = entity_registry.async_get(entity_id)
        if entry is not None and entry.unique_id:
            return str(entry.unique_id)
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
        first_action: Any = action_block[0] if isinstance(action_block, list) and action_block else action_block
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
        stack: list[Any] = list(root) if isinstance(root, list) else ([root] if root else [])
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
        if primary_label:
            labels.add(primary_label)
        if trigger_label:
            labels.add(trigger_label)
        categories = dict(entry.categories)
        category_id = self._ensure_automation_category(_TOPOMATION_CATEGORY_NAME)
        if category_id is not None:
            categories["automation"] = category_id
        try:
            entity_registry.async_update_entity(entity_id, labels=labels, categories=categories)
        except Exception:
            _LOGGER.debug("Failed to apply Topomation labels/categories for %s", entity_id, exc_info=True)

    def _ensure_label(self, name: str) -> str | None:
        """Create label if needed and return label_id."""
        label_registry = lr.async_get(self.hass)
        existing = label_registry.async_get_label_by_name(name)
        if existing is not None:
            return existing.label_id
        try:
            created = label_registry.async_create(name=name)
            return created.label_id
        except ValueError:
            existing_after = label_registry.async_get_label_by_name(name)
            return existing_after.label_id if existing_after else None
        except Exception:
            _LOGGER.debug("Failed to ensure label %s", name, exc_info=True)
            return None

    def _ensure_automation_category(self, name: str) -> str | None:
        """Create automation category if needed and return category_id."""
        category_registry = cr.async_get(self.hass)
        for entry in category_registry.async_list_categories(scope="automation"):
            if entry.name == name:
                return entry.category_id
        try:
            created = category_registry.async_create(
                scope="automation", name=name, icon="mdi:home-automation"
            )
            return created.category_id
        except ValueError:
            for entry in category_registry.async_list_categories(scope="automation"):
                if entry.name == name:
                    return entry.category_id
            return None
        except Exception:
            _LOGGER.debug("Failed to ensure automation category %s", name, exc_info=True)
            return None

    def _config_id_for_entity_id(self, entity_id: str) -> str:
        """Resolve automation config id from entity id when available."""
        component = self.hass.data.get(AUTOMATION_DATA_COMPONENT)
        entities = getattr(component, "entities", []) if component else []
        for automation_entity in entities:
            if getattr(automation_entity, "entity_id", None) != entity_id:
                continue
            raw_config = getattr(automation_entity, "raw_config", None)
            unique_id = getattr(automation_entity, "unique_id", None)
            if isinstance(raw_config, Mapping):
                config_id = raw_config.get(CONF_ID)
                if isinstance(config_id, str) and config_id:
                    return config_id
            if isinstance(unique_id, str) and unique_id:
                return unique_id
        entry = er.async_get(self.hass).async_get(entity_id)
        if entry is not None and entry.unique_id:
            return str(entry.unique_id)
        return ""
