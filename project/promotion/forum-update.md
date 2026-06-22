# Home Assistant Community Forum Update Draft

Post this as a reply to the existing thread:

https://community.home-assistant.io/t/topomation-beta-custom-integration-for-occupancy-driven-whole-home-automation/1010101

## Draft

Quick update on TopoMation.

I tightened up the README, added a set of real-house examples, added repository topics for discovery, and added Home Assistant/HACS validation to CI. The goal is still the same: help with occupancy automation setups that have outgrown one-room-at-a-time logic.

The main idea is still the hierarchy: model the home as property, buildings, grounds, floors, areas, and subareas, then let occupancy roll up through that model.

Here is one small example flow from my own setup:

1. The TopoMation hierarchy/tree.
2. A Basement Hallway lighting rule in TopoMation: when the room becomes occupied, only if it is dark, turn on the Basement Hallway light.
3. The Ambient tab showing where the inherited lux source and dark/bright thresholds come from.
4. The generated Home Assistant automation. It is a normal HA automation with a trigger, condition, and action, so it can be opened, inspected, disabled, and traced like anything else in HA.

The kinds of setups I am especially looking for beta feedback on:

- Open-plan spaces where adjacent rooms should sometimes share occupancy.
- Bathrooms, closets, pantries, garages, sheds, or outdoor zones with odd sensor mixes.
- Whole-floor, whole-building, or whole-property automations.
- Rooms that combine motion, mmWave/presence, contact sensors, switches, media players, or camera detections.

A few concrete examples are here:

https://github.com/mjcumming/topomation/blob/main/docs/examples.md

Repo:

https://github.com/mjcumming/topomation

If you try it, please start with one boring room, one occupancy source, one light, and one vacant rule before modeling the whole house. Bug reports and behavior reports are easiest for me to track on GitHub Issues, but I will watch this thread for beta feedback and questions.

And if TopoMation looks useful, a GitHub star is genuinely appreciated. It helps other Home Assistant users discover the project.

## Attachments

Attach these images in order:

1. `project/promotion/assets/topomation-tree.png`
2. `project/promotion/assets/ha-automation-details-basement-hallway-light-rule.png`
3. `project/promotion/assets/ha-automation-details-basement-hallway-ambient.png`
4. `project/promotion/assets/ha-automation-details-basement-hallway.png`
