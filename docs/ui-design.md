# Home Topology UI Design Specification v0.2

> This document defines the UI design for the Home Topology Location Manager. It drives UI implementation in the Home Assistant integration.

**Status**: Design Complete (Implementation Ready)  
**Last Updated**: 2025-12-02  
**Target Platform**: Home Assistant Panel (standalone view)  
**Technology**: Lit (LitElement) - See [Section 10](#10-implementation-notes) for rationale

---

## 1. Overview

### 1.1 Purpose

The Location Manager UI provides a visual interface for:
- **Modeling** the spatial topology of a home (floors, rooms, zones)
- **Configuring** behavior modules attached to locations (Occupancy, Actions)
- **Managing** entity-to-location assignments
- **Visualizing** location state (occupied, vacant, etc.)

### 1.2 UI Type

This is a **standalone panel** in Home Assistant (similar to Energy Dashboard or History), not a Lovelace card. Rationale:
- Complex hierarchical data requires dedicated screen space
- Configuration workflows need persistent UI state
- Not suitable for dashboard embedding

### 1.3 Design Principles

1. **Tree-first navigation** - Locations are the primary object; modules attach to them
2. **Progressive disclosure** - Show overview first, details on selection
3. **Direct manipulation** - Drag-and-drop for reordering, inline editing
4. **Visual hierarchy** - Icons and indentation communicate structure

---

## 2. Layout Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│  [Logo] Location Manager    [Undo] [Redo]    [Code/Preview] [Share] │  <- Header
├───────────────────────────────────┬─────────────────────────────────┤
│                                   │                                 │
│  Home Topology                    │  [Icon] Location Name           │
│  Model your space...              │  location-id                    │
│                                   │                                 │
│  [+ New Location] [Save Changes]  │  [Occupancy] [Actions]          │
│                                   │                                 │
│  ┌─ First Floor                   │  ─────────────────────────────  │
│  │  ├─ Kitchen ←(selected)        │  PRESENCE LOGIC         [ON]   │
│  │  ├─ Living Room                │                                 │
│  │  ├─ Dining Room                │  Default Timeout    [10] min    │
│  │  └─ Office                     │  Wasp-in-a-Box       [ ]        │
│  │                                │                                 │
│  ├─ Second Floor                  │  ─────────────────────────────  │
│  │  ├─ Master Suite               │  INPUT TRIGGERS                 │
│  │  │  ├─ Master Bedroom          │                                 │
│  │  │  ├─ Master Bath             │  ⊙ Kitchen Motion    [1 Rules]  │
│  │  │  └─ Master Closet           │                                 │
│  │  └─ Kids Wing                  │                                 │
│  │                                │                                 │
│  ├─ Basement                      │                                 │
│  │                                │                                 │
│  └─ Outdoor                       │                                 │
│     ├─ Back Patio                 │                                 │
│     └─ Garage                     │                                 │
│                                   │                                 │
└───────────────────────────────────┴─────────────────────────────────┘
        Tree Panel (~40%)                 Details Panel (~60%)
```

### 2.1 Panel Dimensions

| Panel | Width | Purpose |
|-------|-------|---------|
| Tree Panel | ~40% (min 300px) | Location hierarchy browser |
| Details Panel | ~60% (min 400px) | Selected location configuration |

### 2.2 Responsive Behavior

- **Desktop (>1024px)**: Side-by-side panels
- **Tablet (768-1024px)**: Collapsible tree, details takes full width
- **Mobile (<768px)**: Stack vertically, tree as drawer

---

## 3. Component Specifications

### 3.1 Tree Panel

#### 3.1.1 Header Section

```
Home Topology
Model your space and attach behavior modules.

[+ New Location]  [Save Changes]
```

| Element | Type | Behavior |
|---------|------|----------|
| Title | Static text | "Home Topology" |
| Subtitle | Static text | "Model your space and attach behavior modules." |
| + New Location | Button (outline) | Opens location creation dialog |
| Save Changes | Button (primary) | Persists all pending changes |

#### 3.1.2 Tree Node Structure

Each tree node displays:

```
[Drag] [Expand] [Icon] Location Name                    [Delete] [Status]
```

| Element | Description |
|---------|-------------|
| Drag Handle | 6-dot grip icon, visible on hover |
| Expand/Collapse | Chevron, only if has children |
| Type Icon | Indicates location type (see 3.1.3) |
| Location Name | Editable on double-click |
| Delete Button | ⊗ icon, visible on hover |
| Status Indicator | Optional spark/dot for state |

#### 3.1.3 Location Type Icons

The UI displays icons based on location type. These are **integration-layer concerns** - the core kernel has no knowledge of types or icons.

##### Base Type Icons

| Type | Icon | MDI Name | Description |
|------|------|----------|-------------|
| Floor | ≡ | `mdi:layers` | A floor/level of the building |
| Room | ◎ | `mdi:map-marker` | Generic room (fallback) |
| Zone | ◇ | `mdi:vector-square` | Sub-room area |
| Suite | ❖ | `mdi:home-group` | Room group (e.g., Master Suite) |
| Outdoor | ⌂ | `mdi:home-outline` | Exterior location |
| Building | ▣ | `mdi:warehouse` | Separate structure |

##### Room Category Icons (Semantic Enhancement)

For better UX, the integration can infer room categories from names or allow explicit assignment:

| Category | Icon | MDI Name | Example Rooms |
|----------|------|----------|---------------|
| Kitchen | 🍴 | `mdi:silverware-fork-knife` | Kitchen, Kitchenette |
| Bedroom | 🛏️ | `mdi:bed` | Master Bedroom, Guest Room, Kids Room |
| Bathroom | 🛁 | `mdi:shower` | Master Bath, Half Bath, Powder Room |
| Living | 🛋️ | `mdi:sofa` | Living Room, Family Room, Den |
| Dining | 🍽️ | `mdi:table-furniture` | Dining Room |
| Office | 💼 | `mdi:desk` | Office, Study, Home Office |
| Garage | 🚗 | `mdi:garage` | Garage, Carport |
| Patio | 🌿 | `mdi:flower` | Patio, Deck, Porch |
| Utility | ⚙️ | `mdi:washing-machine` | Laundry, Utility Room |
| Storage | 📦 | `mdi:package-variant` | Closet, Pantry, Attic |
| Gym | 🏋️ | `mdi:dumbbell` | Gym, Exercise Room |
| Theater | 🎬 | `mdi:theater` | Media Room, Theater |

##### Icon Resolution Strategy

The integration determines icons using this priority:

1. **Explicit override** - User sets icon in `_meta.icon`
2. **Category match** - Name contains category keyword
3. **Type fallback** - Use base type icon

```python
# Integration icon resolution
def get_location_icon(loc_mgr, location_id: str) -> str:
    meta = loc_mgr.get_module_config(location_id, "_meta") or {}
    
    # 1. Explicit override
    if meta.get("icon"):
        return meta["icon"]
    
    # 2. Category inference from name
    location = loc_mgr.get_location(location_id)
    category = infer_category(location.name)
    if category:
        return CATEGORY_ICONS[category]
    
    # 3. Type fallback
    loc_type = meta.get("type", "room")
    return TYPE_ICONS.get(loc_type, "mdi:map-marker")
```

> **Design Principle**: The kernel stays type-agnostic. All icon/category logic lives in the integration layer, stored via `modules["_meta"]`.

#### 3.1.4 Tree Interactions

| Action | Trigger | Result |
|--------|---------|--------|
| Select | Click node | Highlights node, loads details panel |
| Expand/Collapse | Click chevron | Shows/hides children |
| Rename | Double-click name | Inline text edit |
| Reorder | Drag handle | Moves node within parent |
| Reparent | Drag to different parent | Changes parent_id |
| Delete | Click ⊗ | Confirmation dialog, removes location |
| Add Child | Right-click → Add Child | Creates child location |

#### 3.1.5 Tree State Indicators

| Indicator | Meaning |
|-----------|---------|
| Blue highlight | Currently selected |
| Spark icon (✦) | Has pending changes |
| Dot (colored) | Occupancy state (green=occupied, gray=vacant) |
| Italic text | Location is locked |

---

### 3.2 Details Panel

The details panel shows configuration for the selected location.

#### 3.2.1 Header Section

```
[Type Icon]  Location Name
             location-id

[Occupancy]  [Actions]
```

| Element | Description |
|---------|-------------|
| Type Icon | Large icon matching tree node type |
| Location Name | Display name (editable via tree) |
| Location ID | Slug/identifier (e.g., "room-kitchen") |
| Module Tabs | Switch between Occupancy, Actions, (future: Comfort, Energy) |

#### 3.2.2 Occupancy Tab

```
PRESENCE LOGIC                                    [Toggle: ON/OFF]
─────────────────────────────────────────────────────────────────
Default Timeout             [Input: 5] min
Hold Release Timeout        [Input: 2] min

DEVICE MAPPINGS
─────────────────────────────────────────────────────────────────
⊙ Kitchen Motion              [Motion Sensor]     [Configure]
⊙ Kitchen Presence            [Presence Sensor]   [Configure]
⊙ Kitchen Door Contact        [Door Sensor]       [Configure]
                                                  [+ Add Device]
```

##### Presence Logic Section

| Field | Type | Maps To | Description |
|-------|------|---------|-------------|
| Presence Logic Toggle | Switch | `modules.occupancy.enabled` | Enable/disable occupancy tracking |
| Default Timeout | Number input | `modules.occupancy.default_timeout` | Minutes until vacant after TRIGGER event |
| Hold Release Timeout | Number input | `modules.occupancy.hold_release_timeout` | Trailing minutes after RELEASE event |

##### Occupancy Sources Section

Lists entities from this HA area that generate occupancy events.

| Element | Description |
|---------|-------------|
| Entity Icon | Entity domain icon (motion, presence, door, etc.) |
| Entity Name | Friendly name from Home Assistant |
| Mode Badge | "Any Change" or "Specific States" |
| Timeout Display | e.g., "5 min" or "∞ → 2m" |
| Configure Button | Opens entity configuration dialog |
| Add Entity Button | Opens entity picker (only shows entities from this HA area) |

##### Entity Configuration Dialog

Two trigger modes are available:

**Mode 1: Any Change (Activity Detection)**
```
TRIGGER MODE
─────────────────────────────────────────────────────────
● Any change (triggers on any state change)
○ Specific states (configure ON/OFF below)

Timeout: [5] min    ☐ Use location default
```

Best for: dimmers, volume controls, thermostats, unusual sensors.

**Mode 2: Specific States (Binary Mapping)**
```
TRIGGER MODE
─────────────────────────────────────────────────────────
○ Any change (triggers on any state change)
● Specific states (configure ON/OFF below)

ON STATE (off → on)
  Event: ● TRIGGER  ○ None
  Timeout: [5] min    ☐ Indefinite (until OFF state)
                      ☐ Use location default

OFF STATE (on → off)
  Event: ● None  ○ CLEAR
  Trailing: [2] min    ☐ Use location default
```

Best for: motion sensors, presence sensors, door sensors, media players.

**Timeout Options** (available for any sensor):
- **Number input**: Timeout in minutes (e.g., 5 min)
- **"Indefinite (until OFF state)" checkbox**: Source contributes indefinitely until OFF state triggers CLEAR
- **"Use location default" checkbox**: Uses location's `default_timeout` setting

**Examples of when "Indefinite" is useful**:
- **Presence sensors**: Sensor ON = occupied, sensor OFF = CLEAR with trailing
- **State-based door sensors**: Door open = occupied, door closed = CLEAR immediately
- **Media players**: Playing = occupied, idle = CLEAR with trailing
- **Any sensor**: When the sensor state itself indicates occupancy (not just activity)

**Note**: These options are available for all sensors. Choose the timeout behavior that matches your use case.

##### Default Mode by Entity Type

| Entity Type | Default Mode | Default Config | Notes |
|-------------|--------------|----------------|-------|
| Motion sensor | Specific states | ON→TRIGGER(5m), OFF→ignore | Re-trigger extends timer |
| Presence sensor | Specific states | ON→TRIGGER(∞), OFF→CLEAR(2m) | Indefinite until cleared |
| Door sensor | Specific states | ON→TRIGGER(2m), OFF→ignore | **See door sensor patterns below** |
| Media player | Specific states | playing→TRIGGER(∞), idle→CLEAR(5m) | Indefinite while playing |
| Dimmer/Light | Any change | TRIGGER(5m) on any change | Activity detection |
| Unknown | Any change | TRIGGER(5m) on any change | Conservative default |

**Door Sensor Configuration Options**:

The UI should allow users to choose between two door sensor patterns:

1. **Entry Door** (default): `ON→TRIGGER(2m), OFF→ignore`
   - Use for: Front door, entryway, room doors
   - Behavior: Opening indicates entry, person may still be present after door closes
   - UI: Default configuration when adding door sensor

2. **State Door** (option): `ON→TRIGGER(∞), OFF→CLEAR(0)`
   - Use for: Garage door, storage room, closet
   - Behavior: Door state directly indicates occupancy
   - UI: Checkbox "Door state indicates occupancy" → switches to this pattern
   - Alternative: Explicit configuration in entity dialog:
     ```
     ON STATE: TRIGGER with ☑ Indefinite (until OFF state)
     OFF STATE: CLEAR with Trailing: [0] min
     ```

**UI Implementation Suggestion**:

For door sensors specifically, show a pattern selector:

```
DOOR SENSOR PATTERN
─────────────────────────────────────────────────────────
○ Entry door (opening indicates entry)
  ON→TRIGGER(2m), OFF→ignore
  
● State door (door state = occupancy state)
  ON→TRIGGER(∞), OFF→CLEAR(0)
  
  ☐ Show advanced configuration
```

This makes it clear and user-friendly without exposing the underlying timeout/indefinite concepts.

> **Note**: For edge cases not covered by the UI, users can call `home_topology.trigger` directly from their own automations.

#### 3.2.3 Actions Tab

```
AUTOMATION RULES
─────────────────────────────────────────────────────────────────
[+ Add Rule]

Rule: "Turn on lights when occupied"              [Edit] [Delete]
  Trigger: Occupancy → Occupied
  Action: light.kitchen → turn_on

Rule: "Turn off lights when vacant"               [Edit] [Delete]
  Trigger: Occupancy → Vacant (after 5 min)
  Action: light.kitchen → turn_off
```

> **Note**: Actions tab design is preliminary. Full spec pending ActionsModule implementation.

---

## 4. Data Model Mapping

The UI maps directly to the home-topology data structures.

### 4.1 Location → Tree Node

```python
# From core/location.py
@dataclass
class Location:
    id: str                      # → node identifier
    name: str                    # → node display text
    parent_id: Optional[str]     # → tree hierarchy
    is_explicit_root: bool       # → root vs unassigned styling
    ha_area_id: Optional[str]    # → (future) HA area link indicator
    entity_ids: List[str]        # → triggers list in details
    modules: Dict[str, Dict]     # → module tab configurations
```

### 4.2 Module Config → Details Panel

```python
# modules.occupancy blob
{
    "enabled": True,                     # → Occupancy Settings toggle
    "default_timeout": 600,              # → Location Timeout (seconds)
    "default_trailing_timeout": 120,     # → Trailing Timeout (seconds)
    "occupancy_sources": [               # → Occupancy Sources list
        {
            "entity_id": "binary_sensor.kitchen_motion",
            "mode": "specific_states",   # or "any_change"
            "on_event": "trigger",       # trigger, none
            "on_timeout": 300,           # seconds, or null for indefinite
            "off_event": "none",         # clear, none
            "off_trailing": null,        # seconds if off_event is clear
        },
    ],
}
```

### 4.3 API Endpoints (Conceptual)

| Action | Method | Endpoint |
|--------|--------|----------|
| Get all locations | GET | `/api/home_topology/locations` |
| Create location | POST | `/api/home_topology/locations` |
| Update location | PUT | `/api/home_topology/locations/{id}` |
| Delete location | DELETE | `/api/home_topology/locations/{id}` |
| Reorder locations | PATCH | `/api/home_topology/locations/reorder` |
| Get location state | GET | `/api/home_topology/locations/{id}/state` |

---

## 5. Interaction Flows

### 5.1 Create New Location

```
1. User clicks [+ New Location]
2. Dialog appears:
   - Name: [text input]
   - Type: [dropdown: Floor/Room/Zone/Suite/Outdoor/Building]
   - Parent: [dropdown: existing locations or "Root"]
3. User fills form, clicks [Create]
4. New location appears in tree, selected
5. Details panel shows default module configs
```

### 5.2 Configure Occupancy

```
1. User selects location in tree
2. Details panel loads, Occupancy tab active
3. User toggles Presence Logic ON
4. User sets timeout to 15 minutes
5. [Save Changes] button becomes active
6. User clicks [Save Changes]
7. Changes persisted, spark indicator clears
```

### 5.3 Drag and Drop Reordering

```
1. User hovers over location, drag handle appears
2. User drags location
3. Drop zones highlight:
   - Between siblings (reorder)
   - Over parent node (reparent)
4. User drops
5. Tree updates, [Save Changes] activates
```

#### 5.3.1 Hierarchy Constraints

While the core kernel is type-agnostic (any location can parent any other), the UI enforces **sensible hierarchy rules** to prevent nonsensical topologies.

##### Location Type Hierarchy

```
Building/Outdoor (root level only)
    └── Floor
            └── Room / Suite
                    └── Zone (terminal, no children)

Suite is a special case:
    └── Suite
            └── Room (e.g., Master Suite → Master Bedroom, Master Bath)
                    └── Zone
```

##### Valid Parent → Child Relationships

| Parent Type | Can Contain |
|-------------|-------------|
| **Root** | Floor, Building, Outdoor |
| **Floor** | Room, Suite |
| **Suite** | Room only |
| **Room** | Zone only |
| **Zone** | Nothing (terminal) |
| **Building** | Floor, Room |
| **Outdoor** | Zone only |

##### Illegal Moves (UI must block these)

| Attempted Move | Allowed? | Reason |
|----------------|----------|--------|
| Floor → Room | ❌ No | Floors contain rooms, not vice versa |
| Floor → Floor | ❌ No | Floors are siblings, not nested |
| Room → Room | ❌ No | Rooms are flat within a floor (use Suite for grouping) |
| Room → Zone | ❌ No | Zones are sub-divisions, cannot contain rooms |
| Zone → anything | ❌ No | Zones are terminal nodes |
| Suite → Floor | ❌ No | Suites exist within floors |
| Room → Suite | ✅ Yes | Suites can contain rooms (Master Suite → Bedroom) |
| Zone → Room | ✅ Yes | Zones belong inside rooms |
| Outdoor → Building | ❌ No | These are both root-level |
| Anything → itself | ❌ No | Cannot be own parent |
| Parent → descendant | ❌ No | Cannot create cycles |

##### Drag Feedback for Illegal Moves

| State | Visual Feedback |
|-------|-----------------|
| Valid drop target | Green highlight, "+" cursor |
| Invalid drop target | Red highlight, "🚫" cursor, tooltip: "Cannot place {type} inside {type}" |
| Dragging over self | No highlight |
| Dragging over descendant | Red highlight, tooltip: "Cannot move into own child" |

##### Edge Cases

1. **Converting types**: If user changes a Room to a Floor, check if current parent is valid. If not, prompt to move first.
2. **Orphaned children**: If a Suite is deleted, its child Rooms become children of the Suite's parent Floor.
3. **Root demotion**: Cannot drag a Floor into another Floor. Must create hierarchy properly.

> **Note**: These constraints are UI-enforced. The core `LocationManager` accepts any valid tree structure. This allows power users to bypass via API if needed, while the UI guides normal users toward sensible hierarchies.

##### Type and Icon Storage

Location types and icons are **not stored in the kernel**. The integration layer is responsible for:

1. **Storing type/category metadata** - Use `modules["_meta"]` convention
2. **Enforcing hierarchy rules** - Validating moves before committing
3. **Resolving icons** - Using type + category + name inference

```python
# Recommended: Use _meta module for all integration metadata
loc_mgr.set_module_config(
    location_id="kitchen",
    module_id="_meta",
    config={
        "type": "room",              # Structural type (for hierarchy rules)
        "category": "kitchen",       # Semantic category (for icon selection)
        "icon": None,                # Optional explicit override
    }
)

# Read back
meta = loc_mgr.get_module_config(location_id, "_meta") or {}
location_type = meta.get("type", "room")
```

> **See also**: 
> - Section 3.1.3 above for icon resolution strategy
> - [Integration Guide](./integration-guide.md#location-types-your-responsibility) for complete implementation patterns

---

## 6. Visual Design Tokens

> Placeholder values. Will align with Home Assistant theme variables.

### 6.1 Colors

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--primary` | #1976D2 | #90CAF9 | Selected state, primary buttons |
| `--surface` | #FFFFFF | #1E1E1E | Panel backgrounds |
| `--on-surface` | #212121 | #E0E0E0 | Text |
| `--border` | #E0E0E0 | #424242 | Dividers, borders |
| `--occupied` | #4CAF50 | #81C784 | Occupied indicator |
| `--vacant` | #9E9E9E | #757575 | Vacant indicator |
| `--locked` | #FF9800 | #FFB74D | Locked indicator |

### 6.2 Typography

| Element | Size | Weight |
|---------|------|--------|
| Panel title | 20px | 600 |
| Section header | 12px | 600 (uppercase) |
| Tree node | 14px | 400 |
| Location ID | 12px | 400 (muted) |

### 6.3 Spacing

| Token | Value |
|-------|-------|
| `--spacing-xs` | 4px |
| `--spacing-sm` | 8px |
| `--spacing-md` | 16px |
| `--spacing-lg` | 24px |
| Tree indent | 24px per level |

---

## 7. State Management

### 7.1 UI State (Local)

| State | Type | Description |
|-------|------|-------------|
| `selectedLocationId` | string | Currently selected location |
| `expandedNodes` | Set<string> | Which tree nodes are expanded |
| `pendingChanges` | Map<string, Location> | Unsaved modifications |
| `activeTab` | 'occupancy' \| 'actions' | Current module tab |

### 7.2 Server State

| State | Source | Description |
|-------|--------|-------------|
| `locations` | API | Full location tree |
| `occupancyStates` | WebSocket | Real-time occupancy per location |
| `moduleConfigs` | API | Per-location module configurations |

### 7.3 Sync Strategy

- **Load**: Fetch full tree on panel open
- **Optimistic updates**: Update UI immediately, rollback on error
- **Save**: Batch pending changes on [Save Changes]
- **Real-time**: WebSocket for occupancy state updates only

---

## 8. Accessibility

### 8.1 Keyboard Navigation

| Key | Action |
|-----|--------|
| Arrow Up/Down | Move selection in tree |
| Arrow Right | Expand node / enter children |
| Arrow Left | Collapse node / go to parent |
| Enter | Activate selected (edit, open) |
| Delete | Delete selected (with confirmation) |
| Tab | Move between panels |

### 8.2 Screen Reader

- Tree uses `role="tree"` and `role="treeitem"`
- Expanded state announced via `aria-expanded`
- Selection announced via `aria-selected`
- Occupancy state included in accessible name

### 8.3 Focus Management

- Focus trapped in dialogs
- Focus returns to trigger on dialog close
- Visible focus indicator on all interactive elements

---

## 9. Future Considerations

### 9.1 Entity Inbox

Unassigned entities (discovered but not placed in topology):

```
INBOX (3 entities)
─────────────────────────────────────────────────────────────────
⊙ binary_sensor.garage_motion              [Assign to Location ▼]
⊙ sensor.outdoor_temperature               [Assign to Location ▼]
⊙ light.unknown_switch_1                   [Assign to Location ▼]
```

### 9.2 Bulk Operations

- Multi-select locations for bulk config
- Copy/paste module configs between locations
- Import/export topology as YAML

### 9.3 Visualization Modes

- **Tree view** (current): Hierarchical list
- **Floor plan view**: 2D spatial layout
- **Graph view**: Visual hierarchy with connections

---

## 10. Implementation Notes

### 10.1 Technology Stack: Lit (Decided)

**Decision**: Use **Lit** (LitElement) for all frontend components.

| Criterion | Lit | React | Why Lit Wins |
|-----------|-----|-------|--------------|
| HA Native | ✅ Yes | ❌ No | Entire HA frontend is Lit |
| Component Reuse | ✅ Use `ha-*` directly | ❌ Wrap or rewrite | Leverage existing HA components |
| Bundling | ✅ Native ES modules | ❌ Complex bundling | Simpler build, faster loads |
| Theme Integration | ✅ CSS variables work | ⚠️ Requires adaptation | Automatic dark/light mode |
| WebSocket API | ✅ `hass` object available | ⚠️ Manual wiring | Standard HA patterns |
| Developer Experience | ⚠️ Less familiar | ✅ More popular | Worth learning for HA |

**Rationale**: React prototyping (Gemini Canvas) revealed significant friction with state management, focus handling, and drag-and-drop. These are solved problems in HA's Lit ecosystem. Building natively avoids translation overhead and leverages battle-tested HA components.

### 10.2 HA Component Mapping

Map design elements to existing HA components where possible:

| Design Element | HA Component | Notes |
|----------------|--------------|-------|
| **Tree Panel** | Custom `ht-location-tree` | Build with `ha-list-item` + `ha-expansion-panel` |
| **Details Panel** | Custom `ht-location-inspector` | Use `ha-card` for sections |
| **Location Dialog** | `ha-dialog` + `ha-form` | Schema-driven form |
| **Entity Picker** | `ha-entity-picker` | Filter by area with `include-areas` |
| **Timeout Input** | `ha-selector` (number) | `{ number: { min: 1, max: 1440, unit_of_measurement: "min" } }` |
| **Toggle Switch** | `ha-switch` | Standard HA toggle |
| **Module Tabs** | `ha-tab-bar` + `ha-tab` | Or `mwc-tab-bar` |
| **Icon Display** | `ha-icon` | MDI icons via `icon` attribute |
| **Confirmation** | `ha-dialog` | Use `destructive` button style |
| **Save Button** | `ha-button` | `unelevated` variant for primary |

### 10.3 Custom Components to Build

These components don't exist in HA and must be created:

#### `ht-location-tree` (Tree Panel)

```typescript
@customElement('ht-location-tree')
export class HtLocationTree extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @property({ attribute: false }) locations!: Location[];
  @property() selectedId?: string;
  @property({ attribute: false }) expandedIds: Set<string> = new Set();
  
  // Events
  // - location-selected: { locationId: string }
  // - location-moved: { locationId: string, newParentId: string | null, newIndex: number }
  // - location-renamed: { locationId: string, newName: string }
  // - location-deleted: { locationId: string }
}
```

**Implementation approach**:
1. Render flat list with visual indentation (not nested DOM)
2. Use CSS `padding-left` for depth (simpler than nested components)
3. Drag-and-drop via SortableJS library (proven, accessible)
4. Inline rename with `contenteditable` span + blur/enter handlers

#### `ht-location-inspector` (Details Panel)

```typescript
@customElement('ht-location-inspector')
export class HtLocationInspector extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @property({ attribute: false }) location?: Location;
  @property() activeTab: 'occupancy' | 'actions' = 'occupancy';
  
  // Events
  // - config-changed: { locationId: string, module: string, config: object }
}
```

**Implementation approach**:
1. Header section with icon + name + ID
2. Tab bar for modules (Occupancy, Actions)
3. Each tab renders module-specific form
4. Use `ha-form` with JSON schema where possible

#### `ht-entity-config-dialog` (Entity Configuration)

```typescript
@customElement('ht-entity-config-dialog')
export class HtEntityConfigDialog extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @property({ attribute: false }) entity?: EntityConfig;
  @property({ type: Boolean }) open = false;
  
  // Events
  // - config-saved: { entityId: string, config: OccupancySourceConfig }
  // - dialog-closed
}
```

**Implementation approach**:
1. Wrap in `ha-dialog` for consistent modal behavior
2. Two-column layout for ON/OFF state (desktop), stack on mobile
3. Radio buttons for event type selection
4. Conditional timeout inputs based on selection

### 10.4 File Structure

```
home-topology-ha/
├── custom_components/
│   └── home_topology/
│       ├── __init__.py              # Integration setup
│       ├── config_flow.py           # Setup wizard
│       ├── const.py                 # Constants
│       ├── panel.py                 # Panel registration
│       ├── websocket_api.py         # WS commands
│       └── frontend/
│           ├── home-topology-panel.ts       # Main panel entry
│           ├── ht-location-tree.ts          # Tree component
│           ├── ht-location-inspector.ts     # Inspector component
│           ├── ht-entity-config-dialog.ts   # Config modal
│           ├── ht-location-dialog.ts        # Create/edit location modal
│           ├── types.ts                     # TypeScript interfaces
│           ├── styles.ts                    # Shared styles
│           └── localize.ts                  # Translations
├── hacs.json                        # HACS metadata
└── README.md
```

### 10.5 HA Integration Points

| Integration | Method | Details |
|-------------|--------|---------|
| Panel registration | `async_register_panel()` | Register as sidebar panel |
| State subscription | `hass.connection.subscribeEvents()` | Real-time occupancy updates |
| API calls | `hass.callWS()` | CRUD operations on locations |
| Entity data | `hass.states` | Entity states and attributes |
| Area data | `hass.areas` | HA areas for entity filtering |
| Themes | CSS variables | Automatic via `ha-style` |

#### WebSocket API Commands

```typescript
// Get all locations
hass.callWS({ type: 'home_topology/locations/list' })
  → { locations: Location[] }

// Create location
hass.callWS({ 
  type: 'home_topology/locations/create',
  name: 'Kitchen',
  parent_id: 'floor-1',
  meta: { type: 'room', category: 'kitchen' }
})
  → { location: Location }

// Update location
hass.callWS({
  type: 'home_topology/locations/update',
  location_id: 'kitchen',
  changes: { name: 'New Kitchen', parent_id: 'floor-2' }
})
  → { location: Location }

// Update module config
hass.callWS({
  type: 'home_topology/locations/set_module_config',
  location_id: 'kitchen',
  module_id: 'occupancy',
  config: { enabled: true, default_timeout: 600 }
})
  → { success: true }

// Delete location
hass.callWS({
  type: 'home_topology/locations/delete',
  location_id: 'kitchen'
})
  → { success: true }

// Reorder locations
hass.callWS({
  type: 'home_topology/locations/reorder',
  location_id: 'kitchen',
  new_parent_id: 'floor-1',
  new_index: 2
})
  → { success: true }
```

### 10.6 Reference Implementations

Study these HA frontend patterns before building:

| HA Component | Path in `home-assistant/frontend` | What to Learn |
|--------------|-----------------------------------|---------------|
| Area Registry | `src/panels/config/areas/` | Similar tree/list + editor pattern |
| Automation Editor | `src/panels/config/automation/` | Complex form editing |
| Entity Picker | `src/components/entity/ha-entity-picker.ts` | Filtered entity selection |
| Dialog Pattern | `src/dialogs/` | Modal lifecycle, focus management |
| Form Rendering | `src/components/ha-form/` | Schema → UI rendering |
| Sortable Lists | `src/panels/lovelace/editor/` | Drag-and-drop patterns |

### 10.7 Development Workflow

1. **Setup**: Clone HA frontend repo, study referenced components
2. **Scaffold**: Create integration structure with empty panel
3. **Static UI**: Build components with mock data, no backend
4. **Wire Backend**: Connect to WebSocket API
5. **Polish**: Drag-and-drop, inline editing, animations
6. **Test**: Manual testing in HA, accessibility audit
7. **Release**: HACS submission, documentation

#### Development Environment

```bash
# Option A: HA development container
# https://developers.home-assistant.io/docs/development_environment

# Option B: Local HA with symlinked custom_components
ln -s /path/to/home-topology-ha/custom_components/home_topology \
      /path/to/ha-config/custom_components/home_topology
```

### 10.8 Drag-and-Drop Strategy

Drag-and-drop is the most complex interaction. Use a phased approach:

**Phase 1 (MVP)**: No drag-and-drop
- Use "Move to..." dropdown in context menu
- Simpler to implement, fully functional
- Ship early, gather feedback

**Phase 2**: Add SortableJS
```typescript
import Sortable from 'sortablejs';

firstUpdated() {
  const el = this.shadowRoot!.querySelector('.location-list');
  Sortable.create(el, {
    handle: '.drag-handle',
    animation: 150,
    ghostClass: 'sortable-ghost',
    onEnd: (evt) => this._handleDragEnd(evt),
  });
}
```

**Hierarchy constraints**: Validate moves before committing (see Section 5.3.1). Show visual feedback for invalid drops.

### 10.9 Accessibility Checklist

| Requirement | Implementation |
|-------------|----------------|
| Keyboard tree navigation | Arrow keys, Enter, Tab |
| Screen reader | `role="tree"`, `role="treeitem"`, `aria-expanded` |
| Focus visible | Use HA's focus styles (automatic) |
| Color contrast | Use HA theme tokens (automatic) |
| Reduced motion | Respect `prefers-reduced-motion` |
| Dialog focus trap | `ha-dialog` handles this |

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2025-11-25 | Initial draft from Gemini Canvas mockup |
| 0.2 | 2025-12-02 | **Technology decision: Lit**. Added component mapping, file structure, WebSocket API, reference implementations, development workflow. Removed TBD status from Section 10. |

---

**Status**: Design Complete (Implementation Ready)  
**Owner**: Mike  
**Next Step**: Create `home-topology-ha` repository and scaffold integration

