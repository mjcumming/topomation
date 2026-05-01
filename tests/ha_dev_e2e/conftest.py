"""Fixtures for HA dev-container production-shaped e2e tests."""

from __future__ import annotations

import pytest

from .ha_client import HADevClient, bootstrap_dev_ha, client_from_env

pytestmark = pytest.mark.live_ha
_BOOTSTRAP_CACHE = None


@pytest.fixture
def ha_dev_client(live_ha_socket_enabled) -> HADevClient:  # noqa: ARG001
    """Authenticated Home Assistant dev-runtime client."""
    return client_from_env()


@pytest.fixture
async def ha_dev_bootstrap(ha_dev_client: HADevClient):
    """Ensure the deterministic HA dev topology exists."""
    global _BOOTSTRAP_CACHE
    if _BOOTSTRAP_CACHE is None:
        _BOOTSTRAP_CACHE = await bootstrap_dev_ha(ha_dev_client)
    return _BOOTSTRAP_CACHE
