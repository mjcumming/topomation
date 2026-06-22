# Reddit Post Draft

Post to `r/homeassistant` as an image post with the screenshots attached in order. Put the repo link in the post body or first comment.

## Title

TopoMation: model your whole home, then automate occupancy from that

## Draft

I built TopoMation because my Home Assistant occupancy automations stopped fitting the simple "one room, one motion sensor, one light" model.

TopoMation is a custom Home Assistant integration where you model the home as a hierarchy: property, buildings, grounds, floors, areas, and subareas. Each level can have its own occupancy entity, and the integration can generate normal Home Assistant automations from that model.

The cases that pushed me toward this were things like:

- bathrooms without dedicated motion sensors, where the light switch is still a useful occupancy signal
- pantries/closets that need very short hold times
- bedrooms where mmWave/presence should hold longer than motion
- kitchen/family-room layouts where two HA areas behave like one open space
- devices that belong to a floor, building, driveway, yard, or whole property instead of one room
- wanting simple entities like "anyone upstairs", "anyone outside", or "anyone on the property"

The screenshots show:

1. The TopoMation hierarchy/tree.
2. A Basement Hallway lighting rule: room becomes occupied, only if it is dark, turn on the hallway light.
3. Ambient config: inherited lux source and dark/bright thresholds.
4. Generated Home Assistant automation: normal trigger, condition, and action.

It is still beta, and I am looking for feedback from people with occupancy-heavy setups or weird real-house edge cases.

Repo:

https://github.com/mjcumming/topomation

Examples:

https://github.com/mjcumming/topomation/blob/main/docs/examples.md

If you have solved this another way, I would love to hear how you are modeling it. If this looks useful, stars are appreciated too because discovery is rough for small custom integrations.

## Attachments

Attach these images in order:

1. `project/promotion/assets/topomation-tree.png`
2. `project/promotion/assets/ha-automation-details-basement-hallway-light-rule.png`
3. `project/promotion/assets/ha-automation-details-basement-hallway-ambient.png`
4. `project/promotion/assets/ha-automation-details-basement-hallway.png`
