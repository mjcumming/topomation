"""Bootstrap the isolated HA dev runtime for Topomation e2e tests."""

from __future__ import annotations

import asyncio

from ha_client import bootstrap_dev_ha, client_from_env


async def _main() -> None:
    client = client_from_env()
    info = await bootstrap_dev_ha(client)
    location_count = len(info.get("locations", {}).get("locations", []))
    print(
        "Bootstrapped HA dev runtime: "
        f"entry_id={info['entry_id']} locations={location_count}"
    )


if __name__ == "__main__":
    asyncio.run(_main())
