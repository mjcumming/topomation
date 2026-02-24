// @ts-nocheck
import { LitElement, html, css, PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import type { HomeAssistant, Location, LocationType } from "./types";
import { sharedStyles } from "./styles";
import Sortable from "sortablejs";
import { getLocationType, isDescendant, canMoveLocation } from "./hierarchy-rules";

/**
 * Flat tree node for rendering - computed from hierarchical Location data
 */
interface FlatTreeNode {
  location: Location;
  depth: number;
  hasChildren: boolean;
  isExpanded: boolean;
}

interface DropContext {
  relatedId?: string;
  willInsertAfter?: boolean;
  pointerX?: number;
  relatedLeft?: number;
}

type OccupancyStatus = "occupied" | "vacant" | "unknown";

/**
 * Build a flat list of nodes in depth-first order for rendering.
 */
function buildFlatTree(
  locations: Location[],
  expandedIds: Set<string>
): FlatTreeNode[] {
  const byParent = new Map<string | null, Location[]>();

  for (const loc of locations) {
    const key = loc.parent_id;
    if (!byParent.has(key)) {
      byParent.set(key, []);
    }
    byParent.get(key)!.push(loc);
  }

  const result: FlatTreeNode[] = [];

  function traverse(parentId: string | null, depth: number): void {
    const children = byParent.get(parentId) || [];
    for (const loc of children) {
      const locChildren = byParent.get(loc.id) || [];
      const hasChildren = locChildren.length > 0;
      const isExpanded = expandedIds.has(loc.id);

      result.push({ location: loc, depth, hasChildren, isExpanded });

      if (isExpanded && hasChildren) {
        traverse(loc.id, depth + 1);
      }
    }
  }

  traverse(null, 0);
  return result;
}

/**
 * Given a drop position in the flat list, determine the new parent_id.
 *
 * Logic:
 * 1. If dropped at index 0 -> becomes root.
 * 2. If dropped after an item:
 *    - If that item is EXPANDED -> becomes its first child.
 *    - Otherwise -> becomes its sibling (same parent).
 */
function _computeInsertIndex(
  oldIndex: number,
  newIndex: number,
  filteredLength: number
): number {
  const adjusted = newIndex > oldIndex ? newIndex - 1 : newIndex;
  return Math.max(0, Math.min(adjusted, filteredLength));
}

function _collectSubtreeIds(flatNodes: FlatTreeNode[], rootId: string): Set<string> {
  const ids = new Set<string>([rootId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const node of flatNodes) {
      const pid = node.location.parent_id;
      if (pid && ids.has(pid) && !ids.has(node.location.id)) {
        ids.add(node.location.id);
        changed = true;
      }
    }
  }
  return ids;
}

function computeDropTarget(
  flatNodes: FlatTreeNode[],
  draggedId: string,
  oldIndex: number,
  newIndex: number,
  currentParentId: string | null,
  dropContext?: DropContext
): { parentId: string | null; siblingIndex: number } {
  const CHILD_INDENT_THRESHOLD_PX = 10;
  const subtreeIds = _collectSubtreeIds(flatNodes, draggedId);
  const filtered = flatNodes.filter((n) => !subtreeIds.has(n.location.id));
  let parentId = currentParentId;
  const relatedNode = dropContext?.relatedId
    ? filtered.find((node) => node.location.id === dropContext.relatedId)
    : undefined;

  // Automatic reparent inference:
  // - Drop after an expanded node -> make dragged item a child of that node.
  // - Otherwise -> keep dragged item as a sibling at the related node's level.
  if (relatedNode) {
    if (relatedNode.location.id === currentParentId) {
      // Dropping onto the current parent row outdents to the grandparent.
      parentId = relatedNode.location.parent_id;
    } else if (getLocationType(relatedNode.location) === "floor") {
      // Floor rows default to "drop as child of this floor".
      if (
        dropContext?.pointerX !== undefined &&
        dropContext?.relatedLeft !== undefined &&
        dropContext.pointerX < dropContext.relatedLeft + CHILD_INDENT_THRESHOLD_PX
      ) {
        parentId = relatedNode.location.parent_id;
      } else {
        parentId = relatedNode.location.id;
      }
    } else if (
      dropContext?.pointerX !== undefined &&
      dropContext?.relatedLeft !== undefined &&
      dropContext.pointerX < dropContext.relatedLeft + CHILD_INDENT_THRESHOLD_PX
    ) {
      // Left gutter intent: keep sibling-level placement.
      parentId = relatedNode.location.parent_id;
    } else if (
      dropContext?.pointerX !== undefined &&
      dropContext?.relatedLeft !== undefined &&
      dropContext.pointerX >= dropContext.relatedLeft + CHILD_INDENT_THRESHOLD_PX
    ) {
      // Horizontal intent: dropping to the right of a row means "make this a child".
      parentId = relatedNode.location.id;
    } else if (relatedNode.isExpanded && dropContext?.willInsertAfter) {
      parentId = relatedNode.location.id;
    } else {
      parentId = relatedNode.location.parent_id;
    }
  }

  const siblings = filtered.filter((node) => node.location.parent_id === parentId);

  if (relatedNode) {
    // Child intent: append as last child of related row.
    if (parentId === relatedNode.location.id) {
      return { parentId, siblingIndex: siblings.length };
    }

    const relatedSiblingIndex = siblings.findIndex(
      (node) => node.location.id === relatedNode.location.id
    );
    if (relatedSiblingIndex >= 0) {
      const idx = dropContext?.willInsertAfter ? relatedSiblingIndex + 1 : relatedSiblingIndex;
      return { parentId, siblingIndex: Math.max(0, Math.min(idx, siblings.length)) };
    }
  }

  // Fallback when we lack a concrete related target: approximate by index,
  // but account for dragging an entire subtree, not only the root row.
  const insertIndex = Math.max(
    0,
    Math.min(
      newIndex > oldIndex ? newIndex - subtreeIds.size : newIndex,
      filtered.length
    )
  );
  const siblingIndex = filtered
    .slice(0, insertIndex)
    .filter((node) => node.location.parent_id === parentId).length;
  return { parentId, siblingIndex };
}

/**
 * Location tree component using FLAT RENDERING pattern.
 */
export class HtLocationTree extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ attribute: false }) public locations: Location[] = [];
  @property({ type: Number }) public version = 0;
  @property() public selectedId?: string;
  @property({ attribute: false }) public occupancyStates: Record<string, boolean> = {};
  @property({ type: Boolean }) public readOnly = false;

  // CRITICAL: Explicit static properties for Vite dev mode compatibility
  static properties = {
    hass: { attribute: false },
    locations: { attribute: false },
    version: { type: Number },
    selectedId: {},
    occupancyStates: { attribute: false },
    readOnly: { type: Boolean },
    // Internal state
    _expandedIds: { state: true },
    _editingId: { state: true },
    _editingValue: { state: true },
    _isDragging: { state: true },
  };

  @state() private _expandedIds = new Set<string>();
  @state() private _editingId?: string;
  @state() private _editingValue = "";
  @state() private _isDragging = false;

  private _sortable?: Sortable;
  private _hasInitializedExpansion = false;
  private _autoExpandTimer?: number;
  private _lastDropContext?: DropContext;

  private _resolveDropContextFromPointer(
    draggedId: string,
    pointerX: number | undefined,
    pointerY: number | undefined
  ): DropContext | undefined {
    if (pointerY === undefined) return undefined;
    const rows = Array.from(
      this.shadowRoot?.querySelectorAll(".tree-item[data-id]") || []
    ) as HTMLElement[];
    let best:
      | { id: string; left: number; centerY: number; dist: number }
      | undefined;
    for (const row of rows) {
      const id = row.getAttribute("data-id") || undefined;
      if (!id || id === draggedId || isDescendant(this.locations, draggedId, id)) continue;
      const rect = row.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      const dist = Math.abs(pointerY - centerY);
      if (!best || dist < best.dist) {
        best = { id, left: rect.left, centerY, dist };
      }
    }
    if (!best) return undefined;
    return {
      relatedId: best.id,
      relatedLeft: best.left,
      pointerX,
      willInsertAfter: pointerY >= best.centerY,
    };
  }

  private _resolveRelatedId(evt: Sortable.MoveEvent): string | undefined {
    const draggedId = (evt.dragged as HTMLElement | undefined)?.getAttribute("data-id") || undefined;
    const start = evt.related as HTMLElement | undefined;
    if (!draggedId || !start?.classList.contains("tree-item")) return undefined;

    const pointerY = (evt as any).originalEvent?.clientY as number | undefined;
    if (pointerY !== undefined) {
      const rows = Array.from(
        this.shadowRoot?.querySelectorAll(".tree-item[data-id]") || []
      ) as HTMLElement[];
      let bestId: string | undefined;
      let bestDist = Number.POSITIVE_INFINITY;
      for (const row of rows) {
        const candidateId = row.getAttribute("data-id") || undefined;
        if (
          !candidateId ||
          candidateId === draggedId ||
          isDescendant(this.locations, draggedId, candidateId)
        ) {
          continue;
        }
        const rect = row.getBoundingClientRect();
        const centerY = rect.top + rect.height / 2;
        const dist = Math.abs(pointerY - centerY);
        if (dist < bestDist) {
          bestDist = dist;
          bestId = candidateId;
        }
      }
      if (bestId) return bestId;
    }

    let cursor: HTMLElement | null = start;
    while (cursor) {
      if (cursor.classList.contains("tree-item")) {
        const candidateId = cursor.getAttribute("data-id") || undefined;
        if (
          candidateId &&
          candidateId !== draggedId &&
          !isDescendant(this.locations, draggedId, candidateId)
        ) {
          return candidateId;
        }
      }
      cursor = evt.willInsertAfter
        ? (cursor.nextElementSibling as HTMLElement | null)
        : (cursor.previousElementSibling as HTMLElement | null);
    }
    return undefined;
  }

  static styles = [
    sharedStyles,
    css`
      :host {
        display: block;
        height: 100%;
        overflow-y: auto;
      }

      .tree-list {
        padding: var(--spacing-md);
        min-height: 100px;
      }

      .tree-item {
        display: flex;
        align-items: center;
        padding: var(--spacing-sm) var(--spacing-md);
        cursor: pointer;
        border-radius: var(--border-radius);
        transition: background var(--transition-speed);
        user-select: none;
        color: var(--primary-text-color);
        gap: var(--spacing-xs);
        min-height: 36px;
      }

      .tree-item:hover {
        background: rgba(var(--rgb-primary-text-color, 0, 0, 0), 0.04);
      }

      .tree-item.selected {
        background: rgba(var(--rgb-primary-color), 0.12);
        color: var(--primary-color);
        font-weight: 600;
      }

      .tree-item.selected:hover {
        background: rgba(var(--rgb-primary-color), 0.2);
      }

      .drag-handle {
        width: 22px;
        height: 22px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: grab;
        opacity: 0.35;
        color: var(--secondary-text-color);
        flex-shrink: 0;
        margin-right: var(--spacing-xs);
      }

      .tree-item:hover .drag-handle {
        opacity: 0.9;
      }

      .drag-handle:active {
        cursor: grabbing;
      }

      .tree-item.floor-item .drag-handle {
        opacity: 0.12;
        cursor: not-allowed;
      }

      .tree-item.floor-item:hover .drag-handle {
        opacity: 0.18;
      }

      .drag-handle.disabled {
        pointer-events: none;
      }

      .expand-btn {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        flex-shrink: 0;
        border: none;
        background: transparent;
        color: inherit;
        padding: 0;
        transition: transform 0.2s;
      }

      .expand-btn.expanded {
        transform: rotate(90deg);
      }

      .expand-btn.hidden {
        visibility: hidden;
      }

      .location-icon {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        color: var(--secondary-text-color);
      }

      .tree-item.selected .location-icon {
        color: var(--primary-color);
      }

      .occupancy-dot {
        width: 9px;
        height: 9px;
        border-radius: 50%;
        border: 1px solid rgba(0, 0, 0, 0.15);
        flex-shrink: 0;
      }

      .occupancy-dot.occupied {
        background: #22c55e;
        border-color: #16a34a;
      }

      .occupancy-dot.vacant {
        background: #d1d5db;
        border-color: #9ca3af;
      }

      .occupancy-dot.unknown {
        background: #f59e0b;
        border-color: #d97706;
      }

      .location-name {
        flex: 1;
        font-size: 14px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .location-name-input {
        flex: 1;
        background: var(--card-background-color);
        border: 2px solid var(--primary-color);
        border-radius: 4px;
        padding: 2px 8px;
        font-size: 14px;
        color: var(--primary-text-color);
        outline: none;
      }

      .type-badge {
        display: inline-flex;
        align-items: center;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-left: var(--spacing-sm);
        flex-shrink: 0;
      }

      .type-badge.floor {
        background: rgba(var(--rgb-primary-color), 0.15);
        color: var(--primary-color);
      }

      .type-badge.area {
        background: rgba(var(--rgb-warning-color), 0.15);
        color: var(--warning-color);
      }

      .tree-item.selected .type-badge.floor {
        background: var(--primary-color);
        color: white;
      }

      .tree-item.selected .type-badge.area {
        background: var(--warning-color);
        color: white;
      }

      .delete-btn {
        opacity: 0;
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 4px;
        color: var(--secondary-text-color);
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
      }

      .tree-item:hover .delete-btn {
        opacity: 0.6;
      }

      .delete-btn:hover {
        color: var(--error-color);
        opacity: 1;
      }

      .sortable-ghost {
        opacity: 0.5;
        background: rgba(var(--rgb-primary-color), 0.12);
      }

      .sortable-chosen {
        background: rgba(var(--rgb-primary-color), 0.08);
      }
    `,
  ];

  protected willUpdate(changedProps: PropertyValues): void {
    super.willUpdate(changedProps);
    if (changedProps.has("locations") && this.locations.length > 0) {
      this._initializeExpansion();
    }
  }

  protected firstUpdated(): void {
    this._initializeSortable();
  }

  protected updated(changedProps: PropertyValues): void {
    super.updated(changedProps);
    if (changedProps.has("locations") || changedProps.has("version")) {
      this._cleanupDuplicateTreeItems();
      if (!this._isDragging) {
        this._initializeSortable();
      }
    }
  }

  private _initializeExpansion(): void {
    if (this.locations.length === 0) return;
    const parentIds = new Set<string>();
    for (const loc of this.locations) {
      if (loc.parent_id) parentIds.add(loc.parent_id);
    }

    if (!this._hasInitializedExpansion) {
      this._expandedIds = new Set(parentIds);
      this._hasInitializedExpansion = true;
    } else {
      for (const id of parentIds) {
        if (!this._expandedIds.has(id)) {
          const newExpanded = new Set(this._expandedIds);
          newExpanded.add(id);
          this._expandedIds = newExpanded;
        }
      }
    }
  }

  private _initializeSortable(): void {
    this._sortable?.destroy();
    this.updateComplete.then(() => {
      const list = this.shadowRoot?.querySelector(".tree-list");
      if (!list) return;
      this._sortable = Sortable.create(list as HTMLElement, {
        handle: ".drag-handle:not(.disabled)",
        animation: 150,
        ghostClass: "sortable-ghost",
        // Keep all rows as valid drop targets; floors are non-draggable via disabled handle.
        draggable: ".tree-item",
        onStart: () => { this._isDragging = true; },
        onMove: (evt) => {
          const relatedTarget = evt.related as HTMLElement | undefined;
          if (relatedTarget?.classList.contains("tree-item")) {
            const resolvedRelatedId = this._resolveRelatedId(evt);
            const resolvedTarget =
              (resolvedRelatedId
                ? (this.shadowRoot?.querySelector(
                    `.tree-item[data-id="${resolvedRelatedId}"]`
                  ) as HTMLElement | null)
                : null) || relatedTarget;
            const rect = resolvedTarget.getBoundingClientRect();
            this._lastDropContext = {
              relatedId: resolvedRelatedId ?? (relatedTarget.getAttribute("data-id") ?? undefined),
              willInsertAfter: evt.willInsertAfter,
              pointerX: (evt as any).originalEvent?.clientX,
              relatedLeft: rect.left,
            };
          }

          // Detect which item we are hovering OVER
          const targetEl = relatedTarget;
          if (targetEl && targetEl.classList.contains('tree-item')) {
            const targetId = targetEl.getAttribute('data-id');
            if (targetId && !this._expandedIds.has(targetId)) {
              if (this._autoExpandTimer) window.clearTimeout(this._autoExpandTimer);
              this._autoExpandTimer = window.setTimeout(() => {
                const next = new Set(this._expandedIds);
                next.add(targetId);
                this._expandedIds = next;
                // Do not re-init Sortable mid-drag; it can leave duplicate DOM artifacts.
              }, 800);
            }
          }
          return true;
        },
        onEnd: (evt) => {
          if (this._autoExpandTimer) window.clearTimeout(this._autoExpandTimer);
          this._isDragging = false;
          this._handleDragEnd(evt);
          this._lastDropContext = undefined;
          // Re-sync Sortable after drop to match Lit-rendered tree state.
          this.updateComplete.then(() => {
            this._cleanupDuplicateTreeItems();
            this._initializeSortable();
          });
        },
      });
    });
  }

  private _handleDragEnd(evt: Sortable.SortableEvent): void {
    const { item, newIndex, oldIndex } = evt;
    if (newIndex === undefined || oldIndex === undefined) return;

    const locationId = item.getAttribute("data-id");
    if (!locationId) return;
    const dragged = this.locations.find((loc) => loc.id === locationId);
    if (!dragged) return;

    const pointerX = (evt as any).originalEvent?.clientX as number | undefined;
    const pointerY = (evt as any).originalEvent?.clientY as number | undefined;
    const pointerDrop = this._resolveDropContextFromPointer(locationId, pointerX, pointerY);
    const effectiveDropContext = pointerDrop || this._lastDropContext;

    const flatNodes = buildFlatTree(this.locations, this._expandedIds);
    const dropTarget = computeDropTarget(
      flatNodes,
      locationId,
      oldIndex,
      newIndex,
      dragged.parent_id,
      effectiveDropContext
    );
    const newParentId = dropTarget.parentId;
    const siblingIndex = dropTarget.siblingIndex;
    const oldSiblingIndex = flatNodes
      .slice(0, oldIndex)
      .filter((node) => node.location.parent_id === dragged.parent_id).length;
    if (newParentId === dragged.parent_id && siblingIndex === oldSiblingIndex) {
      this._restoreTreeAfterCancelledDrop();
      return;
    }

    if (!canMoveLocation({ locations: this.locations, locationId, newParentId })) {
      this._restoreTreeAfterCancelledDrop();
      return;
    }

    this.dispatchEvent(new CustomEvent("location-moved", {
      detail: { locationId, newParentId, newIndex: siblingIndex },
      bubbles: true,
      composed: true,
    }));
  }

  private _restoreTreeAfterCancelledDrop(): void {
    // Sortable mutates DOM directly during drag; force Lit to repaint canonical order.
    this.requestUpdate();
    this.updateComplete.then(() => {
      this._cleanupDuplicateTreeItems();
      this._initializeSortable();
    });
  }

  private _cleanupDuplicateTreeItems(): void {
    const list = this.shadowRoot?.querySelector(".tree-list");
    if (!list) return;
    const items = Array.from(list.querySelectorAll(".tree-item[data-id]")) as HTMLElement[];
    const seen = new Set<string>();
    for (const item of items) {
      const id = item.getAttribute("data-id");
      if (!id) continue;
      if (seen.has(id)) {
        item.remove();
        continue;
      }
      seen.add(id);
    }
  }

  protected render() {
    if (!this.locations.length) {
      return html`
        <div class="empty-state">
          <ha-icon icon="mdi:map-marker-plus"></ha-icon>
          <div>
            ${this.readOnly
              ? "No synced locations yet. Create Areas/Floors in Home Assistant Settings."
              : "No locations yet. Create your first location to get started."}
          </div>
          ${this.readOnly ? "" : html`<button class="button" @click=${this._handleCreate}>+ New Location</button>`}
        </div>
      `;
    }
    const flatNodes = buildFlatTree(this.locations, this._expandedIds);
    const occupancyStatusByLocation = this._computeOccupancyStatusByLocation();
    return html`
      <div class="tree-list">
        ${repeat(
          flatNodes,
          (node) => `${this.version}:${node.location.id}:${node.depth}`,
          (node) =>
            this._renderItem(
              node,
              occupancyStatusByLocation[node.location.id] || "unknown"
            )
        )}
      </div>
    `;
  }

  private _renderItem(node: FlatTreeNode, occupancyStatus: OccupancyStatus): unknown {
    const { location, depth, hasChildren, isExpanded } = node;
    const isSelected = this.selectedId === location.id;
    const isEditing = this._editingId === location.id;
    const indent = depth * 24;
    const type = getLocationType(location);

    return html`
      <div
        class="tree-item ${isSelected ? "selected" : ""} ${type === "floor" ? "floor-item" : ""}"
        data-id=${location.id}
        style="margin-left: ${indent}px"
        @click=${(e: Event) => this._handleClick(e, location)}
      >
        <div
          class="drag-handle ${type === "floor" || this.readOnly ? "disabled" : ""}"
          title=${this.readOnly
            ? "Topology structure is managed in Home Assistant Settings."
            : type === "floor"
              ? "Floors are fixed at top level"
              : "Drag to reorder or move levels."}
        ><ha-icon icon="mdi:drag-vertical"></ha-icon></div>

        <button
          class="expand-btn ${isExpanded ? "expanded" : ""} ${hasChildren ? "" : "hidden"}"
          @click=${(e: Event) => this._handleExpand(e, location.id)}
        >
          <ha-icon icon="mdi:chevron-right"></ha-icon>
        </button>

        <div class="location-icon">
          <ha-icon .icon=${this._getIcon(location)}></ha-icon>
        </div>
        <div
          class="occupancy-dot ${occupancyStatus}"
          title=${this._getOccupancyStatusLabel(occupancyStatus)}
        ></div>

        ${isEditing
          ? html`<input class="location-name-input" .value=${this._editingValue}
                  @input=${(e: any) => this._editingValue = e.target.value}
                  @blur=${() => this._finishEditing(location.id)}
                  @keydown=${(e: any) => this._handleEditKeydown(e, location.id)}
                  @click=${(e: any) => e.stopPropagation()} />`
          : html`<div
              class="location-name"
              @dblclick=${this.readOnly ? (() => {}) : ((e: any) => this._startEditing(e, location))}
            >${location.name}</div>`}

        <span class="type-badge ${type}">${type}</span>

        ${this.readOnly
          ? ""
          : html`<button class="delete-btn" @click=${(e: any) => this._handleDelete(e, location)} title="Delete"><ha-icon icon="mdi:delete-outline"></ha-icon></button>`}
      </div>
    `;
  }

  private _getOccupancyStatusLabel(status: OccupancyStatus): string {
    if (status === "occupied") return "Occupied";
    if (status === "vacant") return "Vacant";
    return "Unknown occupancy";
  }

  private _computeOccupancyStatusByLocation(): Record<string, OccupancyStatus> {
    const statusByLocation: Record<string, OccupancyStatus> = {};
    const byId = new Map(this.locations.map((loc) => [loc.id, loc]));
    const childrenByParent = new Map<string, string[]>();

    for (const loc of this.locations) {
      if (!loc.parent_id) continue;
      if (!childrenByParent.has(loc.parent_id)) {
        childrenByParent.set(loc.parent_id, []);
      }
      childrenByParent.get(loc.parent_id)!.push(loc.id);
    }

    const resolved = new Map<string, OccupancyStatus>();

    const visit = (locationId: string): OccupancyStatus => {
      const cached = resolved.get(locationId);
      if (cached) return cached;
      if (!byId.has(locationId)) return "unknown";

      const direct = this.occupancyStates?.[locationId];
      const own: OccupancyStatus =
        direct === true ? "occupied" : direct === false ? "vacant" : "unknown";

      const childIds = childrenByParent.get(locationId) || [];
      if (!childIds.length) {
        resolved.set(locationId, own);
        return own;
      }

      const childStatuses = childIds.map((id) => visit(id));

      let merged: OccupancyStatus;
      if (own === "occupied" || childStatuses.includes("occupied")) {
        merged = "occupied";
      } else if (own === "vacant") {
        merged = "vacant";
      } else if (childStatuses.length > 0 && childStatuses.every((s) => s === "vacant")) {
        merged = "vacant";
      } else {
        merged = "unknown";
      }

      resolved.set(locationId, merged);
      return merged;
    };

    for (const loc of this.locations) {
      statusByLocation[loc.id] = visit(loc.id);
    }

    return statusByLocation;
  }

  private _getIcon(location: Location): string {
    if (location.ha_area_id && this.hass?.areas?.[location.ha_area_id]?.icon) {
      return this.hass.areas[location.ha_area_id].icon;
    }
    const type = getLocationType(location);
    return type === "floor" ? "mdi:layers" : "mdi:map-marker";
  }

  private _handleClick(e: Event, location: Location): void {
    const target = e.target as HTMLElement;
    if (target.closest(".drag-handle") || target.closest(".expand-btn") || target.closest(".delete-btn")) return;
    this.dispatchEvent(new CustomEvent("location-selected", { detail: { locationId: location.id }, bubbles: true, composed: true }));
  }

  private _handleExpand(e: Event, locationId: string): void {
    e.stopPropagation();
    const next = new Set(this._expandedIds);
    if (next.has(locationId)) next.delete(locationId); else next.add(locationId);
    this._expandedIds = next;
  }

  private _startEditing(e: Event, location: Location): void {
    if (this.readOnly) return;
    e.stopPropagation();
    this._editingId = location.id;
    this._editingValue = location.name;
    this.updateComplete.then(() => {
      const input = this.shadowRoot?.querySelector(".location-name-input") as HTMLInputElement;
      input?.focus();
      input?.select();
    });
  }

  private _handleEditKeydown(e: KeyboardEvent, locationId: string): void {
    if (e.key === "Enter") { e.preventDefault(); this._finishEditing(locationId); }
    else if (e.key === "Escape") { this._editingId = undefined; }
  }

  private _finishEditing(locationId: string): void {
    if (this._editingId !== locationId) return;
    const newName = this._editingValue.trim();
    this._editingId = undefined;
    if (!newName || newName === this.locations.find(l => l.id === locationId)?.name) return;
    this.dispatchEvent(new CustomEvent("location-renamed", { detail: { locationId, newName }, bubbles: true, composed: true }));
  }

  private _handleDelete(e: Event, location: Location): void {
    if (this.readOnly) return;
    e.stopPropagation();
    if (!confirm(`Delete "${location.name}"?`)) return;
    this.dispatchEvent(new CustomEvent("location-delete", { detail: { location }, bubbles: true, composed: true }));
  }

  private _handleCreate(): void {
    if (this.readOnly) return;
    this.dispatchEvent(new CustomEvent("location-create", { bubbles: true, composed: true }));
  }
}

export const __TEST__ = {
  buildFlatTree,
  computeDropTarget,
};

if (!customElements.get("ht-location-tree")) {
  customElements.define("ht-location-tree", HtLocationTree);
}
