#!/usr/bin/env python3
"""
Verify create, read, and delete of one automation via the same REST API the integration uses.

Uses the same endpoints as the HA automation UI and our managed_actions.py:
  POST   /api/config/automation/config/<id>  create/update
  GET    /api/config/automation/config/<id>  read
  DELETE /api/config/automation/config/<id>  delete

Run against your production HA (where the rules UI already works):
  Set HA_URL and HA_TOKEN in tests/ha-config.env, then:
  python scripts/verify-automation-crud.py

If all three steps succeed, the integration's use of the REST API will work on that instance.
"""

from __future__ import annotations

import json
import os
import sys
import time
import urllib.request
import urllib.error

# Load ha-config.env if present
_CONFIG_ENV = os.path.join(os.path.dirname(__file__), "..", "tests", "ha-config.env")
if os.path.isfile(_CONFIG_ENV):
    with open(_CONFIG_ENV) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or line.startswith("if ") or line.startswith("else") or line.startswith("fi") or "export " in line:
                continue
            if "=" in line:
                k, v = line.split("=", 1)
                v = v.strip().strip("'\"")
                os.environ.setdefault(k, v)

# Resolve dev vs prod (ha-config.env may have HA_URL_DEV/PROD + HA_TARGET)
_target = os.environ.get("HA_TARGET", "dev")
if _target == "prod" and os.environ.get("HA_URL_PROD"):
    HA_URL = os.environ.get("HA_URL_PROD", "http://localhost:8123").rstrip("/")
    HA_TOKEN = os.environ.get("HA_TOKEN_PROD", "")
else:
    HA_URL = os.environ.get("HA_URL_DEV", os.environ.get("HA_URL", "http://localhost:8123")).rstrip("/")
    HA_TOKEN = os.environ.get("HA_TOKEN_DEV", os.environ.get("HA_TOKEN", ""))


def _request(method: str, url: str, data: dict | None = None) -> tuple[int, dict | str]:
    """Return (status_code, response_body). Body is parsed JSON or raw text."""
    headers = {
        "Authorization": f"Bearer {HA_TOKEN}",
        "Content-Type": "application/json",
    }
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode()
            return resp.status, json.loads(raw) if raw.strip() else {}
    except urllib.error.HTTPError as e:
        raw = e.read().decode() if e.fp else ""
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, raw


def main() -> int:
    if not HA_TOKEN:
        print("ERROR: HA_TOKEN required. Set HA_URL and HA_TOKEN in tests/ha-config.env")
        return 1

    automation_id = f"verify_topomation_crud_{int(time.time())}"
    url = f"{HA_URL}/api/config/automation/config/{automation_id}"

    payload = {
        "alias": "CRUD test: create then read then delete",
        "description": "verify-automation-crud.py",
        "triggers": [{"trigger": "state", "entity_id": "sun.sun", "to": "below_horizon"}],
        "conditions": [],
        "actions": [{"delay": "00:00:01"}],
        "mode": "single",
    }

    # 1. Create
    print("1. CREATE (POST)")
    print(f"   {url}")
    status, body = _request("POST", url, payload)
    if status != 200:
        print(f"   FAILED: {status} {body}")
        return 1
    print(f"   OK {status}")

    # 2. Read
    print("2. READ (GET)")
    print(f"   {url}")
    status, body = _request("GET", url)
    if status != 200:
        print(f"   FAILED: {status} {body}")
        return 1
    if not isinstance(body, dict) or body.get("alias") != payload["alias"]:
        print(f"   FAILED: unexpected body {body}")
        return 1
    print(f"   OK {status} (alias matches)")

    # 3. Delete
    print("3. DELETE (DELETE)")
    print(f"   {url}")
    status, body = _request("DELETE", url)
    if status not in (200, 204):
        print(f"   FAILED: {status} {body}")
        return 1
    print(f"   OK {status}")

    # 4. Read again (expect 404)
    print("4. READ again (expect 404)")
    status, _ = _request("GET", url)
    if status != 404:
        print(f"   Unexpected: {status} (expected 404)")
        return 1
    print("   OK 404 (automation removed)")

    print()
    print("Create, read, and delete all succeeded. REST API matches UI; integration will work.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
