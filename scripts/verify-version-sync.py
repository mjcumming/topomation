#!/usr/bin/env python3
"""Verify manifest.json, const.py, and pyproject.toml versions match. Exit 1 if not."""
from pathlib import Path
import json
import re
import sys

def main() -> None:
    manifest_path = Path("custom_components/topomation/manifest.json")
    const_path = Path("custom_components/topomation/const.py")
    pyproject_path = Path("pyproject.toml")

    manifest = json.loads(manifest_path.read_text())
    manifest_version = manifest["version"]

    const_text = const_path.read_text()
    const_match = re.search(r'^VERSION\s*=\s*"([^"]+)"', const_text, flags=re.MULTILINE)
    if not const_match:
        print("Could not find VERSION in const.py", file=sys.stderr)
        sys.exit(1)
    const_version = const_match.group(1)

    pyproject_text = pyproject_path.read_text()
    project_match = re.search(r'^\s*version\s*=\s*["\']([^"\']+)["\']', pyproject_text, flags=re.MULTILINE)
    if not project_match:
        print("Could not find version in pyproject.toml", file=sys.stderr)
        sys.exit(1)
    project_version = project_match.group(1)

    versions = {
        "manifest.json": manifest_version,
        "const.py": const_version,
        "pyproject.toml": project_version,
    }

    if len(set(versions.values())) != 1:
        for name, value in versions.items():
            print(f"{name}: {value}")
        sys.exit(1)

    print(f"Version sync ok: {manifest_version}")

if __name__ == "__main__":
    main()
