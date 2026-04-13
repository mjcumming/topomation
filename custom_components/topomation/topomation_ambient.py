"""Topomation ambient lux resolution (shadow HA area entity_ids).

The published `home-topology` wheel may lag the repo; this subclass matches the
1.0.4 kernel hook (`extra_lux_entity_ids` + cache invalidation) while depending
on PyPI `home-topology==1.0.3`.
"""

from __future__ import annotations

import logging
from collections.abc import Callable, Iterable
from typing import Any

from home_topology.modules.ambient import AmbientLightModule

logger = logging.getLogger(__name__)


class TopomationAmbientLightModule(AmbientLightModule):
    """Ambient module with managed-shadow lux candidates."""

    def __init__(
        self,
        platform_adapter: Any = None,
        *,
        extra_lux_entity_ids: Callable[[str], Iterable[str]] | None = None,
    ) -> None:
        super().__init__(platform_adapter=platform_adapter)
        self._extra_lux_entity_ids = extra_lux_entity_ids

    def invalidate_ambient_sensor_cache(self, location_id: str | None = None) -> None:
        """Clear cached lux sensor resolution for one location or all locations."""
        if location_id is None:
            self._sensor_cache.clear()
        else:
            self._sensor_cache.pop(location_id, None)

    def _lux_entity_ids_from_integration_hook(self, location_id: str) -> list[str]:
        resolver = self._extra_lux_entity_ids
        if resolver is None:
            return []
        try:
            seq = resolver(location_id)
        except Exception:  # pragma: no cover - integration callback defensive
            logger.exception("extra_lux_entity_ids failed for %s", location_id)
            return []
        if not seq:
            return []
        out: list[str] = []
        for item in seq:
            if isinstance(item, str) and item.strip():
                out.append(item.strip())
        return out

    def _find_lux_sensor_for_location(self, location_id: str) -> str | None:
        """Find lux sensor: config, auto_discover on host row, then integration hook."""
        if location_id in self._sensor_cache:
            return self._sensor_cache[location_id]

        config = self._get_location_config(location_id)
        if config.lux_sensor:
            self._sensor_cache[location_id] = config.lux_sensor
            return config.lux_sensor

        if config.auto_discover:
            location = self._require_location_manager().get_location(location_id)
            if location:
                for entity_id in location.entity_ids:
                    if self._is_lux_sensor(entity_id):
                        self._sensor_cache[location_id] = entity_id
                        return entity_id

        for entity_id in self._lux_entity_ids_from_integration_hook(location_id):
            if self._is_lux_sensor(entity_id):
                self._sensor_cache[location_id] = entity_id
                return entity_id

        self._sensor_cache[location_id] = None
        return None
