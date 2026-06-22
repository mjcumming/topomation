# Home Assistant Community Forum Update Draft

Post this as a reply to the existing thread:

https://community.home-assistant.io/t/topomation-beta-custom-integration-for-occupancy-driven-whole-home-automation/1010101

## Draft

Quick update on TopoMation.

I tightened up the README, added a set of real-house examples, and added Home Assistant/HACS validation to CI. The goal is still the same: help with occupancy automation setups that have outgrown one-room-at-a-time logic.

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

