# Dependency Release Runbook

**Last reviewed**: 2026-02-26  
**Scope**: Updating Topomation when `home-topology` publishes a new release.

## 1) Confirm the exact upstream release

Use both PyPI and GitHub release metadata before changing pins.

```bash
# PyPI latest + upload timestamp
curl -s https://pypi.org/pypi/home-topology/json \
  | jq -r '.info.version as $v
    | "latest="+$v,
      "upload="+(.releases[$v][0].upload_time_iso_8601 // "unknown"),
      "url="+.info.package_url'

# GitHub release tag + publish timestamp
curl -s https://api.github.com/repos/mjcumming/home-topology/releases \
  | jq -r '.[0] | "tag="+.tag_name, "published="+.published_at, "url="+.html_url'
```

## 2) Pin the exact version in Topomation

Home Assistant integrations should use exact requirement pins in `manifest.json`.

Required files to update:

- `custom_components/topomation/manifest.json`
- `pyproject.toml` (keep local/dev dependency in sync)
- Any docs that mention old versions

Find stale references:

```bash
rg -n "home-topology(==|>=)|0\\.2\\.0a0|0\\.2\\.0-alpha|1\\.0\\.0" \
  custom_components/topomation/manifest.json pyproject.toml docs README.md -S
```

## 3) Validate compatibility with the published package

Run a clean import check in an isolated environment so local editable installs do not hide issues.

```bash
HT_VERSION=$(curl -s https://pypi.org/pypi/home-topology/json | jq -r '.info.version')
TMP_VENV=/tmp/topomation-pypi-check-$$
python -m venv "$TMP_VENV"
"$TMP_VENV/bin/pip" install -q --upgrade pip
"$TMP_VENV/bin/pip" install -q "home-topology==$HT_VERSION"
"$TMP_VENV/bin/python" - <<'PY'
import importlib
symbols = [
    ("home_topology", ["Event", "EventBus", "EventFilter", "LocationManager", "Location"]),
    ("home_topology.modules.ambient", ["AmbientLightModule"]),
    ("home_topology.modules.automation", ["AutomationModule"]),
    ("home_topology.modules.occupancy", ["OccupancyModule"]),
]
for module, names in symbols:
    m = importlib.import_module(module)
    missing = [n for n in names if not hasattr(m, n)]
    if missing:
        raise RuntimeError(f"{module} missing {missing}")
print("import/symbol check passed")
PY
rm -rf "$TMP_VENV"
```

## 4) Run tests with the right command for the goal

Focused smoke validation (recommended after a dependency pin update):

```bash
pytest -q --no-cov tests/test_init.py tests/test_event_bridge.py tests/test_services.py
```

Why `--no-cov`: repo defaults enforce `fail-under=70`; targeted subsets can fail coverage even when tests pass.

Full backend suite (collection + behavior):

```bash
pytest -q --no-cov
```

## 5) Publication-readiness sweep

```bash
ruff check custom_components/topomation tests
mypy custom_components/topomation
python -m build
```

Notes:

- `python -m build` is required only if publishing Topomation as a Python package.
- HACS/Home Assistant release gating is already represented in CI workflows (`hassfest` + `hacs/action`).
- Keep dev test deps aligned with current HA test stack to avoid pip resolver fallback:
  - `pytest-asyncio>=1.0`
  - `pytest-homeassistant-custom-component>=0.13.316`

## 6) Record outcomes in docs

After each dependency release update:

1. Update `docs/TOPOMATION-INTEGRATION-REVIEW.md` if compatibility assumptions changed.
2. Update installation docs/version notes if user-facing requirements changed.
3. Keep this runbook current when command flow or tooling changes.
