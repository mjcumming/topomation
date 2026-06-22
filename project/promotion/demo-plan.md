# TopoMation Demo Plan

Goal: create a low-effort demo that makes people feel the real-house problem before they evaluate the integration.

## Minimum viable demo

Use a short screenshot carousel or 60-90 second screen recording. No polished voiceover required.

Working title:

> Occupancy automation when your house is more complicated than one motion sensor per room

## Story

1. Show the problem.
   - "My Home Assistant install has rooms, floors, outdoor areas, and devices that do not belong to one room."
   - Show the TopoMation tree.
   - Existing asset: `docs/screenshots/tree.jpg`

2. Show one awkward room.
   - Bathroom, pantry, bedroom, or open-plan kitchen/family room.
   - Show multiple occupancy sources with different timing.
   - Existing asset: `docs/screenshots/occupancy-mixed-sources.jpg`

3. Show what gets created.
   - Show a TopoMation lighting rule.
   - Existing asset: `docs/screenshots/lighting-occupancy.jpg`

4. Show that the output is normal Home Assistant.
   - Show the generated automation in **Settings -> Automations & Scenes**.
   - Show one trace or automation details screen.
   - Needed screenshot: generated HA automation/trace view from a real install.

5. End with the beta ask.
   - "I am looking for beta testers with messy occupancy setups: open-plan spaces, bathrooms without motion sensors, pantries/closets, garages, outdoor zones, or whole-floor/property automations."
   - Show GitHub repo URL and star request.

## Screenshots still worth capturing

- Generated Home Assistant automation list/details for one TopoMation rule.
- Automation trace for a rule firing successfully.
- A compact before/after pair: one awkward room setup, then the generated rule.
- Optional: a live tree row changing occupied/vacant state.

## Recording outline

Keep it under 90 seconds:

1. 0-10s: "This is TopoMation, a custom Home Assistant integration for whole-home occupancy automation."
2. 10-25s: show the tree and explain hierarchy.
3. 25-45s: show mixed sources for one real room.
4. 45-65s: show a generated lighting/fan/media rule.
5. 65-80s: show the generated HA automation/trace.
6. 80-90s: beta tester ask and repo link.

## Text-only fallback

If video feels painful, publish the same story as four images:

1. Tree
2. Occupancy sources
3. Rule editor
4. Generated HA automation/trace

That is enough for a forum update, Reddit image post, or GitHub README section.

