// @ts-nocheck
import { LitElement, html, css, PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import type { HomeAssistant, Location, LocationType } from "./types";
import { sharedStyles } from "./styles";
import Sortable from "sortablejs";
import { getLocationType, isDescendant, canMoveLocation } from "./hierarchy-rules";
import { getTypeFallbackIcon } from "./icon-utils";
import {
  buildFlatTree,
  zoneFromPointerInRow,
  resolveDropTargetFromZone,
  type FlatTreeNode,
  type DropZone,
} from "./tree-dnd-zones";

/** Active drop target at drop time: related row + zone. No pointer/heuristic. */
export interface ActiveDropTarget {
  relatedId: string;
  zone: DropZone;
}
export type { DropZone } from "./tree-dnd-zones";
const ENTITY_DND_MIME = "application/x-topomation-entity-id";

interface DropIndicator {
  top: number;
  left: number;
  width: number;
  intent: "child" | "sibling" | "outdent";
  label: string;
}

type OccupancyStatus = "occupied" | "vacant" | "unknown";
type LockState = { isLocked: boolean; lockedBy: string[] };

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
  @property({ type: Boolean }) public allowMove = false;
  @property({ type: Boolean }) public allowRename = false;

  // CRITICAL: Explicit static properties for Vite dev mode compatibility
  static properties = {
    hass: { attribute: false },
    locations: { attribute: false },
    version: { type: Number },
    selectedId: {},
    occupancyStates: { attribute: false },
    readOnly: { type: Boolean },
    allowMove: { type: Boolean },
    allowRename: { type: Boolean },
    // Internal state
    _expandedIds: { state: true },
    _editingId: { state: true },
    _editingValue: { state: true },
    _isDragging: { state: true },
    _dropIndicator: { state: true },
    _entityDropTargetId: { state: true },
  };

  @state() private _expandedIds = new Set<string>();
  @state() private _editingId?: string;
  @state() private _editingValue = "";
  @state() private _isDragging = false;
  @state() private _dropIndicator?: DropIndicator;
  @state() private _entityDropTargetId?: string;

  private _sortable?: Sortable;
  private _draggedId?: string;
  private _boundDragOver?: (e: DragEvent) => void;
  private _hasInitializedExpansion = false;
  private _activeDropTarget?: ActiveDropTarget;

  private _resolveRelatedId(evt: Sortable.MoveEvent): string | undefined {
    const draggedId = (evt.dragged as HTMLElement | undefined)?.getAttribute("data-id") || undefined;
    const start = evt.related as HTMLElement | undefined;
    if (!draggedId || !start?.classList.contains("tree-item")) return undefined;
    const startId = start.getAttribute("data-id") || undefined;
    if (startId && startId !== draggedId && !isDescendant(this.locations, draggedId, startId)) {
      return startId;
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
        position: relative;
        padding: var(--spacing-md);
        min-height: 100px;
      }

      .drop-indicator {
        position: absolute;
        pointer-events: none;
        z-index: 5;
      }

      .drop-indicator-line {
        height: 2px;
        width: 100%;
        border-radius: 999px;
        background: var(--primary-color);
        box-shadow: 0 0 0 1px rgba(var(--rgb-primary-color), 0.18);
      }

      .drop-indicator::before {
        content: "";
        position: absolute;
        left: -6px;
        top: -4px;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--primary-color);
      }

      .drop-indicator-label {
        position: absolute;
        top: -18px;
        left: 0;
        padding: 1px 6px;
        border-radius: 10px;
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.02em;
        color: var(--card-background-color);
        background: rgba(var(--rgb-primary-color), 0.95);
        white-space: nowrap;
      }

      .drop-indicator.sibling .drop-indicator-label {
        background: rgba(var(--rgb-primary-color), 0.95);
      }

      .drop-indicator.child .drop-indicator-label {
        background: rgba(var(--rgb-success-color), 0.95);
      }

      .drop-indicator.outdent .drop-indicator-label {
        background: rgba(var(--rgb-warning-color), 0.95);
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

      .tree-item.entity-drop-target {
        background: rgba(var(--rgb-success-color), 0.18);
        box-shadow: inset 0 0 0 1px rgba(var(--rgb-success-color), 0.45);
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

      .type-badge.building {
        background: rgba(var(--rgb-success-color), 0.15);
        color: var(--success-color);
      }

      .type-badge.grounds {
        background: rgba(var(--rgb-info-color), 0.15);
        color: var(--info-color);
      }

      .tree-item.selected .type-badge.floor {
        background: var(--primary-color);
        color: white;
      }

      .tree-item.selected .type-badge.area {
        background: var(--warning-color);
        color: white;
      }

      .tree-item.selected .type-badge.building {
        background: var(--success-color);
        color: white;
      }

      .tree-item.selected .type-badge.grounds {
        background: var(--info-color);
        color: white;
      }

      .type-badge.root {
        background: rgba(var(--rgb-info-color), 0.15);
        color: var(--info-color);
      }

      .tree-item.selected .type-badge.root {
        background: var(--info-color);
        color: white;
      }

      .delete-btn {
        opacity: 0.6;
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
        opacity: 1;
      }

      .tree-item.selected .delete-btn {
        opacity: 1;
      }

      .delete-btn:hover {
        color: var(--error-color);
        opacity: 1;
      }

      .lock-btn {
        opacity: 0.7;
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 4px;
        color: var(--secondary-text-color);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
      }

      .tree-item:hover .lock-btn,
      .tree-item.selected .lock-btn {
        opacity: 1;
      }

      .lock-btn.locked {
        color: var(--warning-color);
      }

      .lock-btn:hover {
        background: rgba(var(--rgb-primary-color), 0.1);
      }

      .occupancy-btn {
        opacity: 0.7;
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 4px;
        color: var(--secondary-text-color);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
      }

      .tree-item:hover .occupancy-btn,
      .tree-item.selected .occupancy-btn {
        opacity: 1;
      }

      .occupancy-btn:hover {
        background: rgba(var(--rgb-primary-color), 0.1);
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

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._sortable?.destroy();
    this._sortable = undefined;
    this._boundDragOver = undefined;
    this._draggedId = undefined;
    this._entityDropTargetId = undefined;
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
      // Default collapsed tree. Users can expand explicitly, and drag-hover may
      // temporarily expand valid collapsed targets when needed.
      this._expandedIds = new Set();
      this._hasInitializedExpansion = true;
    } else {
      // Preserve user-collapsed branches across location refreshes.
      const nextExpanded = new Set<string>();
      for (const id of this._expandedIds) {
        if (parentIds.has(id)) nextExpanded.add(id);
      }
      this._expandedIds = nextExpanded;
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
        // Keep all rows as valid drop targets; hierarchy-rules.ts enforces move constraints.
        draggable: ".tree-item",
        onStart: (evt) => {
          this._isDragging = true;
          this._dropIndicator = undefined;
          this._entityDropTargetId = undefined;
          this._draggedId = (evt.item as HTMLElement)?.getAttribute("data-id") ?? undefined;
          this._boundDragOver = this._handleContinuousDragOver.bind(this);
          list.addEventListener("dragover", this._boundDragOver);
        },
        onMove: (evt) => {
          const draggedId =
            (evt.dragged as HTMLElement | undefined)?.getAttribute("data-id") || undefined;
          const relatedTarget = evt.related as HTMLElement | undefined;
          if (draggedId && relatedTarget?.classList.contains("tree-item")) {
            const relatedId =
              this._resolveRelatedId(evt) ??
              (relatedTarget.getAttribute("data-id") ?? undefined);
            if (!relatedId || relatedId === draggedId) {
              this._activeDropTarget = undefined;
              this._dropIndicator = undefined;
              return true;
            }
            const rect = relatedTarget.getBoundingClientRect();
            const orig = (evt as any).originalEvent;
            const clientX = typeof orig?.clientX === "number" ? orig.clientX : rect.left + rect.width / 2;
            const clientY = typeof orig?.clientY === "number" ? orig.clientY : rect.top + rect.height / 2;
            const dragged = this.locations.find((l) => l.id === draggedId);
            const currentParentId = dragged?.parent_id ?? null;
            const isCurrentParentRow = relatedId === currentParentId;
            const zone = zoneFromPointerInRow(rect, clientX, clientY, isCurrentParentRow);
            this._activeDropTarget = { relatedId, zone };
            this._updateDropIndicator(draggedId, relatedTarget, zone);
          } else {
            this._activeDropTarget = undefined;
            this._dropIndicator = undefined;
          }
          return true;
        },
        onEnd: (evt) => {
          this._isDragging = false;
          this._dropIndicator = undefined;
          this._entityDropTargetId = undefined;
          if (this._boundDragOver) {
            list.removeEventListener("dragover", this._boundDragOver);
            this._boundDragOver = undefined;
          }
          this._handleDragEnd(evt);
          this._activeDropTarget = undefined;
          this._draggedId = undefined;
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
    const { item } = evt;
    const locationId = item.getAttribute("data-id");
    if (!locationId) return;
    const dragged = this.locations.find((loc) => loc.id === locationId);
    if (!dragged) return;

    const target = this._activeDropTarget;
    if (!target) {
      this._restoreTreeAfterCancelledDrop();
      return;
    }

    const flatNodes = buildFlatTree(this.locations, this._expandedIds);
    const dropTarget = resolveDropTargetFromZone(
      flatNodes,
      locationId,
      dragged.parent_id,
      target.relatedId,
      target.zone
    );
    const { parentId: newParentId, siblingIndex } = dropTarget;
    const oldSiblingIndex = flatNodes
      .filter((node) => node.location.parent_id === dragged.parent_id)
      .findIndex((node) => node.location.id === locationId);
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

  private _handleContinuousDragOver(e: DragEvent): void {
    e.preventDefault();
    const draggedId = this._draggedId;
    if (!draggedId) return;

    const target = (e.target as HTMLElement)?.closest?.(".tree-item") as HTMLElement | null;
    if (!target) return;
    const relatedId = target.getAttribute("data-id");
    if (!relatedId || relatedId === draggedId) return;

    const rect = target.getBoundingClientRect();
    const dragged = this.locations.find((l) => l.id === draggedId);
    const currentParentId = dragged?.parent_id ?? null;
    const isCurrentParentRow = relatedId === currentParentId;
    const zone = zoneFromPointerInRow(rect, e.clientX, e.clientY, isCurrentParentRow);
    this._activeDropTarget = { relatedId, zone };
    this._updateDropIndicator(draggedId, target, zone);
  }

  private _restoreTreeAfterCancelledDrop(): void {
    // Sortable mutates DOM directly during drag; force Lit to repaint canonical order.
    this._dropIndicator = undefined;
    this.requestUpdate();
    this.updateComplete.then(() => {
      this._cleanupDuplicateTreeItems();
      this._initializeSortable();
    });
  }

  private _updateDropIndicator(
    _draggedId: string,
    relatedRow: HTMLElement,
    zone: DropZone
  ): void {
    const list = this.shadowRoot?.querySelector(".tree-list") as HTMLElement | null;
    if (!relatedRow || !list) {
      this._dropIndicator = undefined;
      return;
    }

    const listRect = list.getBoundingClientRect();
    const rowRect = relatedRow.getBoundingClientRect();
    const intent: "child" | "sibling" | "outdent" =
      zone === "inside" ? "child" : zone === "outdent" ? "outdent" : "sibling";
    const label =
      zone === "inside" ? "Child" : zone === "outdent" ? "Outdent" : zone === "after" ? "After" : "Before";

    let left = rowRect.left - listRect.left + 6;
    if (zone === "inside") left += 24;
    if (zone === "outdent") left -= 24;
    left = Math.max(8, Math.min(left, listRect.width - 44));
    const width = Math.max(36, listRect.width - left - 8);
    const top =
      zone === "after"
        ? rowRect.bottom - listRect.top
        : zone === "before"
          ? rowRect.top - listRect.top
          : zone === "inside"
            ? rowRect.bottom - listRect.top
            : rowRect.top - listRect.top;
    this._dropIndicator = { top, left, width, intent, label };
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
          <ha-icon icon="mdi:map-marker-plus" class="empty-state-icon"></ha-icon>
          <div class="empty-state-message">
            ${this.readOnly
              ? "No locations yet. Create your first location to get started."
              : "No locations yet. Create your first location to get started."}
          </div>
          ${this.readOnly
            ? html`
                <a
                  href="/config/areas"
                  class="button button-primary empty-state-cta"
                  @click=${this._handleOpenSettings}
                >
                  <ha-icon icon="mdi:cog"></ha-icon>
                  Open Settings → Areas & Floors
                </a>
              `
            : html`<button class="button" @click=${this._handleCreate}>+ New Location</button>`}
        </div>
      `;
    }
    const flatNodes = buildFlatTree(this.locations, this._expandedIds);
    const occupancyStatusByLocation = this._computeOccupancyStatusByLocation();
    const lockStateByLocation = this._computeLockStateByLocation();
    return html`
      <div class="tree-list">
        ${repeat(
          flatNodes,
          (node) => `${this.version}:${node.location.id}:${node.depth}`,
          (node) =>
            this._renderItem(
              node,
              occupancyStatusByLocation[node.location.id] || "unknown",
              lockStateByLocation[node.location.id] || { isLocked: false, lockedBy: [] }
            )
        )}
        ${this._dropIndicator
          ? html`
              <div
                class="drop-indicator ${this._dropIndicator.intent}"
                style=${`top:${this._dropIndicator.top}px;left:${this._dropIndicator.left}px;width:${this._dropIndicator.width}px;`}
              >
                <div class="drop-indicator-line"></div>
                <div class="drop-indicator-label">${this._dropIndicator.label}</div>
              </div>
            `
          : ""}
      </div>
    `;
  }

  private _renderItem(
    node: FlatTreeNode,
    occupancyStatus: OccupancyStatus,
    lockState: LockState
  ): unknown {
    const { location, depth, hasChildren, isExpanded } = node;
    const isSelected = this.selectedId === location.id;
    const isEditing = this._editingId === location.id;
    const indent = depth * 24;
    const type = getLocationType(location);
    const typeClass = location.is_explicit_root ? "root" : type;
    const typeLabel = location.is_explicit_root ? "home root" : type;
    const lockIcon = lockState.isLocked ? "mdi:lock" : "mdi:lock-open-variant-outline";
    const lockTitle = lockState.isLocked
      ? lockState.lockedBy.length
        ? `Locked (${lockState.lockedBy.join(", ")})`
        : "Locked"
      : "Unlocked";
    const isDirectlyOccupied = this.occupancyStates?.[location.id] === true;
    const occupancyIcon = "mdi:home-switch-outline";
    const occupancyTitle = isDirectlyOccupied ? "Set vacant" : "Set occupied";

    return html`
      <div
        class="tree-item ${isSelected ? "selected" : ""} ${type === "floor" ? "floor-item" : ""} ${this._entityDropTargetId === location.id ? "entity-drop-target" : ""}"
        data-id=${location.id}
        style="margin-left: ${indent}px"
        @click=${(e: Event) => this._handleClick(e, location)}
        @dragover=${(e: DragEvent) => this._handleEntityDragOver(e, location.id)}
        @dragleave=${(e: DragEvent) => this._handleEntityDragLeave(e, location.id)}
        @drop=${(e: DragEvent) => this._handleEntityDrop(e, location.id)}
      >
        <div
          class="drag-handle ${!this.allowMove ? "disabled" : ""}"
          title=${!this.allowMove
            ? "Hierarchy move is disabled."
            : "Drag to reorder. Drop on top/middle/bottom of a row for before/child/after."}
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
              @dblclick=${this.allowRename ? ((e: any) => this._startEditing(e, location)) : (() => {})}
            >${location.name}</div>`}

        <span class="type-badge ${typeClass}">${typeLabel}</span>

        ${location.is_explicit_root || this.readOnly
          ? ""
          : html`
              <button
                class="occupancy-btn"
                title=${occupancyTitle}
                @click=${(e: Event) =>
                  this._handleOccupancyToggle(e, location, isDirectlyOccupied)}
              >
                <ha-icon .icon=${occupancyIcon}></ha-icon>
              </button>
              <button
                class="lock-btn ${lockState.isLocked ? "locked" : ""}"
                title=${lockTitle}
                @click=${(e: Event) => this._handleLockToggle(e, location, lockState)}
              >
                <ha-icon .icon=${lockIcon}></ha-icon>
              </button>
            `}
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

  private _computeLockStateByLocation(): Record<string, LockState> {
    const states = this.hass?.states || {};
    const lockByLocation: Record<string, LockState> = {};
    for (const state of Object.values(states) as any[]) {
      const attrs = state?.attributes || {};
      if (attrs.device_class !== "occupancy") continue;
      const locationId = attrs.location_id;
      if (!locationId) continue;
      const lockedByRaw = attrs.locked_by;
      lockByLocation[String(locationId)] = {
        isLocked: Boolean(attrs.is_locked),
        lockedBy: Array.isArray(lockedByRaw) ? lockedByRaw.map((item: any) => String(item)) : [],
      };
    }
    return lockByLocation;
  }

  private _getIcon(location: Location): string {
    if (location.ha_area_id && this.hass?.areas?.[location.ha_area_id]?.icon) {
      return this.hass.areas[location.ha_area_id].icon;
    }
    const type = getLocationType(location);
    return getTypeFallbackIcon(type);
  }

  private _hasEntityDragPayload(event: DragEvent): boolean {
    const types = Array.from(event.dataTransfer?.types || []);
    if (types.includes(ENTITY_DND_MIME)) return true;
    return !this._isDragging && types.includes("text/plain");
  }

  private _readEntityIdFromDrop(event: DragEvent): string | undefined {
    const fromMime = event.dataTransfer?.getData(ENTITY_DND_MIME);
    if (fromMime) return fromMime;
    const fallback = event.dataTransfer?.getData("text/plain") || "";
    return fallback.includes(".") ? fallback : undefined;
  }

  private _handleEntityDragOver(event: DragEvent, locationId: string): void {
    if (!this._hasEntityDragPayload(event)) return;
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "move";
    }
    this._entityDropTargetId = locationId;
  }

  private _handleEntityDragLeave(event: DragEvent, locationId: string): void {
    if (!this._hasEntityDragPayload(event)) return;
    const related = event.relatedTarget as HTMLElement | null;
    if (related?.closest?.(`[data-id="${locationId}"]`)) return;
    if (this._entityDropTargetId === locationId) {
      this._entityDropTargetId = undefined;
    }
  }

  private _handleEntityDrop(event: DragEvent, locationId: string): void {
    const entityId = this._readEntityIdFromDrop(event);
    if (!entityId) return;
    event.preventDefault();
    event.stopPropagation();
    this._entityDropTargetId = undefined;
    this.dispatchEvent(
      new CustomEvent("entity-dropped", {
        detail: { entityId, targetLocationId: locationId },
        bubbles: true,
        composed: true,
      })
    );
  }

  private _handleClick(e: Event, location: Location): void {
    const target = e.target as HTMLElement;
    if (
      target.closest(".drag-handle") ||
      target.closest(".expand-btn") ||
      target.closest(".lock-btn") ||
      target.closest(".occupancy-btn")
    ) return;
    this.dispatchEvent(new CustomEvent("location-selected", { detail: { locationId: location.id }, bubbles: true, composed: true }));
  }

  private _handleExpand(e: Event, locationId: string): void {
    e.stopPropagation();
    const next = new Set(this._expandedIds);
    if (next.has(locationId)) {
      next.delete(locationId);
      // Collapsing a branch also collapses all descendants so re-expanding
      // shows only the immediate children (predictable tree behavior).
      const stack = [locationId];
      const seen = new Set<string>();
      while (stack.length) {
        const current = stack.pop()!;
        if (seen.has(current)) continue;
        seen.add(current);
        for (const loc of this.locations) {
          if (loc.parent_id !== current) continue;
          next.delete(loc.id);
          stack.push(loc.id);
        }
      }
    } else {
      next.add(locationId);
    }
    this._expandedIds = next;
  }

  private _startEditing(e: Event, location: Location): void {
    if (!this.allowRename) return;
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
    if (location.is_explicit_root) return;
    e.stopPropagation();
    if (!confirm(`Delete "${location.name}"?`)) return;
    this.dispatchEvent(new CustomEvent("location-delete", { detail: { location }, bubbles: true, composed: true }));
  }

  private _handleCreate(): void {
    if (this.readOnly) return;
    this.dispatchEvent(new CustomEvent("location-create", { bubbles: true, composed: true }));
  }

  private _handleLockToggle(e: Event, location: Location, lockState: LockState): void {
    if (this.readOnly) return;
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent("location-lock-toggle", {
        detail: {
          locationId: location.id,
          lock: !lockState.isLocked,
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  private _handleOccupancyToggle(
    e: Event,
    location: Location,
    isDirectlyOccupied: boolean
  ): void {
    if (this.readOnly) return;
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent("location-occupancy-toggle", {
        detail: {
          locationId: location.id,
          occupied: !isDirectlyOccupied,
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  private _handleOpenSettings(e: Event): void {
    e.preventDefault();
    const nav = (this.hass as any)?.navigate;
    if (typeof nav === "function") {
      nav("/config/areas");
    } else {
      window.location.href = "/config/areas";
    }
  }
}

export const __TEST__ = {
  buildFlatTree,
  zoneFromPointerInRow,
  resolveDropTargetFromZone,
};

if (!customElements.get("ht-location-tree")) {
  customElements.define("ht-location-tree", HtLocationTree);
}
