# Tree DnD Stabilization Plan

**Purpose**: Implementation plan for moving from heuristic (x-offset) drag intent to explicit drop targets. Aligns with **C-011** and **ADR-HA-039**.

**Last updated**: 2026-02-28

---

## 1. Contract (done)

- **C-011** in `docs/contracts.md`: intent = which drop zone is hovered (before / inside / after; outdent explicit or separate).
- **ADR-HA-039** in `docs/adr-log.md`: explicit drop targets, no heuristic intent; SortableJS for mechanics only.

---

## 2. Implementation strategy

### 2.1 Freeze heuristic behavior first

- Stop changing x-offset / `childIntent` / `outdentIntent` logic for “fixes.”
- Treat current behavior as legacy; new work follows the explicit-zone contract.

### 2.2 Introduce explicit drop zones per row

- **Option A — Invisible hit areas**: Each tree row is divided into three (or four) non-overlapping horizontal bands:
  - **Before**: top third (or a thin strip above center) → insert as previous sibling.
  - **Inside**: middle (or “child” strip) → make this row the parent (append as last child).
  - **After**: bottom third (or thin strip below center) → insert as next sibling.
  - **Outdent** (optional): only when the related row is the current parent; e.g. a small “outdent” strip at the left edge of that row.
- **Option B — Visible drop targets**: Same semantics but with visible zone outlines or icons (e.g. “insert above”, “make child”, “insert below”) that appear on drag-over.
- **Recommendation**: Start with Option A (invisible bands) to minimize UI change; add optional visible hints later if needed.

### 2.3 Hit-testing during drag

- In SortableJS `onMove` (or equivalent):
  - Determine **related row** (as today).
  - Use **pointer Y** (and optionally X for outdent) relative to that row’s bounding rect to choose zone: before / inside / after (and outdent if applicable).
  - Store **active zone** (e.g. `{ relatedId, zone: 'before' | 'inside' | 'after' | 'outdent' }`) instead of `DropContext` with `pointerX`/`relatedLeft`/heuristics.
- Drop indicator: show a line or badge for the **active zone** (e.g. “Before”, “Child”, “After”, “Outdent”) based on stored zone only.

### 2.4 Resolve (parentId, siblingIndex) from zone only

- Replace `computeDropTarget(..., dropContext)` with a function that takes:
  - `relatedId`, `zone: 'before' | 'inside' | 'after' | 'outdent'`,
  - flat list / expanded state (for sibling order),
  - dragged id and current parent.
- Logic (no pointer inputs):
  - **before**: parent = parent of related row; siblingIndex = index of related in its sibling list.
  - **inside**: parent = relatedId; siblingIndex = number of children of related (append).
  - **after**: parent = parent of related row; siblingIndex = index of related + 1.
  - **outdent**: parent = parent of related row (current parent); siblingIndex = index of related (or +1 as needed so moved node is sibling, not child).
- After computing (parentId, siblingIndex), run **existing** `canMoveLocation`; if invalid, cancel drop and restore (as today).

### 2.5 Keep SortableJS for mechanics only

- Use SortableJS for: drag start, list reorder animation, drop event.
- **Do not** use its `newIndex`/`oldIndex` to infer parent/sibling. Use them only to know “where the pointer was” for choosing the related row; then **zone** + **relatedId** drive (parentId, siblingIndex) via the new resolver.
- Optionally: prevent SortableJS from actually reordering the list on drop; instead, on drop, compute (parentId, siblingIndex) from zone, then call existing `moveLocation` and emit `location-moved`; Lit re-renders from new `locations` and Sortable is re-initialized (current pattern).

### 2.6 Remove or isolate heuristic code

- Remove or gate: `CHILD_INDENT_THRESHOLD_PX`, `OUTDENT_THRESHOLD_PX`, `_childIntentThresholdPx`, `childIntent`/`outdentIntent` in `computeDropTarget`, and `_resolveDropIntent`’s use of `pointerX`/`relatedLeft`.
- Keep `canMoveLocation`, `moveLocation`, and domain rules unchanged.

---

## 3. E2E / regression

- Add scenarios (Playwright or similar) that:
  - Drag a node and drop on **before** zone of a row → assert (parentId, siblingIndex) and final tree order.
  - Same for **after** and **inside** (child).
  - If outdent is a zone: drag and drop on **outdent** of current parent → assert move to grandparent.
  - Attempt invalid move (e.g. floor under area) → assert drop is rejected and tree restored.
- Prefer DOM state or tree-model assertions over screenshot-only; screenshots can supplement for visual regression.

---

## 4. Order of work (suggested)

1. **Spec and freeze** (done): C-011, ADR-HA-039, this plan.
2. **Zone model**: Define zone enum and hit-test (Y ranges per row; optional outdent strip). No UI change yet; unit tests for zone-from-rect.
3. **Resolver**: New function `(relatedId, zone, flatNodes, draggedId, currentParentId) => { parentId, siblingIndex }` with tests; replace usage of `computeDropTarget` in drop path.
4. **Wire onMove**: In SortableJS `onMove`, compute zone from pointer + related row rect; store active zone; update drop indicator from zone only.
5. **Wire onEnd**: In `_handleDragEnd`, use stored (relatedId, zone) and new resolver to get (parentId, siblingIndex); validate with `canMoveLocation`; emit `location-moved` or restore.
6. **Remove heuristics**: Remove or dead-code x-offset intent logic; run full test suite and manual smoke.
7. **E2E**: Add before/after/inside (and outdent) + invalid-move scenarios; run in CI.

---

## 5. References

- `docs/contracts.md` — C-011 Tree drag-and-drop contract
- `docs/adr-log.md` — ADR-HA-039
- `custom_components/topomation/frontend/ht-location-tree.ts` — current DnD and `computeDropTarget`
- `custom_components/topomation/frontend/hierarchy-rules.ts` — `canMoveLocation`, type rules
- `custom_components/topomation/frontend/tree-utils.ts` — `moveLocation`
