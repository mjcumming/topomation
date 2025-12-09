# Bidirectional Sync Design: Home Assistant ↔ Home Topology

**Date**: 2025-12-09
**Status**: 🚧 Design Phase
**Implementation**: Pending

---

## Overview

This document describes the bidirectional synchronization system between Home Assistant's area/floor system and the home-topology location hierarchy.

### Goals

1. **Import**: HA areas/floors → Topology locations
2. **Export**: Topology changes → HA area/floor updates
3. **Sync**: Keep names and relationships in sync
4. **Coexistence**: Allow topology-only locations (zones, virtual spaces)
5. **Performance**: Efficient, non-blocking updates

---

## Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     Home Assistant                          │
│                                                              │
│  ┌──────────────┐          ┌──────────────┐               │
│  │  Floor       │          │  Area        │               │
│  │  Registry    │──────────│  Registry    │               │
│  └──────┬───────┘          └──────┬───────┘               │
│         │                         │                         │
│         │ Events                  │ Events                 │
│         │                         │                         │
└─────────┼─────────────────────────┼─────────────────────────┘
          │                         │
          ▼                         ▼
    ┌─────────────────────────────────────┐
    │      Sync Manager                   │
    │  (Custom Component)                 │
    │                                      │
    │  ┌─────────────────────────────┐   │
    │  │  • Import on startup        │   │
    │  │  • Listen for HA events     │   │
    │  │  • Listen for topology      │   │
    │  │  • Bidirectional updates    │   │
    │  │  • Conflict resolution      │   │
    │  └─────────────────────────────┘   │
    └──────────────┬──────────────────────┘
                   │
                   ▼
    ┌─────────────────────────────────────┐
    │      Home Topology Kernel           │
    │                                      │
    │  ┌──────────────┐                   │
    │  │  Location    │                   │
    │  │  Manager     │                   │
    │  └──────────────┘                   │
    │                                      │
    │  Metadata:                           │
    │  • ha_area_id                        │
    │  • ha_floor_id                       │
    │  • sync_source                       │
    └─────────────────────────────────────┘
```

---

## Data Model

### Location Metadata

Each topology location stores HA relationship data:

```python
location = {
    "id": "area_abc123",           # Topology location ID
    "name": "Kitchen",              # Current name
    "parent_id": "floor_xyz456",    # Parent location
    "modules": {
        "_meta": {
            "type": "room",                    # Location type
            "ha_area_id": "abc123",            # HA area ID (if from HA)
            "ha_floor_id": None,               # HA floor ID (if from HA)
            "sync_source": "homeassistant",    # Where it came from
            "sync_enabled": True,              # Enable bidirectional sync
            "last_synced": "2025-12-09T...",  # Last sync timestamp
        }
    }
}
```

### Sync Sources

- **`homeassistant`**: Location created from HA area/floor
- **`topology`**: Location created in topology (no HA counterpart)
- **`manual`**: User created, sync disabled

---

## Import Strategy (HA → Topology)

### On Integration Setup

1. **Get all HA floors** (if HA version supports it)

   ```python
   floors = area_registry.async_list_floors()
   for floor in floors:
       create_floor_location(floor)
   ```

2. **Get all HA areas**

   ```python
   areas = area_registry.areas.values()
   for area in areas:
       create_area_location(area)
   ```

3. **Build hierarchy**

   - Floor locations → children of root "house"
   - Areas with floor_id → children of that floor location
   - Areas without floor_id → children of root "house"

4. **Map entities**
   ```python
   entities = entity_registry.entities.values()
   for entity in entities:
       if entity.area_id:
           loc_mgr.add_entity_to_location(
               entity.entity_id,
               f"area_{entity.area_id}"
           )
   ```

### Location ID Mapping

| HA Object | Topology Location ID | Example              |
| --------- | -------------------- | -------------------- |
| Floor     | `floor_{floor_id}`   | `floor_ground_floor` |
| Area      | `area_{area_id}`     | `area_kitchen`       |
| Root      | `house`              | `house`              |

---

## Live Sync (HA → Topology)

### Listen for HA Events

```python
@callback
def on_area_updated(event):
    """Handle area registry updates."""
    action = event.data["action"]  # "create", "update", "remove"
    area_id = event.data["area_id"]

    if action == "create":
        sync_manager.import_area(area_id)
    elif action == "update":
        sync_manager.update_location_from_area(area_id)
    elif action == "remove":
        sync_manager.remove_location_for_area(area_id)

hass.bus.async_listen(
    ar.EVENT_AREA_REGISTRY_UPDATED,
    on_area_updated
)
```

### Update Scenarios

#### 1. Area Renamed in HA

```python
def update_location_from_area(self, area_id: str):
    """Update topology location from HA area."""
    area = self.area_registry.async_get_area(area_id)
    location_id = f"area_{area_id}"
    location = self.loc_mgr.get_location(location_id)

    if location and location.name != area.name:
        # Update location name
        self.loc_mgr.update_location(location_id, name=area.name)

        # Update metadata
        self.loc_mgr.set_module_config(
            location_id,
            "_meta",
            {
                **location.modules["_meta"],
                "last_synced": datetime.now().isoformat(),
            }
        )
```

#### 2. Area Moved to Different Floor

```python
def update_location_parent(self, area_id: str):
    """Update location parent when area floor changes."""
    area = self.area_registry.async_get_area(area_id)
    location_id = f"area_{area_id}"

    new_parent = (
        f"floor_{area.floor_id}" if area.floor_id
        else "house"
    )

    self.loc_mgr.update_location(location_id, parent_id=new_parent)
```

#### 3. Entity Area Assignment Changed

```python
@callback
def on_entity_updated(event):
    """Handle entity registry updates."""
    entity_id = event.data["entity_id"]
    old_area = event.data.get("old_area_id")
    new_area = event.data.get("area_id")

    if old_area:
        # Remove from old location
        loc_mgr.remove_entity_from_location(
            entity_id,
            f"area_{old_area}"
        )

    if new_area:
        # Add to new location
        loc_mgr.add_entity_to_location(
            entity_id,
            f"area_{new_area}"
        )

hass.bus.async_listen(
    er.EVENT_ENTITY_REGISTRY_UPDATED,
    on_entity_updated
)
```

---

## Export Strategy (Topology → HA)

### Listen for Topology Changes

```python
class SyncManager:
    def __init__(self, hass, loc_mgr, event_bus):
        # Subscribe to topology events
        event_bus.subscribe(
            self.on_location_renamed,
            EventFilter(event_type="location.renamed")
        )

        event_bus.subscribe(
            self.on_location_deleted,
            EventFilter(event_type="location.deleted")
        )
```

### Update Scenarios

#### 1. Location Renamed in Topology

```python
@callback
def on_location_renamed(self, event: Event):
    """Handle location rename event."""
    location_id = event.location_id
    old_name = event.payload["old_name"]
    new_name = event.payload["new_name"]

    location = self.loc_mgr.get_location(location_id)
    meta = location.modules.get("_meta", {})

    # Only sync if this came from HA
    if meta.get("sync_source") != "homeassistant":
        return

    # Only sync if bidirectional sync enabled
    if not meta.get("sync_enabled", True):
        return

    # Update HA area
    if ha_area_id := meta.get("ha_area_id"):
        # Prevent circular updates
        if self._is_update_from_ha(location_id):
            return

        self._mark_update_from_topology(location_id)
        self.area_registry.async_update(ha_area_id, name=new_name)
        self._clear_update_mark(location_id)
```

#### 2. Location Deleted in Topology

```python
@callback
def on_location_deleted(self, event: Event):
    """Handle location deletion."""
    location_id = event.location_id
    meta = event.payload.get("metadata", {})

    if not meta.get("sync_enabled", True):
        return

    # Delete corresponding HA area (optional, configurable)
    if ha_area_id := meta.get("ha_area_id"):
        if self.config.get("delete_ha_areas_on_location_delete", False):
            self.area_registry.async_delete(ha_area_id)
```

---

## Conflict Resolution

### Circular Update Prevention

```python
class SyncManager:
    def __init__(self):
        self._update_locks = {}  # location_id -> timestamp
        self._lock_timeout = 1.0  # 1 second

    def _is_update_from_ha(self, location_id: str) -> bool:
        """Check if recent update came from HA."""
        lock_time = self._update_locks.get(f"ha_{location_id}")
        if lock_time and (time.time() - lock_time < self._lock_timeout):
            return True
        return False

    def _mark_update_from_topology(self, location_id: str):
        """Mark that update is from topology to prevent loop."""
        self._update_locks[f"topo_{location_id}"] = time.time()

    def _clear_update_mark(self, location_id: str):
        """Clear update mark after sync complete."""
        self._update_locks.pop(f"topo_{location_id}", None)
```

### Concurrent Updates

**Strategy**: Last-write-wins with timestamp tracking

```python
def resolve_conflict(self, location_id: str, ha_name: str, topo_name: str):
    """Resolve naming conflict."""
    location = self.loc_mgr.get_location(location_id)
    meta = location.modules["_meta"]

    ha_area = self.area_registry.async_get_area(meta["ha_area_id"])

    # Compare timestamps (if available)
    topo_updated = meta.get("last_updated")
    ha_updated = ha_area.modified_at

    if topo_updated and ha_updated:
        if topo_updated > ha_updated:
            # Topology is newer, update HA
            self.area_registry.async_update(meta["ha_area_id"], name=topo_name)
        else:
            # HA is newer, update topology
            self.loc_mgr.update_location(location_id, name=ha_name)
    else:
        # Fallback: Use HA as source of truth
        self.loc_mgr.update_location(location_id, name=ha_name)
```

---

## Topology-Only Locations

### Creation

Locations created directly in topology (not from HA):

```python
# User creates zone via UI
loc_mgr.create_location(
    id="zone_kitchen_island",
    name="Kitchen Island",
    parent_id="area_kitchen",
)

# Mark as topology-only
loc_mgr.set_module_config(
    "zone_kitchen_island",
    "_meta",
    {
        "type": "zone",
        "sync_source": "topology",
        "sync_enabled": False,  # Don't sync to HA
    }
)
```

### Behavior

- **Don't create HA areas**: Topology zones/virtual spaces stay in topology
- **Don't sync renames**: No bidirectional sync
- **Allow entities**: Can still assign entities to topology-only locations
- **Export option**: Optional feature to export as HA areas (future)

---

## Configuration Options

### Per-Integration Config

```yaml
# configuration.yaml (future)
home_topology:
  sync:
    enabled: true
    import_on_startup: true
    bidirectional: true
    delete_ha_areas: false # Don't delete HA areas when location deleted
    conflict_resolution: "ha_wins" # or "topology_wins", "last_write_wins"
```

### Per-Location Config

```python
# Via WebSocket API or UI
{
    "location_id": "area_kitchen",
    "module_id": "_meta",
    "config": {
        "sync_enabled": true,  # Enable/disable sync for this location
        "sync_direction": "bidirectional",  # or "import_only", "export_only"
    }
}
```

---

## Implementation Phases

### Phase 1: Import Only (MVP) ✅

- ✅ Import HA areas/floors on startup
- ✅ Track ha_area_id in location metadata
- ✅ Build hierarchy (floors → areas)
- ✅ Entity-to-location mapping

### Phase 2: Live Import Sync 🚧

- ⚠️ Listen for HA area registry events
- ⚠️ Update locations on HA changes
- ⚠️ Handle entity reassignments
- ⚠️ Circular update prevention

### Phase 3: Bidirectional Sync (Full) 📋

- ⏳ Topology → HA area updates
- ⏳ Location renames propagate to HA
- ⏳ Conflict resolution
- ⏳ Topology-only location support

### Phase 4: Advanced Features 🔮

- Floor-level sync
- Bulk operations
- Sync history/audit log
- Manual sync triggers
- Import/export tools

---

## Testing Strategy

See **`tests/test-bidirectional-sync.py`** for comprehensive test cases:

1. **Import Tests**: HA → Topology
2. **Live Sync Tests**: HA changes → Topology updates
3. **Export Tests**: Topology → HA propagation
4. **Relationship Tests**: ID tracking and lookups
5. **Entity Tests**: Entity assignment sync
6. **Edge Cases**: Conflicts, errors, special characters
7. **Performance Tests**: Large datasets

### Manual Testing

Use the helper function to create test data:

```python
# In HA Developer Tools → Template
{{ await create_test_house_structure(hass) }}
```

---

## API Reference

### Sync Manager

```python
class SyncManager:
    """Manages bidirectional sync between HA and topology."""

    async def import_all_areas(self) -> None:
        """Import all HA areas as locations."""

    async def import_area(self, area_id: str) -> Location:
        """Import single HA area."""

    async def update_location_from_area(self, area_id: str) -> None:
        """Update location when HA area changes."""

    async def update_area_from_location(self, location_id: str) -> None:
        """Update HA area when location changes."""

    def get_location_for_area(self, area_id: str) -> Location | None:
        """Get topology location for HA area."""

    def get_area_for_location(self, location_id: str) -> Area | None:
        """Get HA area for topology location."""
```

---

## Performance Considerations

### Batch Operations

```python
async def import_all_areas(self):
    """Import all areas efficiently."""
    areas = self.area_registry.areas.values()

    # Create all locations in single batch
    locations_to_create = [
        {
            "id": f"area_{area.id}",
            "name": area.name,
            "parent_id": f"floor_{area.floor_id}" if area.floor_id else "house",
        }
        for area in areas
    ]

    # Batch create (if supported by kernel)
    self.loc_mgr.create_locations_batch(locations_to_create)
```

### Debouncing

```python
class SyncManager:
    def __init__(self):
        self._pending_updates = {}
        self._debounce_delay = 0.5  # 500ms

    async def debounced_update(self, location_id: str):
        """Debounce rapid updates."""
        # Cancel pending update
        if location_id in self._pending_updates:
            self._pending_updates[location_id].cancel()

        # Schedule new update
        self._pending_updates[location_id] = asyncio.create_task(
            self._delayed_update(location_id)
        )

    async def _delayed_update(self, location_id: str):
        """Execute update after delay."""
        await asyncio.sleep(self._debounce_delay)
        await self._do_update(location_id)
        self._pending_updates.pop(location_id, None)
```

---

## Known Limitations

1. **HA Floor Support**: Requires HA 2023.9+ for floor registry
2. **Circular Updates**: 1-second window for circular detection
3. **Concurrent Edits**: Last-write-wins (no merge support)
4. **Delete Cascades**: Deleting floor doesn't auto-delete children
5. **Offline Sync**: No queue for when HA restarts

---

## Future Enhancements

- **Sync Queue**: Persistent queue for offline changes
- **Conflict UI**: Visual conflict resolution in frontend
- **Sync History**: Track all sync operations
- **Selective Sync**: Choose which locations to sync
- **Export to HA**: Convert topology locations → HA areas
- **Multi-home**: Sync multiple HA instances

---

**Document Status**: 📋 Design
**Next Step**: Implement SyncManager class
**Priority**: High (blocking bidirectional features)
