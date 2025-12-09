import { LitElement, html, css, PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { HomeAssistant, Location } from "./types";
import { sharedStyles } from "./styles";

import "./ht-location-tree";
import "./ht-location-inspector";

console.log("[home-topology-panel] module loaded");

/**
 * Main Home Topology panel
 * Two-column layout: tree on left, inspector on right
 */
// @customElement("home-topology-panel")
export class HomeTopologyPanel extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ attribute: false }) public narrow = false;

  @state() private _locations: Location[] = [];
  @state() private _selectedId?: string;
  @state() private _loading = true;
  @state() private _error?: string;

  private _hasLoaded = false;
  private _pendingLoadTimer?: number;

  constructor() {
    super();
    console.log("HomeTopologyPanel constructed");
  }

  protected willUpdate(changedProps: PropertyValues): void {
    super.willUpdate(changedProps);
    if (!this._hasLoaded && this.hass) {
      this._hasLoaded = true;
      console.log("Hass available, loading locations...");
      this._loadLocations();
    }
  }

  connectedCallback(): void {
    super.connectedCallback();
    console.log("HomeTopologyPanel connected");
    this._scheduleInitialLoad();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._pendingLoadTimer) {
      clearTimeout(this._pendingLoadTimer);
      this._pendingLoadTimer = undefined;
    }
  }

  static styles = [
    sharedStyles,
    css`
      :host {
        display: block;
        height: 100%;
        background: var(--primary-background-color, #fafafa);
      }

      .panel-container {
        display: flex;
        height: 100%;
        gap: 1px;
        background: var(--divider-color);
      }

      .panel-left {
        flex: 0 0 400px;
        background: var(--card-background-color);
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .panel-right {
        flex: 1;
        background: var(--card-background-color);
        overflow: hidden;
      }

      @media (max-width: 1024px) {
        .panel-left {
          flex: 0 0 300px;
        }
      }

      @media (max-width: 768px) {
        .panel-container {
          flex-direction: column;
        }

        .panel-left,
        .panel-right {
          flex: 1;
        }
      }

      .header {
        padding: var(--spacing-lg);
        border-bottom: 1px solid var(--divider-color);
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
      }

      .header-title {
        font-size: 22px;
        font-weight: 600;
      }

      .header-subtitle {
        font-size: 13px;
        color: var(--text-secondary-color);
      }

      .header-actions {
        display: flex;
        gap: var(--spacing-sm);
        flex-wrap: wrap;
      }

      .loading-container {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        flex-direction: column;
        gap: var(--spacing-md);
      }

      .spinner {
        border: 3px solid var(--divider-color);
        border-top: 3px solid var(--primary-color);
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }

      .error-container {
        padding: var(--spacing-lg);
        color: var(--error-color);
      }
    `,
  ];

  protected render() {
    if (this._loading) {
      return html`
        <div class="loading-container">
          <div class="spinner"></div>
          <div class="text-muted">Loading locations...</div>
        </div>
      `;
    }

    if (this._error) {
      return html`
        <div class="error-container">
          <h3>Error Loading Home Topology</h3>
          <p>${this._error}</p>
          <button class="button button-primary" @click=${this._loadLocations}>
            Retry
          </button>
        </div>
      `;
    }

    const selectedLocation = this._locations.find(
      (loc) => loc.id === this._selectedId
    );

    return html`
      <div class="panel-container">
        <div class="panel-left">
          <div class="header">
            <div class="header-title">Location Manager</div>
            <div class="header-subtitle">Manage your home topology hierarchy.</div>
            <div class="header-actions">
              <button class="button button-primary" @click=${this._handleSaveChanges} disabled>
                Save Changes
              </button>
              <button class="button button-secondary" @click=${this._seedDemoData}>
                ⚡ Seed Demo Data
              </button>
            </div>
          </div>
          <ht-location-tree
            .hass=${this.hass}
            .locations=${this._locations}
            .selectedId=${this._selectedId}
            @location-selected=${this._handleLocationSelected}
            @location-create=${this._handleLocationCreate}
          ></ht-location-tree>
        </div>

        <div class="panel-right">
          <div class="header" style="border-bottom: 1px solid var(--divider-color);">
            <div class="header-title">Modules</div>
            <div class="header-subtitle">Configure the selected location.</div>
          </div>
          <ht-location-inspector
            .hass=${this.hass}
            .location=${selectedLocation}
          ></ht-location-inspector>
        </div>
      </div>
    `;
  }

  private async _loadLocations(): Promise<void> {
    this._loading = true;
    this._error = undefined;

    try {
      if (!this.hass) {
        throw new Error("Home Assistant connection not ready");
      }

      const result = await Promise.race([
        this.hass.callWS<{ locations: Location[] }>({
          type: "home_topology/locations/list",
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout loading locations")), 8000)
        ),
      ]);

      this._locations = (result as { locations: Location[] }).locations;

      // Auto-select first location if none selected
      if (!this._selectedId && this._locations.length > 0) {
        this._selectedId = this._locations[0].id;
      }
    } catch (err: any) {
      console.error("Failed to load locations:", err);
      this._error = err.message || "Failed to load locations";
    } finally {
      this._loading = false;
    }
  }

  private _scheduleInitialLoad(): void {
    if (this._hasLoaded) return;
    if (this.hass) {
      this._hasLoaded = true;
      console.log("Hass available, loading locations...");
      this._loadLocations();
      return;
    }
    // hass not yet injected; try again shortly
    this._pendingLoadTimer = window.setTimeout(() => this._scheduleInitialLoad(), 300);
  }

  private _handleLocationSelected(e: CustomEvent): void {
    this._selectedId = e.detail.locationId;
  }

  private _handleLocationCreate(): void {
    // TODO: Show create location dialog
    alert("Create location dialog coming soon");
  }

  private _handleSaveChanges(): void {
    // TODO: Wire up pending changes persistence
    alert("Save Changes coming soon");
  }

  private async _seedDemoData(): Promise<void> {
    if (!confirm("This will create a demo topology. Continue?")) return;

    const locations = [
      { id: "ground_floor", name: "Ground Floor", type: "floor", parent_id: "house" },
      { id: "living_room", name: "Living Room", type: "room", parent_id: "ground_floor" },
      { id: "reading_corner", name: "Reading Corner", type: "zone", parent_id: "living_room" },
      { id: "kitchen", name: "Kitchen", type: "room", parent_id: "ground_floor" },
      { id: "dining_room", name: "Dining Room", type: "room", parent_id: "ground_floor" },
      { id: "hallway", name: "Hallway", type: "room", parent_id: "ground_floor" },
      { id: "office", name: "Office", type: "room", parent_id: "ground_floor" },
      { id: "garage", name: "Garage", type: "room", parent_id: "ground_floor" },

      { id: "first_floor", name: "First Floor", type: "floor", parent_id: "house" },
      { id: "master_suite", name: "Master Suite", type: "suite", parent_id: "first_floor" },
      { id: "master_bedroom", name: "Master Bedroom", type: "room", parent_id: "master_suite" },
      { id: "master_bath", name: "Master Bath", type: "room", parent_id: "master_suite" },
      { id: "kids_room", name: "Kids Room", type: "room", parent_id: "first_floor" },
      { id: "guest_room", name: "Guest Room", type: "room", parent_id: "first_floor" },

      { id: "outdoor", name: "Outdoor", type: "outdoor", parent_id: "house" },
      { id: "patio", name: "Patio", type: "zone", parent_id: "outdoor" },
      { id: "garden", name: "Garden", type: "zone", parent_id: "outdoor" },
    ];

    try {
      this._loading = true;

      // Ensure root "house" exists (created by backend on setup, but just in case)
      // We skip creating 'house' as it's default.

      for (const loc of locations) {
        console.log(`Creating ${loc.name}...`);
        try {
          await this.hass.callWS({
            type: "home_topology/locations/create",
            name: loc.name,
            parent_id: loc.parent_id,
            meta: { type: loc.type }
          });
        } catch (e: any) {
          console.warn(`Failed to create ${loc.name} (might exist):`, e);
        }
      }

      await this._loadLocations();
      alert("Demo data seeded successfully!");
    } catch (e: any) {
      console.error("Seeding failed:", e);
      alert(`Seeding failed: ${e.message}`);
    } finally {
      this._loading = false;
    }
  }
}

if (!customElements.get("home-topology-panel")) {
  try {
    console.log("[home-topology-panel] registering custom element");
    customElements.define("home-topology-panel", HomeTopologyPanel);
  } catch (err) {
    console.error("[home-topology-panel] failed to define element", err);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "home-topology-panel": HomeTopologyPanel;
  }

  interface HASSDomEvents {
    "location-selected": { locationId: string };
    "location-create": {};
  }
}

