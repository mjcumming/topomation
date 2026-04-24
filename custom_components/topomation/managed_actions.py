"""Backend managed-action automation lifecycle for Topomation.

Uses Home Assistant's config/automation REST API (POST/GET/DELETE) so HA
handles validation, file write, and reload. No direct file I/O.
"""

from __future__ import annotations

import asyncio
import json
import logging
import re
from collections.abc import Mapping
from dataclasses import dataclass
from time import monotonic
from typing import Any, Literal, cast
from urllib.parse import urlsplit

from aiohttp.client_exceptions import ClientConnectorError
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

ActionTriggerType = Literal["on_occupied", "on_vacant", "on_dark", "on_bright"]
ActionAmbientCondition = Literal["any", "dark", "bright"]

_TOPOMATION_AUTOMATION_ID_PREFIX = "topomation_"
_TOPOMATION_LABEL_NAME = "TopoMation"
_TOPOMATION_OCCUPIED_LABEL_NAME = "TopoMation - On Occupied"
_TOPOMATION_VACANT_LABEL_NAME = "TopoMation - On Vacant"
_TOPOMATION_DARK_LABEL_NAME = "TopoMation - On Dark"
_TOPOMATION_BRIGHT_LABEL_NAME = "TopoMation - On Bright"
_TOPOMATION_CATEGORY_NAME = "TopoMation"
_TOPOMATION_SYSTEM_USER_NAME = "Topomation"
_AUTOMATION_API_REFRESH_TOKEN_KEY = "_automation_api_refresh_token"  # noqa: S105
_ENTITY_RESOLVE_MAX_ATTEMPTS = 20
_ENTITY_RESOLVE_WAIT_SECONDS = 0.25
_VALID_TRIGGER_TYPES = frozenset({"on_occupied", "on_vacant", "on_dark", "on_bright"})
_TRIGGER_TYPE_ORDER: tuple[ActionTriggerType, ...] = (
    "on_occupied",
    "on_vacant",
    "on_dark",
    "on_bright",
)
_VALID_AMBIENT_CONDITIONS = frozenset({"any", "dark", "bright"})
_AUTOMATION_ID_PATTERN = re.compile(r"^[a-zA-Z0-9_]+$")
_RULE_UUID_PATTERN = re.compile(r"^[a-z0-9][a-z0-9_-]{7,63}$")
_RECENT_RULE_SNAPSHOT_TTL_SECONDS = 30.0

_LOGGER = logging.getLogger(__name__)


@dataclass(slots=True)
class _TopomationMetadata:
    """Metadata embedded in Topomation-managed automation descriptions."""

    location_id: str
    trigger_type: ActionTriggerType
    trigger_types: tuple[ActionTriggerType, ...]
    ambient_condition: ActionAmbientCondition
    must_be_occupied: bool | None
    time_condition_enabled: bool
    start_time: str
    end_time: str
    run_on_startup: bool | None
    rule_uuid: str
    user_named: bool


@dataclass(slots=True)
class _RecentRuleSnapshot:
    """Short-lived snapshot for upsert/list consistency after API writes."""

    saved_at_monotonic: float
    location_id: str
    name: str
    trigger_type: ActionTriggerType
    trigger_types: tuple[ActionTriggerType, ...]
    ambient_condition: ActionAmbientCondition
    must_be_occupied: bool | None
    time_condition_enabled: bool
    start_time: str
    end_time: str
    run_on_startup: bool | None
    rule_uuid: str
    user_named: bool
    actions: list[dict[str, Any]]
    action_entity_id: str | None
    action_service: str | None
    action_data: dict[str, Any] | None


class TopomationManagedActions:
    """Create/list/update/delete Topomation managed automations via HA's config REST API."""

    def __init__(self, hass: HomeAssistant) -> None:
        """Initialize managed automation helper."""
        self.hass = hass
        self._token_lock = asyncio.Lock()
        self._recent_rule_snapshots: dict[str, _RecentRuleSnapshot] = {}

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
        session = async_get_clientsession(self.hass)
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }
        if method == "POST" and payload is not None:
            body = json.dumps(payload).encode("utf-8")
        else:
            body = None
        last_connect_error: ClientConnectorError | None = None
        for base in self._automation_api_bases():
            url = f"{base}/api/config/automation/config/{automation_id}"
            try:
                async with session.request(
                    method, url, headers=headers, data=body, timeout=30
                ) as resp:
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
            except ClientConnectorError as err:
                last_connect_error = err
                _LOGGER.debug(
                    "Automation API connection failed for base %s; trying next candidate",
                    base,
                    exc_info=True,
                )
                continue
        if last_connect_error is not None:
            raise last_connect_error
        raise ValueError("Automation API request failed before a response was received")

    def _automation_api_bases(self) -> list[str]:
        """Return candidate base URLs for the HA automation config API."""
        configured = get_url(self.hass, allow_external=False).rstrip("/")
        parsed = urlsplit(configured)
        hostname = (parsed.hostname or "").strip().lower()
        candidates: list[str] = []
        if hostname not in {"127.0.0.1", "localhost"}:
            port = parsed.port or (443 if parsed.scheme == "https" else 8123)
            scheme = parsed.scheme or "http"
            for loopback_host in ("127.0.0.1", "localhost"):
                candidates.append(f"{scheme}://{loopback_host}:{port}")
        candidates.append(configured)

        deduped: list[str] = []
        seen = set()
        for candidate in candidates:
            if candidate in seen:
                continue
            seen.add(candidate)
            deduped.append(candidate)
        return deduped

    async def async_list_rules(self, location_id: str) -> list[dict[str, Any]]:
        """List managed action rules for one location."""
        rules: list[dict[str, Any]] = []
        entity_registry = er.async_get(self.hass)
        component = self.hass.data.get(AUTOMATION_DATA_COMPONENT)
        entities = self._snapshot_automation_entities(component)
        self._prune_recent_rule_snapshots()

        pending: list[tuple[str, Mapping[str, Any], str]] = []

        for automation_entity in entities:
            entity_id = getattr(automation_entity, "entity_id", None)
            raw_config = getattr(automation_entity, "raw_config", None)
            unique_id = getattr(automation_entity, "unique_id", None)
            if not isinstance(entity_id, str) or not entity_id:
                continue
            if not isinstance(raw_config, Mapping):
                continue

            automation_id = self._resolve_automation_id(
                entity_registry, entity_id, raw_config, unique_id
            )
            recent_snapshot = self._get_recent_rule_snapshot(
                automation_id or "",
                location_id=location_id,
            )
            if recent_snapshot is not None:
                enabled = self._is_automation_enabled(entity_id)
                rules.append(
                    {
                        "id": automation_id or entity_id,
                        "entity_id": entity_id,
                        "name": recent_snapshot.name,
                        "trigger_type": recent_snapshot.trigger_type,
                        "trigger_types": list(recent_snapshot.trigger_types),
                        "actions": [dict(action) for action in recent_snapshot.actions],
                        "action_entity_id": recent_snapshot.action_entity_id,
                        "action_service": recent_snapshot.action_service,
                        "action_data": (
                            dict(recent_snapshot.action_data)
                            if isinstance(recent_snapshot.action_data, Mapping)
                            else None
                        ),
                        "ambient_condition": recent_snapshot.ambient_condition,
                        "must_be_occupied": recent_snapshot.must_be_occupied,
                        "time_condition_enabled": recent_snapshot.time_condition_enabled,
                        "start_time": recent_snapshot.start_time,
                        "end_time": recent_snapshot.end_time,
                        "run_on_startup": recent_snapshot.run_on_startup,
                        "rule_uuid": recent_snapshot.rule_uuid,
                        "user_named": recent_snapshot.user_named,
                        # Legacy compatibility for older frontends.
                        "require_dark": recent_snapshot.ambient_condition == "dark",
                        "enabled": enabled,
                    }
                )
                continue

            raw_metadata = self._parse_metadata(raw_config.get("description"))
            if raw_metadata is None or raw_metadata.location_id != location_id:
                continue

            pending.append(
                (entity_id, raw_config, automation_id if isinstance(automation_id, str) else "")
            )

        async def _fetch_latest_rule_config(
            automation_id: str, raw_config: Mapping[str, Any]
        ) -> Mapping[str, Any]:
            if not automation_id:
                return raw_config
            try:
                latest_payload = await self._call_automation_config_api("GET", automation_id)
                if isinstance(latest_payload, Mapping):
                    latest_config = latest_payload.get("config")
                    if isinstance(latest_config, Mapping):
                        return latest_config
                    if "description" in latest_payload and "triggers" in latest_payload:
                        # Some HA builds may return the config object directly.
                        return latest_payload
            except Exception:
                _LOGGER.debug(
                    "Falling back to runtime raw_config for managed rule list: %s",
                    automation_id,
                    exc_info=True,
                )
            return raw_config

        effective_configs = await asyncio.gather(
            *[
                _fetch_latest_rule_config(automation_id, raw_config)
                for (_, raw_config, automation_id) in pending
            ]
        )

        for (entity_id, raw_config, automation_id), effective_config in zip(
            pending, effective_configs, strict=True
        ):
            metadata = self._parse_metadata(effective_config.get("description"))
            if metadata is None or metadata.location_id != location_id:
                metadata = self._parse_metadata(raw_config.get("description"))
                if metadata is None or metadata.location_id != location_id:
                    continue

            name = self._resolve_rule_name(entity_id, effective_config)
            actions = self._extract_actions(effective_config)
            if not actions:
                actions = self._extract_actions(raw_config)
            first_action = actions[0] if actions else None
            action_entity_id = first_action.get("entity_id") if first_action else None
            action_service = first_action.get("service") if first_action else None
            action_data = first_action.get("data") if first_action else None
            enabled = self._is_automation_enabled(entity_id)

            rules.append(
                {
                    "id": automation_id or entity_id,
                    "entity_id": entity_id,
                    "name": name,
                    "trigger_type": metadata.trigger_type,
                    "trigger_types": list(metadata.trigger_types),
                    "actions": actions,
                    "action_entity_id": action_entity_id,
                    "action_service": action_service,
                    "action_data": action_data,
                    "ambient_condition": metadata.ambient_condition,
                    "must_be_occupied": metadata.must_be_occupied,
                    "time_condition_enabled": metadata.time_condition_enabled,
                    "start_time": metadata.start_time,
                    "end_time": metadata.end_time,
                    "run_on_startup": metadata.run_on_startup,
                    "rule_uuid": metadata.rule_uuid or self._rule_uuid_from_automation_id(automation_id or entity_id),
                    "user_named": metadata.user_named,
                    # Legacy compatibility for older frontends.
                    "require_dark": metadata.ambient_condition == "dark",
                    "enabled": enabled,
                }
            )

        rules.sort(key=lambda r: str(r.get("name", "")))
        return rules

    async def async_migrate_rule_names(self, location_manager: Any) -> int:
        """One-off: regenerate auto-name for every managed rule, overwriting its alias.

        Intentionally ignores the ``user_named`` flag — this migration is the baseline
        that establishes consistent naming across all pre-existing rules on first load
        of the renaming feature. Remove this method and its caller in __init__.py once
        the rollout is complete.
        """
        renamed = 0
        try:
            locations = list(location_manager.all_locations())
        except Exception:  # pragma: no cover - defensive
            _LOGGER.warning(
                "[migration] unable to enumerate locations for rule-name migration",
                exc_info=True,
            )
            return 0

        for location in locations:
            location_id = str(getattr(location, "id", "")).strip()
            if not location_id:
                continue
            try:
                rules = await self.async_list_rules(location_id)
            except Exception:  # pragma: no cover - defensive
                _LOGGER.warning(
                    "[migration] failed to list rules for location %s",
                    location_id,
                    exc_info=True,
                )
                continue

            for rule in rules:
                automation_id = str(rule.get("id") or "").strip()
                if not automation_id:
                    continue
                new_name = self._auto_rule_name(rule)
                current_name = str(rule.get("name") or "").strip()
                if not new_name or new_name == current_name:
                    continue
                try:
                    fetch_payload = await self._call_automation_config_api(
                        "GET", automation_id
                    )
                    if isinstance(fetch_payload, Mapping):
                        fetched_config = fetch_payload.get("config")
                        if isinstance(fetched_config, Mapping):
                            raw_config: Mapping[str, Any] = fetched_config
                        elif "triggers" in fetch_payload or "actions" in fetch_payload:
                            raw_config = fetch_payload
                        else:
                            continue
                    else:
                        continue
                    updated = dict(raw_config)
                    updated["alias"] = new_name
                    await self._call_automation_config_api(
                        "POST", automation_id, updated
                    )
                    renamed += 1
                    _LOGGER.info(
                        "[migration] renamed rule %s: %r -> %r",
                        automation_id,
                        current_name,
                        new_name,
                    )
                except Exception:  # pragma: no cover - defensive
                    _LOGGER.warning(
                        "[migration] failed to rename rule %s",
                        automation_id,
                        exc_info=True,
                    )
        return renamed

    async def async_create_rule(
        self,
        *,
        location: Any,
        name: str,
        trigger_type: str,
        trigger_types: list[str] | tuple[str, ...] | None = None,
        action_entity_id: str | None = None,
        action_service: str | None = None,
        actions: list[Mapping[str, Any]] | None = None,
        action_data: Mapping[str, Any] | None = None,
        require_dark: bool = False,
        ambient_condition: str | None = None,
        must_be_occupied: bool | None = None,
        time_condition_enabled: bool = False,
        start_time: str | None = None,
        end_time: str | None = None,
        run_on_startup: bool | None = None,
        automation_id: str | None = None,
        rule_uuid: str | None = None,
        user_named: bool = False,
    ) -> dict[str, Any]:
        """Create or replace one managed action automation (HA config/automation.py pattern)."""
        location_id = str(getattr(location, "id", "")).strip()
        location_name = str(getattr(location, "name", "Location")).strip() or "Location"
        if not location_id:
            raise ValueError("Location id is required")

        normalized_trigger_types = self._normalize_trigger_types(
            trigger_types, fallback_trigger_type=trigger_type
        )
        normalized_trigger = normalized_trigger_types[0]
        normalized_ambient_condition = self._normalize_ambient_condition(
            ambient_condition=ambient_condition,
            trigger_types=normalized_trigger_types,
            require_dark=require_dark,
        )
        normalized_start_time = self._normalize_time_hhmm(start_time, "18:00")
        normalized_end_time = self._normalize_time_hhmm(end_time, "23:59")
        normalized_actions = self._normalize_rule_actions(
            actions=actions,
            trigger_type=normalized_trigger,
            fallback_entity_id=action_entity_id,
            fallback_service=action_service,
            fallback_data=action_data,
        )
        if not normalized_actions:
            raise ValueError("At least one action target is required")
        primary_action = normalized_actions[0]
        primary_action_entity_id = str(primary_action["entity_id"])
        primary_action_service = str(primary_action["service"])
        primary_action_data = (
            dict(primary_action["data"]) if isinstance(primary_action.get("data"), Mapping) else None
        )

        occupancy_entity_id: str | None = None
        requires_occupancy_entity = (
            any(
                current_trigger in {"on_occupied", "on_vacant"}
                for current_trigger in normalized_trigger_types
            )
            or isinstance(must_be_occupied, bool)
        )
        if requires_occupancy_entity:
            occupancy_entity_id = self._find_occupancy_entity_id(location_id)
            if occupancy_entity_id is None:
                raise ValueError(
                    f'No occupancy binary sensor found for location "{location_name}" ({location_id})'
                )

        ambient_config = self._ambient_trigger_config(location)
        normalized_rule_uuid = self._normalize_rule_uuid(
            rule_uuid or self._rule_uuid_from_automation_id(automation_id or "")
        )
        automation_id = self._normalize_existing_automation_id(automation_id)
        if not automation_id:
            automation_id = self._build_stable_automation_id(
                location_id,
                normalized_trigger_types,
                primary_action_entity_id,
                name,
                normalized_rule_uuid,
            )
        if not normalized_rule_uuid:
            normalized_rule_uuid = self._rule_uuid_from_automation_id(automation_id)

        triggers = self._build_trigger_definitions(
            trigger_types=normalized_trigger_types,
            occupancy_entity_id=occupancy_entity_id,
            ambient_config=ambient_config,
        )
        if not triggers:
            raise ValueError("Unable to build automation triggers for this rule")

        conditions = self._build_condition_definitions(
            ambient_condition=normalized_ambient_condition,
            must_be_occupied=must_be_occupied,
            occupancy_entity_id=occupancy_entity_id,
            time_condition_enabled=bool(time_condition_enabled),
            start_time=normalized_start_time,
            end_time=normalized_end_time,
            ambient_config=ambient_config,
        )

        metadata_payload = {
            "version": 4,
            "location_id": location_id,
            "trigger_type": normalized_trigger,
            "trigger_types": list(normalized_trigger_types),
            "ambient_condition": normalized_ambient_condition,
            **(
                {"must_be_occupied": must_be_occupied}
                if isinstance(must_be_occupied, bool)
                else {}
            ),
            "time_condition_enabled": bool(time_condition_enabled),
            "start_time": normalized_start_time,
            "end_time": normalized_end_time,
            **(
                {"run_on_startup": bool(run_on_startup)}
                if isinstance(run_on_startup, bool)
                else {}
            ),
            "rule_uuid": normalized_rule_uuid,
            "user_named": bool(user_named),
        }
        description = "Managed by Topomation.\n" + self._metadata_line(metadata_payload)
        config_actions: list[dict[str, Any]] = []
        for action_target in normalized_actions:
            action_entity = str(action_target["entity_id"])
            action_service_name = str(action_target["service"])
            action_domain = (
                action_entity.split(".", 1)[0]
                if "." in action_entity
                else "homeassistant"
            )
            action_step: dict[str, Any] = {
                "action": f"{action_domain}.{action_service_name}",
                "target": {"entity_id": action_entity},
            }
            action_step_data = action_target.get("data")
            if isinstance(action_step_data, Mapping) and action_step_data:
                action_step["data"] = dict(action_step_data)
            only_if_off = (
                bool(action_target.get("only_if_off"))
                if self._action_supports_only_if_off(action_entity, action_service_name)
                else False
            )
            if only_if_off:
                config_actions.append(
                    {
                        "choose": [
                            {
                                "conditions": [
                                    {
                                        "condition": "state",
                                        "entity_id": action_entity,
                                        "state": "off",
                                    }
                                ],
                                "sequence": [action_step],
                            }
                        ]
                    }
                )
            else:
                config_actions.append(action_step)

        config_payload: dict[str, Any] = {
            CONF_ID: automation_id,
            "alias": name,
            "description": description,
            "triggers": triggers,
            "conditions": conditions,
            "actions": config_actions,
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
        self._remember_recent_rule_snapshot(
            automation_id=automation_id,
            location_id=location_id,
            name=name,
            trigger_type=normalized_trigger,
            trigger_types=normalized_trigger_types,
            ambient_condition=normalized_ambient_condition,
            must_be_occupied=must_be_occupied,
            time_condition_enabled=bool(time_condition_enabled),
            start_time=normalized_start_time,
            end_time=normalized_end_time,
            run_on_startup=run_on_startup if isinstance(run_on_startup, bool) else None,
            rule_uuid=normalized_rule_uuid,
            actions=normalized_actions,
            action_entity_id=primary_action_entity_id,
            action_service=primary_action_service,
            action_data=primary_action_data,
            user_named=bool(user_named),
        )

        entity_id = await self._resolve_created_entity_id(
            automation_id,
            max_attempts=_ENTITY_RESOLVE_MAX_ATTEMPTS,
            wait_seconds=_ENTITY_RESOLVE_WAIT_SECONDS,
        )
        if entity_id:
            _LOGGER.info(
                "[managed_actions] Rule created automation_id=%s entity_id=%s",
                automation_id,
                entity_id,
            )
            ha_area_id = getattr(location, "ha_area_id", None) or (
                (getattr(location, "modules", None) or {})
                .get("_meta", {})
                .get("ha_area_id")
            )
            self._apply_topomation_grouping(
                entity_id, normalized_trigger, area_id=ha_area_id
            )
        else:
            timeout_seconds = _ENTITY_RESOLVE_MAX_ATTEMPTS * _ENTITY_RESOLVE_WAIT_SECONDS
            self._recent_rule_snapshots.pop(automation_id, None)
            _LOGGER.warning(
                "[managed_actions] Rule written via config API but entity did not appear after %.1fs. "
                "Rolling back attempted write. "
                "The integration uses the same REST API as the HA automation UI (writes to automations.yaml). "
                "Ensure configuration.yaml includes that file (e.g. automation: !include automations.yaml). "
                "automation_id=%s",
                timeout_seconds,
                automation_id,
            )
            error_message = (
                "Managed action rule was written but Home Assistant did not register it after "
                f"{timeout_seconds:.1f}s. Ensure configuration.yaml includes automations.yaml "
                "(for example: automation: !include automations.yaml)."
            )
            try:
                await self.async_delete_rule(automation_id=automation_id)
            except Exception as err:
                _LOGGER.warning(
                    "Failed rollback after managed rule registration timeout for %s",
                    automation_id,
                    exc_info=True,
                )
                raise ValueError(
                    error_message
                    + " Topomation could not roll back automatically; check automations.yaml for a stale entry."
                ) from err
            raise ValueError(error_message + " Topomation rolled back the attempted write.")

        return {
            "id": automation_id,
            "entity_id": entity_id or f"automation.{automation_id}",
            "name": name,
            "trigger_type": normalized_trigger,
            "trigger_types": list(normalized_trigger_types),
            "actions": normalized_actions,
            "action_entity_id": primary_action_entity_id,
            "action_service": primary_action_service,
            "action_data": primary_action_data,
            "ambient_condition": normalized_ambient_condition,
            "must_be_occupied": must_be_occupied,
            "time_condition_enabled": bool(time_condition_enabled),
            "start_time": normalized_start_time,
            "end_time": normalized_end_time,
            "run_on_startup": run_on_startup if isinstance(run_on_startup, bool) else None,
            "rule_uuid": normalized_rule_uuid,
            # Legacy compatibility for older frontends.
            "require_dark": normalized_ambient_condition == "dark",
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
        self._recent_rule_snapshots.pop(config_id, None)

    async def async_set_rule_enabled(self, *, entity_id: str, enabled: bool) -> None:
        """Enable or disable one automation entity."""
        await self.hass.services.async_call(
            AUTOMATION_DOMAIN,
            "turn_on" if enabled else "turn_off",
            {"entity_id": entity_id},
            blocking=True,
        )

    async def async_delete_rules_for_location(self, location_id: str) -> list[str]:
        """Delete all Topomation-managed automations linked to a location."""
        deleted_automation_ids: list[str] = []
        target_location_id = location_id.strip()
        if not target_location_id:
            return deleted_automation_ids

        component = self.hass.data.get(AUTOMATION_DATA_COMPONENT)
        entities = self._snapshot_automation_entities(component)
        entity_registry = er.async_get(self.hass)

        for automation_entity in entities:
            entity_id = getattr(automation_entity, "entity_id", None)
            raw_config = getattr(automation_entity, "raw_config", None)
            unique_id = getattr(automation_entity, "unique_id", None)
            if not isinstance(entity_id, str) or not entity_id:
                continue
            if not isinstance(raw_config, Mapping):
                continue

            metadata = self._parse_metadata(raw_config.get("description"))
            if metadata is None or metadata.location_id != target_location_id:
                continue

            automation_id = self._resolve_automation_id(
                entity_registry,
                entity_id,
                raw_config,
                unique_id,
            ) or self._config_id_for_entity_id(entity_id)
            if not automation_id:
                _LOGGER.debug(
                    "Skipping managed automation delete with unknown config id: entity_id=%s location=%s",
                    entity_id,
                    target_location_id,
                )
                continue

            try:
                await self.async_delete_rule(
                    automation_id=automation_id,
                    entity_id=entity_id,
                )
                deleted_automation_ids.append(automation_id)
            except Exception:  # pragma: no cover - defensive logging
                _LOGGER.warning(
                    "Failed to delete managed automation %s for deleted location %s",
                    automation_id,
                    target_location_id,
                    exc_info=True,
                )

        return deleted_automation_ids

    def _snapshot_automation_entities(self, component: Any) -> list[Any]:
        """Return a stable list of automation entities from HA's automation component."""
        if component is None:
            return []
        raw_entities = getattr(component, "entities", [])
        if isinstance(raw_entities, Mapping):
            return list(raw_entities.values())
        return list(raw_entities)

    def _find_occupancy_entity_id(self, location_id: str) -> str | None:
        """Resolve occupancy binary sensor entity_id for a location id."""
        for state in self.hass.states.async_all("binary_sensor"):
            if state.attributes.get("device_class") != "occupancy":
                continue
            if state.attributes.get("location_id") != location_id:
                continue
            return state.entity_id
        return None

    def _normalize_trigger_type(self, trigger_type: str) -> ActionTriggerType:
        """Normalize legacy/new trigger aliases to the canonical trigger set."""
        normalized = str(trigger_type or "").strip().lower()
        if normalized == "occupied":
            normalized = "on_occupied"
        elif normalized == "vacant":
            normalized = "on_vacant"
        if normalized not in _VALID_TRIGGER_TYPES:
            raise ValueError(f"Invalid trigger_type '{trigger_type}'")
        return cast(ActionTriggerType, normalized)

    def _normalize_trigger_types(
        self,
        trigger_types: list[str] | tuple[str, ...] | None,
        *,
        fallback_trigger_type: str | None = None,
    ) -> tuple[ActionTriggerType, ...]:
        """Normalize one-or-many trigger types to a stable canonical tuple."""
        normalized: list[ActionTriggerType] = []
        seen: set[ActionTriggerType] = set()

        raw_values: list[str] = []
        if isinstance(trigger_types, (list, tuple)):
            raw_values.extend(str(value or "") for value in trigger_types)
        if fallback_trigger_type:
            raw_values.append(str(fallback_trigger_type))

        for raw_value in raw_values:
            trigger_type = self._normalize_trigger_type(raw_value)
            if trigger_type in seen:
                continue
            normalized.append(trigger_type)
            seen.add(trigger_type)

        if not normalized:
            raise ValueError("At least one trigger_type is required")

        ordered = sorted(normalized, key=_TRIGGER_TYPE_ORDER.index)
        if "on_occupied" in ordered and "on_vacant" in ordered:
            raise ValueError("Lighting rules cannot include both on_occupied and on_vacant")
        if "on_dark" in ordered and "on_bright" in ordered:
            raise ValueError("Lighting rules cannot include both on_dark and on_bright")
        return tuple(ordered)

    def _prune_recent_rule_snapshots(self) -> None:
        """Drop expired snapshot entries."""
        now = monotonic()
        expired_keys = [
            automation_id
            for automation_id, snapshot in self._recent_rule_snapshots.items()
            if now - snapshot.saved_at_monotonic > _RECENT_RULE_SNAPSHOT_TTL_SECONDS
        ]
        for automation_id in expired_keys:
            self._recent_rule_snapshots.pop(automation_id, None)

    def _get_recent_rule_snapshot(
        self,
        automation_id: str,
        *,
        location_id: str,
    ) -> _RecentRuleSnapshot | None:
        """Return a non-expired snapshot for this automation/location pair."""
        if not automation_id:
            return None
        snapshot = self._recent_rule_snapshots.get(automation_id)
        if snapshot is None:
            return None
        if monotonic() - snapshot.saved_at_monotonic > _RECENT_RULE_SNAPSHOT_TTL_SECONDS:
            self._recent_rule_snapshots.pop(automation_id, None)
            return None
        if snapshot.location_id != location_id:
            return None
        return snapshot

    def _remember_recent_rule_snapshot(
        self,
        *,
        automation_id: str,
        location_id: str,
        name: str,
        trigger_type: ActionTriggerType,
        trigger_types: tuple[ActionTriggerType, ...],
        ambient_condition: ActionAmbientCondition,
        must_be_occupied: bool | None,
        time_condition_enabled: bool,
        start_time: str,
        end_time: str,
        run_on_startup: bool | None,
        rule_uuid: str,
        actions: list[dict[str, Any]],
        action_entity_id: str | None,
        action_service: str | None,
        action_data: Mapping[str, Any] | None,
        user_named: bool,
    ) -> None:
        """Persist short-lived rule state after POST for immediate list consistency."""
        if not automation_id:
            return
        normalized_actions: list[dict[str, Any]] = []
        for action in actions:
            entry: dict[str, Any] = {
                "entity_id": str(action.get("entity_id", "")).strip(),
                "service": str(action.get("service", "")).strip(),
            }
            raw_data = action.get("data")
            if isinstance(raw_data, Mapping) and raw_data:
                entry["data"] = dict(raw_data)
            if self._action_supports_only_if_off(entry["entity_id"], entry["service"]):
                only_if_off = action.get("only_if_off")
                if isinstance(only_if_off, bool):
                    entry["only_if_off"] = only_if_off
            if entry["entity_id"] and entry["service"]:
                normalized_actions.append(entry)

        snapshot = _RecentRuleSnapshot(
            saved_at_monotonic=monotonic(),
            location_id=location_id,
            name=name,
            trigger_type=trigger_type,
            trigger_types=trigger_types,
            ambient_condition=ambient_condition,
            must_be_occupied=must_be_occupied,
            time_condition_enabled=time_condition_enabled,
            start_time=start_time,
            end_time=end_time,
            run_on_startup=run_on_startup if isinstance(run_on_startup, bool) else None,
            rule_uuid=rule_uuid,
            user_named=bool(user_named),
            actions=normalized_actions,
            action_entity_id=action_entity_id,
            action_service=action_service,
            action_data=(dict(action_data) if isinstance(action_data, Mapping) else None),
        )
        self._recent_rule_snapshots[automation_id] = snapshot

    def _default_ambient_condition_for_trigger(
        self,
        trigger_types: tuple[ActionTriggerType, ...],
    ) -> ActionAmbientCondition:
        if "on_dark" in trigger_types:
            return "dark"
        if "on_bright" in trigger_types:
            return "bright"
        return "any"

    def _normalize_ambient_condition(
        self,
        *,
        ambient_condition: str | None,
        trigger_types: tuple[ActionTriggerType, ...],
        require_dark: bool,
    ) -> ActionAmbientCondition:
        if isinstance(ambient_condition, str):
            normalized = ambient_condition.strip().lower()
            if normalized in _VALID_AMBIENT_CONDITIONS:
                return normalized  # type: ignore[return-value]
        if require_dark:
            return "dark"
        return self._default_ambient_condition_for_trigger(trigger_types)

    def _normalize_time_hhmm(self, value: str | None, fallback: str) -> str:
        raw = str(value or "").strip()
        if not raw:
            return fallback
        parts = raw.split(":")
        if len(parts) < 2:
            return fallback
        try:
            hour = int(parts[0])
            minute = int(parts[1])
        except ValueError:
            return fallback
        if hour < 0 or hour > 23 or minute < 0 or minute > 59:
            return fallback
        return f"{hour:02d}:{minute:02d}"

    def _ambient_trigger_config(self, location: Any) -> dict[str, Any]:
        """Extract ambient trigger-relevant configuration from the location config."""
        modules = getattr(location, "modules", {}) or {}
        ambient = modules.get("ambient", {}) if isinstance(modules, Mapping) else {}
        if not isinstance(ambient, Mapping):
            ambient = {}

        lux_sensor_raw = str(ambient.get("lux_sensor", "") or "").strip()
        lux_sensor = lux_sensor_raw if lux_sensor_raw.startswith("sensor.") else None

        try:
            dark_threshold = float(ambient.get("dark_threshold", 50))
        except (TypeError, ValueError):
            dark_threshold = 50.0
        try:
            bright_threshold = float(ambient.get("bright_threshold", 500))
        except (TypeError, ValueError):
            bright_threshold = max(dark_threshold + 1.0, 500.0)

        if bright_threshold <= dark_threshold:
            bright_threshold = dark_threshold + 1.0

        return {
            "lux_sensor": lux_sensor,
            "dark_threshold": dark_threshold,
            "bright_threshold": bright_threshold,
            "fallback_to_sun": bool(ambient.get("fallback_to_sun", True)),
        }

    def _build_trigger_definitions(
        self,
        *,
        trigger_types: tuple[ActionTriggerType, ...],
        occupancy_entity_id: str | None,
        ambient_config: Mapping[str, Any],
    ) -> list[dict[str, Any]]:
        """Build Home Assistant trigger definitions for one managed action rule."""
        triggers: list[dict[str, Any]] = []
        for trigger_type in trigger_types:
            if trigger_type in {"on_occupied", "on_vacant"}:
                if not occupancy_entity_id:
                    raise ValueError("Occupancy trigger requested but no occupancy entity was found")
                triggers.append(
                    {
                        "trigger": "state",
                        "entity_id": occupancy_entity_id,
                        "to": "on" if trigger_type == "on_occupied" else "off",
                    }
                )
                continue

            lux_sensor = ambient_config.get("lux_sensor")
            if isinstance(lux_sensor, str) and lux_sensor:
                if trigger_type == "on_dark":
                    triggers.append(
                        {
                            "trigger": "numeric_state",
                            "entity_id": lux_sensor,
                            "below": float(ambient_config.get("dark_threshold", 50.0)),
                        }
                    )
                elif trigger_type == "on_bright":
                    triggers.append(
                        {
                            "trigger": "numeric_state",
                            "entity_id": lux_sensor,
                            "above": float(ambient_config.get("bright_threshold", 500.0)),
                        }
                    )

            fallback_to_sun = bool(ambient_config.get("fallback_to_sun", True))
            if fallback_to_sun or not isinstance(lux_sensor, str) or not lux_sensor:
                triggers.append(
                    {
                        "trigger": "state",
                        "entity_id": "sun.sun",
                        "to": "below_horizon" if trigger_type == "on_dark" else "above_horizon",
                    }
                )
        return triggers

    def _ambient_condition_clause(
        self,
        *,
        ambient_condition: ActionAmbientCondition,
        ambient_config: Mapping[str, Any],
    ) -> dict[str, Any] | None:
        """Build ambient state condition block for dark/bright constraints."""
        if ambient_condition == "any":
            return None

        lux_sensor = ambient_config.get("lux_sensor")
        fallback_to_sun = bool(ambient_config.get("fallback_to_sun", True))
        dark_state = ambient_condition == "dark"
        clauses: list[dict[str, Any]] = []

        if isinstance(lux_sensor, str) and lux_sensor:
            threshold_key = "dark_threshold" if dark_state else "bright_threshold"
            threshold = float(ambient_config.get(threshold_key, 50.0 if dark_state else 500.0))
            clauses.append(
                {
                    "condition": "numeric_state",
                    "entity_id": lux_sensor,
                    "below" if dark_state else "above": threshold,
                }
            )
        if fallback_to_sun or not clauses:
            clauses.append(
                {
                    "condition": "state",
                    "entity_id": "sun.sun",
                    "state": "below_horizon" if dark_state else "above_horizon",
                }
            )

        if len(clauses) == 1:
            return clauses[0]
        return {
            "condition": "or",
            "conditions": clauses,
        }

    def _build_condition_definitions(
        self,
        *,
        ambient_condition: ActionAmbientCondition,
        must_be_occupied: bool | None,
        occupancy_entity_id: str | None,
        time_condition_enabled: bool,
        start_time: str,
        end_time: str,
        ambient_config: Mapping[str, Any],
    ) -> list[dict[str, Any]]:
        """Build Home Assistant condition list for one managed action rule."""
        conditions: list[dict[str, Any]] = []

        ambient_clause = self._ambient_condition_clause(
            ambient_condition=ambient_condition,
            ambient_config=ambient_config,
        )
        if ambient_clause is not None:
            conditions.append(ambient_clause)

        if isinstance(must_be_occupied, bool):
            if not occupancy_entity_id:
                raise ValueError("Occupancy condition requires an occupancy sensor")
            conditions.append(
                {
                    "condition": "state",
                    "entity_id": occupancy_entity_id,
                    "state": "on" if must_be_occupied else "off",
                }
            )

        if time_condition_enabled:
            conditions.append(
                {
                    "condition": "time",
                    "after": start_time,
                    "before": end_time,
                }
            )

        return conditions

    def _build_stable_automation_id(
        self,
        location_id: str,
        trigger_types: tuple[ActionTriggerType, ...],
        action_entity_id: str,
        rule_name: str,
        rule_uuid: str | None = None,
    ) -> str:
        """Build a stable Topomation automation id so saves update in place."""
        loc_slug = self._slugify(location_id)
        trigger_slug = "_".join(trigger_type.removeprefix("on_") for trigger_type in trigger_types)
        action_slug = self._slugify(action_entity_id)
        if rule_uuid:
            uuid_slug = self._slugify(rule_uuid)[:24]
            return (
                f"{_TOPOMATION_AUTOMATION_ID_PREFIX}"
                f"{loc_slug}_{trigger_slug}_{action_slug}_{uuid_slug}"
            )
        name_slug = self._slugify(rule_name)[:40]
        return (
            f"{_TOPOMATION_AUTOMATION_ID_PREFIX}"
            f"{loc_slug}_{trigger_slug}_{action_slug}_{name_slug}"
        )

    def _normalize_existing_automation_id(self, value: str | None) -> str | None:
        """Normalize optional user-supplied automation id for in-place updates."""
        raw = str(value or "").strip()
        if not raw:
            return None
        if raw.startswith("automation."):
            raw = raw.split(".", 1)[1].strip()
        if not raw:
            return None
        if _AUTOMATION_ID_PATTERN.fullmatch(raw):
            return raw
        normalized = self._slugify(raw)
        return normalized or None

    def _normalize_rule_uuid(self, value: str | None) -> str:
        """Normalize stable per-rule UUID/token used for metadata + id suffix."""
        raw = str(value or "").strip().lower()
        if not raw:
            return ""
        normalized = re.sub(r"[^a-z0-9_-]+", "", raw).strip("_-")
        if not normalized:
            return ""
        if len(normalized) > 64:
            normalized = normalized[:64]
        if _RULE_UUID_PATTERN.fullmatch(normalized):
            return normalized
        return ""

    def _rule_uuid_from_automation_id(self, automation_id: str) -> str:
        """Derive a deterministic rule token from an automation id when metadata is missing."""
        raw = str(automation_id or "").strip().lower()
        if raw.startswith("automation."):
            raw = raw.split(".", 1)[1]
        normalized = re.sub(r"[^a-z0-9_-]+", "", raw).strip("_-")
        if not normalized:
            return ""
        if len(normalized) > 64:
            normalized = normalized[-64:]
        if _RULE_UUID_PATTERN.fullmatch(normalized):
            return normalized
        return ""

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
            if not isinstance(location_id, str) or not location_id:
                return None

            raw_trigger_type = parsed.get("trigger_type")
            raw_trigger_types = parsed.get("trigger_types")
            try:
                trigger_types = self._normalize_trigger_types(
                    raw_trigger_types if isinstance(raw_trigger_types, (list, tuple)) else None,
                    fallback_trigger_type=str(raw_trigger_type or ""),
                )
            except ValueError:
                return None
            trigger_type = trigger_types[0]

            ambient_condition = self._normalize_ambient_condition(
                ambient_condition=(
                    parsed.get("ambient_condition")
                    if isinstance(parsed, Mapping)
                    else None
                ),
                trigger_types=trigger_types,
                require_dark=bool(parsed.get("require_dark", False)),
            )
            raw_must_be_occupied = (
                parsed.get("must_be_occupied") if isinstance(parsed, Mapping) else None
            )
            must_be_occupied = (
                raw_must_be_occupied
                if isinstance(raw_must_be_occupied, bool)
                else None
            )
            time_condition_enabled = bool(parsed.get("time_condition_enabled", False))
            start_time = self._normalize_time_hhmm(
                parsed.get("start_time") if isinstance(parsed, Mapping) else None,
                "18:00",
            )
            end_time = self._normalize_time_hhmm(
                parsed.get("end_time") if isinstance(parsed, Mapping) else None,
                "23:59",
            )
            run_on_startup = (
                parsed.get("run_on_startup")
                if isinstance(parsed, Mapping)
                else None
            )
            rule_uuid = self._normalize_rule_uuid(
                parsed.get("rule_uuid") if isinstance(parsed, Mapping) else None
            )
            if not rule_uuid and isinstance(parsed, Mapping):
                rule_uuid = self._rule_uuid_from_automation_id(
                    str(parsed.get("automation_id", "")).strip()
                )

            raw_user_named = (
                parsed.get("user_named") if isinstance(parsed, Mapping) else None
            )
            return _TopomationMetadata(
                location_id=location_id,
                trigger_type=trigger_type,
                trigger_types=trigger_types,
                ambient_condition=ambient_condition,
                must_be_occupied=must_be_occupied,
                time_condition_enabled=time_condition_enabled,
                start_time=start_time,
                end_time=end_time,
                run_on_startup=run_on_startup if isinstance(run_on_startup, bool) else None,
                rule_uuid=rule_uuid,
                user_named=bool(raw_user_named) if isinstance(raw_user_named, bool) else False,
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

    @staticmethod
    def _trigger_word(trigger_type: str) -> str:
        return {
            "on_occupied": "Occupied",
            "on_vacant": "Vacant",
            "on_dark": "Dark",
            "on_bright": "Bright",
        }.get(trigger_type, "Dark")

    def _friendly_entity_name(self, entity_id: str) -> str:
        state = self.hass.states.get(entity_id)
        if state is not None:
            friendly_name = state.attributes.get("friendly_name")
            if isinstance(friendly_name, str) and friendly_name.strip():
                return friendly_name.strip()
        return entity_id

    def _auto_rule_name(self, rule: Mapping[str, Any]) -> str:
        """Python mirror of frontend _autoActionRuleName — keep the two in sync."""
        trigger_types_raw = rule.get("trigger_types")
        if isinstance(trigger_types_raw, (list, tuple)):
            trigger_types_in = [str(t) for t in trigger_types_raw]
        else:
            single = rule.get("trigger_type")
            trigger_types_in = [str(single)] if single else []
        ordered = ("on_occupied", "on_vacant", "on_dark", "on_bright")
        trigger_words = [self._trigger_word(t) for t in ordered if t in trigger_types_in]
        prefix = " + ".join(trigger_words)

        must_be_occupied = rule.get("must_be_occupied")
        if must_be_occupied is True:
            prefix = f"{prefix} if occupied" if prefix else "If occupied"
        elif must_be_occupied is False:
            prefix = f"{prefix} if vacant" if prefix else "If vacant"

        if bool(rule.get("time_condition_enabled")):
            begin = self._normalize_time_hhmm(rule.get("start_time"), "18:00")
            end = self._normalize_time_hhmm(rule.get("end_time"), "23:59")
            time_part = f"{begin}-{end}"
            prefix = f"{prefix} {time_part}" if prefix else time_part

        actions = rule.get("actions") or []
        primary_entity = ""
        if isinstance(actions, list) and actions:
            first = actions[0]
            if isinstance(first, Mapping):
                primary_entity = str(first.get("entity_id") or "").strip()
        if not primary_entity:
            primary_entity = str(rule.get("action_entity_id") or "").strip()

        if not primary_entity:
            return prefix or "New rule"

        suffix = self._friendly_entity_name(primary_entity)
        extras = len(actions) - 1 if isinstance(actions, list) else 0
        if extras > 0:
            suffix = f"{suffix} +{extras}"
        return f"{prefix}: {suffix}" if prefix else suffix

    def _extract_actions(
        self,
        raw_config: Mapping[str, Any],
    ) -> list[dict[str, Any]]:
        """Extract normalized action targets from raw automation config."""
        action_block = raw_config.get("actions", raw_config.get("action"))
        action_entries: list[Any]
        if isinstance(action_block, list):
            action_entries = action_block
        elif action_block is None:
            action_entries = []
        else:
            action_entries = [action_block]

        normalized_actions: list[dict[str, Any]] = []
        seen_entity_ids: set[str] = set()
        for raw_action in action_entries:
            if not isinstance(raw_action, Mapping):
                continue
            choose_entries = raw_action.get("choose")
            if isinstance(choose_entries, list):
                parsed_choose = self._extract_only_if_off_choose_action(raw_action)
                if parsed_choose is not None:
                    choose_entity_id = str(parsed_choose["entity_id"])
                    if choose_entity_id not in seen_entity_ids:
                        normalized_actions.append(parsed_choose)
                        seen_entity_ids.add(choose_entity_id)
                continue
            raw_service = raw_action.get("action") or raw_action.get("service")
            if not isinstance(raw_service, str) or not raw_service.strip():
                continue
            action_service_name = (
                raw_service.split(".", 1)[1] if "." in raw_service else raw_service
            ).strip()
            if not action_service_name:
                continue

            action_entity_id: str | None = None
            target = raw_action.get("target")
            if isinstance(target, Mapping):
                target_entity = target.get("entity_id")
                if isinstance(target_entity, str) and target_entity.strip():
                    action_entity_id = target_entity.strip()
                elif isinstance(target_entity, list):
                    for candidate in target_entity:
                        if isinstance(candidate, str) and candidate.strip():
                            action_entity_id = candidate.strip()
                            break
            if not action_entity_id:
                data = raw_action.get("data")
                if isinstance(data, Mapping):
                    data_entity = data.get("entity_id")
                    if isinstance(data_entity, str) and data_entity.strip():
                        action_entity_id = data_entity.strip()

            if not action_entity_id or action_entity_id in seen_entity_ids:
                continue
            action_data = self._normalize_action_data(raw_action.get("data"))
            normalized_actions.append(
                {
                    "entity_id": action_entity_id,
                    "service": action_service_name,
                    **({"data": action_data} if action_data else {}),
                }
            )
            seen_entity_ids.add(action_entity_id)

        return normalized_actions

    def _default_action_service_for_trigger(self, entity_id: str, trigger_type: ActionTriggerType) -> str:
        """Return default service for one entity+trigger pairing."""
        domain = entity_id.split(".", 1)[0] if "." in entity_id else ""
        prefers_off = trigger_type in {"on_vacant", "on_bright"}
        if domain == "media_player":
            return "media_stop" if prefers_off else "media_play"
        if domain in {"switch", "fan", "light"}:
            return "turn_off" if prefers_off else "turn_on"
        return "turn_off" if prefers_off else "turn_on"

    def _normalize_rule_actions(
        self,
        *,
        actions: list[Mapping[str, Any]] | None,
        trigger_type: ActionTriggerType,
        fallback_entity_id: str | None,
        fallback_service: str | None,
        fallback_data: Mapping[str, Any] | None,
    ) -> list[dict[str, Any]]:
        """Normalize multi-target action payload."""
        normalized: list[dict[str, Any]] = []
        seen_entity_ids: set[str] = set()
        for raw_action in actions or []:
            if not isinstance(raw_action, Mapping):
                continue
            entity_id = str(raw_action.get("entity_id", "")).strip()
            if not entity_id or entity_id in seen_entity_ids:
                continue
            raw_service = str(raw_action.get("service", "")).strip()
            service = raw_service or self._default_action_service_for_trigger(entity_id, trigger_type)
            data = self._normalize_action_data(raw_action.get("data"))
            only_if_off = (
                raw_action.get("only_if_off")
                if self._action_supports_only_if_off(entity_id, service)
                else None
            )
            normalized.append(
                {
                    "entity_id": entity_id,
                    "service": service,
                    **({"data": data} if data else {}),
                    **({"only_if_off": bool(only_if_off)} if isinstance(only_if_off, bool) else {}),
                }
            )
            seen_entity_ids.add(entity_id)

        fallback_entity = str(fallback_entity_id or "").strip()
        if fallback_entity and fallback_entity not in seen_entity_ids:
            fallback_service_name = str(fallback_service or "").strip() or self._default_action_service_for_trigger(
                fallback_entity, trigger_type
            )
            fallback_data_normalized = self._normalize_action_data(fallback_data)
            normalized.insert(
                0,
                {
                    "entity_id": fallback_entity,
                    "service": fallback_service_name,
                    **({"data": fallback_data_normalized} if fallback_data_normalized else {}),
                },
            )

        return normalized

    @staticmethod
    def _action_supports_only_if_off(entity_id: str, service: str) -> bool:
        """Return True when one action target supports the only-if-off guard."""
        return entity_id.startswith("light.") and service == "turn_on"

    def _extract_only_if_off_choose_action(
        self,
        raw_action: Mapping[str, Any],
    ) -> dict[str, Any] | None:
        """Extract one Topomation choose wrapper that guards a light turn_on action."""
        choose_entries = raw_action.get("choose")
        if not isinstance(choose_entries, list) or len(choose_entries) != 1:
            return None
        choose_entry = choose_entries[0]
        if not isinstance(choose_entry, Mapping):
            return None
        conditions = choose_entry.get("conditions")
        sequence = choose_entry.get("sequence")
        if not isinstance(conditions, list) or len(conditions) != 1:
            return None
        if not isinstance(sequence, list) or len(sequence) != 1:
            return None
        condition = conditions[0]
        action_step = sequence[0]
        if not isinstance(condition, Mapping) or not isinstance(action_step, Mapping):
            return None
        if (
            condition.get("condition") != "state"
            or condition.get("state") != "off"
            or not isinstance(condition.get("entity_id"), str)
        ):
            return None
        parsed_actions = self._extract_actions({"actions": [action_step]})
        if len(parsed_actions) != 1:
            return None
        extracted = dict(parsed_actions[0])
        entity_id = str(extracted.get("entity_id", "")).strip()
        service = str(extracted.get("service", "")).strip()
        if entity_id != str(condition.get("entity_id")).strip():
            return None
        if not self._action_supports_only_if_off(entity_id, service):
            return None
        extracted["only_if_off"] = True
        return extracted

    def _normalize_action_data(self, raw_data: Any) -> dict[str, Any] | None:
        """Normalize managed action data payload for service call compatibility."""
        if not isinstance(raw_data, Mapping):
            return None

        action_data: dict[str, Any] = {}
        brightness_raw = raw_data.get("brightness_pct")
        if brightness_raw is not None:
            try:
                numeric = float(brightness_raw)
            except (TypeError, ValueError):
                numeric = 0.0
            if numeric > 0:
                action_data["brightness_pct"] = max(1, min(100, round(numeric)))

        for key, value in raw_data.items():
            if key in {"entity_id", "brightness_pct"}:
                continue
            if value is not None:
                action_data[str(key)] = value

        return action_data or None

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

    async def _resolve_created_entity_id(
        self,
        automation_id: str,
        *,
        max_attempts: int,
        wait_seconds: float,
    ) -> str | None:
        """Resolve automation entity_id after create/reload races settle."""
        entity_registry = er.async_get(self.hass)
        for attempt in range(max_attempts):
            entity_id = entity_registry.async_get_entity_id(
                AUTOMATION_DOMAIN, AUTOMATION_DOMAIN, automation_id
            )
            if isinstance(entity_id, str) and entity_id:
                return entity_id

            component = self.hass.data.get(AUTOMATION_DATA_COMPONENT)
            entities = getattr(component, "entities", []) if component else []
            for automation_entity in entities:
                if getattr(automation_entity, "unique_id", None) != automation_id:
                    continue
                candidate = getattr(automation_entity, "entity_id", None)
                if isinstance(candidate, str) and candidate:
                    return candidate

            if attempt < max_attempts - 1:
                await asyncio.sleep(wait_seconds)
        return None

    def _apply_topomation_grouping(
        self,
        entity_id: str,
        trigger_type: ActionTriggerType,
        *,
        area_id: str | None = None,
    ) -> None:
        """Apply area, label, and category to an automation entity (matches UI Save dialog)."""
        entity_registry = er.async_get(self.hass)
        entry = entity_registry.async_get(entity_id)
        if entry is None:
            return
        labels = set(entry.labels or ())
        primary_label = self._ensure_label(_TOPOMATION_LABEL_NAME)
        if trigger_type == "on_occupied":
            trigger_label_name = _TOPOMATION_OCCUPIED_LABEL_NAME
        elif trigger_type == "on_vacant":
            trigger_label_name = _TOPOMATION_VACANT_LABEL_NAME
        elif trigger_type == "on_dark":
            trigger_label_name = _TOPOMATION_DARK_LABEL_NAME
        else:
            trigger_label_name = _TOPOMATION_BRIGHT_LABEL_NAME
        trigger_label = self._ensure_label(
            trigger_label_name
        )
        if primary_label:
            labels.add(primary_label)
        if trigger_label:
            labels.add(trigger_label)
        categories = dict(entry.categories or {})
        category_id = self._ensure_automation_category(_TOPOMATION_CATEGORY_NAME)
        if category_id is not None:
            categories["automation"] = category_id
        update_kwargs: dict[str, Any] = {
            "labels": labels,
            "categories": categories,
        }
        if area_id is not None:
            update_kwargs["area_id"] = area_id
        existing_labels = set(entry.labels or ())
        existing_categories = dict(entry.categories or {})
        existing_area_id = getattr(entry, "area_id", None)
        if (
            existing_labels == set(update_kwargs["labels"])
            and existing_categories == cast(dict[str, Any], update_kwargs["categories"])
            and (area_id is None or existing_area_id == area_id)
        ):
            return
        try:
            entity_registry.async_update_entity(entity_id, **update_kwargs)
        except Exception:
            _LOGGER.debug(
                "Failed to apply Topomation area/labels/categories for %s",
                entity_id,
                exc_info=True,
            )

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
