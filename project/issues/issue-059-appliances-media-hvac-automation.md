# Issue ISSUE-059: Appliances tab + Media/HVAC automation parity (occupancy-only)

**Epic**: Automation UX (see `project/epics/` as needed)  
**Execution Status**: Done  
**Delivery Status**: Implemented  
**Created**: 2026-04-10  
**Priority**: High  

**Alpha posture**: This repo is in an **alpha build-out** phase. Do **not** preserve superseded UI paths, compatibility shims, or data migrations for pre-alpha rule storage. Replace narrow implementations outright when the contract moves. Prefer deleting dead branches over carrying “legacy” alongside new behavior.

---

## Objective

Introduce an **Appliances** automation tab (fans-first for bathroom / simple exhaust), split **HVAC** from ad-hoc fans, and bring **Media** and **HVAC** rule authoring up to the same **interaction quality** as Lighting (clear sections, card lifecycle, copy), while keeping these three tabs **occupancy-driven only**: no ambient-light triggers and no dark/bright condition rows.

---

## Requirements

### Information architecture

1. Inspector rule tabs include **Lighting**, **Media**, **HVAC**, and **Appliances** (order TBD; suggest `… Lighting | Appliances | Media | HVAC` so domestic controls sit together).
2. **Lighting** remains unchanged in contract depth (trigger families + ambient + time); not in scope except shared shell/patterns.
3. **Appliances** (v1): **Fans first** — `fan.*` targets for simple on/off (and percentage only if we already have patterns from HVAC v1). Do not scope arbitrary “appliances” beyond fans until a later issue.
4. **HVAC** (v1): Reserve for **true HVAC** — `climate.*` when a contract exists, plus any **`fan.*` that is tied to an HVAC device** (see classification below). Remove the product pretense that “all bathroom fans live under HVAC.”
5. **Media** (v1): **`media_player.*`** only, simple actions (off / stop / pause / mute / volume as already supported in code paths), **occupancy edges + optional time window only**.

### Triggers and conditions (Media, HVAC, Appliances)

1. **Occupancy only** for these three tabs:
   - Triggers: at most **`on_occupied`** and **`on_vacant`** (no `on_dark` / `on_bright`).
   - **No** ambient “must be dark / bright” rows and **no** ambient trigger family.
2. **Time window**: optional, same mental model as today (single window per rule unless product decides otherwise — default: match Lighting’s single-window story for consistency).
3. Present triggers using the **same family-style or pill-style clarity** as Lighting where it improves scanability, but **only** the occupancy family is relevant (no second family card for ambient).

### Media actions and triggers (v1 bias)

1. Default product story: **vacant-side actions are primary** (stop / pause / turn off — exact verbs per HA service availability). Reason: “play on occupied” without scene/context is easy to get wrong; defer richer occupied automation until explicitly specified.
2. If **occupied** actions remain technically trivial (e.g. single `media_play` on occupied), they may stay **optional** behind the same occupancy trigger UI — but **do not** block shipping on complex “resume context” behavior.

### Appliances vs HVAC: `fan.*` classification (v1 heuristic)

Goal: **bathroom / standalone fans → Appliances**; **fans that are part of an HVAC stack → HVAC**.

1. Use Home Assistant **entity + device registry** (no guessing from friendly names):
   - If the fan entity’s **device** (or `via_device` chain) is associated with a **`climate`** entity (same device id, or device as parent/child in the device tree — exact rule to be implemented against HA registry APIs available in-panel), treat the fan as **HVAC**.
   - Otherwise treat the fan as **Appliances**.
2. **Alpha**: If a fan is misclassified, fixing the heuristic or HA device linkage is in scope; **no** persisted “tab override” field is required for v1 unless implementation proves necessary.
3. **`switch.*`**: v1 decision — either **Appliances only** for switch-mode exhaust/bath fans, or duplicate listing forbidden with explicit contract. Default recommendation: **Appliances** for `switch.*` that are ventilation-adjacent; keep **HVAC** for `climate.*` + HVAC-linked `fan.*` only (drops generic switch from HVAC tab unless linked). Document final choice in `docs/contracts.md` when implementing.

### Non-goals (this issue)

- Importing or migrating old `modules.dusk_dawn` payloads.
- Ambient lux/sun **triggers** or **condition rows** on Media / HVAC / Appliances.
- Full thermostat preset / setback semantics for `climate.*` until a separate contract issue exists.

---

## Architecture notes

**Supersedes in spirit**: ADR-HA-060’s “no Appliances tab; HVAC is fans-first” — for alpha, **replace** that IA with this four-tab model and delete obsolete UI branches rather than maintaining aliases.

**Implementation touchpoints** (non-exhaustive):

- `custom_components/topomation/frontend/ht-location-inspector.ts`: `DeviceAutomationTab`, `_actionDomainsForTab`, `_tabForActionEntity`, `_renderDeviceAutomationTab`, panel tab strip, deep links / `topomation-panel.ts` routes.
- `docs/automation-ui-guide.md`: new Sections for **Appliances**, and expand **Media** / **HVAC** to mirror Lighting’s clarity without ambient (replace §6.5 “do not present Appliances”).
- `docs/contracts.md` **C-017**: tab list, domain ownership, fan classification, overlap rules with Lighting (`light.*` still exclusive to Lighting tab).

---

## Acceptance criteria

1. User can author **fan** rules under **Appliances** for standalone fans and under **HVAC** only when registry ties fan to HVAC (per heuristic above).
2. **Media** and **HVAC** and **Appliances** editors do not show ambient-dark/bright triggers or ambient condition rows.
3. Media v1 behavior matches agreed bias (vacant-primary; occupied optional only if implemented and tested).
4. Docs (`automation-ui-guide.md` + `contracts.md` + ADR log entry) match shipped UI with no contradictory “no Appliances tab” language.

---

## References

- `docs/automation-ui-guide.md` (current §6.5, §10 Lighting)
- `docs/contracts.md` (C-017)
- `docs/adr-log.md` (ADR-HA-060 — to be superseded by new ADR when implementation lands)
