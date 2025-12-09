import { LitElement, html, css, PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type {
  HomeAssistant,
  Location,
  LocationTreeState,
} from "./types";
import { sharedStyles } from "./styles";

console.log("[ht-location-tree] module loaded");

/**
 * Location tree component
 * Displays hierarchical location structure with expand/collapse
 */
// @customElement("ht-location-tree")
export class HtLocationTree extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ attribute: false }) public locations: Location[] = [];
  @property() public selectedId?: string;

  @state() private _expandedIds = new Set<string>();
  @state() private _error?: string;

  static styles = [
    sharedStyles,
    css`
      :host {
        display: block;
        height: 100%;
        overflow-y: auto;
      }

      .tree-container {
        padding: var(--spacing-md);
      }

      .tree-node {
        display: flex;
        align-items: center;
        padding: var(--spacing-sm) var(--spacing-md);
        cursor: pointer;
        border-radius: var(--border-radius);
        transition: background var(--transition-speed);
        user-select: none;
      }

      .tree-node:hover {
        background: rgba(0, 0, 0, 0.05);
      }

      .tree-node.selected {
        background: var(--primary-color);
        color: white;
      }

      .tree-node.selected:hover {
        background: var(--primary-color);
        opacity: 0.9;
      }

      .tree-node-content {
        display: flex;
        align-items: center;
        flex: 1;
        gap: var(--spacing-sm);
      }

      .expand-icon {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform var(--transition-speed);
      }

      .expand-icon.expanded {
        transform: rotate(90deg);
      }

      .expand-icon.placeholder {
        opacity: 0;
      }

      .location-icon {
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .location-name {
        flex: 1;
        font-size: 14px;
      }

      .tree-children {
        margin-left: var(--spacing-lg);
      }

      .actions {
        display: flex;
        gap: var(--spacing-sm);
        margin-bottom: var(--spacing-md);
      }
    `,
  ];

  protected render() {
    if (this._error) {
      return html`
        <div class="error-text">Error loading locations: ${this._error}</div>
      `;
    }

    if (!this.locations.length) {
      return html`
        <div class="empty-state">
          <div class="empty-state-icon">📍</div>
          <div>No locations yet. Create your first location to get started.</div>
        </div>
      `;
    }

    const rootLocations = this._getRootLocations();

    return html`
      <div class="tree-container">
        <div class="actions">
          <button class="button button-primary" @click=${this._handleCreate}>
            + New Location
          </button>
        </div>
        ${rootLocations.map((loc) => this._renderNode(loc))}
      </div>
    `;
  }

  private _renderNode(location: Location): unknown {
    const children = this._getChildren(location.id);
    const hasChildren = children.length > 0;
    const isExpanded = this._expandedIds.has(location.id);
    const isSelected = this.selectedId === location.id;

    return html`
      <div>
        <div
          class="tree-node ${isSelected ? "selected" : ""}"
          @click=${() => this._handleSelect(location.id)}
        >
          <div class="tree-node-content">
            <div
              class="expand-icon ${isExpanded ? "expanded" : ""} ${hasChildren
                ? ""
                : "placeholder"}"
              @click=${(e: Event) => this._handleExpandToggle(e, location.id)}
            >
              ${hasChildren ? "▶" : ""}
            </div>
            <div class="location-icon">
              ${this._getLocationIcon(location)}
            </div>
            <div class="location-name">${location.name}</div>
          </div>
        </div>
        ${hasChildren && isExpanded
          ? html`
              <div class="tree-children">
                ${children.map((child) => this._renderNode(child))}
              </div>
            `
          : ""}
      </div>
    `;
  }

  private _getRootLocations(): Location[] {
    return this.locations.filter(
      (loc) => loc.parent_id === null || loc.is_explicit_root
    );
  }

  private _getChildren(locationId: string): Location[] {
    return this.locations.filter((loc) => loc.parent_id === locationId);
  }

  private _getLocationIcon(location: Location): string {
    const meta = location.modules._meta as any;
    const type = meta?.type || "room";

    const typeIcons: Record<string, string> = {
      floor: "≡",
      room: "◎",
      zone: "◇",
      suite: "❖",
      outdoor: "⌂",
      building: "▣",
    };

    return typeIcons[type] || "◎";
  }

  private _handleExpandToggle(e: Event, locationId: string): void {
    e.stopPropagation();
    const newExpanded = new Set(this._expandedIds);
    if (newExpanded.has(locationId)) {
      newExpanded.delete(locationId);
    } else {
      newExpanded.add(locationId);
    }
    this._expandedIds = newExpanded;
  }

  private _handleSelect(locationId: string): void {
    this.dispatchEvent(
      new CustomEvent("location-selected", {
        detail: { locationId },
        bubbles: true,
        composed: true,
      })
    );
  }

  private _handleCreate(): void {
    this.dispatchEvent(
      new CustomEvent("location-create", {
        bubbles: true,
        composed: true,
      })
    );
  }
}

if (!customElements.get("ht-location-tree")) {
  try {
    console.log("[ht-location-tree] registering custom element");
    customElements.define("ht-location-tree", HtLocationTree);
  } catch (err) {
    console.error("[ht-location-tree] failed to define element", err);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ht-location-tree": HtLocationTree;
  }
}

