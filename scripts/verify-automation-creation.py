#!/usr/bin/env python3
"""
Verify that we can create automations from outside HA using the same mechanism
HA's own UI uses: the config/automation REST API.

Run against a live HA instance:
  python scripts/verify-automation-creation.py

Requires tests/ha-config.env with HA_URL and HA_TOKEN.

This script does NOT use our integration. It directly calls HA's built-in
  POST /api/config/automation/config/<id>
API - the same one HA's automation UI uses. If this fails, the issue is
environmental (HA config, permissions). If it succeeds, the mechanism works
and our integration should be able to do the same.
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


def main() -> int:
    if not HA_TOKEN:
        print("ERROR: HA_TOKEN required. Set in tests/ha-config.env or environment.")
        return 1

    automation_id = f"verify_topomation_{int(time.time())}"
    url = f"{HA_URL}/api/config/automation/config/{automation_id}"

    # Minimal valid automation - trigger on sun, harmless action
    payload = {
        "alias": "Verification: Topomation can create automations",
        "description": "Created by scripts/verify-automation-creation.py to prove automation creation works.",
        "triggers": [
            {"trigger": "state", "entity_id": "sun.sun", "to": "below_horizon"}
        ],
        "conditions": [],
        "actions": [{"delay": "00:00:01"}],
        "mode": "single",
    }

    print("Step 1: Calling HA's config API (same as HA automation UI)")
    print(f"  POST {url}")
    print()

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        method="POST",
        headers={
            "Authorization": f"Bearer {HA_TOKEN}",
            "Content-Type": "application/json",
        },
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read().decode())
            print(f"  Response: {result}")
    except urllib.error.HTTPError as e:
        body = e.read().decode() if e.fp else ""
        print(f"  FAILED: HTTP {e.code}")
        try:
            err = json.loads(body)
            print(f"  Message: {err.get('message', body)}")
        except Exception:
            print(f"  Body: {body[:500]}")
        return 1
    except Exception as e:
        print(f"  FAILED: {e}")
        return 1

    print()
    print("Step 2: Checking if automation appears in entity registry")
    ws_url = HA_URL.replace("http://", "ws://").replace("https://", "wss://")
    ws_url = f"{ws_url}/api/websocket"
    print(f"  (Would need WebSocket to list entities - checking states API instead)")

    # Use REST API to get states
    states_url = f"{HA_URL}/api/states"
    req2 = urllib.request.Request(
        states_url,
        headers={"Authorization": f"Bearer {HA_TOKEN}"},
    )
    try:
        with urllib.request.urlopen(req2, timeout=10) as resp2:
            states = json.loads(resp2.read().decode())
    except Exception as e:
        print(f"  Could not fetch states: {e}")
        print()
        print("Step 1 succeeded - automation was created. Manual check: visit")
        print(f"  {HA_URL}/config/automation/dashboard")
        print("  and look for 'Verification: Topomation can create automations'")
        return 0

    automation_entities = [s for s in states if s.get("entity_id", "").startswith("automation.")]
    matching = [s for s in automation_entities if s.get("attributes", {}).get("id") == automation_id]

    if matching:
        print(f"  SUCCESS: Found automation.{automation_id} in states")
        print(f"  State: {matching[0].get('state')}")
        print()
        print("CONCLUSION: HA's config API can create automations. The mechanism works.")
        print("If Topomation panel still fails, the issue is in our integration/backend.")
    else:
        print("  Automation not found in states (might need a few seconds to register)")
        print()
        print("Step 1 returned 200 - the API accepted the request.")
        print("Check manually: {HA_URL}/config/automation/dashboard")
        print()
        print("If the automation appears there: mechanism works.")
        print("If it does not: HA's config or reload may be failing.")

    return 0


if __name__ == "__main__":
    sys.exit(main())
