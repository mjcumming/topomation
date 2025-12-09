import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { HomeAssistant, Location } from "./types";
import { sharedStyles } from "./styles";

import "./ht-location-tree";
import "./ht-location-inspector";

/**
 * Main Home Topology panel
 * Two-column layout: tree on left, inspector on right
 */
@customElement("home-topology-panel")
export class HomeTopologyPanel extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ attribute: false }) public narrow = false;

  @state() private _locations: Location[] = [];
  @state() private _selectedId?: string;
  @state() private _loading = true;
  @state() private _error?: string;

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
      }

      .header-title {
        font-size: 24px;
        font-weight: 500;
        margin-bottom: var(--spacing-xs);
      }

      .header-subtitle {
        font-size: 14px;
        color: var(--text-secondary-color);
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

  connectedCallback(): void {
    super.connectedCallback();
    this._loadLocations();
  }

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
            <div class="header-title">Home Topology</div>
            <div class="header-subtitle">
              Model your space and configure behaviors
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
      const result = await this.hass.callWS<{ locations: Location[] }>({
        type: "home_topology/locations/list",
      });

      this._locations = result.locations;

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

  private _handleLocationSelected(e: CustomEvent): void {
    this._selectedId = e.detail.locationId;
  }

  private _handleLocationCreate(): void {
    // TODO: Show create location dialog
    alert("Create location dialog coming soon");
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

