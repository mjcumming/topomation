# Workspace Rules

## Testing Philosophy

**NO BS MOCK TESTS - Write real tests**

- Write integration tests that actually test real functionality
- Avoid excessive mocking that makes tests meaningless
- Tests should verify actual behavior, not just that mocks were called
- Use real dependencies and real data flows whenever possible
- Mocks should only be used when absolutely necessary (e.g., external services, hardware)

## Frontend Development (Mock Harness)

**The mock harness requires functional mocks for HA components.**

When developing the UI in the mock harness (`mock-harness.html`):

- Real HA components (`ha-form`, `ha-dialog`) don't work without HA runtime
- We use **functional mocks** in `mock-ha-components.ts` that honor the same input/output contract
- Key contract: `ha-form` fires `value-changed` with `{ detail: { value: newData }, bubbles: true, composed: true }`
- Key contract: `ha-dialog` fires `opened`/`closed` events when `open` prop changes
- See `docs/mock-component-strategy.md` for full documentation

**Architectural Layers (Critical)**:

1. **Kernel** (`home-topology` core): Type-agnostic. Only knows `Location` objects. No floor/room/building.
2. **Integration** (`home-topology-ha`): Defines types via `modules._meta`, enforces hierarchy, maps to HA Areas.
3. **Home Assistant**: Areas (flat), Floors (optional grouping), Zones (GPS geofences, NOT indoor topology).

## Naming Conventions

- No underscores in directory or file names
- Use hyphens for separation in file/folder names
- Use YYYY.MM.DD format for document file names

## Key Documentation

| Document                          | Purpose                                |
| --------------------------------- | -------------------------------------- |
| `docs/mock-component-strategy.md` | How to mock HA components in harness   |
| `docs/frontend-dev-workflow.md`   | Development workflow with mock harness |
| `docs/frontend-patterns.md`       | Lit patterns, performance, drag-drop   |
| `docs/ui-design.md`               | UI specification and interaction flows |
| `docs/workflow-analysis.md`       | Epic and workflow for UI development   |
