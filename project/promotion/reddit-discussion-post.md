# Reddit Discussion Draft

Post to `r/homeassistant` as a discussion, not as a pure launch announcement.

## Title options

- How are you handling occupancy when rooms do not map cleanly to HA areas?
- Occupancy automations for open-plan rooms, bathrooms, pantries, and whole floors?
- People with messy occupancy setups: how are you modeling your house?

## Draft

I am curious how other people are handling occupancy once the setup gets past the simple "motion sensor turns on one room light" stage.

The cases that pushed my own setup into awkward territory were things like:

- bathrooms without dedicated motion sensors, where the light switch is still a useful occupancy signal
- pantries/closets that need very short hold times
- bedrooms where mmWave/presence should hold longer than motion
- kitchen/family-room layouts where two HA areas behave like one open space
- devices that belong to a floor, building, driveway, yard, or whole property instead of one room
- wanting simple entities like "anyone upstairs", "anyone outside", or "anyone on the property"

I ended up building a custom integration called TopoMation around that model. You arrange the home as a hierarchy, assign occupancy sources at each location, and it can generate normal Home Assistant automations for common lighting/fan/media/HVAC fan/vacuum cases. The generated automations are still visible and traceable in HA.

It is still beta, and I am mainly looking for feedback from people with occupancy-heavy setups or weird real-house edge cases.

Repo:

https://github.com/mjcumming/topomation

Examples:

https://github.com/mjcumming/topomation/blob/main/docs/examples.md

If you have solved this another way, I would love to hear how you are modeling it. If this looks useful, stars are appreciated too because discovery is rough for small custom integrations.

