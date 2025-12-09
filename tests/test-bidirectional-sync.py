"""Bidirectional Sync Tests: Home Assistant ↔ Home Topology.

Tests the bidirectional synchronization between HA's area/floor system
and the home-topology location hierarchy:

1. HA → Topology: Areas and floors import as locations
2. Topology → HA: Location renames propagate back to HA
3. HA → Topology: Area/floor renames update locations
4. Topology-only: Locations without HA counterparts work correctly
5. Relationship tracking: Floor → Area → Location mappings maintained

Test Strategy:
- Use HA registries to create/modify areas and floors
- Monitor topology for changes
- Verify bidirectional propagation
- Test edge cases (orphaned areas, deleted floors, etc.)
