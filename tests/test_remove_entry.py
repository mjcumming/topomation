"""Removal of the Topomation automation system user."""

from __future__ import annotations

from homeassistant.auth.const import GROUP_ID_ADMIN
from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.topomation import async_remove_entry
from custom_components.topomation.const import DOMAIN


async def test_remove_entry_deletes_system_user_and_keeps_same_name_human(
    hass: HomeAssistant,
) -> None:
    """Uninstall removes the generated admin user and its refresh token."""
    system_user = await hass.auth.async_create_system_user(
        "Topomation",
        group_ids=[GROUP_ID_ADMIN],
    )
    await hass.auth.async_create_refresh_token(system_user)
    human = await hass.auth.async_create_user("Topomation")
    entry = MockConfigEntry(domain=DOMAIN, data={}, entry_id="only-entry")
    entry.add_to_hass(hass)

    await async_remove_entry(hass, entry)

    users = await hass.auth.async_get_users()
    user_ids = {user.id for user in users}
    assert system_user.id not in user_ids
    assert human.id in user_ids
    assert await hass.auth.async_get_user(system_user.id) is None


async def test_remove_entry_keeps_system_user_while_another_entry_remains(
    hass: HomeAssistant,
) -> None:
    """A second loaded entry still needs the shared automation system user."""
    system_user = await hass.auth.async_create_system_user(
        "Topomation",
        group_ids=[GROUP_ID_ADMIN],
    )
    first = MockConfigEntry(domain=DOMAIN, data={}, entry_id="first-entry")
    second = MockConfigEntry(domain=DOMAIN, data={}, entry_id="second-entry")
    first.add_to_hass(hass)
    second.add_to_hass(hass)

    await async_remove_entry(hass, first)

    users = await hass.auth.async_get_users()
    assert any(user.id == system_user.id for user in users)
