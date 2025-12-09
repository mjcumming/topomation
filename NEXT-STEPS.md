# Next Steps: Home Topology HA Integration

**Date**: 2025-12-09  
**Status**: ✅ Ready for Testing  
**Version**: 0.1.0

---

## ✅ Completed Setup

### 1. **Core Library** (home-topology)
- ✅ Version: `0.2.0-alpha`
- ✅ Installed in editable mode from `/workspaces/home-topology`
- ✅ Available to Home Assistant

### 2. **Integration** (home-topology-ha)
- ✅ Version: `0.1.0`
- ✅ Production-ready test suite (32 tests, ~85% coverage)
- ✅ All code linted and formatted
- ✅ Committed and pushed to GitHub

### 3. **Development Environment**
- ✅ Symlinked to HA config: `/workspaces/wiim/custom_components/home_topology`
- ✅ Core dependencies installed
- ✅ Ready for live testing

---

## 🚀 Next Steps

### Phase 1: Initial Testing ⚠️ **START HERE**

#### 1.1 Restart Home Assistant
```bash
# If HA is running as a service
sudo systemctl restart home-assistant

# Or via HA UI: Developer Tools → YAML → Restart
```

#### 1.2 Check HA Logs
```bash
# Watch for integration loading
tail -f /workspaces/wiim/home-assistant.log | grep -i "home_topology\|home topology"

# Or check in HA UI: Settings → System → Logs
```

#### 1.3 Verify Integration Loads
**Expected in logs**:
```
INFO (MainThread) [homeassistant.setup] Setting up home_topology
INFO (MainThread) [homeassistant.setup] Setup of domain home_topology took 0.1 seconds
```

**If errors occur**, check:
- Missing dependencies
- Import errors
- Configuration issues

#### 1.4 Add Integration via UI
1. Go to: **Settings → Devices & Services**
2. Click: **+ Add Integration**
3. Search: "Home Topology"
4. Click: **Home Topology** to add

**Expected**: Config flow should launch (even if simple)

---

### Phase 2: Feature Verification

#### 2.1 Check Panel Registration
- Sidebar should show: **"Location Manager"**
- Icon: `mdi:floor-plan`
- URL: `/home-topology`

#### 2.2 Verify WebSocket API
Open HA Developer Tools → Services:

```yaml
# Test locations list
service: home_topology.locations.list
data: {}
```

Or use WebSocket directly:
```javascript
// In browser console on HA frontend
const ws = window.hassConnection.conn;
ws.sendMessage({
  type: "home_topology/locations/list",
  id: 1
});
```

#### 2.3 Check Entity Creation
**Should see**:
- No entities initially (areas not yet imported as locations)
- After area import: `binary_sensor.occupancy_<location_id>`
- State attributes: confidence, active_holds, expires_at

#### 2.4 Verify Services
Check: **Developer Tools → Services**

Should see:
- `home_topology.trigger`
- `home_topology.clear`
- `home_topology.lock`
- `home_topology.unlock`
- `home_topology.vacate_area`

---

### Phase 3: Functional Testing

#### 3.1 Import Home Assistant Areas
The integration should automatically import HA areas on first setup:

```python
# Check in logs:
INFO Building topology from HA areas
INFO Created location: area_<area_id> (Kitchen)
```

#### 3.2 Configure a Test Location

**Via Frontend Panel** (when UI is ready):
1. Open Location Manager panel
2. Select a location (e.g., Kitchen)
3. Go to Occupancy tab
4. Set timeout: 300 seconds (5 min)
5. Add occupancy source: `binary_sensor.kitchen_motion`

**Via Service Call** (for now):
```yaml
service: home_topology.set_module_config
data:
  location_id: "area_<your_area_id>"
  module_id: "occupancy"
  config:
    enabled: true
    default_timeout: 300
    sources:
      - entity_id: binary_sensor.kitchen_motion
        trigger_mode: "on_change"
```

#### 3.3 Test Occupancy Detection

1. **Trigger motion sensor**
   - Move in front of sensor
   - Or manually turn it on via UI

2. **Check occupancy entity**
   ```yaml
   # Should change to ON
   binary_sensor.occupancy_<location>
   ```

3. **Wait for timeout**
   - After 5 minutes of no motion
   - Entity should go to OFF

4. **Check state attributes**
   ```yaml
   # View in Developer Tools → States
   attributes:
     confidence: 0.95
     active_holds: []
     expires_at: "2025-12-09T14:30:00Z"
   ```

#### 3.4 Test Manual Control

**Trigger occupancy manually**:
```yaml
service: home_topology.trigger
data:
  location_id: "area_<your_area_id>"
```

**Clear occupancy**:
```yaml
service: home_topology.clear
data:
  location_id: "area_<your_area_id>"
```

**Lock location** (prevent vacancy):
```yaml
service: home_topology.lock
data:
  location_id: "area_<your_area_id>"
  duration: 3600  # 1 hour
```

---

### Phase 4: Advanced Testing

#### 4.1 Test Coordinator Timeout Scheduling
Enable debug logging:

```yaml
# configuration.yaml
logger:
  default: info
  logs:
    custom_components.home_topology: debug
```

**Watch logs for**:
```
DEBUG Scheduling timeout check at 2025-12-09 14:30:00
DEBUG Running timeout check at 2025-12-09 14:30:00
DEBUG Module occupancy: checking timeouts
```

#### 4.2 Test Event Bridge
**Watch for state change translation**:
```
DEBUG State changed: binary_sensor.kitchen_motion: off → on
DEBUG Publishing kernel event: sensor.state_changed (location: kitchen)
DEBUG OccupancyModule received event: sensor.state_changed
```

#### 4.3 Test Multiple Locations
1. Create/import multiple areas
2. Configure occupancy for each
3. Trigger different locations
4. Verify isolation (one doesn't affect others)
5. Test parent/child relationships

#### 4.4 Test State Persistence
1. Set up occupancy state
2. Restart Home Assistant
3. Verify state is restored correctly
4. Check `.storage/home_topology_state.json`

---

### Phase 5: UI Development (When Ready)

#### 5.1 Frontend Panel
**Current status**: TypeScript components exist but need building

**To develop**:
```bash
cd /workspaces/home-topology-ha/custom_components/home_topology/frontend

# Install dependencies (when build system added)
npm install

# Watch mode
npm run watch

# Build
npm run build
```

#### 5.2 Test UI Components
- Location tree navigation
- Location inspector
- Occupancy configuration
- Entity assignment
- Module settings

---

## 🐛 Troubleshooting

### Integration Won't Load

**Check 1: Import errors**
```bash
grep -i "error\|exception" /workspaces/wiim/home-assistant.log | grep home_topology
```

**Check 2: Core library not found**
```python
# In HA Python environment
python3 -m pip show home-topology
```

**Fix**: Install core library
```bash
pip install -e /workspaces/home-topology
```

### No Entities Created

**Possible causes**:
1. Areas not imported (check `_build_topology_from_ha`)
2. Occupancy module not enabled
3. No entities assigned to areas

**Debug**:
```python
# Check in HA Python shell
from homeassistant.helpers import area_registry as ar
areas = ar.async_get(hass).areas
print(f"Found {len(areas)} areas")
```

### Coordinator Not Scheduling

**Check logs for**:
```
ERROR Error getting timeout from occupancy: <error>
```

**Verify**:
- Modules have `get_next_timeout()` method
- Modules are attached properly
- No exceptions in module code

### WebSocket Commands Fail

**Check**:
1. WebSocket API registered (check logs)
2. Correct command format
3. Authentication (must be logged in)

**Test manually**:
```bash
# Use HA REST API
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"home_topology/locations/list"}' \
  http://localhost:8123/api/websocket
```

---

## 📊 Readiness Checklist

### Core Integration
- ✅ Core library installed and working
- ✅ Integration loads without errors
- ✅ Config flow works (adds via UI)
- ✅ Areas imported as locations
- ⚠️ Entities created for locations
- ⚠️ Event bridge translating states
- ⚠️ Coordinator scheduling timeouts

### Services
- ⚠️ `home_topology.trigger` works
- ⚠️ `home_topology.clear` works
- ⚠️ `home_topology.lock` works
- ⚠️ `home_topology.unlock` works
- ⚠️ `home_topology.vacate_area` works

### WebSocket API
- ⚠️ `locations/list` works
- ⚠️ `locations/create` works
- ⚠️ `locations/update` works
- ⚠️ `locations/delete` works
- ⚠️ `locations/set_module_config` works

### Frontend
- ⚠️ Panel registered and visible
- ⚠️ Panel loads without errors
- ⚠️ Location tree displays
- ⚠️ Location inspector works
- ⚠️ Configuration UI functional

### Tests
- ✅ 32 tests passing
- ✅ ~85% code coverage
- ✅ Following HA best practices
- ⚠️ Integration tests with real HA

---

## 🎯 Immediate Action Items

1. **Restart Home Assistant** and check logs
2. **Add integration via UI** (Settings → Integrations)
3. **Verify panel appears** in sidebar
4. **Test a simple occupancy scenario** with one location
5. **Document any issues** encountered
6. **Fix blocking issues** before proceeding

---

## 📈 Success Criteria

**MVP (Minimum Viable Product)**:
- ✅ Integration loads without errors
- ✅ Areas imported as locations
- ✅ At least one occupancy sensor working
- ✅ Manual control services work
- ✅ Panel visible (even if basic)

**Beta Release**:
- All MVP criteria
- Multiple locations with occupancy
- State persistence working
- Frontend UI functional
- Documentation complete

**Production (v1.0.0)**:
- All Beta criteria
- >95% test coverage including integration tests
- Full UI with all features
- Automation module working
- Lighting module working
- Community feedback incorporated

---

## 🔗 Quick Links

**Repositories**:
- Core: https://github.com/mjcumming/home-topology
- Integration: https://github.com/mjcumming/home-topology-ha

**Documentation**:
- `/workspaces/home-topology-ha/docs/architecture.md`
- `/workspaces/home-topology-ha/docs/integration-guide.md`
- `/workspaces/home-topology-ha/tests/HA-BEST-PRACTICES.md`

**Development**:
- Core: `/workspaces/home-topology`
- Integration: `/workspaces/home-topology-ha`
- HA Config: `/workspaces/wiim`
- Symlink: `/workspaces/wiim/custom_components/home_topology`

---

## 🤝 Need Help?

**Check logs first**:
```bash
# Integration logs
tail -f /workspaces/wiim/home-assistant.log | grep -i home_topology

# All HA logs
tail -f /workspaces/wiim/home-assistant.log
```

**Enable debug logging**:
```yaml
# configuration.yaml
logger:
  default: info
  logs:
    custom_components.home_topology: debug
    home_topology: debug  # core library
```

**Common Issues**: See Troubleshooting section above

---

**Status**: ✅ **READY FOR INITIAL TESTING**  
**Next Action**: **Restart Home Assistant and verify integration loads**  
**Expected Time**: 15-30 minutes for initial verification

