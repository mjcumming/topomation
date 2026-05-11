# Support

TopoMation is a one-person beta project. I am sharing it because it may help
people with similar Home Assistant occupancy problems, not because it is a
commercial or support-backed product.

It also covers a lot of Home Assistant surface area: registries, entities,
services, websocket APIs, custom panels, and managed automations. It runs well
in my own environments, but Home Assistant installations vary a lot. I cannot
realistically predict every version, device integration, entity model, browser,
or household topology before people try it.

## Before You Install

- Back up your Home Assistant configuration.
- Read the beta expectations in [README.md](README.md).
- Start with one room, one occupancy source, and one simple rule.
- Be comfortable checking Home Assistant logs, automation traces, and browser
  console output.

## Good Bug Reports

Please include enough detail to reproduce the problem without guessing:

- Home Assistant version
- TopoMation version
- install method, such as HACS custom repository or manual copy
- browser and device type for UI problems
- what you expected
- what happened instead
- the smallest room/source/rule setup that reproduces it
- relevant Home Assistant logs, automation trace details, and screenshots

If the problem only happens in a large whole-house setup, try to narrow it to
one location first. Reports that start small are much easier to fix.

## Feature Requests

Feature ideas are welcome, but they may not be accepted. TopoMation is built
around a fairly specific model: hierarchy, occupancy state, ambient state, and
managed common-case automations. Some requests are better handled as normal
Home Assistant automations using the occupancy entities TopoMation exposes.

## What TopoMation Is Not

- It is not affiliated with Home Assistant.
- It is not a replacement for the Home Assistant automation editor.
- It is not a general-purpose rules engine.
- It is not magic presence detection; your sensors still matter.
- It is not guaranteed to support every device domain.
- It does not have stable public APIs before `1.0`.
