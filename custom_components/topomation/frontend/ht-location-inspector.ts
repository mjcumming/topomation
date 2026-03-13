import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import type {
  AdjacencyEdge,
  AmbientConfig,
  AmbientLightReading,
  HandoffTrace,
  HomeAssistant,
  Location,
  OccupancyConfig,
  OccupancySource,
  TopomationActionRule,
  WaspInBoxConfig,
  WaspInBoxPreset,
} from "./types";
import { sharedStyles } from "./styles";
import { getLocationIcon } from "./icon-utils";
import { getLocationType } from "./hierarchy-rules";
import {
  isSystemShadowLocation,
  managedShadowAreaIdForHost,
  managedShadowLocationIdSet,
} from "./shadow-location-utils";
import { applyModeDefaults, getSourceDefaultsForEntity } from "./source-profile-utils";
import {
  createTopomationActionRule,
  deleteTopomationActionRule,
  listTopomationActionRules,
} from "./ha-automation-rules";

type SourceSignalKey = OccupancySource["signal_key"];
type CandidateItem = { key: string; entityId: string; signalKey?: SourceSignalKey };
type WiabEntityListKey = "interior_entities" | "door_entities" | "exterior_door_entities";
type InspectorTab =
  | "detection"
  | "ambient"
  | "lighting"
  | "media"
  | "hvac";
type InspectorTabRequest = InspectorTab | "occupancy";
type DeviceAutomationTab = "lighting" | "media" | "hvac";
type OccupancyLockDirective = {
  sourceId: string;
  mode: string;
  scope: string;
};
type InspectorLockState = {
  isLocked: boolean;
  lockedBy: string[];
  lockModes: string[];
  directLocks: OccupancyLockDirective[];
};
type OccupancyTransitionState = {
  occupied: boolean;
  previousOccupied?: boolean;
  reason?: string;
  changedAt?: string;
};
type EntityRegistryMeta = {
  hiddenBy?: string | null;
  disabledBy?: string | null;
  entityCategory?: string | null;
};
type SyncLocationScope = {
  candidateType: "area" | "floor";
  parentId: string;
  parentType: "area" | "floor" | "building";
};
type RuleActionTarget = {
  entity_id: string;
  service: string;
  data?: Record<string, unknown>;
};

// Dev UX: custom elements cannot be hot-replaced. On HMR updates, force a quick reload.
try {
  (import.meta as any)?.hot?.accept(() => window.location.reload());
} catch {
  // ignore (non-Vite environments)
}

/**
 * Location inspector panel
 * Shows details and configuration for selected location
 */
// @customElement("ht-location-inspector")
export class HtLocationInspector extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ attribute: false }) public location?: Location;
  @property({ attribute: false }) public allLocations: Location[] = [];
  @property({ attribute: false }) public adjacencyEdges: AdjacencyEdge[] = [];
  @property({ attribute: false }) public entryId?: string;
  @property({ type: Number }) public entityRegistryRevision = 0;
  @property({ type: String }) public forcedTab?: InspectorTabRequest;
  @property({ attribute: false }) public occupancyStates: Record<string, boolean> = {};
  @property({ attribute: false })
  public occupancyTransitions: Record<string, OccupancyTransitionState> = {};
  @property({ attribute: false }) public handoffTraces: HandoffTrace[] = [];

  // Ensure reactivity even if decorator transforms are unavailable in a given toolchain.
  static properties = {
    hass: { attribute: false },
    location: { attribute: false },
    allLocations: { attribute: false },
    adjacencyEdges: { attribute: false },
    entryId: { attribute: false },
    entityRegistryRevision: { type: Number },
    forcedTab: { type: String },
    occupancyStates: { attribute: false },
    occupancyTransitions: { attribute: false },
    handoffTraces: { attribute: false },
  };

  @state() private _activeTab: InspectorTab = "detection";
  @state() private _occupancyDraft?: OccupancyConfig;
  @state() private _occupancyDraftDirty = false;
  @state() private _occupancySaveError?: string;
  @state() private _savingOccupancyDraft = false;
  @state() private _pendingOccupancyByLocation: Record<string, OccupancyConfig> = {};
  @state() private _externalAreaId = "";
  @state() private _externalEntityId = "";
  @state() private _entityAreaById: Record<string, string | null> = {};
  @state() private _entityRegistryMetaById: Record<string, EntityRegistryMeta> = {};
  @state() private _actionRules: TopomationActionRule[] = [];
  @state() private _actionRulesDraft?: TopomationActionRule[];
  @state() private _actionRulesDraftDirty = false;
  @state() private _savingActionRules = false;
  @state() private _loadingActionRules = false;
  @state() private _actionRulesError?: string;
  @state() private _actionRulesSaveError?: string;
  @state() private _liveOccupancyStateByLocation: Record<string, Record<string, any>> = {};
  @state() private _nowEpochMs = Date.now();
  @state() private _editingActionRuleNameId?: string;
  @state() private _editingActionRuleNameValue = "";
  private _actionRuleTabById: Record<string, DeviceAutomationTab> = {};
  @state() private _syncImportInProgress = false;
  @state() private _showAdvancedAdjacency = false;
  @state() private _showRecentOccupancyEvents = false;
  @state() private _adjacencyNeighborId = "";
  @state() private _adjacencyBoundaryType = "door";
  @state() private _adjacencyDirection = "bidirectional";
  @state() private _adjacencyCrossingSources = "";
  @state() private _adjacencyHandoffWindowSec = 12;
  @state() private _adjacencyPriority = 50;
  @state() private _savingAdjacency = false;
  @state() private _wiabInteriorEntityId = "";
  @state() private _wiabDoorEntityId = "";
  @state() private _wiabExteriorDoorEntityId = "";
  @state() private _wiabShowAllEntities = false;
  @state() private _ambientReading?: AmbientLightReading;
  @state() private _ambientDraft?: AmbientConfig;
  @state() private _ambientDraftDirty = false;
  @state() private _ambientSaveError?: string;
  @state() private _loadingAmbientReading = false;
  @state() private _ambientReadingError?: string;
  @state() private _savingAmbientConfig = false;
  private _onTimeoutMemory: Record<string, number> = {};
  private _entityAreaLoadPromise?: Promise<void>;
  private _actionRulesLoadSeq = 0;
  private _ambientReadingLoadSeq = 0;
  private _ambientReadingReloadTimer?: number;
  private _clockTimer?: number;
  private _unsubAutomationStateChanged?: () => void;
  private _automationStateSubscriptionConnection?: unknown;
  private _actionRulesReloadTimer?: number;
  private _beforeUnloadHandler = (event: BeforeUnloadEvent) => {
    if (!this._hasUnsavedDrafts()) return;
    event.preventDefault();
    event.returnValue = "";
  };

  static styles = [
    sharedStyles,
    css`
      :host {
        display: block;
        height: 100%;
        overflow-y: auto;
      }

      .inspector-container {
        padding: var(--spacing-md);
        padding-bottom: calc(var(--spacing-xl) + 80px);
      }

      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--spacing-md);
        margin-bottom: var(--spacing-lg);
        padding: var(--spacing-md);
        background: rgba(var(--rgb-primary-color), 0.05);
        border-radius: var(--border-radius);
      }

      .header-main {
        display: flex;
        align-items: center;
        gap: var(--spacing-lg);
        min-width: 0;
      }

      .header-icon {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--card-background-color);
        border-radius: 50%;
        color: var(--primary-color);
        box-shadow: var(--ha-card-box-shadow, 0 2px 4px rgba(0,0,0,0.1));
        --mdc-icon-size: 32px;
      }

      .header-content {
        min-width: 0;
      }

      .location-name {
        font-size: 24px;
        font-weight: 600;
        color: var(--primary-text-color);
        line-height: 1.2;
      }

      .header-status {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        margin-top: 8px;
      }

      .header-vacant-at {
        font-size: 12px;
        color: var(--text-secondary-color);
      }

      .header-ambient {
        font-size: 12px;
        color: var(--text-secondary-color);
        font-family: var(--code-font-family, monospace);
      }

      .header-lock-state {
        font-size: 12px;
        color: var(--text-secondary-color);
      }

      .ambient-grid {
        display: grid;
        grid-template-columns: minmax(150px, 220px) 1fr;
        gap: 8px 12px;
        margin-bottom: var(--spacing-md);
      }

      .ambient-key {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-secondary-color);
        font-weight: 700;
      }

      .ambient-value {
        font-size: 13px;
        color: var(--primary-text-color);
      }

      .dusk-status-grid {
        display: grid;
        grid-template-columns: minmax(160px, 220px) 1fr;
        gap: 8px 12px;
      }

      .dusk-status-key {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-secondary-color);
        font-weight: 700;
      }

      .dusk-status-value {
        font-size: 13px;
        color: var(--primary-text-color);
      }

      .dusk-target-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
        max-height: 220px;
        overflow-y: auto;
      }

      .dusk-target-row {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
      }

      .dusk-target-row code {
        font-size: 11px;
        color: var(--text-secondary-color);
      }

      .dusk-light-actions {
        margin-top: 10px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .dusk-light-action-row {
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        padding: 8px;
        background: var(--card-background-color);
      }

      .dusk-light-action-grid {
        display: grid;
        grid-template-columns:
          26px
          minmax(170px, 260px)
          minmax(240px, 360px)
          minmax(70px, 100px)
          minmax(140px, 200px);
        gap: 8px;
        align-items: center;
      }

      .dusk-light-action-grid.disabled {
        opacity: 0.65;
      }

      .dusk-light-entity-meta {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }

      .dusk-light-entity-meta code {
        font-size: 11px;
        color: var(--text-secondary-color);
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .dusk-light-action-grid input[type="color"] {
        width: 44px;
        height: 30px;
        padding: 0;
        border: 1px solid var(--divider-color);
        border-radius: 6px;
        background: var(--card-background-color);
      }

      .dusk-light-action-grid select {
        width: 100%;
      }

      .dusk-level-control {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        width: 100%;
      }

      .dusk-level-slider {
        width: 100%;
      }

      .dusk-level-value {
        min-width: 38px;
        font-size: 12px;
        color: var(--text-secondary-color);
      }

      .dusk-off-only-toggle {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: var(--text-secondary-color);
        user-select: none;
      }

      .dusk-off-only-toggle input[type="checkbox"] {
        width: 16px;
        height: 16px;
      }

      .dusk-block-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-top: 6px;
      }

      .dusk-block-row {
        border: 1px solid var(--divider-color);
        border-radius: var(--border-radius);
        padding: 16px;
        background: rgba(var(--rgb-primary-color), 0.03);
      }

      .dusk-block-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 12px;
      }

      .dusk-block-title {
        font-size: 16px;
        font-weight: 600;
        color: var(--primary-text-color);
      }

      .dusk-block-title-button {
        border: none;
        background: transparent;
        color: var(--primary-text-color);
        font-size: 16px;
        font-weight: 600;
        padding: 2px 4px;
        cursor: pointer;
        text-align: left;
        border-radius: 6px;
      }

      .dusk-block-title-button:hover {
        background: rgba(var(--rgb-primary-color), 0.08);
      }

      .dusk-block-title-input {
        width: min(100%, 380px);
        font-size: 16px;
        font-weight: 600;
      }

      .dusk-rule-row {
        display: grid;
        grid-template-columns: minmax(180px, 230px) minmax(320px, 1fr);
        gap: 12px;
        align-items: center;
        margin-top: 12px;
      }

      .dusk-section-heading {
        margin-top: 18px;
        margin-bottom: 8px;
      }

      .dusk-rule-section-title {
        margin-top: 18px;
        margin-bottom: 6px;
        font-size: 14px;
        font-weight: 500;
        letter-spacing: 0;
        text-transform: none;
        color: var(--primary-text-color);
      }

      .dusk-block-footer {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        flex-wrap: wrap;
        margin-top: 12px;
      }

      .dusk-delete-rule-button {
        min-width: 112px;
      }

      .dusk-list-footer {
        display: flex;
        justify-content: flex-end;
        margin-top: 12px;
      }

      .dusk-conditions {
        margin-top: 14px;
        margin-bottom: 20px;
        margin-left: 8px;
        padding-left: 12px;
        border-left: 2px solid rgba(var(--rgb-primary-color), 0.18);
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .dusk-conditions .config-row {
        grid-template-columns: minmax(220px, 320px) minmax(320px, 1fr);
        padding: 8px 0;
        border-bottom: none;
      }

      .dusk-conditions .config-value {
        width: 100%;
      }

      .dusk-condition-derived {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 7px 10px;
        border-radius: 8px;
        border: 1px solid var(--divider-color);
        background: var(--card-background-color);
        color: var(--primary-text-color);
        font-size: 13px;
        font-weight: 500;
      }

      .dusk-condition-derived-note {
        color: var(--text-secondary-color);
        font-size: 12px;
        font-weight: 400;
      }

      .dusk-wide-select {
        min-width: 340px;
        width: min(100%, 560px);
        max-width: 560px;
      }

      .dusk-block-grid {
        display: grid;
        grid-template-columns: minmax(120px, 160px) minmax(180px, 1fr);
        gap: 10px;
        align-items: center;
      }

      .dusk-block-grid input[type="time"],
      .dusk-block-grid input[type="number"],
      .dusk-block-grid input[type="text"] {
        width: 100%;
      }

      .dusk-time-fields {
        display: grid;
        grid-template-columns: repeat(2, minmax(200px, 260px));
        gap: 12px;
        max-width: 560px;
      }

      .dusk-time-inline {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }

      .dusk-time-inline-fields {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }

      .dusk-time-field {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 122px;
      }

      .dusk-time-input {
        width: 100%;
        min-height: 36px;
      }

      .dusk-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin: 10px 0 12px;
      }

      .dusk-save-button {
        appearance: none;
        border: 1px solid var(--divider-color);
        background: var(--card-background-color);
        color: var(--primary-text-color);
        border-radius: 8px;
        padding: 8px 12px;
        min-width: 114px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        line-height: 1.2;
      }

      .dusk-save-button.dirty {
        border-color: var(--primary-color);
        background: var(--primary-color);
        color: #fff;
      }

      .dusk-save-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .draft-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin: 0 0 10px;
        max-width: 900px;
      }

      .draft-toolbar-note {
        font-size: 12px;
        color: var(--text-secondary-color);
      }

      .draft-toolbar-actions {
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }

      .sticky-draft-bar {
        position: sticky;
        bottom: 0;
        z-index: 5;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-top: 16px;
        padding: 12px 16px;
        border: 1px solid var(--divider-color);
        border-radius: 12px;
        background: color-mix(in srgb, var(--card-background-color) 92%, white 8%);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
      }

      .sticky-draft-bar-note {
        font-size: 13px;
        font-weight: 500;
        color: var(--primary-text-color);
      }

      .sticky-draft-bar-actions {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin-left: auto;
      }

      .draft-save-button {
        min-width: 124px;
      }

      .draft-toolbar-actions-only {
        justify-content: flex-end;
      }

      .dusk-inline-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 8px;
      }

      .dusk-inline-actions-end {
        justify-content: flex-end;
        margin-top: 14px;
      }

      .section-title-actions .button,
      .dusk-list-footer .button,
      .dusk-inline-actions-end .button {
        min-width: 108px;
        white-space: nowrap;
      }

      .occupancy-events {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-top: 10px;
        max-width: 820px;
      }

      .occupancy-event {
        display: inline-flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        font-size: 12px;
        color: var(--primary-text-color);
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        padding: 6px 8px;
        background: rgba(var(--rgb-primary-color), 0.03);
      }

      .occupancy-event-source {
        font-weight: 600;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .occupancy-event-meta {
        color: var(--text-secondary-color);
        white-space: nowrap;
      }

      .header-meta {
        min-width: 180px;
        display: flex;
        justify-content: flex-end;
      }

      .meta-row {
        display: grid;
        grid-template-columns: auto 1fr;
        align-items: baseline;
        gap: 8px;
        margin-top: 4px;
      }

      .meta-label {
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--secondary-text-color);
        text-align: right;
      }

      .meta-value {
        font-size: 12px;
        font-family: var(--code-font-family, monospace);
        color: var(--primary-text-color);
        text-align: right;
      }

      .runtime-summary {
        max-width: 900px;
        margin-bottom: var(--spacing-md);
        padding: 10px 12px;
        border: 1px solid var(--divider-color);
        border-radius: var(--border-radius);
        background: var(--card-background-color);
      }

      .runtime-summary-head {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }

      .status-chip {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 2px 10px;
        font-size: 12px;
        font-weight: 600;
        border: 1px solid var(--divider-color);
      }

      .status-chip.occupied {
        color: var(--success-color);
        border-color: rgba(var(--rgb-success-color), 0.35);
        background: rgba(var(--rgb-success-color), 0.08);
      }

      .status-chip.vacant {
        color: var(--text-secondary-color);
      }

      .status-chip.locked {
        color: var(--warning-color);
        border-color: rgba(var(--rgb-warning-color), 0.35);
        background: rgba(var(--rgb-warning-color), 0.08);
      }

      .runtime-summary-grid {
        display: grid;
        grid-template-columns: max-content 1fr;
        gap: 6px 12px;
        max-width: 560px;
      }

      .runtime-summary-key {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-secondary-color);
        font-weight: 700;
      }

      .runtime-summary-value {
        font-size: 14px;
        color: var(--primary-text-color);
      }

      .card-section {
        background: var(--card-background-color);
        border-radius: var(--border-radius);
        border: 1px solid var(--divider-color);
        padding: var(--spacing-md);
        margin-bottom: var(--spacing-md);
        max-width: 900px;
      }

      .section-title {
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: var(--secondary-text-color);
        margin-bottom: var(--spacing-md);
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .section-title-row {
        max-width: 900px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 6px;
      }

      .section-title-row .section-title {
        margin-bottom: 0;
      }

      .section-title-actions {
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }

      .section-title ha-icon {
        --mdc-icon-size: 16px;
      }

      .sources-heading {
        margin-bottom: var(--spacing-sm);
        max-width: 820px;
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 12px;
      }

      .sources-heading .section-title {
        margin-bottom: 0;
      }

      .sources-inline-help {
        color: var(--text-secondary-color);
        font-size: 12px;
      }

      .tabs {
        display: flex;
        gap: var(--spacing-sm);
        margin-bottom: var(--spacing-md);
        border-bottom: 1px solid var(--divider-color);
      }

      .tab {
        padding: var(--spacing-sm) var(--spacing-md);
        background: transparent;
        border: none;
        border-bottom: 2px solid transparent;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        color: var(--text-secondary-color);
        transition: all var(--transition-speed);
      }

      .tab:hover {
        color: var(--text-primary-color);
      }

      .tab.active {
        color: var(--primary-color);
        border-bottom-color: var(--primary-color);
      }

      .tab-content {
        padding: 8px 0 0;
      }

      .config-row {
        display: grid;
        grid-template-columns: minmax(220px, 320px) minmax(120px, max-content);
        align-items: center;
        justify-content: start;
        column-gap: 16px;
        padding: var(--spacing-md) 0;
        border-bottom: 1px solid var(--divider-color);
      }

      .settings-grid {
        max-width: 620px;
      }

      .config-row:last-child {
        border-bottom: none;
      }

      .config-label {
        font-size: 14px;
        font-weight: 500;
      }

      .config-help {
        margin-top: 3px;
        color: var(--text-secondary-color);
        font-size: 12px;
      }

      .startup-config-row {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding-top: 4px;
      }

      .startup-config-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }

      .startup-config-row .config-help {
        margin-top: 0;
        max-width: 700px;
        line-height: 1.45;
      }

      .startup-config-row .config-value {
        flex: 0 0 auto;
      }

      .config-value {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        justify-self: start;
      }

      .switch-input {
        width: 18px;
        height: 18px;
        cursor: pointer;
      }

      .startup-inline {
        max-width: 900px;
        margin-bottom: var(--spacing-md);
        padding: 10px 12px;
        border: 1px solid var(--divider-color);
        border-radius: var(--border-radius);
        background: var(--card-background-color);
      }

      .startup-inline-toggle {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        font-size: 14px;
        font-weight: 600;
        color: var(--primary-text-color);
      }

      .startup-inline-help {
        margin-top: 6px;
        font-size: 12px;
        color: var(--text-secondary-color);
      }

      .input {
        padding: var(--spacing-sm);
        border: 1px solid var(--divider-color);
        border-radius: var(--border-radius);
        font-size: 14px;
        width: 84px;
      }

      .dusk-time-field .input {
        width: 132px;
        min-width: 132px;
      }

      .timeout-slider {
        width: 240px;
      }

      .sources-list {
        margin-top: var(--spacing-md);
        max-width: 820px;
      }

      .contribution-summary {
        margin-top: var(--spacing-sm);
        padding: 10px 12px;
        border: 1px solid var(--divider-color);
        border-radius: var(--border-radius);
        background: rgba(var(--rgb-primary-color), 0.05);
        font-size: 12px;
        max-width: 820px;
      }

      .contribution-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: var(--spacing-sm);
        margin-top: var(--spacing-xs);
      }

      .contribution-cell {
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        background: var(--card-background-color);
        padding: 8px;
      }

      .contribution-label {
        color: var(--text-secondary-color);
        font-size: 11px;
      }

      .contribution-value {
        font-size: 16px;
        font-weight: 700;
      }

      .source-item {
        display: grid;
        grid-template-columns: 24px minmax(0, 1fr) auto;
        gap: var(--spacing-md);
        padding: var(--spacing-md);
        background: var(--card-background-color);
        border: 1px solid var(--divider-color);
        border-radius: var(--border-radius);
        margin-bottom: var(--spacing-sm);
        max-width: 820px;
      }

      .action-device-list {
        display: grid;
        gap: var(--spacing-sm);
        max-width: 820px;
      }

      .action-device-row.enabled {
        border-color: rgba(var(--rgb-primary-color), 0.35);
        background: rgba(var(--rgb-primary-color), 0.05);
      }

      .action-device-row {
        grid-template-columns: 28px 24px minmax(0, 1fr) auto;
      }

      .action-include-control {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .action-include-input {
        appearance: auto;
        width: 18px;
        height: 18px;
        cursor: pointer;
        accent-color: var(--primary-color);
      }

      .action-include-input:focus-visible {
        outline: 2px solid rgba(var(--rgb-primary-color), 0.45);
        outline-offset: 2px;
      }

      .action-controls {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 10px;
      }

      .action-service-select {
        min-width: 170px;
        border: 1px solid var(--divider-color);
        border-radius: 6px;
        padding: 6px 8px;
        font-size: 12px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
      }

      .action-dark-toggle {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: var(--text-secondary-color);
        cursor: pointer;
        user-select: none;
      }

      .action-dark-input {
        width: 14px;
        height: 14px;
        cursor: pointer;
        accent-color: var(--primary-color);
      }

      .service-pill {
        display: inline-flex;
        align-items: center;
        padding: 1px 8px;
        border-radius: 999px;
        background: rgba(var(--rgb-primary-color), 0.1);
        color: var(--primary-color);
        font-weight: 600;
      }

      .source-icon {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .source-info {
        flex: 1;
      }

      .source-name {
        font-size: 14px;
        font-weight: 500;
      }

      .action-name-row {
        display: flex;
        align-items: baseline;
        gap: 6px;
        flex-wrap: wrap;
      }

      .action-entity-inline {
        color: var(--text-secondary-color);
        font-size: 11px;
        font-weight: 500;
        font-family: var(--code-font-family, monospace);
      }

      .source-details {
        font-size: 12px;
        color: var(--text-secondary-color);
        margin-top: var(--spacing-xs);
      }

      .source-events {
        margin-top: var(--spacing-sm);
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacing-xs);
      }

      .event-chip {
        display: inline-flex;
        align-items: center;
        padding: 2px 8px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 600;
        background: rgba(var(--rgb-primary-color), 0.08);
        color: var(--primary-color);
      }

      .event-chip.off {
        background: rgba(var(--rgb-warning-color), 0.12);
        color: var(--warning-color);
      }

      .event-chip.ignore {
        background: rgba(var(--rgb-disabled-color, 120, 120, 120), 0.18);
        color: var(--text-secondary-color);
      }

      .policy-note {
        font-size: 13px;
        color: var(--text-secondary-color);
        line-height: 1.45;
      }

      .policy-warning {
        margin-top: var(--spacing-sm);
        font-size: 12px;
        color: var(--warning-color);
      }

      .lock-banner {
        margin: 0 0 var(--spacing-md);
        padding: 10px 12px;
        border: 1px solid rgba(var(--rgb-warning-color), 0.4);
        border-radius: 8px;
        background: rgba(var(--rgb-warning-color), 0.1);
      }

      .lock-title {
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.4px;
        color: var(--warning-color);
      }

      .lock-details {
        margin-top: 4px;
        font-size: 13px;
        color: var(--primary-text-color);
      }

      .runtime-grid {
        display: grid;
        row-gap: 8px;
        margin-bottom: var(--spacing-md);
      }

      .runtime-row {
        display: grid;
        grid-template-columns: minmax(180px, 240px) 1fr;
        align-items: center;
        column-gap: 12px;
      }

      .runtime-key {
        font-size: 12px;
        font-weight: 700;
        color: var(--text-secondary-color);
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }

      .runtime-value {
        font-size: 14px;
        color: var(--primary-text-color);
      }

      .runtime-note {
        margin-top: 8px;
        font-size: 12px;
        color: var(--text-secondary-color);
      }

      .lock-directive-list {
        margin-top: 8px;
        display: grid;
        gap: 6px;
      }

      .lock-directive {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        font-size: 12px;
        color: var(--primary-text-color);
      }

      .lock-pill {
        display: inline-flex;
        align-items: center;
        border: 1px solid rgba(var(--rgb-warning-color), 0.35);
        border-radius: 999px;
        padding: 2px 8px;
        color: var(--warning-color);
        background: rgba(var(--rgb-warning-color), 0.08);
      }

      .subsection-title {
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.4px;
        text-transform: uppercase;
        color: var(--text-secondary-color);
      }

      .subsection-header {
        margin-top: var(--spacing-md);
        margin-bottom: var(--spacing-sm);
        max-width: 820px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .candidate-list {
        display: grid;
        gap: var(--spacing-sm);
        max-width: 820px;
      }

      .source-card {
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        background: var(--card-background-color);
        overflow: hidden;
      }

      .source-card.enabled {
        border-color: rgba(var(--rgb-primary-color), 0.25);
        background: rgba(var(--rgb-primary-color), 0.03);
      }

      .source-card-item.grouped {
        border-top: 1px solid var(--divider-color);
      }

      .subsection-help {
        margin-bottom: var(--spacing-sm);
        color: var(--text-secondary-color);
        font-size: 12px;
        max-width: 820px;
      }

      .linked-location-list {
        display: grid;
        gap: 8px;
        max-width: 820px;
      }

      .linked-location-row {
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        padding: 8px 10px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        background: rgba(var(--rgb-primary-color), 0.02);
      }

      .linked-location-left,
      .linked-location-right {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .linked-location-left {
        min-width: 0;
      }

      .linked-location-row input[type="checkbox"] {
        margin: 0;
      }

      .linked-location-name {
        font-size: 13px;
        font-weight: 600;
      }

      .linked-location-two-way-label {
        font-size: 12px;
        color: var(--text-secondary-color);
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }

      .linked-location-meta {
        color: var(--text-secondary-color);
        font-size: 12px;
      }

      .advanced-toggle-row {
        display: flex;
        justify-content: flex-end;
        max-width: 820px;
      }

      .adjacency-list {
        display: grid;
        gap: 8px;
        margin-bottom: 12px;
        max-width: 820px;
      }

      .adjacency-row {
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        padding: 8px 10px;
        background: rgba(var(--rgb-primary-color), 0.03);
      }

      .adjacency-row-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }

      .adjacency-neighbor {
        font-size: 13px;
        font-weight: 600;
      }

      .adjacency-meta {
        margin-top: 4px;
        color: var(--text-secondary-color);
        font-size: 12px;
      }

      .adjacency-delete-btn {
        font-size: 11px;
        padding: 4px 8px;
      }

      .adjacency-empty {
        color: var(--text-secondary-color);
        font-size: 12px;
        margin-bottom: 8px;
      }

      .adjacency-form {
        display: grid;
        gap: 10px;
        max-width: 820px;
      }

      .adjacency-form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 10px;
      }

      .adjacency-form-field {
        display: grid;
        gap: 4px;
      }

      .adjacency-form-field label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-secondary-color);
        font-weight: 700;
      }

      .adjacency-form-field input,
      .adjacency-form-field select {
        border: 1px solid var(--divider-color);
        border-radius: 6px;
        padding: 6px 8px;
        font-size: 13px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
      }

      .adjacency-form-actions {
        display: flex;
        justify-content: flex-end;
      }

      .handoff-trace-list {
        display: grid;
        gap: 8px;
        max-width: 820px;
      }

      .handoff-trace-row {
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        padding: 8px 10px;
        background: rgba(var(--rgb-primary-color), 0.02);
      }

      .handoff-trace-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        font-size: 12px;
      }

      .handoff-trace-route {
        font-weight: 700;
      }

      .handoff-trace-time {
        color: var(--text-secondary-color);
      }

      .handoff-trace-meta {
        margin-top: 4px;
        font-size: 12px;
        color: var(--text-secondary-color);
      }

      .candidate-item {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: var(--spacing-md);
        align-items: center;
        padding: 8px 10px;
        border: none;
        border-radius: 0;
        background: transparent;
      }

      .candidate-item:hover {
        background: rgba(var(--rgb-primary-color), 0.04);
      }

      .candidate-title {
        font-size: 14px;
        font-weight: 600;
      }

      .candidate-entity-inline {
        margin-left: 4px;
        color: var(--text-secondary-color);
        font-size: 11px;
        font-weight: 500;
        font-family: var(--code-font-family, monospace);
      }

      .candidate-meta {
        margin-top: 4px;
        color: var(--text-secondary-color);
        font-size: 12px;
        font-family: var(--code-font-family, monospace);
      }

      .candidate-submeta {
        margin-top: 6px;
        color: var(--text-secondary-color);
        font-size: 11px;
        font-weight: 600;
      }

      .light-signal-toggles {
        margin-top: 6px;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .light-signal-toggle {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        color: var(--primary-text-color);
      }

      .light-signal-toggle input {
        width: 14px;
        height: 14px;
        accent-color: var(--primary-color);
      }

      .candidate-headline {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 10px;
        flex-wrap: wrap;
      }

      .candidate-controls {
        display: inline-flex;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
        flex-wrap: wrap;
      }

      .source-state-pill {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        border: 1px solid var(--divider-color);
        padding: 2px 8px;
        font-size: 11px;
        color: var(--text-secondary-color);
        text-transform: lowercase;
      }

      .inline-mode-select {
        min-width: 180px;
        border: 1px solid var(--divider-color);
        border-radius: 6px;
        padding: 4px 8px;
        font-size: 12px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
      }

      .inline-mode-group {
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }

      .inline-mode-label {
        color: var(--text-secondary-color);
        font-size: 12px;
        font-weight: 600;
      }

      .source-enable-control {
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .source-enable-input {
        width: 18px;
        height: 18px;
        cursor: pointer;
        accent-color: var(--primary-color);
      }

      .source-enable-input:focus-visible {
        outline: 2px solid rgba(var(--rgb-primary-color), 0.4);
        outline-offset: 2px;
      }

      .status-pill {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.25px;
        text-transform: uppercase;
        border-radius: 999px;
        padding: 3px 8px;
        border: 1px solid var(--divider-color);
        color: var(--text-secondary-color);
      }

      .status-pill.active {
        color: var(--success-color);
        border-color: rgba(var(--rgb-success-color), 0.35);
        background: rgba(var(--rgb-success-color), 0.08);
      }

      .source-actions {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
        white-space: nowrap;
      }

      .mini-button {
        border: 1px solid var(--divider-color);
        background: var(--card-background-color);
        color: var(--primary-text-color);
        border-radius: 6px;
        padding: 4px 8px;
        font-size: 11px;
        cursor: pointer;
      }

      .source-editor {
        margin: 0;
        border: none;
        border-top: 1px solid rgba(var(--rgb-primary-color), 0.2);
        border-radius: 0;
        padding: 8px 10px;
        background: rgba(var(--rgb-primary-color), 0.07);
      }

      .editor-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(220px, 1fr));
        gap: 8px 10px;
      }

      .media-signals {
        margin-bottom: 10px;
        color: var(--text-secondary-color);
        font-size: 12px;
      }

      .editor-field {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .editor-field label {
        font-size: 12px;
        color: var(--text-secondary-color);
        font-weight: 600;
      }

      .editor-label-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }

      .editor-field select,
      .editor-field input[type="number"] {
        border: 1px solid var(--divider-color);
        border-radius: 6px;
        padding: 6px 8px;
        font-size: 13px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
      }

      .editor-timeout {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .editor-timeout input[type="range"] {
        flex: 1;
      }

      .editor-toggle {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
      }

      .editor-actions {
        margin-top: 10px;
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      }

      .sources-actions {
        margin-top: 10px;
        max-width: 820px;
      }

      .external-source-section {
        margin-top: var(--spacing-md);
        padding-top: var(--spacing-md);
        border-top: 1px solid var(--divider-color);
        max-width: 820px;
      }

      .external-source-section .subsection-title {
        margin-bottom: 4px;
      }

      .external-source-section .subsection-help {
        margin-bottom: 10px;
      }

      .external-composer {
        display: grid;
        grid-template-columns: minmax(180px, 240px) minmax(220px, 1fr) auto;
        gap: 8px;
        align-items: end;
        max-width: 820px;
        margin-bottom: 10px;
      }

      .external-composer .editor-field {
        min-width: 0;
      }

      .wiab-config {
        display: grid;
        gap: 10px;
        max-width: 820px;
      }

      .wiab-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 10px;
      }

      .wiab-entity-editor {
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        padding: 10px;
        background: rgba(var(--rgb-primary-color), 0.03);
      }

      .wiab-entity-editor label {
        display: block;
        margin-bottom: 6px;
        color: var(--text-secondary-color);
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .wiab-entity-input {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 8px;
        align-items: center;
      }

      .wiab-entity-input select {
        min-width: 0;
        border: 1px solid var(--divider-color);
        border-radius: 6px;
        padding: 6px 8px;
        font-size: 13px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
      }

      .wiab-chip-list {
        margin-top: 8px;
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .wiab-chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border: 1px solid var(--divider-color);
        border-radius: 999px;
        padding: 2px 8px;
        background: var(--card-background-color);
        font-size: 12px;
      }

      .wiab-chip button {
        border: none;
        background: transparent;
        color: var(--text-secondary-color);
        cursor: pointer;
        font-size: 14px;
        line-height: 1;
      }

      .wiab-empty {
        margin-top: 6px;
        font-size: 12px;
        color: var(--text-secondary-color);
      }

      .mini-button:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }

      /* Ensure buttons are always visible */
      .button {
        visibility: visible !important;
        opacity: 1 !important;
        display: inline-flex !important;
      }

      .button-primary {
        background: var(--primary-color, #03a9f4) !important;
        color: white !important;
      }

      .button-secondary {
        color: var(--primary-color, #03a9f4) !important;
        border-color: var(--divider-color, #e0e0e0) !important;
      }

      .empty-state {
        color: var(--text-secondary-color, #757575) !important;
      }

      .empty-state .button {
        margin-top: var(--spacing-md);
      }

      @media (max-width: 900px) {
        .contribution-grid {
          grid-template-columns: 1fr 1fr;
        }
      }

      @media (max-width: 700px) {
        .header {
          flex-direction: column;
          align-items: flex-start;
        }

        .header-main {
          width: 100%;
        }

        .header-meta {
          width: 100%;
          min-width: 0;
        }

        .meta-label,
        .meta-value {
          text-align: left;
        }

        .runtime-summary-grid {
          grid-template-columns: 1fr;
          gap: 4px;
        }

        .config-row {
          grid-template-columns: 1fr;
          row-gap: 8px;
        }

        .startup-config-row {
          gap: 10px;
        }

        .startup-config-header {
          align-items: flex-start;
        }

        .editor-grid {
          grid-template-columns: 1fr;
        }

        .external-composer {
          grid-template-columns: 1fr;
        }

        .dusk-block-grid {
          grid-template-columns: 1fr;
        }

        .dusk-rule-row {
          grid-template-columns: 1fr;
        }

        .dusk-wide-select {
          min-width: 0;
          width: 100%;
          max-width: 100%;
        }

        .dusk-conditions {
          margin-left: 0;
          padding-left: 10px;
        }

        .dusk-conditions .config-row {
          grid-template-columns: 1fr;
        }

        .dusk-time-fields {
          grid-template-columns: 1fr;
          max-width: 100%;
        }

        .dusk-time-inline {
          align-items: flex-start;
          width: 100%;
        }

        .dusk-time-inline-fields {
          width: 100%;
        }

        .dusk-light-action-grid {
          grid-template-columns: 1fr;
        }

        .dusk-toolbar {
          flex-direction: column;
          align-items: stretch;
        }

        .section-title-row {
          flex-direction: column;
          align-items: flex-start;
        }

        .section-title-actions {
          width: 100%;
          justify-content: flex-end;
        }

        .sticky-draft-bar {
          flex-direction: column;
          align-items: stretch;
        }

        .sticky-draft-bar-actions {
          width: 100%;
          justify-content: flex-end;
        }

        .sources-heading {
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
        }
      }
    `,
  ];

  protected render() {
    if (!this.location) {
      return html`
        <div class="empty-state">
          <div class="empty-state-icon">
            <ha-icon .icon=${"mdi:arrow-left"}></ha-icon>
          </div>
          <div>Select a location to view details</div>
        </div>
      `;
    }

    return html`
      <div class="inspector-container">
        ${this._renderHeader()} ${this._renderTabs()}
        ${this._renderContent()}
      </div>
    `;
  }

  protected willUpdate(changedProps: Map<string, unknown>): void {
    if (changedProps.has("hass")) {
      const previousHass = changedProps.get("hass") as HomeAssistant | undefined;
      const previousConnection = previousHass?.connection;
      const nextConnection = this.hass?.connection;
      if (previousConnection !== nextConnection) {
        this._entityAreaById = {};
        this._entityAreaLoadPromise = undefined;
        this._liveOccupancyStateByLocation = {};
        if (!this.hass) {
          if (this._unsubAutomationStateChanged) {
            this._unsubAutomationStateChanged();
            this._unsubAutomationStateChanged = undefined;
          }
          this._automationStateSubscriptionConnection = undefined;
        } else {
          void this._loadEntityAreaAssignments();
          void this._loadActionRules();
          void this._subscribeAutomationStateChanged();
        }
      }
    }

    if (changedProps.has("forcedTab")) {
      const mapped = this._mapRequestedTab(this.forcedTab);
      if (mapped) {
        this._activeTab = mapped;
      } else if (changedProps.get("forcedTab")) {
        this._activeTab = "detection";
      }
    }

    if (changedProps.has("location")) {
      const prev = changedProps.get("location") as Location | undefined;
      const prevId = prev?.id || "";
      const nextId = this.location?.id || "";
      if (prevId !== nextId) {
        if (this._ambientReadingReloadTimer) {
          window.clearTimeout(this._ambientReadingReloadTimer);
          this._ambientReadingReloadTimer = undefined;
        }
        this._externalAreaId = "";
        this._externalEntityId = "";
        this._wiabShowAllEntities = false;
        this._showAdvancedAdjacency = false;
        this._showRecentOccupancyEvents = false;
        this._onTimeoutMemory = {};
        this._actionRulesDraft = undefined;
        this._actionRulesDraftDirty = false;
        this._actionRulesSaveError = undefined;
        this._editingActionRuleNameId = undefined;
        this._editingActionRuleNameValue = "";
        this._actionRuleTabById = {};
        this._ambientReading = undefined;
        this._ambientReadingError = undefined;
        this._occupancyDraft = undefined;
        this._occupancyDraftDirty = false;
        this._occupancySaveError = undefined;
        this._pendingOccupancyByLocation = {};
        this._ambientDraft = undefined;
        this._ambientDraftDirty = false;
        this._ambientSaveError = undefined;
        this._resetDetectionDraftFromLocation();
        this._resetAmbientDraftFromLocation();
        if (this.hass) {
          void this._loadEntityAreaAssignments();
        }
        void this._loadAmbientReading();
      } else {
        if (!this._occupancyDraftDirty) {
          this._resetDetectionDraftFromLocation();
        }
        if (!this._ambientDraftDirty) {
          this._resetAmbientDraftFromLocation();
        }
      }
      void this._loadActionRules();
    }

    if (changedProps.has("entryId")) {
      const prevEntryId = (changedProps.get("entryId") as string | undefined) || "";
      const nextEntryId = this.entryId || "";
      if (prevEntryId !== nextEntryId) {
        void this._loadActionRules();
        void this._loadAmbientReading();
      }
    }

    if (changedProps.has("entityRegistryRevision")) {
      void this._loadEntityAreaAssignments();
    }
  }

  private async _loadActionRules(): Promise<boolean> {
    const loadSeq = ++this._actionRulesLoadSeq;
    const locationId = this.location?.id;
    if (!locationId || !this.hass) {
      this._actionRules = [];
      this._loadingActionRules = false;
      this._actionRulesError = undefined;
      return true;
    }

    this._loadingActionRules = true;
    this._actionRulesError = undefined;
    this.requestUpdate();

    try {
      const rules = await listTopomationActionRules(this.hass, locationId, this.entryId);
      if (loadSeq !== this._actionRulesLoadSeq) return false;
      const previousSignature = this._actionRulesSignature(this._actionRules);
      const nextSignature = this._actionRulesSignature(rules);
      const changedInHa = previousSignature !== nextSignature;
      this._actionRules = rules;
      if (!this._actionRulesDraftDirty) {
        this._resetActionRulesDraftFromLoaded();
      } else if (changedInHa) {
        this._resetActionRulesDraftFromLoaded();
        this._showToast(
          "Rules changed in Home Assistant. Local draft was reloaded.",
          "warning"
        );
      }
      return true;
    } catch (err: any) {
      if (loadSeq !== this._actionRulesLoadSeq) return false;
      // Preserve current rows on read failures so successful writes don't visually
      // "revert" while HA registry/config APIs converge.
      this._actionRulesError = err?.message || "Failed to load automation rules";
      return false;
    } finally {
      if (loadSeq === this._actionRulesLoadSeq) {
        this._loadingActionRules = false;
        this.requestUpdate();
      }
    }
  }

  private _actionRulesSignature(rules: TopomationActionRule[]): string {
    const normalized = rules
      .map((rule) => ({
        id: String(rule.id || ""),
        entity_id: String(rule.entity_id || ""),
        name: String(rule.name || ""),
        rule_uuid: String(rule.rule_uuid || ""),
        trigger_type: String(rule.trigger_type || ""),
        action_entity_id: String(rule.action_entity_id || ""),
        action_service: String(rule.action_service || ""),
        ambient_condition: String(rule.ambient_condition || ""),
        must_be_occupied:
          typeof rule.must_be_occupied === "boolean" ? rule.must_be_occupied : null,
        time_condition_enabled: Boolean(rule.time_condition_enabled),
        start_time: String(rule.start_time || ""),
        end_time: String(rule.end_time || ""),
        enabled: Boolean(rule.enabled),
      }))
      .sort((left, right) => `${left.id}|${left.entity_id}`.localeCompare(`${right.id}|${right.entity_id}`));
    return JSON.stringify(normalized);
  }

  private _occupancyDefaults(): OccupancyConfig {
    return {
      version: 1,
      enabled: true,
      default_timeout: 300,
      default_trailing_timeout: 120,
      occupancy_sources: [],
      linked_locations: [],
      sync_locations: [],
      wiab: {
        preset: "off",
      },
    };
  }

  private _sanitizeOccupancyConfig(
    config: OccupancyConfig,
    selfLocationId: string | undefined = this.location?.id
  ): OccupancyConfig {
    const defaults = this._occupancyDefaults();
    const sourceCandidates = Array.isArray(config.occupancy_sources) ? config.occupancy_sources : [];
    const occupancySources = sourceCandidates
      .filter((source) => source && typeof source.entity_id === "string" && source.entity_id.trim().length > 0)
      .map((source) => this._normalizeSource(source.entity_id.trim(), source));
    const defaultTimeout = Math.max(1, Number(config.default_timeout) || defaults.default_timeout);
    const defaultTrailingTimeout = Math.max(
      0,
      Number(config.default_trailing_timeout) || defaults.default_trailing_timeout || 0
    );
    const sanitized: OccupancyConfig = {
      ...defaults,
      ...config,
      enabled: config.enabled !== false,
      default_timeout: defaultTimeout,
      default_trailing_timeout: defaultTrailingTimeout,
      occupancy_sources: occupancySources,
      linked_locations: this._normalizeLinkedLocationIds(config.linked_locations, undefined, selfLocationId),
      sync_locations: this._normalizeLinkedLocationIds(config.sync_locations, undefined, selfLocationId),
    };
    sanitized.wiab = this._getWiabConfig(sanitized);
    return sanitized;
  }

  private _persistedOccupancyConfig(): OccupancyConfig {
    const raw = ((this.location?.modules?.occupancy || {}) as OccupancyConfig) || {};
    return this._sanitizeOccupancyConfig(raw, this.location?.id);
  }

  private _resetDetectionDraftFromLocation(): void {
    if (!this.location) {
      this._occupancyDraft = undefined;
      this._occupancyDraftDirty = false;
      this._occupancySaveError = undefined;
      this._pendingOccupancyByLocation = {};
      return;
    }
    this._occupancyDraft = this._persistedOccupancyConfig();
    this._occupancyDraftDirty = false;
    this._occupancySaveError = undefined;
    this._pendingOccupancyByLocation = {};
  }

  private _setOccupancyDraft(config: OccupancyConfig): void {
    this._occupancyDraft = this._sanitizeOccupancyConfig(config, this.location?.id);
    this._occupancyDraftDirty = true;
    this._occupancySaveError = undefined;
    this.requestUpdate();
  }

  private _occupancyConfigForLocation(location: Location): OccupancyConfig {
    const pending = this._pendingOccupancyByLocation[location.id];
    if (pending) {
      return this._sanitizeOccupancyConfig(pending, location.id);
    }
    const raw = ((location.modules?.occupancy || {}) as OccupancyConfig) || {};
    return this._sanitizeOccupancyConfig(raw, location.id);
  }

  private _setPendingOccupancyForLocation(locationId: string, config: OccupancyConfig): void {
    const sanitized = this._sanitizeOccupancyConfig(config, locationId);
    this._pendingOccupancyByLocation = {
      ...this._pendingOccupancyByLocation,
      [locationId]: sanitized,
    };
    this._occupancyDraftDirty = true;
    this._occupancySaveError = undefined;
    this.requestUpdate();
  }

  private _renderDetectionDraftToolbar() {
    const hasUnsaved = this._occupancyDraftDirty;
    const busy = this._savingOccupancyDraft;
    const hasError = Boolean(this._occupancySaveError);
    if (!hasUnsaved && !busy && !hasError) return "";
    return html`
      ${this._occupancySaveError
        ? html`<div class="policy-warning" data-testid="detection-save-error">${this._occupancySaveError}</div>`
        : ""}
      <div class="draft-toolbar draft-toolbar-actions-only" data-testid="detection-draft-toolbar">
        <div class="draft-toolbar-actions">
          <button
            class="button button-secondary"
            type="button"
            data-testid="detection-discard-button"
            ?disabled=${busy || !hasUnsaved}
            @click=${() => this._discardDetectionDraft()}
          >
            Discard
          </button>
          <button
            class="dusk-save-button ${hasUnsaved ? "dirty" : ""}"
            type="button"
            data-testid="detection-save-button"
            ?disabled=${busy || !hasUnsaved}
            @click=${() => this._saveDetectionDraft()}
          >
            ${busy ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    `;
  }

  private _renderStickyDraftBar(
    kind: "detection" | "ambient",
    options: {
      hasUnsaved: boolean;
      busy: boolean;
      error?: string;
      onDiscard: () => void;
      onSave: () => void;
    }
  ) {
    const { hasUnsaved, busy, error, onDiscard, onSave } = options;
    if (!hasUnsaved && !busy && !error) return "";
    const note = busy ? "Saving changes..." : "Unsaved changes";
    return html`
      ${error ? html`<div class="policy-warning">${error}</div>` : ""}
      <div class="sticky-draft-bar" data-testid=${`${kind}-sticky-draft-bar`}>
        <div class="sticky-draft-bar-note">${note}</div>
        <div class="sticky-draft-bar-actions">
          <button
            class="button button-secondary"
            type="button"
            data-testid=${`${kind}-discard-button`}
            ?disabled=${busy || !hasUnsaved}
            @click=${onDiscard}
          >
            Discard
          </button>
          <button
            class="button button-primary draft-save-button"
            type="button"
            data-testid=${`${kind}-save-button`}
            ?disabled=${busy || !hasUnsaved}
            @click=${onSave}
          >
            ${busy ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    `;
  }

  private async _persistOccupancyConfigForLocation(locationId: string, config: OccupancyConfig): Promise<void> {
    await this.hass.callWS(
      this._withEntryId({
        type: "topomation/locations/set_module_config",
        location_id: locationId,
        module_id: "occupancy",
        config,
      })
    );
  }

  private async _saveDetectionDraft(): Promise<void> {
    if (!this.location || !this.hass) return;
    const sourceLocationId = this.location.id;
    const sourceConfig = this._sanitizeOccupancyConfig(
      this._occupancyDraft || this._persistedOccupancyConfig(),
      sourceLocationId
    );
    const updates: Array<{ locationId: string; config: OccupancyConfig }> = [
      { locationId: sourceLocationId, config: sourceConfig },
      ...Object.entries(this._pendingOccupancyByLocation)
        .filter(([locationId]) => locationId !== sourceLocationId)
        .map(([locationId, config]) => ({
          locationId,
          config: this._sanitizeOccupancyConfig(config, locationId),
        })),
    ];

    this._savingOccupancyDraft = true;
    this._occupancySaveError = undefined;
    this.requestUpdate();
    try {
      for (const update of updates) {
        await this._persistOccupancyConfigForLocation(update.locationId, update.config);
        if (update.locationId === sourceLocationId && this.location?.id === sourceLocationId) {
          this.location.modules = this.location.modules || {};
          this.location.modules.occupancy = update.config;
          continue;
        }
        const candidate = (this.allLocations || []).find((location) => location.id === update.locationId);
        if (!candidate) continue;
        candidate.modules = candidate.modules || {};
        candidate.modules.occupancy = update.config;
      }
      this._resetDetectionDraftFromLocation();
      this._showToast("Detection settings updated", "success");
    } catch (err: any) {
      console.error("Failed to update detection settings", err);
      this._occupancySaveError = err?.message || "Failed to update detection settings";
      this._showToast(this._occupancySaveError, "error");
    } finally {
      this._savingOccupancyDraft = false;
      this.requestUpdate();
    }
  }

  private _discardDetectionDraft(showToast = true): void {
    this._resetDetectionDraftFromLocation();
    if (showToast) {
      this._showToast("Discarded detection changes", "success");
    }
  }

  private _ambientDefaults(): AmbientConfig {
    return {
      version: 1,
      lux_sensor: null,
      auto_discover: false,
      inherit_from_parent: true,
      dark_threshold: 50,
      bright_threshold: 500,
      fallback_to_sun: true,
      assume_dark_on_error: true,
    };
  }

  private _persistedAmbientConfig(): AmbientConfig {
    const raw = ((this.location?.modules?.ambient || {}) as AmbientConfig) || {};
    return this._sanitizeAmbientConfig(raw);
  }

  private _sanitizeAmbientConfig(config: AmbientConfig): AmbientConfig {
    const defaults = this._ambientDefaults();
    const luxSensor =
      typeof config.lux_sensor === "string" && config.lux_sensor.trim().length > 0
        ? config.lux_sensor.trim()
        : null;
    const darkThreshold = Math.max(0, Number(config.dark_threshold) || 0);
    const brightThreshold = Math.max(
      Math.max(1, darkThreshold) + 1,
      Number(config.bright_threshold) || 0
    );
    return {
      ...defaults,
      ...config,
      lux_sensor: luxSensor,
      auto_discover: false,
      inherit_from_parent:
        typeof config.inherit_from_parent === "boolean"
          ? config.inherit_from_parent
          : defaults.inherit_from_parent,
      dark_threshold: darkThreshold,
      bright_threshold: brightThreshold,
      fallback_to_sun:
        typeof config.fallback_to_sun === "boolean" ? config.fallback_to_sun : defaults.fallback_to_sun,
      assume_dark_on_error:
        typeof config.assume_dark_on_error === "boolean"
          ? config.assume_dark_on_error
          : defaults.assume_dark_on_error,
    };
  }

  private _resetAmbientDraftFromLocation(): void {
    this._ambientDraft = this._persistedAmbientConfig();
    this._ambientDraftDirty = false;
    this._ambientSaveError = undefined;
  }

  private _ambientConfigSignature(config: AmbientConfig): string {
    const sanitized = this._sanitizeAmbientConfig(config);
    return JSON.stringify({
      lux_sensor: sanitized.lux_sensor ?? null,
      inherit_from_parent: Boolean(sanitized.inherit_from_parent),
      dark_threshold: sanitized.dark_threshold,
      bright_threshold: sanitized.bright_threshold,
      fallback_to_sun: Boolean(sanitized.fallback_to_sun),
      assume_dark_on_error: Boolean(sanitized.assume_dark_on_error),
    });
  }

  private _getAmbientConfig(): AmbientConfig {
    if (!this.location) {
      return this._sanitizeAmbientConfig(this._ambientDefaults());
    }
    return this._sanitizeAmbientConfig(this._ambientDraft || this._persistedAmbientConfig());
  }

  private _setAmbientDraft(config: AmbientConfig): void {
    const sanitized = this._sanitizeAmbientConfig(config);
    this._ambientDraft = sanitized;
    this._ambientDraftDirty =
      this._ambientConfigSignature(sanitized) !==
      this._ambientConfigSignature(this._persistedAmbientConfig());
    this._ambientSaveError = undefined;
    this.requestUpdate();
  }

  private async _saveAmbientDraft(): Promise<void> {
    if (!this.location || !this.hass) return;
    this._savingAmbientConfig = true;
    this._ambientSaveError = undefined;
    const sanitized = this._sanitizeAmbientConfig(this._ambientDraft || this._persistedAmbientConfig());
    try {
      await this.hass.callWS(
        this._withEntryId({
          type: "topomation/locations/set_module_config",
          location_id: this.location.id,
          module_id: "ambient",
          config: sanitized,
        })
      );
      this.location.modules = this.location.modules || {};
      this.location.modules.ambient = sanitized;
      this._ambientDraft = sanitized;
      this._ambientDraftDirty = false;
      await this._loadAmbientReading();
      this._showToast("Ambient settings updated", "success");
    } catch (err: any) {
      console.error("Failed to update ambient settings", err);
      this._ambientSaveError = err?.message || "Failed to update ambient settings";
      this._showToast(this._ambientSaveError, "error");
    } finally {
      this._savingAmbientConfig = false;
      this.requestUpdate();
    }
  }

  private _discardAmbientDraft(showToast = true): void {
    this._resetAmbientDraftFromLocation();
    void this._loadAmbientReading();
    if (showToast) {
      this._showToast("Discarded ambient changes", "success");
    }
  }

  private async _loadAmbientReading(): Promise<void> {
    const loadSeq = ++this._ambientReadingLoadSeq;
    if (!this.location || !this.hass) {
      this._ambientReading = undefined;
      this._ambientReadingError = undefined;
      this._loadingAmbientReading = false;
      return;
    }

    this._loadingAmbientReading = true;
    this._ambientReadingError = undefined;
    this.requestUpdate();

    try {
      const config = this._getAmbientConfig();
      const reading = await this.hass.callWS<AmbientLightReading>(
        this._withEntryId({
          type: "topomation/ambient/get_reading",
          location_id: this.location.id,
          dark_threshold: config.dark_threshold,
          bright_threshold: config.bright_threshold,
        })
      );
      if (loadSeq !== this._ambientReadingLoadSeq) return;
      this._ambientReading = reading;
      this._hydrateAmbientDraftFromReading(reading);
      this._ambientReadingError = undefined;
    } catch (err: any) {
      if (loadSeq !== this._ambientReadingLoadSeq) return;
      this._ambientReading = undefined;
      this._ambientReadingError = err?.message || "Failed to load ambient reading";
    } finally {
      if (loadSeq === this._ambientReadingLoadSeq) {
        this._loadingAmbientReading = false;
        this.requestUpdate();
      }
    }
  }

  private _hydrateAmbientDraftFromReading(reading: AmbientLightReading): void {
    if (this._ambientDraftDirty) return;
    const persisted = this._persistedAmbientConfig();
    if (persisted.lux_sensor) return;
    const sourceSensor = typeof reading.source_sensor === "string" ? reading.source_sensor.trim() : "";
    if (!sourceSensor || reading.is_inherited === true) return;
    if (!this._isSelectableLuxSensor(sourceSensor)) return;
    const nextConfig = this._sanitizeAmbientConfig({
      ...persisted,
      lux_sensor: sourceSensor,
      inherit_from_parent: false,
    });
    this._ambientDraft = nextConfig;
    this._ambientDraftDirty = false;
    this._ambientSaveError = undefined;
  }

  private _ambientSourceMethod(reading?: AmbientLightReading): string {
    if (!reading) return "unknown";
    if (reading.source_sensor) return reading.is_inherited ? "inherited_sensor" : "sensor";
    const fallback = String(reading.fallback_method || "").trim().toLowerCase();
    if (!fallback) return "unknown";
    if (fallback.includes("sun")) return "sun_fallback";
    if (fallback === "assume_dark") return "assume_dark";
    if (fallback === "assume_bright") return "assume_bright";
    return fallback;
  }

  private _ambientSourceMethodLabel(sourceMethod: string): string {
    if (sourceMethod === "sensor") return "Sensor";
    if (sourceMethod === "inherited_sensor") return "Inherited sensor";
    if (sourceMethod === "sun_fallback") return "Sun fallback";
    if (sourceMethod === "assume_dark") return "Assume dark";
    if (sourceMethod === "assume_bright") return "Assume bright";
    return "Unknown";
  }

  private _formatAmbientLux(reading?: AmbientLightReading): string {
    const rawLux = reading?.lux;
    if (typeof rawLux !== "number" || Number.isNaN(rawLux)) return "n/a";
    return `${rawLux.toFixed(1)} lx`;
  }

  private _ambientStateLabel(reading?: AmbientLightReading): string {
    if (reading?.is_dark === true) return "Dark";
    if (reading?.is_bright === true) return "Bright";
    if (reading?.is_dark === false && reading?.is_bright === false) return "Neutral";
    return "Unknown";
  }

  private _ambientSensorCandidates(): string[] {
    if (!this.location) return [];
    const candidateIds = new Set<string>();
    const config = this._getAmbientConfig();
    if (typeof config.lux_sensor === "string" && config.lux_sensor.trim()) {
      candidateIds.add(config.lux_sensor.trim());
    }
    const effectiveSourceSensor =
      typeof this._ambientReading?.source_sensor === "string" ? this._ambientReading.source_sensor.trim() : "";
    if (effectiveSourceSensor) {
      candidateIds.add(effectiveSourceSensor);
    }

    for (const entityId of this.location.entity_ids || []) {
      if (this._isLuxSensorEntity(entityId)) {
        candidateIds.add(entityId);
      }
    }

    if (this.location.ha_area_id) {
      const states = this.hass?.states || {};
      for (const entityId of Object.keys(states)) {
        if (!this._entityIsInArea(entityId, this.location.ha_area_id)) continue;
        if (!this._isLuxSensorEntity(entityId)) continue;
        candidateIds.add(entityId);
      }
    }

    return [...candidateIds].sort((left, right) => this._entityName(left).localeCompare(this._entityName(right)));
  }

  private _selectedAmbientSensorId(
    config: AmbientConfig,
    reading: AmbientLightReading | undefined
  ): string {
    const explicitSensor = typeof config.lux_sensor === "string" ? config.lux_sensor.trim() : "";
    if (explicitSensor) return explicitSensor;
    const effectiveSensor = typeof reading?.source_sensor === "string" ? reading.source_sensor.trim() : "";
    if (effectiveSensor && reading?.is_inherited !== true) {
      return effectiveSensor;
    }
    return "";
  }

  private _isLuxSensorEntity(entityId: string): boolean {
    const stateObj = this.hass?.states?.[entityId];
    return this._isLuxSensorEntityForState(entityId, stateObj);
  }

  private _isSelectableLuxSensor(entityId: string): boolean {
    const stateObj = this.hass?.states?.[entityId];
    if (!this._isLuxSensorEntityForState(entityId, stateObj)) return false;
    const stateValue = String(stateObj?.state || "").trim().toLowerCase();
    return stateValue !== "" && stateValue !== "unknown" && stateValue !== "unavailable";
  }

  private _isLuxSensorEntityForState(entityId: string, stateObj: any): boolean {
    if (!stateObj) return false;
    if (!entityId.startsWith("sensor.")) return false;

    const attrs = stateObj.attributes || {};
    const deviceClass = String(attrs.device_class || "").toLowerCase();
    if (deviceClass === "illuminance") return true;

    const unit = String(attrs.unit_of_measurement || "").toLowerCase();
    if (unit === "lx" || unit === "lux") return true;

    const normalized = entityId.toLowerCase();
    return normalized.includes("lux") || normalized.includes("illuminance") || normalized.includes("light_level");
  }

  private async _loadEntityAreaAssignments(): Promise<void> {
    if (this._entityAreaLoadPromise || !this.hass?.callWS) return;

    this._entityAreaLoadPromise = (async () => {
      try {
        const [entityRegistry, deviceRegistry] = await Promise.all([
          this.hass.callWS<any[]>({ type: "config/entity_registry/list" }),
          this.hass.callWS<any[]>({ type: "config/device_registry/list" }),
        ]);

        const deviceAreaById = new Map<string, string>();
        if (Array.isArray(deviceRegistry)) {
          for (const device of deviceRegistry) {
            const deviceId = typeof device?.id === "string" ? device.id : undefined;
            const areaId = typeof device?.area_id === "string" ? device.area_id : undefined;
            if (deviceId && areaId) {
              deviceAreaById.set(deviceId, areaId);
            }
          }
        }

        const assignments: Record<string, string | null> = {};
        const entityRegistryMetaById: Record<string, EntityRegistryMeta> = {};
        if (Array.isArray(entityRegistry)) {
          for (const entity of entityRegistry) {
            const entityId = typeof entity?.entity_id === "string" ? entity.entity_id : undefined;
            if (!entityId) continue;

            const explicitAreaId =
              typeof entity?.area_id === "string" ? entity.area_id : undefined;
            const deviceAreaId =
              typeof entity?.device_id === "string"
                ? deviceAreaById.get(entity.device_id)
                : undefined;

            assignments[entityId] = explicitAreaId || deviceAreaId || null;
            entityRegistryMetaById[entityId] = {
              hiddenBy: typeof entity?.hidden_by === "string" ? entity.hidden_by : null,
              disabledBy: typeof entity?.disabled_by === "string" ? entity.disabled_by : null,
              entityCategory:
                typeof entity?.entity_category === "string" ? entity.entity_category : null,
            };
          }
        }

        this._entityAreaById = assignments;
        this._entityRegistryMetaById = entityRegistryMetaById;
      } catch (err) {
        this._entityAreaById = {};
        this._entityRegistryMetaById = {};
      } finally {
        this._entityAreaLoadPromise = undefined;
        this.requestUpdate();
      }
    })();

    await this._entityAreaLoadPromise;
  }

  private _renderHeader() {
    if (!this.location) return "";
    const areaId = this.location.ha_area_id;
    const metaLabel = areaId ? "HA Area ID" : "Location ID";
    const metaValue = areaId || this.location.id;
    const lockState = this._getLockState();
    const occupancyState = this._getOccupancyState();
    const occupiedState = this._resolveOccupiedState(occupancyState);
    const occupied = occupiedState === true;
    const occupancyLabel =
      occupiedState === true ? "Occupied" : occupiedState === false ? "Vacant" : "Unknown";
    const vacancyReason = this._resolveVacancyReason(occupancyState, occupiedState);
    const occupiedReason = this._resolveOccupiedReason(occupancyState, occupiedState);
    const occupancyStatusDetail = occupied ? occupiedReason : vacancyReason;
    const vacantAt = occupancyState ? this._resolveVacantAt(occupancyState.attributes || {}, occupied) : undefined;
    const vacantAtLabel = occupied ? this._formatVacantAtLabel(vacantAt) : undefined;
    const ambientSourceMethod = this._ambientSourceMethod(this._ambientReading);
    const ambientSourceHint = ambientSourceMethod === "inherited_sensor" ? " (inherited)" : "";
    const ambientLuxHeader = this._loadingAmbientReading
      ? "Ambient: loading..."
      : this._ambientReadingError
        ? "Ambient: unavailable"
        : `Ambient: ${this._formatAmbientLux(this._ambientReading)}${ambientSourceHint}`;

    return html`
      <div class="header">
        <div class="header-main">
          <div class="header-icon">
            <ha-icon .icon=${this._headerIcon(this.location)}></ha-icon>
          </div>
          <div class="header-content">
            <div class="location-name">${this.location.name}</div>
            <div class="header-status">
              <span
                class="status-chip ${occupied ? "occupied" : "vacant"}"
                data-testid="header-occupancy-status"
                .title=${occupancyStatusDetail || ""}
              >
                ${occupancyLabel}
              </span>
              ${lockState.isLocked
                ? html`
                    <span class="status-chip locked" data-testid="header-lock-status">Locked</span>
                  `
                : html`
                    <span class="header-lock-state" data-testid="header-lock-status">Unlocked</span>
                  `}
              <span class="header-ambient" data-testid="header-ambient-lux">
                ${ambientLuxHeader}
              </span>
              ${occupied
                ? html`
                    <span class="header-vacant-at" data-testid="header-vacant-at">
                      Vacant at ${vacantAtLabel}
                    </span>
                  `
                : ""}
            </div>
          </div>
        </div>
        <div class="header-meta">
          <div class="meta-row">
            <span class="meta-label">${metaLabel}</span>
            <span class="meta-value">${metaValue}</span>
          </div>
        </div>
      </div>
    `;
  }

  private _headerIcon(location: Location): string {
    const areaId = location.ha_area_id;
    if (areaId && this.hass?.areas?.[areaId]?.icon) {
      return this.hass.areas[areaId].icon;
    }
    return getLocationIcon(location);
  }

  private _renderTabs() {
    return html`
      <div class="tabs">
        <button
          class="tab ${this._activeTab === "detection" ? "active" : ""}"
          @click=${() => this._handleTabChange("detection")}
        >
          Detection
        </button>
        <button
          class="tab ${this._activeTab === "ambient" ? "active" : ""}"
          @click=${() => this._handleTabChange("ambient")}
        >
          Ambient
        </button>
        <button
          class="tab ${this._activeTab === "lighting" ? "active" : ""}"
          @click=${() => this._handleTabChange("lighting")}
        >
          Lighting
        </button>
        <button
          class="tab ${this._activeTab === "media" ? "active" : ""}"
          @click=${() => this._handleTabChange("media")}
        >
          Media
        </button>
        <button
          class="tab ${this._activeTab === "hvac" ? "active" : ""}"
          @click=${() => this._handleTabChange("hvac")}
        >
          HVAC
        </button>
      </div>
    `;
  }

  private _renderContent() {
    const activeTab = this._effectiveTab();
    return html`
      <div class="tab-content">
        ${activeTab === "detection"
          ? html`${this._renderOccupancyTab()} ${this._renderAdvancedTab()}`
          : activeTab === "ambient"
            ? this._renderAmbientTab()
          : activeTab === "lighting"
              ? this._renderDeviceAutomationTab("lighting")
            : activeTab === "media"
              ? this._renderDeviceAutomationTab("media")
            : activeTab === "hvac"
              ? this._renderDeviceAutomationTab("hvac")
            : ""}
        ${activeTab === "detection"
          ? this._renderStickyDraftBar("detection", {
              hasUnsaved: this._occupancyDraftDirty,
              busy: this._savingOccupancyDraft,
              error: this._occupancySaveError,
              onDiscard: () => this._discardDetectionDraft(),
              onSave: () => this._saveDetectionDraft(),
            })
          : activeTab === "ambient"
            ? this._renderStickyDraftBar("ambient", {
                hasUnsaved: this._ambientDraftDirty,
                busy: this._savingAmbientConfig,
                error: this._ambientSaveError,
                onDiscard: () => this._discardAmbientDraft(),
                onSave: () => this._saveAmbientDraft(),
              })
            : ""}
      </div>
    `;
  }

  private _effectiveTab(): InspectorTab {
    return this._activeTab;
  }

  private _hasUnsavedDrafts(): boolean {
    return Boolean(
      this._occupancyDraftDirty ||
      this._ambientDraftDirty ||
      this._actionRulesDraftDirty
    );
  }

  private _handleTabChange(nextTab: InspectorTab): void {
    if (this._activeTab === nextTab) return;
    if (this._activeTab === "detection" && this._occupancyDraftDirty) {
      const discard = window.confirm(
        "Detection changes are not saved. Discard changes and continue?"
      );
      if (!discard) return;
      this._discardDetectionDraft(false);
    }
    if (this._activeTab === "ambient" && this._ambientDraftDirty) {
      const discard = window.confirm(
        "Ambient changes are not saved. Discard changes and continue?"
      );
      if (!discard) return;
      this._discardAmbientDraft(false);
    }
    this._activeTab = nextTab;
    this.requestUpdate();
  }

  private _mapRequestedTab(requested?: InspectorTabRequest): InspectorTab | undefined {
    if (requested === "detection") return "detection";
    if (requested === "ambient") return "ambient";
    if (requested === "lighting") return "lighting";
    if (requested === "media") return "media";
    if (requested === "hvac") return "hvac";
    if (requested === "occupancy") return "detection";
    return undefined;
  }

  connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener("beforeunload", this._beforeUnloadHandler);
    this._startClockTicker();
    void this._subscribeAutomationStateChanged();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener("beforeunload", this._beforeUnloadHandler);
    this._stopClockTicker();
    this._resetSourceDraftState();
    if (this._ambientReadingReloadTimer) {
      window.clearTimeout(this._ambientReadingReloadTimer);
      this._ambientReadingReloadTimer = undefined;
    }
    if (this._actionRulesReloadTimer) {
      window.clearTimeout(this._actionRulesReloadTimer);
      this._actionRulesReloadTimer = undefined;
    }
    if (this._unsubAutomationStateChanged) {
      this._unsubAutomationStateChanged();
      this._unsubAutomationStateChanged = undefined;
    }
    this._automationStateSubscriptionConnection = undefined;
  }

  private _scheduleActionRulesReload(delayMs = 250): void {
    if (this._actionRulesReloadTimer) {
      window.clearTimeout(this._actionRulesReloadTimer);
      this._actionRulesReloadTimer = undefined;
    }
    this._actionRulesReloadTimer = window.setTimeout(() => {
      this._actionRulesReloadTimer = undefined;
      void this._loadActionRules();
    }, delayMs);
  }

  private _scheduleAmbientReadingReload(delayMs = 300): void {
    if (!this.location || !this.hass) return;
    if (this._ambientReadingReloadTimer) {
      window.clearTimeout(this._ambientReadingReloadTimer);
      this._ambientReadingReloadTimer = undefined;
    }
    this._ambientReadingReloadTimer = window.setTimeout(() => {
      this._ambientReadingReloadTimer = undefined;
      void this._loadAmbientReading();
    }, delayMs);
  }

  private async _subscribeAutomationStateChanged(): Promise<void> {
    const connection = this.hass?.connection;
    if (!connection?.subscribeEvents) {
      if (this._unsubAutomationStateChanged) {
        this._unsubAutomationStateChanged();
        this._unsubAutomationStateChanged = undefined;
      }
      this._automationStateSubscriptionConnection = undefined;
      return;
    }
    if (
      this._unsubAutomationStateChanged &&
      this._automationStateSubscriptionConnection === connection
    ) {
      return;
    }
    if (this._unsubAutomationStateChanged) {
      this._unsubAutomationStateChanged();
      this._unsubAutomationStateChanged = undefined;
    }

    try {
      this._unsubAutomationStateChanged = await connection.subscribeEvents(
        (event: any) => {
          const entityId = event?.data?.entity_id;
          const newStateObj = event?.data?.new_state;
          const oldStateObj = event?.data?.old_state;
          const newAttrs = newStateObj?.attributes || {};
          const oldAttrs = oldStateObj?.attributes || {};

          if (typeof entityId === "string" && entityId.startsWith("binary_sensor.")) {
            const newLocationId =
              typeof newAttrs.location_id === "string" ? newAttrs.location_id : undefined;
            const oldLocationId =
              typeof oldAttrs.location_id === "string" ? oldAttrs.location_id : undefined;
            const locationId = newLocationId || oldLocationId;
            const newIsOccupancy = newAttrs.device_class === "occupancy";
            const oldIsOccupancy = oldAttrs.device_class === "occupancy";
            if (locationId && (newIsOccupancy || oldIsOccupancy)) {
              if (newStateObj && newIsOccupancy) {
                this._liveOccupancyStateByLocation = {
                  ...this._liveOccupancyStateByLocation,
                  [locationId]: newStateObj,
                };
              } else {
                const { [locationId]: _omit, ...remaining } = this._liveOccupancyStateByLocation;
                this._liveOccupancyStateByLocation = remaining;
              }
              if (this.location?.id === locationId) {
                this.requestUpdate();
              }
            }
          }

          if (
            typeof entityId === "string" &&
            this._isAmbientStateChangeRelevant(entityId, newStateObj, oldStateObj)
          ) {
            this._scheduleAmbientReadingReload();
          }

          if (typeof entityId !== "string" || !entityId.startsWith("automation.")) {
            return;
          }
          // Listen to all automation state changes while inspector is open so
          // externally added/renamed managed rules are reconciled immediately.
          this._scheduleActionRulesReload();
        },
        "state_changed"
      );
      this._automationStateSubscriptionConnection = connection;
    } catch (err) {
      // ignore subscribe failures in restricted/test contexts
      this._automationStateSubscriptionConnection = undefined;
    }
  }

  private _renderOccupancyTab() {
    if (!this.location) return "";

    const config = this._getOccupancyConfig();
    const isFloor = this._isFloorLocation();
    const hasHaAreaLink = !!this.location.ha_area_id;
    const siblingAreaSourceScope = this._isSiblingAreaSourceScope();
    const floorSourceCount = (config.occupancy_sources || []).length;
    const lockState = this._getLockState();
    if (isFloor) {
      return html`
        <div>
          <div class="card-section">
            <div class="section-title">
              <ha-icon .icon=${"mdi:layers"}></ha-icon>
              Floor Occupancy Behavior
            </div>
            <div class="policy-note">
              Floors do not use direct occupancy sources. Floor occupancy is derived from child areas, so
              add sensors to those areas and use this floor for aggregated automation.
            </div>
            ${floorSourceCount > 0
              ? html`
                  <div class="policy-warning">
                    This floor still has ${floorSourceCount} unsupported source${floorSourceCount === 1 ? "" : "s"} in
                    config. Floor sources are unsupported and should be moved to areas.
                  </div>
                `
              : ""}
          </div>
          ${this._renderSyncLocationsSection(config)}
        </div>
      `;
    }

    return html`
      <div>
        <div class="card-section">
          ${lockState.isLocked ? html`
            <div class="lock-banner">
              <div class="lock-title">Locked</div>
              <div class="lock-details">
                ${lockState.lockedBy.length
                  ? html`Held by ${lockState.lockedBy.join(", ")}.`
                  : html`Occupancy is currently held by a lock.`}
              </div>
              ${lockState.lockModes.length
                ? html`
                    <div class="runtime-note">
                      Modes: ${lockState.lockModes.map((mode) => this._lockModeLabel(mode)).join(", ")}
                    </div>
                  `
                : ""}
              ${lockState.directLocks.length
                ? html`
                    <div class="lock-directive-list">
                      ${lockState.directLocks.map((directive) => html`
                        <div class="lock-directive">
                          <span class="lock-pill">${directive.sourceId}</span>
                          <span>${this._lockModeLabel(directive.mode)}</span>
                          <span>${this._lockScopeLabel(directive.scope)}</span>
                        </div>
                      `)}
                    </div>
                  `
                : html`<div class="runtime-note">Inherited from an ancestor subtree lock.</div>`}
            </div>
          ` : ""}
          <div class="sources-heading">
            <div class="section-title">Sources</div>
            <div class="sources-inline-help">
              ${hasHaAreaLink
                ? "Select sensors in this area."
                : "Integration-owned location: choose sources from Home Assistant entities."}
            </div>
          </div>
          ${hasHaAreaLink
            ? ""
            : html`
                <div class="policy-note" style="margin-bottom: 10px; max-width: 820px;">
                  Tip: choose <strong>Any area / unassigned</strong> to browse all compatible entities.
                </div>
              `}
          ${this._renderAreaSensorList(config)}
          <div class="external-source-section">
            <div class="subsection-title">Add Source</div>
            <div class="subsection-help">
              ${hasHaAreaLink
                ? siblingAreaSourceScope
                  ? "Need more coverage? Add a source from a sibling area or include all compatible entities from this area."
                  : "Need more coverage? Add a source from another area or include all compatible entities from this area."
                : "Add a source from any HA area (including unassigned entities)."}
            </div>
            ${this._renderExternalSourceComposer(config)}
          </div>
        </div>
        ${this._renderSyncLocationsSection(config)}
      </div>
    `;
  }

  private _renderAmbientTab() {
    if (!this.location) return "";
    return html`<div>${this._renderAmbientSection()}</div>`;
  }

  private _renderAdvancedTab() {
    if (!this.location) return "";
    const config = this._getOccupancyConfig();
    return html`
      <div>
        ${this._renderWiabSection(config)}
        ${this._renderAdjacencyAdvancedSection(config)}
        ${this._isManagedShadowHost() ? this._renderManagedShadowAreaSection() : ""}
        ${this._renderRecentOccupancyEventsSection(config)}
      </div>
    `;
  }

  private _renderRecentOccupancyEventsSection(config: OccupancyConfig) {
    const occupancyActivity = this._occupancyContributions(config);
    if (occupancyActivity.length === 0) return "";
    const occupancyEventsToRender = this._showRecentOccupancyEvents
      ? occupancyActivity
      : occupancyActivity.slice(0, 1);

    return html`
      <div class="card-section" data-testid="recent-occupancy-events-section">
        <div class="section-title">
          <ha-icon .icon=${"mdi:clock-outline"}></ha-icon>
          Recent Occupancy Events
        </div>
        <div
          class="sources-inline-help"
          style="margin-bottom: 8px; display: flex; justify-content: space-between; align-items: baseline; gap: 8px;"
        >
          Sources currently contributing to occupancy.
          ${occupancyActivity.length > 1
            ? html`
                <button
                  class="button button-secondary"
                  type="button"
                  style="padding: 2px 8px; font-size: 11px;"
                  data-testid="recent-events-toggle"
                  @click=${() => {
                    this._showRecentOccupancyEvents = !this._showRecentOccupancyEvents;
                    this.requestUpdate();
                  }}
                >
                  ${this._showRecentOccupancyEvents ? "Show less" : "Show all"}
                </button>
              `
            : ""}
        </div>
        <div class="occupancy-events">
          ${occupancyEventsToRender.map(
            (item) => html`
              <div class="occupancy-event">
                <span class="occupancy-event-source">${item.sourceLabel}</span>
                <span class="occupancy-event-meta">${item.stateLabel}</span>
                ${item.relativeTime ? html`<span class="occupancy-event-meta">${item.relativeTime}</span>` : ""}
              </div>
            `
          )}
        </div>
      </div>
    `;
  }

  private _isAmbientStateChangeRelevant(entityId: string, newStateObj: any, oldStateObj: any): boolean {
    if (!this.location) return false;

    const config = this._getAmbientConfig();
    const activeSourceSensor = String(this._ambientReading?.source_sensor || "").trim();
    const configuredLuxSensor = String(config.lux_sensor || "").trim();
    const fallbackMethod = String(this._ambientReading?.fallback_method || "").toLowerCase();
    const tracksSun = Boolean(config.fallback_to_sun) || fallbackMethod.includes("sun");

    if (entityId === "sun.sun" && tracksSun) return true;
    if (!entityId.startsWith("sensor.")) return false;

    const candidateState = newStateObj || oldStateObj || this.hass?.states?.[entityId];
    if (!this._isLuxSensorEntityForState(entityId, candidateState)) return false;

    if (entityId === activeSourceSensor || entityId === configuredLuxSensor) return true;
    if ((this.location.entity_ids || []).includes(entityId)) return true;

    if (this.location.ha_area_id) {
      if (this._resolveEntityAreaId(entityId, candidateState) === this.location.ha_area_id) return true;
    }

    return false;
  }

  private _renderAmbientSection() {
    if (!this.location) return "";
    const config = this._getAmbientConfig();
    const reading = this._ambientReading;
    const candidates = this._ambientSensorCandidates();
    const sourceMethod = this._ambientSourceMethod(reading);
    const sourceMethodLabel = this._ambientSourceMethodLabel(sourceMethod);
    const sourceSensor = reading?.source_sensor || "-";
    const sourceLocation =
      typeof reading?.source_location === "string" && reading.source_location
        ? this._locationName(reading.source_location)
        : "-";
    const ambientStateLabel = this._ambientStateLabel(reading);
    const darkThreshold = Math.max(0, Number(config.dark_threshold) || 0);
    const brightThreshold = Math.max(darkThreshold + 1, Number(config.bright_threshold) || darkThreshold + 1);
    const selectedLuxSensor = this._selectedAmbientSensorId(config, reading);
    const emptyLuxSensorLabel = "Inherit from parent";
    const busy = this._savingAmbientConfig;

    return html`
      <div class="card-section" data-testid="ambient-section">
        <div class="section-title-row">
          <div class="section-title">
            <ha-icon .icon=${"mdi:weather-sunny"}></ha-icon>
            Ambient
          </div>
        </div>

        ${this._ambientReadingError
          ? html`
              <div class="policy-warning" data-testid="ambient-error">${this._ambientReadingError}</div>
            `
          : ""}
        <div class="ambient-grid">
          <div class="ambient-key">Lux level</div>
          <div class="ambient-value" data-testid="ambient-lux-level">${this._formatAmbientLux(reading)}</div>
          <div class="ambient-key">Ambient state</div>
          <div class="ambient-value" data-testid="ambient-state">${ambientStateLabel}</div>
          <div class="ambient-key">Source method</div>
          <div class="ambient-value" data-testid="ambient-source-method">${sourceMethodLabel}</div>
          <div class="ambient-key">Source sensor</div>
          <div class="ambient-value" data-testid="ambient-source-sensor">${sourceSensor}</div>
          <div class="ambient-key">Source location</div>
          <div class="ambient-value" data-testid="ambient-source-location">${sourceLocation}</div>
        </div>

        <div class="policy-note" style="margin-bottom: 8px;">
          Lux sensor assignment is explicit. Set a location sensor or inherit from parent.
        </div>

        <div class="config-row">
          <div>
            <div class="config-label">Lux sensor</div>
            <div class="config-help">Choose a direct illuminance sensor or inherit from the parent location.</div>
          </div>
          <div class="config-value">
            <select
              ?disabled=${busy}
              data-testid="ambient-lux-sensor-select"
              @change=${(ev: Event) => {
                const value = (ev.target as HTMLSelectElement).value.trim();
                this._setAmbientDraft({
                  ...config,
                  lux_sensor: value || null,
                  inherit_from_parent: value ? false : true,
                });
                this._scheduleAmbientReadingReload();
              }}
            >
              <option value="" ?selected=${selectedLuxSensor === ""}>${emptyLuxSensorLabel}</option>
              ${candidates.map(
                (entityId) =>
                  html`<option value=${entityId} ?selected=${selectedLuxSensor === entityId}>
                    ${this._entityName(entityId)}
                  </option>`
              )}
            </select>
          </div>
        </div>

        <div class="config-row">
          <div>
            <div class="config-label">Dark threshold (lux)</div>
            <div class="config-help">Dark when lux is below this value.</div>
          </div>
          <div class="config-value">
            <input
              type="number"
              min="0"
              step="1"
              class="input"
              .value=${String(darkThreshold)}
              ?disabled=${busy}
              data-testid="ambient-dark-threshold"
              @change=${(ev: Event) => {
                const nextDark = Math.max(0, Number((ev.target as HTMLInputElement).value) || 0);
                this._setAmbientDraft({
                  ...config,
                  dark_threshold: nextDark,
                  bright_threshold: Math.max(nextDark + 1, Number(config.bright_threshold) || nextDark + 1),
                });
                this._scheduleAmbientReadingReload();
              }}
            />
          </div>
        </div>

        <div class="config-row">
          <div>
            <div class="config-label">Bright threshold (lux)</div>
            <div class="config-help">Bright when lux is above this value.</div>
          </div>
          <div class="config-value">
            <input
              type="number"
              min=${String(darkThreshold + 1)}
              step="1"
              class="input"
              .value=${String(brightThreshold)}
              ?disabled=${busy}
              data-testid="ambient-bright-threshold"
              @change=${(ev: Event) => {
                const nextBright = Math.max(
                  darkThreshold + 1,
                  Number((ev.target as HTMLInputElement).value) || darkThreshold + 1
                );
                this._setAmbientDraft({
                  ...config,
                  bright_threshold: nextBright,
                });
                this._scheduleAmbientReadingReload();
              }}
            />
          </div>
        </div>

        <div class="config-row">
          <div>
            <div class="config-label">Fallback to sun</div>
            <div class="config-help">Use sunrise/sunset state when no lux sensor reading is available.</div>
          </div>
          <div class="config-value">
            <input
              type="checkbox"
              class="switch-input"
              .checked=${Boolean(config.fallback_to_sun)}
              ?disabled=${busy}
              data-testid="ambient-fallback-to-sun-toggle"
              @change=${(ev: Event) => {
                this._setAmbientDraft({
                  ...config,
                  fallback_to_sun: (ev.target as HTMLInputElement).checked,
                });
                this._scheduleAmbientReadingReload();
              }}
            />
          </div>
        </div>

        <div class="config-row">
          <div>
            <div class="config-label">Assume dark on error</div>
            <div class="config-help">When fallback to sun is disabled, treat unavailable readings as dark.</div>
          </div>
          <div class="config-value">
            <input
              type="checkbox"
              class="switch-input"
              .checked=${Boolean(config.assume_dark_on_error)}
              ?disabled=${busy}
              data-testid="ambient-assume-dark-on-error-toggle"
              @change=${(ev: Event) => {
                this._setAmbientDraft({
                  ...config,
                  assume_dark_on_error: (ev.target as HTMLInputElement).checked,
                });
                this._scheduleAmbientReadingReload();
              }}
            />
          </div>
        </div>
      </div>
    `;
  }

  private _isManagedShadowHost(): boolean {
    if (!this.location || this.location.is_explicit_root) return false;
    const type = getLocationType(this.location);
    return type === "floor" || type === "building" || type === "grounds";
  }

  private _currentManagedShadowAreaId(): string {
    if (!this._isManagedShadowHost() || !this.location) return "";
    return managedShadowAreaIdForHost(this.location);
  }

  private _managedShadowAreaById(locationId: string): Location | undefined {
    return (this.allLocations || []).find((candidate) => candidate.id === locationId);
  }

  private _managedShadowAreaLabel(areaId: string): string {
    const area = this._managedShadowAreaById(areaId);
    if (!area) return areaId;
    const areaRegistryName = area.ha_area_id ? this.hass?.areas?.[area.ha_area_id]?.name : undefined;
    return areaRegistryName || area.name;
  }

  private _renderManagedShadowAreaSection() {
    if (!this._isManagedShadowHost() || !this.location) return "";

    const hostId = this.location.id;
    const shadowAreaId = this._currentManagedShadowAreaId();
    const shadowArea = shadowAreaId ? this._managedShadowAreaById(shadowAreaId) : undefined;
    const shadowMeta = (shadowArea?.modules?._meta || {}) as Record<string, any>;
    const hasExpectedRole = String(shadowMeta.role || "").trim().toLowerCase() === "managed_shadow";
    const mappedHostId = String(shadowMeta.shadow_for_location_id || "").trim();
    const isConsistent = Boolean(
      shadowArea &&
      shadowArea.ha_area_id &&
      shadowArea.parent_id === hostId &&
      hasExpectedRole &&
      mappedHostId === hostId
    );
    const currentLabel = shadowAreaId ? this._managedShadowAreaLabel(shadowAreaId) : "Not configured";
    const mismatchReasons: string[] = [];
    if (shadowAreaId && !shadowArea) {
      mismatchReasons.push("configured system area was not found");
    }
    if (shadowArea && !shadowArea.ha_area_id) {
      mismatchReasons.push("location is missing linked HA area id");
    }
    if (shadowArea && shadowArea.parent_id !== hostId) {
      mismatchReasons.push(`parent mismatch (expected ${hostId}, got ${shadowArea.parent_id || "root"})`);
    }
    if (shadowArea && !hasExpectedRole) {
      mismatchReasons.push('missing role tag "managed_shadow"');
    }
    if (shadowArea && mappedHostId !== hostId) {
      mismatchReasons.push(
        `shadow host mapping mismatch (expected ${hostId}, got ${mappedHostId || "unset"})`
      );
    }
    const mismatchReasonText = mismatchReasons.length
      ? mismatchReasons.join("; ")
      : "metadata mismatch";
    const needsRepair = !shadowAreaId || !isConsistent;

    return html`
      <div class="card-section" data-testid="managed-shadow-section">
        <div class="section-title">
          <ha-icon .icon=${"mdi:link-variant"}></ha-icon>
          Managed System Area
        </div>
        <div class="policy-note">
          Topomation owns this mapping. Assignments to this ${getLocationType(this.location)} are
          remapped to a managed shadow HA area for native area_id interoperability.
        </div>
        <div class="subsection-help">
          Current system area: ${currentLabel}
        </div>
        ${!shadowAreaId
          ? html`
              <div class="policy-warning" data-testid="managed-shadow-warning">
                Missing managed system area mapping for ${hostId}. Action: run Sync Import to create and
                relink the managed system area.
              </div>
            `
          : ""}
        ${shadowAreaId && !isConsistent
          ? html`
              <div class="policy-warning" data-testid="managed-shadow-warning">
                Managed system area mapping is inconsistent for ${hostId}: ${mismatchReasonText}. Action:
                run Sync Import to reconcile metadata.
              </div>
            `
          : ""}
        ${needsRepair
          ? html`
              <div class="advanced-toggle-row">
                <button
                  class="button button-secondary"
                  type="button"
                  data-testid="managed-shadow-sync-import"
                  ?disabled=${this._syncImportInProgress}
                  @click=${() => void this._runSyncImport()}
                >
                  ${this._syncImportInProgress ? "Running Sync Import..." : "Run Sync Import"}
                </button>
              </div>
            `
          : ""}
      </div>
    `;
  }

  private _linkedLocationFloorParentId(): string | null {
    if (!this.location) return null;
    if (getLocationType(this.location) !== "area") return null;
    const parentId = this.location.parent_id ?? null;
    if (!parentId) return null;
    const parent = (this.allLocations || []).find((loc) => loc.id === parentId);
    if (!parent || getLocationType(parent) !== "floor") {
      return null;
    }
    return parentId;
  }

  private _linkedLocationCandidates(): Location[] {
    if (!this.location) return [];
    const floorParentId = this._linkedLocationFloorParentId();
    if (!floorParentId) return [];
    const managedShadowIds = this._managedShadowLocationIds();

    return (this.allLocations || [])
      .filter((loc) => loc.id !== this.location!.id)
      .filter((loc) => (loc.parent_id ?? null) === floorParentId)
      .filter((loc) => getLocationType(loc) === "area")
      .filter((loc) => !this._isManagedShadowLocation(loc, managedShadowIds))
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  private _locationById(locationId: string | null | undefined): Location | undefined {
    if (!locationId) return undefined;
    return (this.allLocations || []).find((candidate) => candidate.id === locationId);
  }

  private _syncLocationScope(): SyncLocationScope | null {
    if (!this.location) return null;
    const currentType = getLocationType(this.location);
    const parentId = this.location.parent_id ?? null;
    const parent = this._locationById(parentId);
    if (!parentId || !parent) return null;
    const parentType = getLocationType(parent);

    if (
      currentType === "area" &&
      (parentType === "area" || parentType === "floor" || parentType === "building")
    ) {
      return { candidateType: "area", parentId, parentType };
    }
    if (currentType === "floor" && parentType === "building") {
      return { candidateType: "floor", parentId, parentType };
    }
    return null;
  }

  private _syncIneligibleMessage(): string {
    if (!this.location) return "Sync Locations is unavailable for this selection.";
    const currentType = getLocationType(this.location);
    if (currentType === "area") {
      return "Sync Locations is available for area locations whose parent is an area, floor, or building.";
    }
    if (currentType === "floor") {
      return "Sync Locations is available for floor locations that are siblings under the same building.";
    }
    return "Sync Locations is available only for eligible area/floor sibling sets.";
  }

  private _syncLocationCandidates(): Location[] {
    if (!this.location) return [];
    const scope = this._syncLocationScope();
    if (!scope) return [];
    const managedShadowIds = this._managedShadowLocationIds();

    return (this.allLocations || [])
      .filter((loc) => loc.id !== this.location!.id)
      .filter((loc) => (loc.parent_id ?? null) === scope.parentId)
      .filter((loc) => getLocationType(loc) === scope.candidateType)
      .filter(
        (loc) => scope.candidateType !== "area" || !this._isManagedShadowLocation(loc, managedShadowIds)
      )
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  private _isManagedShadowLocation(
    location: Location,
    managedShadowIds?: Set<string>
  ): boolean {
    return isSystemShadowLocation(location, managedShadowIds);
  }

  private _managedShadowLocationIds(): Set<string> {
    return managedShadowLocationIdSet(this.allLocations || []);
  }

  private _normalizeLinkedLocationIds(
    raw: unknown,
    allowedCandidates?: Set<string>,
    excludedLocationId?: string
  ): string[] {
    if (!Array.isArray(raw)) {
      return [];
    }

    const seen = new Set<string>();
    const linked: string[] = [];
    for (const item of raw) {
      if (typeof item !== "string") continue;
      const locationId = item.trim();
      if (!locationId || seen.has(locationId)) continue;
      if (excludedLocationId && locationId === excludedLocationId) continue;
      if (allowedCandidates && !allowedCandidates.has(locationId)) continue;
      seen.add(locationId);
      linked.push(locationId);
    }
    return linked;
  }

  private _linkedLocationIds(config: OccupancyConfig): string[] {
    if (!this.location) {
      return [];
    }

    const allowedCandidates = new Set(this._linkedLocationCandidates().map((candidate) => candidate.id));
    if (allowedCandidates.size === 0) {
      return [];
    }

    const raw = config.linked_locations;
    return this._normalizeLinkedLocationIds(raw, allowedCandidates, this.location.id);
  }

  private _syncLocationIds(config: OccupancyConfig): string[] {
    if (!this.location) {
      return [];
    }

    const allowedCandidates = new Set(this._syncLocationCandidates().map((candidate) => candidate.id));
    if (allowedCandidates.size === 0) {
      return [];
    }

    const raw = config.sync_locations;
    return this._normalizeLinkedLocationIds(raw, allowedCandidates, this.location.id);
  }

  private _candidateLinkedLocationIds(candidate: Location): string[] {
    const raw = this._occupancyConfigForLocation(candidate).linked_locations;
    return this._normalizeLinkedLocationIds(raw, undefined, candidate.id);
  }

  private _candidateSyncLocationIds(candidate: Location): string[] {
    const raw = this._occupancyConfigForLocation(candidate).sync_locations;
    return this._normalizeLinkedLocationIds(raw, undefined, candidate.id);
  }

  private _syncLocationGroupMemberIds(sourceLocationId: string): string[] {
    const visited = new Set<string>();
    const queue = [sourceLocationId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const currentLocation =
        currentId === this.location?.id
          ? this.location
          : (this.allLocations || []).find((candidate) => candidate.id === currentId);
      if (!currentLocation) continue;

      const directPeers = new Set(this._candidateSyncLocationIds(currentLocation));
      for (const candidate of this._syncLocationCandidatesForLocation(currentLocation)) {
        const candidatePeers = new Set(this._candidateSyncLocationIds(candidate));
        if (directPeers.has(candidate.id) || candidatePeers.has(currentId)) {
          queue.push(candidate.id);
        }
      }
    }

    return [...visited].sort((left, right) => this._locationName(left).localeCompare(this._locationName(right)));
  }

  private _syncLocationCandidatesForLocation(location: Location): Location[] {
    const scope = this._syncLocationScopeForLocation(location);
    if (!scope) return [];
    return (this.allLocations || [])
      .filter((candidate) => candidate.id !== location.id)
      .filter((candidate) => candidate.parent_id === scope.parentId)
      .filter((candidate) => getLocationType(candidate) === scope.candidateType)
      .filter((candidate) => !isSystemShadowLocation(candidate))
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  private _syncLocationScopeForLocation(
    location: Location
  ): { candidateType: "area" | "floor"; parentId: string; parentType: string } | undefined {
    if (isSystemShadowLocation(location)) return undefined;
    const locationType = getLocationType(location);
    const parentId = String(location.parent_id || "").trim();
    if (!parentId) return undefined;
    const parent = (this.allLocations || []).find((candidate) => candidate.id === parentId);
    if (!parent) return undefined;
    const parentType = getLocationType(parent);
    if (locationType === "area" && (parentType === "area" || parentType === "floor" || parentType === "building")) {
      return { candidateType: "area", parentId, parentType };
    }
    if (locationType === "floor" && parentType === "building") {
      return { candidateType: "floor", parentId, parentType };
    }
    return undefined;
  }

  private _isTwoWayLinked(candidate: Location, linkedSet: Set<string>): boolean {
    if (!this.location) return false;
    if (!linkedSet.has(candidate.id)) return false;
    return this._candidateLinkedLocationIds(candidate).includes(this.location.id);
  }

  private _toggleLinkedLocation(linkedLocationId: string, enabled: boolean): void {
    const config = this._getOccupancyConfig();
    const next = new Set(this._linkedLocationIds(config));
    if (enabled) {
      next.add(linkedLocationId);
    } else {
      next.delete(linkedLocationId);
    }

    const nextLinked = [...next].sort((left, right) =>
      this._locationName(left).localeCompare(this._locationName(right))
    );
    this._setOccupancyDraft({
      ...config,
      linked_locations: nextLinked,
    });
  }

  private _toggleSyncLocation(candidate: Location, enabled: boolean): void {
    if (!this.location) return;
    const sourceLocationId = this.location.id;
    const previousGroupIds = new Set(this._syncLocationGroupMemberIds(sourceLocationId));
    const groupMemberIds = new Set(previousGroupIds);
    groupMemberIds.add(sourceLocationId);
    if (enabled) {
      groupMemberIds.add(candidate.id);
    } else {
      groupMemberIds.delete(candidate.id);
    }

    const nextGroupIds = [...groupMemberIds].sort((left, right) =>
      this._locationName(left).localeCompare(this._locationName(right))
    );

    for (const locationId of nextGroupIds) {
      const targetLocation =
        locationId === sourceLocationId
          ? this.location
          : (this.allLocations || []).find((item) => item.id === locationId);
      if (!targetLocation) continue;
      const config = this._occupancyConfigForLocation(targetLocation);
      const nextSynced = nextGroupIds.filter((peerId) => peerId !== locationId);
      const nextConfig = {
        ...config,
        sync_locations: nextSynced,
      };
      if (locationId === sourceLocationId) {
        this._setOccupancyDraft(nextConfig);
      } else {
        this._setPendingOccupancyForLocation(locationId, nextConfig);
      }
    }

    previousGroupIds.add(sourceLocationId);
    for (const locationId of previousGroupIds) {
      if (groupMemberIds.has(locationId) || locationId === sourceLocationId) continue;
      const targetLocation = (this.allLocations || []).find((item) => item.id === locationId);
      if (!targetLocation) continue;
      const config = this._occupancyConfigForLocation(targetLocation);
      this._setPendingOccupancyForLocation(locationId, {
        ...config,
        sync_locations: [],
      });
    }
  }

  private _toggleTwoWayLinkedLocation(candidate: Location, enabled: boolean): void {
    if (!this.location) return;
    const sourceConfig = this._getOccupancyConfig();
    const sourceLinkedSet = new Set(this._linkedLocationIds(sourceConfig));
    let nextSourceLinked = [...sourceLinkedSet].sort((left, right) =>
      this._locationName(left).localeCompare(this._locationName(right))
    );
    if (enabled && !sourceLinkedSet.has(candidate.id)) {
      sourceLinkedSet.add(candidate.id);
      nextSourceLinked = [...sourceLinkedSet].sort((left, right) =>
        this._locationName(left).localeCompare(this._locationName(right))
      );
    }

    const candidateLinked = new Set(this._candidateLinkedLocationIds(candidate));
    if (enabled) {
      candidateLinked.add(this.location.id);
    } else {
      candidateLinked.delete(this.location.id);
    }
    const nextCandidateLinked = [...candidateLinked].sort((left, right) =>
      this._locationName(left).localeCompare(this._locationName(right))
    );
    this._setOccupancyDraft({
      ...sourceConfig,
      linked_locations: nextSourceLinked,
    });
    this._setPendingOccupancyForLocation(candidate.id, {
      ...this._occupancyConfigForLocation(candidate),
      linked_locations: nextCandidateLinked,
    });
  }

  private _renderSyncLocationsSection(config: OccupancyConfig) {
    if (!this.location) return "";
    const scope = this._syncLocationScope();
    if (!scope) {
      return html`
        <div class="card-section">
          <div class="section-title">
            <ha-icon .icon=${"mdi:link-lock"}></ha-icon>
            Sync Locations
          </div>
          <div class="subsection-help">
            ${this._syncIneligibleMessage()}
          </div>
        </div>
      `;
    }

    const candidates = this._syncLocationCandidates();
    const synced = this._syncLocationIds(config);
    const syncedSet = new Set(synced);
    const syncedLabel = synced.length
      ? synced.map((locationId) => this._locationName(locationId)).join(", ")
      : "None";

    return html`
      <div class="card-section" data-testid="sync-locations-section">
        <div class="section-title">
          <ha-icon .icon=${"mdi:link-lock"}></ha-icon>
          Sync Locations
        </div>
        <div class="subsection-help">
          <strong>Recommended:</strong> synced locations share the same occupancy state and timeout.
          Any occupancy change in one synced location is mirrored to all others.
        </div>
        <div class="linked-location-meta">Synced with: ${syncedLabel}</div>
        ${candidates.length === 0
          ? html`
              <div class="adjacency-empty">
                ${scope.candidateType === "floor"
                  ? "No eligible sibling floors found under this building."
                  : `No eligible sibling areas found under this ${scope.parentType}.`}
              </div>
            `
          : html`
              <div class="linked-location-list">
                ${candidates.map((candidate) => {
                  const checked = syncedSet.has(candidate.id);
                  return html`
                    <div class="linked-location-row">
                      <label class="linked-location-left">
                        <input
                          type="checkbox"
                          data-testid=${`sync-location-${candidate.id}`}
                          .checked=${checked}
                          @change=${(event: Event) => {
                            const target = event.target as HTMLInputElement;
                            this._toggleSyncLocation(candidate, target.checked);
                          }}
                        />
                        <span class="linked-location-name">${candidate.name}</span>
                      </label>
                    </div>
                  `;
                })}
              </div>
            `}
      </div>
    `;
  }

  private _renderLinkedLocationsSection(config: OccupancyConfig) {
    if (!this.location) return "";
    const eligible = !!this._linkedLocationFloorParentId();
    if (!eligible) {
      return html`
        <div class="card-section">
          <div class="section-title">
            <ha-icon .icon=${"mdi:link-variant"}></ha-icon>
            Directional Contributors
          </div>
          <div class="subsection-help">
            Directional contributors are available only for area locations directly under a floor.
          </div>
        </div>
      `;
    }

    const candidates = this._linkedLocationCandidates();
    const linked = this._linkedLocationIds(config);
    const syncedSet = new Set(this._syncLocationIds(config));
    const linkedSet = new Set(linked);
    const linkedLabel = linked.length
      ? linked.map((locationId) => this._locationName(locationId)).join(", ")
      : "None";

    return html`
      <div class="card-section">
        <div class="section-title">
          <ha-icon .icon=${"mdi:link-variant"}></ha-icon>
          Directional Contributors
        </div>
        <div class="subsection-help">
          Advanced: select locations that can contribute occupancy to this location directionally.
          Configure reverse direction from the other location if needed.
        </div>
        <div class="linked-location-meta">Contributors: ${linkedLabel}</div>
        ${candidates.length === 0
          ? html`<div class="adjacency-empty">No sibling area candidates available on this floor.</div>`
          : html`
              <div class="linked-location-list">
                ${candidates.map((candidate) => {
                  const checked = linkedSet.has(candidate.id);
                  const isSynced = syncedSet.has(candidate.id);
                  const twoWayChecked = this._isTwoWayLinked(candidate, linkedSet);
                  return html`
                    <div class="linked-location-row">
                      <label class="linked-location-left">
                        <input
                          type="checkbox"
                          data-testid=${`linked-location-${candidate.id}`}
                          .checked=${checked}
                          ?disabled=${isSynced}
                          @change=${(event: Event) => {
                            const target = event.target as HTMLInputElement;
                            this._toggleLinkedLocation(candidate.id, target.checked);
                          }}
                        />
                        <span class="linked-location-name">${candidate.name}</span>
                      </label>
                      <label class="linked-location-right">
                        <input
                          type="checkbox"
                          data-testid=${`linked-location-two-way-${candidate.id}`}
                          .checked=${twoWayChecked}
                          ?disabled=${!checked || isSynced}
                          @change=${(event: Event) => {
                            const target = event.target as HTMLInputElement;
                            this._toggleTwoWayLinkedLocation(candidate, target.checked);
                          }}
                        />
                        <span class="linked-location-two-way-label">2-way</span>
                      </label>
                    </div>
                  `;
                })}
              </div>
            `}
      </div>
    `;
  }

  private _renderAdjacencyAdvancedSection(config: OccupancyConfig) {
    const expanded = this._showAdvancedAdjacency;
    return html`
      <div class="card-section">
        <div class="section-title">
          <ha-icon .icon=${"mdi:beaker-outline"}></ha-icon>
          Advanced Occupancy Relationships
        </div>
        <div class="subsection-help">
          Directional contributors and movement handoff are advanced tools.
          Most homes should start with Sync Locations.
        </div>
        <div class="advanced-toggle-row">
          <button
            class="button button-secondary"
            data-testid="adjacency-advanced-toggle"
            @click=${() => {
              this._showAdvancedAdjacency = !this._showAdvancedAdjacency;
            }}
          >
            ${expanded ? "Hide Advanced Controls" : "Show Advanced Controls"}
          </button>
        </div>
      </div>
      ${expanded
        ? html`${this._renderLinkedLocationsSection(config)} ${this._renderAdjacencySection()} ${this._renderHandoffTraceSection()}`
        : ""}
    `;
  }

  private _adjacencyCandidates(): Location[] {
    if (!this.location) return [];
    const currentType = getLocationType(this.location);
    if (currentType !== "area" && currentType !== "subarea") {
      return [];
    }
    const parentId = this.location.parent_id ?? null;
    const managedShadowIds = this._managedShadowLocationIds();
    return (this.allLocations || [])
      .filter((loc) => loc.id !== this.location!.id)
      .filter((loc) => (loc.parent_id ?? null) === parentId)
      .filter((loc) => !this._isManagedShadowLocation(loc, managedShadowIds))
      .filter((loc) => {
        const type = getLocationType(loc);
        return type === "area" || type === "subarea";
      })
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  private _connectedAdjacencyEdges(): AdjacencyEdge[] {
    if (!this.location) return [];
    const locationId = this.location.id;
    return (this.adjacencyEdges || [])
      .filter(
        (edge) =>
          edge &&
          (edge.from_location_id === locationId || edge.to_location_id === locationId)
      )
      .sort((left, right) => {
        const leftNeighbor = this._adjacentLocationName(left);
        const rightNeighbor = this._adjacentLocationName(right);
        return leftNeighbor.localeCompare(rightNeighbor);
      });
  }

  private _adjacentLocationId(edge: AdjacencyEdge): string {
    if (!this.location) return edge.to_location_id;
    return edge.from_location_id === this.location.id
      ? edge.to_location_id
      : edge.from_location_id;
  }

  private _adjacentLocationName(edge: AdjacencyEdge): string {
    const adjacentId = this._adjacentLocationId(edge);
    return this.allLocations.find((location) => location.id === adjacentId)?.name || adjacentId;
  }

  private _edgeDirectionLabel(edge: AdjacencyEdge): string {
    if (!this.location) return edge.directionality;
    if (edge.directionality === "bidirectional") return "Two-way";
    const currentId = this.location.id;
    const outgoing =
      (edge.directionality === "a_to_b" && edge.from_location_id === currentId) ||
      (edge.directionality === "b_to_a" && edge.to_location_id === currentId);
    return outgoing ? "Outbound" : "Inbound";
  }

  private _parseCrossingSources(raw: string): string[] {
    return raw
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  private _emitAdjacencyChanged(): void {
    this.dispatchEvent(
      new CustomEvent("adjacency-changed", {
        bubbles: true,
        composed: true,
      })
    );
  }

  private async _handleAdjacencyCreate(): Promise<void> {
    const neighborId = this._adjacencyNeighborId || this._adjacencyCandidates()[0]?.id || "";
    if (!this.location || !neighborId || this._savingAdjacency) {
      return;
    }

    this._savingAdjacency = true;
    try {
      let fromLocationId = this.location.id;
      let toLocationId = neighborId;
      let directionality: "bidirectional" | "a_to_b" | "b_to_a" = "bidirectional";

      if (this._adjacencyDirection === "outbound") {
        directionality = "a_to_b";
      } else if (this._adjacencyDirection === "inbound") {
        fromLocationId = neighborId;
        toLocationId = this.location.id;
        directionality = "a_to_b";
      }

      await this.hass.callWS(
        this._withEntryId({
          type: "topomation/adjacency/create",
          from_location_id: fromLocationId,
          to_location_id: toLocationId,
          directionality,
          boundary_type: this._adjacencyBoundaryType,
          crossing_sources: this._parseCrossingSources(this._adjacencyCrossingSources),
          handoff_window_sec: this._adjacencyHandoffWindowSec,
          priority: this._adjacencyPriority,
        })
      );

      this._adjacencyCrossingSources = "";
      this._showToast("Adjacency edge created", "success");
      this._emitAdjacencyChanged();
    } catch (err: any) {
      console.error("Failed to create adjacency edge:", err);
      this._showToast(err?.message || "Failed to create adjacency edge", "error");
    } finally {
      this._savingAdjacency = false;
    }
  }

  private async _handleAdjacencyDelete(edgeId: string): Promise<void> {
    if (!edgeId || this._savingAdjacency) return;

    this._savingAdjacency = true;
    try {
      await this.hass.callWS(
        this._withEntryId({
          type: "topomation/adjacency/delete",
          edge_id: edgeId,
        })
      );

      this._showToast("Adjacency edge deleted", "success");
      this._emitAdjacencyChanged();
    } catch (err: any) {
      console.error("Failed to delete adjacency edge:", err);
      this._showToast(err?.message || "Failed to delete adjacency edge", "error");
    } finally {
      this._savingAdjacency = false;
    }
  }

  private _renderAdjacencySection() {
    if (!this.location) return "";

    const candidates = this._adjacencyCandidates();
    const edges = this._connectedAdjacencyEdges();
    const selectedNeighborId = this._adjacencyNeighborId || candidates[0]?.id || "";
    const canCreate = !!selectedNeighborId && !this._savingAdjacency;
    const noCandidates = candidates.length === 0;

    return html`
      <div class="card-section">
        <div class="section-title">
          <ha-icon .icon=${"mdi:graph-outline"}></ha-icon>
          Adjacent Locations
        </div>
        <div class="subsection-help">
          Model pathways between neighboring locations so wasp-in-box handoffs can reason about movement.
        </div>

        ${edges.length === 0
          ? html`<div class="adjacency-empty">No adjacency edges for this location yet.</div>`
          : html`
              <div class="adjacency-list">
                ${edges.map((edge) => html`
                  <div class="adjacency-row">
                    <div class="adjacency-row-head">
                      <div class="adjacency-neighbor">${this._adjacentLocationName(edge)}</div>
                      <button
                        class="button button-secondary adjacency-delete-btn"
                        ?disabled=${this._savingAdjacency}
                        @click=${() => this._handleAdjacencyDelete(edge.edge_id)}
                      >
                        Remove
                      </button>
                    </div>
                    <div class="adjacency-meta">
                      ${this._edgeDirectionLabel(edge)} • ${edge.boundary_type} •
                      handoff ${edge.handoff_window_sec}s • priority ${edge.priority}
                    </div>
                    ${Array.isArray(edge.crossing_sources) && edge.crossing_sources.length > 0
                      ? html`
                          <div class="adjacency-meta">
                            crossings: ${edge.crossing_sources.join(", ")}
                          </div>
                        `
                      : ""}
                  </div>
                `)}
              </div>
            `}

        <div class="adjacency-form">
          <div class="adjacency-form-grid">
            <div class="adjacency-form-field">
              <label for="adjacency-neighbor">Neighbor</label>
                <select
                id="adjacency-neighbor"
                .value=${selectedNeighborId}
                ?disabled=${noCandidates || this._savingAdjacency}
                @change=${(event: Event) => {
                  const target = event.target as HTMLSelectElement;
                  this._adjacencyNeighborId = target.value;
                }}
              >
                ${candidates.map((candidate) => html`
                  <option value=${candidate.id}>${candidate.name}</option>
                `)}
              </select>
            </div>
            <div class="adjacency-form-field">
              <label for="adjacency-direction">Direction</label>
              <select
                id="adjacency-direction"
                .value=${this._adjacencyDirection}
                ?disabled=${this._savingAdjacency}
                @change=${(event: Event) => {
                  const target = event.target as HTMLSelectElement;
                  this._adjacencyDirection = target.value;
                }}
              >
                <option value="bidirectional">Two-way</option>
                <option value="outbound">This to neighbor</option>
                <option value="inbound">Neighbor to this</option>
              </select>
            </div>
            <div class="adjacency-form-field">
              <label for="adjacency-boundary">Boundary</label>
              <select
                id="adjacency-boundary"
                .value=${this._adjacencyBoundaryType}
                ?disabled=${this._savingAdjacency}
                @change=${(event: Event) => {
                  const target = event.target as HTMLSelectElement;
                  this._adjacencyBoundaryType = target.value;
                }}
              >
                <option value="door">Door</option>
                <option value="archway">Archway</option>
                <option value="corridor">Corridor</option>
                <option value="stairs">Stairs</option>
                <option value="virtual">Virtual</option>
              </select>
            </div>
            <div class="adjacency-form-field">
              <label for="adjacency-handoff">Handoff Window (sec)</label>
              <input
                id="adjacency-handoff"
                type="number"
                min="1"
                max="300"
                .value=${String(this._adjacencyHandoffWindowSec)}
                ?disabled=${this._savingAdjacency}
                @input=${(event: Event) => {
                  const target = event.target as HTMLInputElement;
                  const parsed = Number.parseInt(target.value || "12", 10);
                  this._adjacencyHandoffWindowSec = Number.isNaN(parsed)
                    ? 12
                    : Math.max(1, Math.min(300, parsed));
                }}
              />
            </div>
            <div class="adjacency-form-field">
              <label for="adjacency-priority">Priority</label>
              <input
                id="adjacency-priority"
                type="number"
                min="0"
                max="1000"
                .value=${String(this._adjacencyPriority)}
                ?disabled=${this._savingAdjacency}
                @input=${(event: Event) => {
                  const target = event.target as HTMLInputElement;
                  const parsed = Number.parseInt(target.value || "50", 10);
                  this._adjacencyPriority = Number.isNaN(parsed)
                    ? 50
                    : Math.max(0, Math.min(1000, parsed));
                }}
              />
            </div>
          </div>
          <div class="adjacency-form-field">
            <label for="adjacency-crossings">Crossing sources (comma-separated entity IDs)</label>
            <input
              id="adjacency-crossings"
              type="text"
              placeholder="binary_sensor.hallway_beam, binary_sensor.kitchen_door"
              .value=${this._adjacencyCrossingSources}
              ?disabled=${this._savingAdjacency}
              @input=${(event: Event) => {
                const target = event.target as HTMLInputElement;
                this._adjacencyCrossingSources = target.value;
              }}
            />
          </div>
          <div class="adjacency-form-actions">
            <button
              class="button button-primary"
              ?disabled=${!canCreate || noCandidates}
              @click=${this._handleAdjacencyCreate}
            >
              Add Adjacency
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private _locationName(locationId: string): string {
    if (this.location?.id === locationId) {
      return this.location.name;
    }
    return this.allLocations.find((location) => location.id === locationId)?.name || locationId;
  }

  private _formatHandoffStatus(status: string): string {
    const normalized = status.trim();
    if (!normalized) return "Unknown";
    return normalized
      .split("_")
      .filter((part) => part.length > 0)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  private _renderHandoffTraceSection() {
    if (!this.location) return "";
    const traces = Array.isArray(this.handoffTraces) ? this.handoffTraces : [];

    return html`
      <div class="card-section">
        <div class="section-title">
          <ha-icon .icon=${"mdi:swap-horizontal-bold"}></ha-icon>
          Handoff Trace
        </div>
        <div class="subsection-help">
          Recent adjacency handoff triggers touching this location. Use this to validate wasp-in-box
          movement assumptions and crossing-source tuning.
        </div>
        ${traces.length === 0
          ? html`<div class="adjacency-empty">No recent handoff traces for this location.</div>`
          : html`
              <div class="handoff-trace-list">
                ${traces.map((trace) => {
                  const occurredAt = this._parseDateValue(trace.timestamp);
                  const timeLabel = occurredAt ? this._formatDateTime(occurredAt) : trace.timestamp;
                  const routeLabel = `${this._locationName(trace.from_location_id)} -> ${this._locationName(trace.to_location_id)}`;
                  const triggerLabel = trace.trigger_entity_id || trace.trigger_source_id || "unknown";
                  return html`
                    <div class="handoff-trace-row">
                      <div class="handoff-trace-head">
                        <span class="handoff-trace-route">${routeLabel}</span>
                        <span class="handoff-trace-time">${timeLabel}</span>
                      </div>
                      <div class="handoff-trace-meta">
                        ${this._formatHandoffStatus(trace.status)} • ${trace.boundary_type} • window
                        ${trace.handoff_window_sec}s
                      </div>
                      <div class="handoff-trace-meta">trigger: ${triggerLabel}</div>
                    </div>
                  `;
                })}
              </div>
            `}
      </div>
    `;
  }

  private _renderRuntimeStatus(lockState: InspectorLockState) {
    const occupancyState = this._getOccupancyState();
    const occupiedState = this._resolveOccupiedState(occupancyState);
    if (!occupancyState && occupiedState === undefined) {
      return html`
        <div class="runtime-summary">
          <div class="runtime-summary-head">
            <span class="status-chip">Occupancy sensor unavailable</span>
            ${lockState.isLocked ? html`<span class="status-chip locked">Locked</span>` : ""}
          </div>
        </div>
      `;
    }

    const attrs = occupancyState?.attributes || {};
    const occupied = occupiedState === true;
    const vacantAt = this._resolveVacantAt(attrs, occupied);
    const occupancyLabel =
      occupiedState === true ? "Occupied" : occupiedState === false ? "Vacant" : "Unknown";
    const vacantAtLabel = occupied ? this._formatVacantAtLabel(vacantAt) : "-";

    return html`
      <div class="runtime-summary">
        <div class="runtime-summary-head">
          <span class="status-chip ${occupied ? "occupied" : "vacant"}">${occupancyLabel}</span>
          ${lockState.isLocked
            ? html`<span class="status-chip locked">Locked</span>`
            : html`<span class="header-lock-state">Unlocked</span>`}
        </div>
        <div class="runtime-summary-grid">
          <div class="runtime-summary-key">Vacant at</div>
          <div class="runtime-summary-value" data-testid="runtime-vacant-at">${vacantAtLabel}</div>
          <div class="runtime-summary-key">Lock</div>
          <div class="runtime-summary-value">${lockState.isLocked ? "Locked" : "Unlocked"}</div>
        </div>
      </div>
    `;
  }

  private _isMediaEntity(entityId: string): boolean {
    return entityId.startsWith("media_player.");
  }

  private _mediaSignalLabel(signalKey?: SourceSignalKey): string {
    if (signalKey === "color") return "Color changes";
    if (signalKey === "power") return "Power changes";
    if (signalKey === "level") return "Brightness changes";
    if (signalKey === "volume") return "Volume changes";
    if (signalKey === "mute") return "Mute changes";
    return "Playback";
  }

  private _signalDescription(signalKey?: SourceSignalKey): string {
    if (signalKey === "color") return "RGB/color changes";
    if (signalKey === "power") return "on/off";
    if (signalKey === "level") return "brightness changes";
    if (signalKey === "volume") return "volume changes";
    if (signalKey === "mute") return "mute/unmute";
    return "playback start/stop";
  }

  private _sourceKey(entityId: string, signalKey?: SourceSignalKey): string {
    return signalKey ? `${entityId}::${signalKey}` : entityId;
  }

  private _sourceKeyFromSource(source: OccupancySource): string {
    const normalizedSignalKey = this._normalizedSignalKeyForSource(source);
    return this._sourceKey(source.entity_id, normalizedSignalKey);
  }

  private _sourceCardGroupKey(item: CandidateItem): string {
    const normalizedSignalKey = this._normalizedSignalKey(item.entityId, item.signalKey);
    if (
      item.entityId.startsWith("light.") &&
      (normalizedSignalKey === "power" ||
        normalizedSignalKey === "level" ||
        normalizedSignalKey === "color")
    ) {
      return `${item.entityId}::power-level`;
    }
    if (
      item.entityId.startsWith("media_player.") &&
      (normalizedSignalKey === "playback" ||
        normalizedSignalKey === "volume" ||
        normalizedSignalKey === "mute")
    ) {
      return `${item.entityId}::media-signals`;
    }
    return item.key;
  }

  private _isLightSignalKey(signalKey?: SourceSignalKey): signalKey is "power" | "level" | "color" {
    return signalKey === "power" || signalKey === "level" || signalKey === "color";
  }

  private _isMediaSignalKey(signalKey?: SourceSignalKey): signalKey is "playback" | "volume" | "mute" {
    return signalKey === "playback" || signalKey === "volume" || signalKey === "mute";
  }

  private _isIntegratedLightGroup(group: CandidateItem[]): boolean {
    return (
      group.length > 1 &&
      group[0].entityId.startsWith("light.") &&
      group.every((item) => item.entityId === group[0].entityId)
    );
  }

  private _isIntegratedMediaGroup(group: CandidateItem[]): boolean {
    return (
      group.length > 1 &&
      group[0].entityId.startsWith("media_player.") &&
      group.every((item) => item.entityId === group[0].entityId)
    );
  }

  private _defaultSignalKeyForEntity(entityId: string): SourceSignalKey | undefined {
    if (this._isMediaEntity(entityId)) return "playback";
    if (this._isDimmableEntity(entityId) || this._isColorCapableEntity(entityId)) return "power";
    return undefined;
  }

  private _candidateItemsForEntity(entityId: string): CandidateItem[] {
    if (!this._isMediaEntity(entityId)) {
      const isDimmable = this._isDimmableEntity(entityId);
      const isColorCapable = this._isColorCapableEntity(entityId);
      if (!isDimmable && !isColorCapable) {
        return [{ key: this._sourceKey(entityId), entityId }];
      }
      const signalKeys: SourceSignalKey[] = ["power"];
      if (isDimmable) signalKeys.push("level");
      if (isColorCapable) signalKeys.push("color");
      return signalKeys.map((signalKey) => ({
        key: this._sourceKey(entityId, signalKey),
        entityId,
        signalKey,
      }));
    }

    return (["playback", "volume", "mute"] as const).map((signalKey) => ({
      key: this._sourceKey(entityId, signalKey),
      entityId,
      signalKey,
    }));
  }

  private _signalSortWeight(signalKey?: SourceSignalKey): number {
    if (!signalKey) return 0;
    if (signalKey === "power" || signalKey === "playback") return 0;
    if (signalKey === "level" || signalKey === "volume") return 1;
    if (signalKey === "color" || signalKey === "mute") return 2;
    return 3;
  }

  private _candidateTitle(entityId: string, signalKey?: SourceSignalKey): string {
    const normalizedSignalKey = this._normalizedSignalKey(entityId, signalKey);
    const baseName = this._entityName(entityId);
    if (normalizedSignalKey && (entityId.startsWith("media_player.") || entityId.startsWith("light."))) {
      return `${baseName} — ${this._mediaSignalLabel(normalizedSignalKey)}`;
    }
    if (!this._isMediaEntity(entityId) && !this._isDimmableEntity(entityId) && !this._isColorCapableEntity(entityId)) {
      return baseName;
    }
    return `${baseName} — ${this._mediaSignalLabel(normalizedSignalKey)}`;
  }

  private _normalizedSignalKeyForSource(source: OccupancySource): SourceSignalKey | undefined {
    const parsedSignal =
      source.source_id?.includes("::")
        ? (source.source_id.split("::")[1] as SourceSignalKey | undefined)
        : undefined;
    const rawSignalKey = source.signal_key || parsedSignal;
    return this._normalizedSignalKey(source.entity_id, rawSignalKey);
  }

  private _normalizedSignalKey(
    entityId: string,
    signalKey?: SourceSignalKey
  ): SourceSignalKey | undefined {
    if (signalKey) return signalKey;
    return this._defaultSignalKeyForEntity(entityId);
  }

  private _mediaSignalDefaults(
    entityId: string,
    signalKey: "playback" | "volume" | "mute"
  ): Partial<OccupancySource> {
    if (signalKey === "playback") {
      return {
        entity_id: entityId,
        source_id: this._sourceKey(entityId, "playback"),
        signal_key: "playback",
        mode: "any_change",
        on_event: "trigger",
        on_timeout: 30 * 60,
        off_event: "none",
        off_trailing: 0,
      };
    }
    return {
      entity_id: entityId,
      source_id: this._sourceKey(entityId, signalKey),
      signal_key: signalKey,
      mode: "any_change",
      on_event: "trigger",
      on_timeout: 30 * 60,
      off_event: "none",
      off_trailing: 0,
    };
  }

  private _lightSignalDefaults(
    entityId: string,
    signalKey: "power" | "level" | "color"
  ): Partial<OccupancySource> {
    if (signalKey === "power") {
      return {
        entity_id: entityId,
        source_id: this._sourceKey(entityId, "power"),
        signal_key: "power",
        mode: "any_change",
        on_event: "trigger",
        on_timeout: 30 * 60,
        off_event: "none",
        off_trailing: 0,
      };
    }

    if (signalKey === "color") {
      return {
        entity_id: entityId,
        source_id: this._sourceKey(entityId, "color"),
        signal_key: "color",
        mode: "any_change",
        on_event: "trigger",
        on_timeout: 30 * 60,
        off_event: "none",
        off_trailing: 0,
      };
    }

    return {
      entity_id: entityId,
      source_id: this._sourceKey(entityId, "level"),
      signal_key: "level",
      mode: "any_change",
      on_event: "trigger",
      on_timeout: 30 * 60,
      off_event: "none",
      off_trailing: 0,
    };
  }

  private _isDimmableEntity(entityId: string): boolean {
    const stateObj = this.hass?.states?.[entityId];
    if (!stateObj) return false;
    const domain = entityId.split(".", 1)[0];
    if (domain !== "light") return false;
    const attrs = stateObj.attributes || {};
    if (typeof attrs.brightness === "number") return true;
    const colorModes = attrs.supported_color_modes;
    if (Array.isArray(colorModes)) {
      return colorModes.some((mode: string) => mode && mode !== "onoff");
    }
    return false;
  }

  private _isColorCapableEntity(entityId: string): boolean {
    const stateObj = this.hass?.states?.[entityId];
    if (!stateObj) return false;
    const domain = entityId.split(".", 1)[0];
    if (domain !== "light") return false;
    const attrs = stateObj.attributes || {};
    if (attrs.rgb_color || attrs.hs_color || attrs.xy_color) return true;
    const colorModes = attrs.supported_color_modes;
    if (Array.isArray(colorModes)) {
      return colorModes.some((mode: string) => ["hs", "xy", "rgb", "rgbw", "rgbww"].includes(mode));
    }
    return false;
  }

  private _renderAreaSensorList(config: OccupancyConfig) {
    if (!this.location) return "";
    const hasHaAreaLink = !!this.location.ha_area_id;
    const sources = this._workingSources(config);
    const sourceIndexByKey = new Map<string, number>();
    sources.forEach((source, index) => sourceIndexByKey.set(this._sourceKeyFromSource(source), index));

    const areaEntityIdSet = new Set<string>(this.location.entity_ids || []);
    if (this.location.ha_area_id) {
      for (const entityId of this._entitiesForArea(this.location.ha_area_id)) {
        areaEntityIdSet.add(entityId);
      }
    }
    const areaEntityIds = [...areaEntityIdSet].sort((a, b) =>
      this._entityName(a).localeCompare(this._entityName(b))
    );
    const candidateAreaEntityIds = areaEntityIds.filter((entityId) => this._isCoreAreaSourceEntity(entityId));
    const candidateItems: CandidateItem[] = candidateAreaEntityIds.flatMap((entityId) =>
      this._candidateItemsForEntity(entityId)
    );
    const visibleCandidateItems = candidateItems;
    const candidateItemKeys = new Set(candidateItems.map((item) => item.key));
    const configuredExtraItems: CandidateItem[] = sources
      .filter((source) => !candidateItemKeys.has(this._sourceKeyFromSource(source)))
      .map((source) => ({
        key: this._sourceKeyFromSource(source),
        entityId: source.entity_id,
        signalKey: this._normalizedSignalKeyForSource(source),
      }));
    const items = [...visibleCandidateItems, ...configuredExtraItems].sort((a, b) => {
      const aConfigured = sourceIndexByKey.has(a.key);
      const bConfigured = sourceIndexByKey.has(b.key);
      if (aConfigured !== bConfigured) return aConfigured ? -1 : 1;

      const byName = this._entityName(a.entityId).localeCompare(this._entityName(b.entityId));
      if (byName !== 0) return byName;

      return this._signalSortWeight(a.signalKey) - this._signalSortWeight(b.signalKey);
    });

    const itemGroups: Array<{ key: string; items: CandidateItem[] }> = [];
    const groupByKey = new Map<string, { key: string; items: CandidateItem[] }>();
    for (const item of items) {
      const groupKey = this._sourceCardGroupKey(item);
      const existing = groupByKey.get(groupKey);
      if (existing) {
        existing.items.push(item);
        continue;
      }
      const created = { key: groupKey, items: [item] };
      groupByKey.set(groupKey, created);
      itemGroups.push(created);
    }

    if (!itemGroups.length) {
      return html`
        <div class="empty-state">
          <div class="text-muted">
            ${hasHaAreaLink
              ? html`No occupancy-relevant entities found yet. Add one from another area to get started.`
              : html`Add a source from Home Assistant entities below to get started.`}
          </div>
        </div>
      `;
    }

    return html`
      <div class="candidate-list">
        ${repeat(itemGroups, (group) => group.key, (group) => {
          if (this._isIntegratedLightGroup(group.items)) {
            return this._renderIntegratedLightCard(config, group.items, sources, sourceIndexByKey);
          }
          if (this._isIntegratedMediaGroup(group.items)) {
            return this._renderIntegratedMediaCard(config, group.items, sources, sourceIndexByKey);
          }

          const groupConfigured = group.items.some((item) => sourceIndexByKey.has(item.key));
          return html`
            <div class="source-card ${groupConfigured ? "enabled" : ""}">
              ${repeat(group.items, (item) => item.key, (item, itemIndex) => {
                const sourceIndex = sourceIndexByKey.get(item.key);
                const configured = sourceIndex !== undefined;
                const source = configured ? sources[sourceIndex] : undefined;
                const draft = configured && source ? source : undefined;
                const modeOptions = this._modeOptionsForEntity(item.entityId);
                return html`
                  <div class=${`source-card-item${itemIndex > 0 ? " grouped" : ""}`}>
                    <div class="candidate-item">
                      <div class="source-enable-control">
                        <input
                          type="checkbox"
                          class="source-enable-input"
                          aria-label="Include source"
                          .checked=${configured}
                          @change=${(ev: Event) => {
                            const checked = (ev.target as HTMLInputElement).checked;
                            if (checked && !configured) {
                              const added = this._addSourceWithDefaults(item.entityId, config, {
                                resetExternalPicker: false,
                                signalKey: item.signalKey,
                              });
                              if (!added) this.requestUpdate();
                            } else if (!checked && configured) {
                              this._removeSource(sourceIndex, config);
                            }
                          }}
                        />
                      </div>
                      <div>
                        <div class="candidate-headline">
                          <div class="candidate-title">
                            ${this._candidateTitle(item.entityId, item.signalKey)}
                            <span class="candidate-entity-inline">[${item.entityId}]</span>
                          </div>
                          <div class="candidate-controls">
                            <span class="source-state-pill">${this._entityState(item.entityId)}</span>
                            ${configured && draft && modeOptions.length > 1
                              ? html`
                                  <div class="inline-mode-group">
                                    <span class="inline-mode-label">Mode</span>
                                    <select
                                      class="inline-mode-select"
                                      .value=${modeOptions.some((opt) => opt.value === draft.mode)
                                        ? draft.mode
                                        : modeOptions[0].value}
                                      @change=${(ev: Event) => {
                                        const mode = (ev.target as HTMLSelectElement).value as "any_change" | "specific_states";
                                        const entity = this.hass.states[item.entityId];
                                        const next = applyModeDefaults(draft, mode, entity) as OccupancySource;
                                        this._updateSourceDraft(config, sourceIndex, { ...next, entity_id: draft.entity_id });
                                      }}
                                    >
                                      ${modeOptions.map((opt) => html`<option value=${opt.value}>${opt.label}</option>`)}
                                    </select>
                                  </div>
                                `
                              : ""}
                          </div>
                        </div>
                        ${(this._isMediaEntity(item.entityId) || item.entityId.startsWith("light.")) && item.signalKey
                          ? html`<div class="candidate-submeta">Activity trigger: ${this._mediaSignalLabel(item.signalKey)}</div>`
                          : ""}
                      </div>
                    </div>
                    ${configured && source
                      ? this._renderSourceEditor(config, source, sourceIndex)
                      : ""}
                  </div>
                `;
              })}
            </div>
          `;
        })}
      </div>
    `;
  }

  private _renderIntegratedLightCard(
    config: OccupancyConfig,
    group: CandidateItem[],
    sources: OccupancySource[],
    sourceIndexByKey: Map<string, number>
  ) {
    const entityId = group[0]?.entityId;
    if (!entityId) return "";

    const signalItems = [...group]
      .filter((item) => this._isLightSignalKey(item.signalKey))
      .sort((a, b) => this._signalSortWeight(a.signalKey) - this._signalSortWeight(b.signalKey));
    if (signalItems.length === 0) return "";

    const configuredItems = signalItems.filter((item) => sourceIndexByKey.has(item.key));
    const groupConfigured = configuredItems.length > 0;
    const primaryItem =
      configuredItems.find((item) => item.signalKey === "power") || configuredItems[0] || signalItems[0];
    const primarySourceIndex = sourceIndexByKey.get(primaryItem.key);
    const primarySource = primarySourceIndex !== undefined ? sources[primarySourceIndex] : undefined;
    const modeOptions = this._modeOptionsForEntity(entityId);

    return html`
      <div class="source-card ${groupConfigured ? "enabled" : ""}">
        <div class="source-card-item">
          <div class="candidate-item">
            <div class="source-enable-control">
              <input
                type="checkbox"
                class="source-enable-input"
                aria-label="Include light source"
                .checked=${groupConfigured}
                @change=${(ev: Event) => {
                  const checked = (ev.target as HTMLInputElement).checked;
                  if (checked && !groupConfigured) {
                    const addSignal =
                      signalItems.find((item) => item.signalKey === "power")?.signalKey || signalItems[0].signalKey;
                    const added = this._addSourceWithDefaults(entityId, config, {
                      resetExternalPicker: false,
                      signalKey: addSignal,
                    });
                    if (!added) this.requestUpdate();
                    return;
                  }
                  if (!checked && groupConfigured) {
                    this._removeSourcesByKey(
                      signalItems.map((item) => item.key),
                      config
                    );
                  }
                }}
              />
            </div>
            <div>
              <div class="candidate-headline">
                <div class="candidate-title">
                  ${this._entityName(entityId)}
                  <span class="candidate-entity-inline">[${entityId}]</span>
                </div>
                <div class="candidate-controls">
                  <span class="source-state-pill">${this._entityState(entityId)}</span>
                  ${primarySource && primarySourceIndex !== undefined && modeOptions.length > 1
                    ? html`
                        <div class="inline-mode-group">
                          <span class="inline-mode-label">Mode</span>
                          <select
                            class="inline-mode-select"
                            .value=${modeOptions.some((opt) => opt.value === primarySource.mode)
                              ? primarySource.mode
                              : modeOptions[0].value}
                            @change=${(ev: Event) => {
                              const mode = (ev.target as HTMLSelectElement).value as "any_change" | "specific_states";
                              const entity = this.hass.states[entityId];
                              const next = applyModeDefaults(primarySource, mode, entity) as OccupancySource;
                              this._updateSourceDraft(config, primarySourceIndex, {
                                ...next,
                                entity_id: primarySource.entity_id,
                              });
                            }}
                          >
                            ${modeOptions.map((opt) => html`<option value=${opt.value}>${opt.label}</option>`)}
                          </select>
                        </div>
                      `
                    : ""}
                </div>
              </div>
              <div class="candidate-submeta">Activity triggers</div>
              <div class="light-signal-toggles">
                ${signalItems.map((signalItem) => {
                  const signalConfigured = sourceIndexByKey.has(signalItem.key);
                  return html`
                    <label class="light-signal-toggle">
                      <input
                        type="checkbox"
                        .checked=${signalConfigured}
                        @change=${(ev: Event) => {
                          const checked = (ev.target as HTMLInputElement).checked;
                          if (checked && !signalConfigured) {
                            const added = this._addSourceWithDefaults(entityId, config, {
                              resetExternalPicker: false,
                              signalKey: signalItem.signalKey,
                            });
                            if (!added) this.requestUpdate();
                            return;
                          }
                          if (!checked && signalConfigured) {
                            this._removeSourcesByKey([signalItem.key], config);
                          }
                        }}
                      />
                      <span>${this._mediaSignalLabel(signalItem.signalKey)}</span>
                    </label>
                  `;
                })}
              </div>
            </div>
          </div>
          ${primarySource && primarySourceIndex !== undefined
            ? this._renderSourceEditor(config, primarySource, primarySourceIndex)
            : ""}
        </div>
      </div>
    `;
  }

  private _renderIntegratedMediaCard(
    config: OccupancyConfig,
    group: CandidateItem[],
    sources: OccupancySource[],
    sourceIndexByKey: Map<string, number>
  ) {
    const entityId = group[0]?.entityId;
    if (!entityId) return "";

    const signalItems = [...group]
      .filter((item) => this._isMediaSignalKey(item.signalKey))
      .sort((a, b) => this._signalSortWeight(a.signalKey) - this._signalSortWeight(b.signalKey));
    if (signalItems.length === 0) return "";

    const configuredItems = signalItems.filter((item) => sourceIndexByKey.has(item.key));
    const groupConfigured = configuredItems.length > 0;
    const primaryItem =
      configuredItems.find((item) => item.signalKey === "playback") || configuredItems[0] || signalItems[0];
    const primarySourceIndex = sourceIndexByKey.get(primaryItem.key);
    const primarySource = primarySourceIndex !== undefined ? sources[primarySourceIndex] : undefined;
    const modeOptions = this._modeOptionsForEntity(entityId);

    return html`
      <div class="source-card ${groupConfigured ? "enabled" : ""}">
        <div class="source-card-item">
          <div class="candidate-item">
            <div class="source-enable-control">
              <input
                type="checkbox"
                class="source-enable-input"
                aria-label="Include media source"
                .checked=${groupConfigured}
                @change=${(ev: Event) => {
                  const checked = (ev.target as HTMLInputElement).checked;
                  if (checked && !groupConfigured) {
                    const addSignal =
                      signalItems.find((item) => item.signalKey === "playback")?.signalKey || signalItems[0].signalKey;
                    const added = this._addSourceWithDefaults(entityId, config, {
                      resetExternalPicker: false,
                      signalKey: addSignal,
                    });
                    if (!added) this.requestUpdate();
                    return;
                  }
                  if (!checked && groupConfigured) {
                    this._removeSourcesByKey(
                      signalItems.map((item) => item.key),
                      config
                    );
                  }
                }}
              />
            </div>
            <div>
              <div class="candidate-headline">
                <div class="candidate-title">
                  ${this._entityName(entityId)}
                  <span class="candidate-entity-inline">[${entityId}]</span>
                </div>
                <div class="candidate-controls">
                  <span class="source-state-pill">${this._entityState(entityId)}</span>
                  ${primarySource && primarySourceIndex !== undefined && modeOptions.length > 1
                    ? html`
                        <div class="inline-mode-group">
                          <span class="inline-mode-label">Mode</span>
                          <select
                            class="inline-mode-select"
                            .value=${modeOptions.some((opt) => opt.value === primarySource.mode)
                              ? primarySource.mode
                              : modeOptions[0].value}
                            @change=${(ev: Event) => {
                              const mode = (ev.target as HTMLSelectElement).value as "any_change" | "specific_states";
                              const entity = this.hass.states[entityId];
                              const next = applyModeDefaults(primarySource, mode, entity) as OccupancySource;
                              this._updateSourceDraft(config, primarySourceIndex, {
                                ...next,
                                entity_id: primarySource.entity_id,
                              });
                            }}
                          >
                            ${modeOptions.map((opt) => html`<option value=${opt.value}>${opt.label}</option>`)}
                          </select>
                        </div>
                      `
                    : ""}
                </div>
              </div>
              <div class="candidate-submeta">Activity triggers</div>
              <div class="light-signal-toggles">
                ${signalItems.map((signalItem) => {
                  const signalConfigured = sourceIndexByKey.has(signalItem.key);
                  return html`
                    <label class="light-signal-toggle">
                      <input
                        type="checkbox"
                        .checked=${signalConfigured}
                        @change=${(ev: Event) => {
                          const checked = (ev.target as HTMLInputElement).checked;
                          if (checked && !signalConfigured) {
                            const added = this._addSourceWithDefaults(entityId, config, {
                              resetExternalPicker: false,
                              signalKey: signalItem.signalKey,
                            });
                            if (!added) this.requestUpdate();
                            return;
                          }
                          if (!checked && signalConfigured) {
                            this._removeSourcesByKey([signalItem.key], config);
                          }
                        }}
                      />
                      <span>${this._mediaSignalLabel(signalItem.signalKey)}</span>
                    </label>
                  `;
                })}
              </div>
            </div>
          </div>
          ${primarySource && primarySourceIndex !== undefined
            ? this._renderSourceEditor(config, primarySource, primarySourceIndex)
            : ""}
        </div>
      </div>
    `;
  }

  private _renderExternalSourceComposer(config: OccupancyConfig) {
    const areas = this._availableSourceAreas();
    const siblingAreaSourceScope = this._isSiblingAreaSourceScope();
    const currentAreaId = this.location?.ha_area_id || "";
    const hasHaAreaLink = Boolean(currentAreaId);
    const selectedAreaId = this._externalAreaId || "";
    const entityOptions = !selectedAreaId
      ? []
      : selectedAreaId === "__this_area__"
        ? (currentAreaId ? this._entitiesForArea(currentAreaId) : [])
        : this._entitiesForArea(selectedAreaId);
    const entityId = this._externalEntityId || "";
    const existing = new Set(this._workingSources(config).map((source) => this._sourceKeyFromSource(source)));
    const defaultSignalKey = entityId ? this._defaultSignalKeyForEntity(entityId) : undefined;
    const selectedKey = entityId
      ? this._sourceKey(entityId, defaultSignalKey)
      : "";
    const areaLabel = siblingAreaSourceScope
      ? "Sibling Area"
      : this.location?.ha_area_id
        ? "Other Area"
        : "Source Area";
    const areaPlaceholder = siblingAreaSourceScope ? "Select sibling area..." : "Select area...";

    return html`
      <div class="external-composer">
        ${siblingAreaSourceScope
          ? html`<div class="runtime-note">Sibling areas on this floor are available, plus all compatible entities in this area.</div>`
          : ""}
        ${siblingAreaSourceScope && areas.length === 0
          ? html`
              <div class="policy-warning">
                No sibling HA-backed areas are available for cross-area sources.
              </div>
            `
          : ""}
        <div class="editor-field">
          <label for="external-source-area">${areaLabel}</label>
          <select
            id="external-source-area"
            data-testid="external-source-area-select"
            .value=${selectedAreaId}
            @change=${(ev: Event) => {
              const nextAreaId = (ev.target as HTMLSelectElement).value;
              this._externalAreaId = nextAreaId;
              this._externalEntityId = "";
              this.requestUpdate();
            }}
          >
            <option value="">${areaPlaceholder}</option>
            ${hasHaAreaLink ? html`<option value="__this_area__">This area (all compatible)</option>` : ""}
            ${siblingAreaSourceScope ? "" : html`<option value="__all__">Any area / unassigned</option>`}
            ${areas.map((area) => html`<option value=${area.area_id}>${area.name}</option>`)}
          </select>
        </div>

        <div class="editor-field">
          <label for="external-source-entity">Sensor</label>
          <select
            id="external-source-entity"
            data-testid="external-source-entity-select"
            .value=${entityId}
            @change=${(ev: Event) => {
              this._externalEntityId = (ev.target as HTMLSelectElement).value;
              this.requestUpdate();
            }}
            ?disabled=${!selectedAreaId}
          >
            <option value="">Select sensor...</option>
            ${entityOptions.map((id) => html`
              <option
                value=${id}
                ?disabled=${existing.has(this._sourceKey(id, this._defaultSignalKeyForEntity(id)))}
              >
                ${this._entityName(id)}${existing.has(this._sourceKey(id, this._defaultSignalKeyForEntity(id))) ? " (already added)" : ""}
              </option>
            `)}
          </select>
        </div>

        <button
          class="button button-secondary"
          data-testid="add-external-source-inline"
          ?disabled=${this._savingOccupancyDraft || !entityId || (selectedKey ? existing.has(selectedKey) : false)}
          @click=${() => {
            this._addSourceWithDefaults(entityId, config, {
              resetExternalPicker: true,
              signalKey: this._defaultSignalKeyForEntity(entityId),
            });
          }}
        >
          + Add Source
        </button>
      </div>
    `;
  }

  private _renderWiabSection(config: OccupancyConfig) {
    const wiab = this._getWiabConfig(config);
    const interiorCandidates = this._wiabInteriorCandidates();
    const doorCandidates = this._wiabDoorCandidates();
    const wiabAreaId = this.location?.ha_area_id || "";
    const wiabAreaName = wiabAreaId
      ? this.hass?.areas?.[wiabAreaId]?.name || wiabAreaId
      : "";
    const scopedToArea = Boolean(wiabAreaId) && !this._wiabShowAllEntities;
    const preset = wiab.preset || "off";
    const presetLabel =
      preset === "enclosed_room"
        ? "Enclosed Room (Door Latch)"
        : preset === "home_containment"
          ? "Home Containment"
          : preset === "hybrid"
            ? "Hybrid"
            : "Off";

    return html`
      <div class="card-section">
        <div class="section-title">
          <ha-icon .icon=${"mdi:box-shadow"}></ha-icon>
          Wasp In A Box
        </div>
        <div class="subsection-help">
          Preset occupancy latch behavior for enclosed rooms and whole-home containment.
          Use this when boundary sensors should hold occupancy until a release event occurs.
        </div>

        <div class="wiab-config">
          <div class="editor-field" style="max-width: 420px;">
            <label for="wiab-preset">Preset</label>
            <select
              id="wiab-preset"
              data-testid="wiab-preset-select"
              .value=${preset}
              @change=${(ev: Event) => {
                const nextPreset = this._normalizeWiabPreset(
                  (ev.target as HTMLSelectElement).value
                );
                const defaults = this._defaultWiabTimeouts(nextPreset);
                this._setOccupancyDraft({
                  ...config,
                  wiab: {
                    ...wiab,
                    preset: nextPreset,
                    hold_timeout_sec: defaults.hold_timeout_sec,
                    release_timeout_sec: defaults.release_timeout_sec,
                  },
                });
              }}
            >
              <option value="off">Off</option>
              <option value="enclosed_room">Enclosed Room (Door Latch)</option>
              <option value="home_containment">Home Containment</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>

          ${preset === "off"
            ? html`<div class="policy-note">WIAB is disabled for this location.</div>`
            : html`<div class="policy-note">Active preset: ${presetLabel}</div>`}

          ${preset === "off"
            ? ""
            : html`
                ${wiabAreaId
                  ? html`
                      <label class="editor-toggle">
                        <input
                          type="checkbox"
                          data-testid="wiab-show-all-toggle"
                          .checked=${this._wiabShowAllEntities}
                          @change=${(ev: Event) => {
                            this._wiabShowAllEntities = (ev.target as HTMLInputElement).checked;
                          }}
                        />
                        Show entities from all areas
                      </label>
                      <div class="policy-note">
                        ${scopedToArea
                          ? `Showing ${wiabAreaName} entities by default.`
                          : "Showing entities from all areas."}
                      </div>
                    `
                  : ""}

                ${this._renderWiabEntityEditor({
                  label: "Interior entities",
                  listKey: "interior_entities",
                  candidates: interiorCandidates,
                  selectedEntityId: this._wiabInteriorEntityId,
                  setSelectedEntityId: (value: string) => {
                    this._wiabInteriorEntityId = value;
                  },
                  config,
                  testIdPrefix: "wiab-interior",
                })}

                ${preset === "enclosed_room" || preset === "hybrid"
                  ? this._renderWiabEntityEditor({
                      label: "Boundary door entities",
                      listKey: "door_entities",
                      candidates: doorCandidates,
                      selectedEntityId: this._wiabDoorEntityId,
                      setSelectedEntityId: (value: string) => {
                        this._wiabDoorEntityId = value;
                      },
                      config,
                      testIdPrefix: "wiab-door",
                    })
                  : ""}

                ${preset === "home_containment" || preset === "hybrid"
                  ? this._renderWiabEntityEditor({
                      label: "Exterior door entities",
                      listKey: "exterior_door_entities",
                      candidates: doorCandidates,
                      selectedEntityId: this._wiabExteriorDoorEntityId,
                      setSelectedEntityId: (value: string) => {
                        this._wiabExteriorDoorEntityId = value;
                      },
                      config,
                      testIdPrefix: "wiab-exterior-door",
                    })
                  : ""}

                <div class="wiab-grid">
                  <div class="editor-field">
                    <label for="wiab-hold-timeout">Hold timeout (sec)</label>
                    <input
                      id="wiab-hold-timeout"
                      data-testid="wiab-hold-timeout"
                      type="number"
                      min="0"
                      max="86400"
                      .value=${String(wiab.hold_timeout_sec ?? 0)}
                      @change=${(ev: Event) => {
                        const value = Number((ev.target as HTMLInputElement).value);
                        this._updateWiabValue(config, "hold_timeout_sec", value);
                      }}
                    />
                  </div>
                  <div class="editor-field">
                    <label for="wiab-release-timeout">Release timeout (sec)</label>
                    <input
                      id="wiab-release-timeout"
                      data-testid="wiab-release-timeout"
                      type="number"
                      min="0"
                      max="86400"
                      .value=${String(wiab.release_timeout_sec ?? 0)}
                      @change=${(ev: Event) => {
                        const value = Number((ev.target as HTMLInputElement).value);
                        this._updateWiabValue(config, "release_timeout_sec", value);
                      }}
                    />
                  </div>
                </div>
              `}
        </div>
      </div>
    `;
  }

  private _renderWiabEntityEditor(options: {
    label: string;
    listKey: WiabEntityListKey;
    candidates: string[];
    selectedEntityId: string;
    setSelectedEntityId: (entityId: string) => void;
    config: OccupancyConfig;
    testIdPrefix: string;
  }) {
    const wiab = this._getWiabConfig(options.config);
    const configured = wiab[options.listKey] || [];
    const configuredSet = new Set(configured);
    const availableCandidates = options.candidates.filter((entityId) => !configuredSet.has(entityId));
    const selectedEntityId = configuredSet.has(options.selectedEntityId)
      ? ""
      : options.selectedEntityId;

    return html`
      <div class="wiab-entity-editor">
        <label>${options.label}</label>
        <div class="wiab-entity-input">
          <select
            data-testid=${`${options.testIdPrefix}-select`}
            .value=${selectedEntityId}
            @change=${(ev: Event) => {
              options.setSelectedEntityId((ev.target as HTMLSelectElement).value);
              this.requestUpdate();
            }}
          >
            <option value="">Select entity...</option>
            ${availableCandidates.map((entityId) => html`
              <option value=${entityId}>${this._entityName(entityId)} (${entityId})</option>
            `)}
          </select>
          <button
            class="button button-secondary"
            data-testid=${`${options.testIdPrefix}-add`}
            ?disabled=${!selectedEntityId}
            @click=${() => {
              if (this._addWiabEntity(options.config, options.listKey, selectedEntityId)) {
                options.setSelectedEntityId("");
                this.requestUpdate();
              }
            }}
          >
            Add
          </button>
        </div>

        ${configured.length === 0
          ? html`<div class="wiab-empty">No entities configured.</div>`
          : html`
              <div class="wiab-chip-list">
                ${configured.map((entityId) => html`
                  <span class="wiab-chip" data-testid=${`${options.testIdPrefix}-chip`}>
                    ${this._entityName(entityId)}
                    <button
                      type="button"
                      aria-label="Remove entity"
                      data-testid=${`${options.testIdPrefix}-remove`}
                      @click=${() => this._removeWiabEntity(options.config, options.listKey, entityId)}
                    >
                      ×
                    </button>
                  </span>
                `)}
              </div>
            `}
      </div>
    `;
  }

  private _getWiabConfig(config: OccupancyConfig): WaspInBoxConfig {
    const raw = config.wiab || {};
    const preset = this._normalizeWiabPreset(raw.preset);
    const defaults = this._defaultWiabTimeouts(preset);
    return {
      preset,
      interior_entities: this._normalizeWiabEntities(raw.interior_entities),
      door_entities: this._normalizeWiabEntities(raw.door_entities),
      exterior_door_entities: this._normalizeWiabEntities(raw.exterior_door_entities),
      hold_timeout_sec: this._clampWiabSeconds(raw.hold_timeout_sec, defaults.hold_timeout_sec),
      release_timeout_sec: this._clampWiabSeconds(raw.release_timeout_sec, defaults.release_timeout_sec),
    };
  }

  private _normalizeWiabPreset(value: unknown): WaspInBoxPreset {
    const normalized = String(value || "").trim().toLowerCase();
    if (normalized === "enclosed_room") return "enclosed_room";
    if (normalized === "home_containment") return "home_containment";
    if (normalized === "hybrid") return "hybrid";
    return "off";
  }

  private _defaultWiabTimeouts(
    preset: WaspInBoxPreset
  ): { hold_timeout_sec: number; release_timeout_sec: number } {
    if (preset === "home_containment") {
      return { hold_timeout_sec: 3600, release_timeout_sec: 120 };
    }
    if (preset === "hybrid") {
      return { hold_timeout_sec: 1800, release_timeout_sec: 120 };
    }
    return { hold_timeout_sec: 900, release_timeout_sec: 90 };
  }

  private _normalizeWiabEntities(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    const seen = new Set<string>();
    const normalized: string[] = [];
    for (const item of value) {
      if (typeof item !== "string") continue;
      const entityId = item.trim();
      if (!entityId || seen.has(entityId)) continue;
      seen.add(entityId);
      normalized.push(entityId);
    }
    return normalized;
  }

  private _clampWiabSeconds(value: unknown, fallback: number): number {
    const parsed = Number.parseInt(String(value ?? fallback), 10);
    if (Number.isNaN(parsed)) return fallback;
    return Math.max(0, Math.min(86400, parsed));
  }

  private _updateWiabValue(
    config: OccupancyConfig,
    key: "hold_timeout_sec" | "release_timeout_sec",
    value: number
  ): void {
    const wiab = this._getWiabConfig(config);
    const fallback = wiab[key] ?? this._defaultWiabTimeouts(wiab.preset || "off")[key];
    const nextValue = this._clampWiabSeconds(value, fallback);
    this._setOccupancyDraft({
      ...config,
      wiab: {
        ...wiab,
        [key]: nextValue,
      },
    });
  }

  private _addWiabEntity(
    config: OccupancyConfig,
    listKey: WiabEntityListKey,
    entityId: string
  ): boolean {
    const normalizedEntityId = entityId.trim();
    if (!normalizedEntityId) return false;
    const wiab = this._getWiabConfig(config);
    const current = wiab[listKey] || [];
    if (current.includes(normalizedEntityId)) return false;
    this._setOccupancyDraft({
      ...config,
      wiab: {
        ...wiab,
        [listKey]: [...current, normalizedEntityId],
      },
    });
    return true;
  }

  private _removeWiabEntity(
    config: OccupancyConfig,
    listKey: WiabEntityListKey,
    entityId: string
  ): void {
    const wiab = this._getWiabConfig(config);
    const current = wiab[listKey] || [];
    const filtered = current.filter((candidate) => candidate !== entityId);
    if (filtered.length === current.length) return;
    this._setOccupancyDraft({
      ...config,
      wiab: {
        ...wiab,
        [listKey]: filtered,
      },
    });
  }

  private _wiabInteriorCandidates(): string[] {
    return this._wiabCandidates((entityId) => this._isCandidateEntity(entityId));
  }

  private _wiabDoorCandidates(): string[] {
    return this._wiabCandidates((entityId) => this._isDoorBoundaryEntity(entityId));
  }

  private _wiabCandidates(predicate: (entityId: string) => boolean): string[] {
    const states = this.hass?.states || {};
    const areaId = this.location?.ha_area_id;
    const candidatePool =
      areaId && !this._wiabShowAllEntities
        ? this._wiabEntityIdsForArea(areaId)
        : Object.keys(states);
    return candidatePool
      .filter((entityId) => this._isCandidateEntity(entityId))
      .filter(predicate)
      .sort((a, b) => this._entityName(a).localeCompare(this._entityName(b)));
  }

  private _wiabEntityIdsForArea(areaId: string): string[] {
    const states = this.hass?.states || {};
    const ids = new Set<string>();

    for (const entityId of this.location?.entity_ids || []) {
      if (states[entityId]) {
        ids.add(entityId);
      }
    }

    for (const entityId of Object.keys(states)) {
      if (this._entityIsInArea(entityId, areaId)) {
        ids.add(entityId);
      }
    }

    return [...ids];
  }

  private _entityIsInArea(entityId: string, areaId: string): boolean {
    return this._resolveEntityAreaId(entityId) === areaId;
  }

  private _resolveEntityAreaId(entityId: string, stateObj?: any): string | null {
    const registryAreaId = this._entityAreaById[entityId];
    if (typeof registryAreaId === "string" && registryAreaId.trim()) {
      return registryAreaId;
    }
    const resolvedStateObj = stateObj ?? this.hass?.states?.[entityId];
    const stateAreaId = resolvedStateObj?.attributes?.area_id;
    return typeof stateAreaId === "string" && stateAreaId.trim() ? stateAreaId : null;
  }

  private _isDoorBoundaryEntity(entityId: string): boolean {
    const stateObj = this.hass?.states?.[entityId];
    if (!stateObj) return false;
    const registryMeta = this._entityRegistryMetaById[entityId];
    if (registryMeta?.hiddenBy || registryMeta?.disabledBy || registryMeta?.entityCategory) {
      return false;
    }

    const domain = entityId.split(".", 1)[0];
    if (domain !== "binary_sensor") return false;
    const deviceClass = String(stateObj.attributes?.device_class || "").toLowerCase();
    return ["door", "garage_door", "opening", "window"].includes(deviceClass);
  }

  private _renderSourceEditor(config: OccupancyConfig, source: OccupancySource, sourceIndex: number) {
    const draft = source;
    const labels = this._eventLabelsForSource(source);
    const sourceKey = this._sourceKeyFromSource(source);
    const supportsOffBehavior = this._supportsOffBehavior(source);
    const defaultTimeoutSeconds = config.default_timeout || 300;
    const rememberedOnTimeout = this._onTimeoutMemory[sourceKey];
    const onTimeoutSeconds = draft.on_timeout === null
      ? (rememberedOnTimeout ?? defaultTimeoutSeconds)
      : (draft.on_timeout ?? rememberedOnTimeout ?? defaultTimeoutSeconds);
    const onTimeoutMinutes = Math.max(1, Math.min(120, Math.round(onTimeoutSeconds / 60)));
    const offTrailingSeconds = draft.off_trailing ?? 0;
    const offTrailingMinutes = Math.max(0, Math.min(120, Math.round(offTrailingSeconds / 60)));

    return html`
      <div class="source-editor">
        ${(this._isMediaEntity(source.entity_id) || source.entity_id.startsWith("light.")) && source.signal_key
          ? html`<div class="media-signals">Trigger signal: ${this._mediaSignalLabel(source.signal_key)} (${this._signalDescription(source.signal_key)}).</div>`
          : ""}
        <div class="editor-grid">
          <div class="editor-field">
            <div class="editor-label-row">
              <label for="source-on-event-${sourceIndex}">${labels.onBehavior}</label>
              <button
                class="mini-button"
                type="button"
                data-testid="source-test-on"
                ?disabled=${(draft.on_event || "trigger") !== "trigger"}
                @click=${() => this._handleTestSource(draft, "trigger")}
              >
                Test On
              </button>
            </div>
            <select
              id="source-on-event-${sourceIndex}"
              .value=${draft.on_event || "trigger"}
              @change=${(ev: Event) => {
                this._updateSourceDraft(config, sourceIndex, {
                  ...draft,
                  on_event: (ev.target as HTMLSelectElement).value as "trigger" | "none",
                });
              }}
            >
              <option value="trigger">Mark occupied</option>
              <option value="none">No change</option>
            </select>
          </div>

          <div class="editor-field">
            <label for="source-on-timeout-${sourceIndex}">${labels.onTimeout}</label>
            <div class="editor-timeout">
              <input
                id="source-on-timeout-${sourceIndex}"
                type="range"
                min="1"
                max="120"
                step="1"
                .value=${String(onTimeoutMinutes)}
                ?disabled=${draft.on_timeout === null}
                @input=${(ev: Event) => {
                  const minutes = Number((ev.target as HTMLInputElement).value) || 1;
                  this._onTimeoutMemory = {
                    ...this._onTimeoutMemory,
                    [sourceKey]: minutes * 60,
                  };
                  this._updateSourceDraft(config, sourceIndex, { ...draft, on_timeout: minutes * 60 });
                }}
              />
              <input
                type="number"
                min="1"
                max="120"
                .value=${String(onTimeoutMinutes)}
                ?disabled=${draft.on_timeout === null}
                @change=${(ev: Event) => {
                  const minutes = Math.max(1, Math.min(120, Number((ev.target as HTMLInputElement).value) || 1));
                  this._onTimeoutMemory = {
                    ...this._onTimeoutMemory,
                    [sourceKey]: minutes * 60,
                  };
                  this._updateSourceDraft(config, sourceIndex, { ...draft, on_timeout: minutes * 60 });
                }}
              />
              <span class="text-muted">min</span>
            </div>
            <label class="editor-toggle">
              <input
                type="checkbox"
                .checked=${draft.on_timeout === null}
                @change=${(ev: Event) => {
                  const checked = (ev.target as HTMLInputElement).checked;
                  const remembered = this._onTimeoutMemory[sourceKey];
                  const fallbackSeconds = onTimeoutMinutes * 60;
                  const restoreSeconds = remembered ?? fallbackSeconds;
                  if (checked) {
                    this._onTimeoutMemory = {
                      ...this._onTimeoutMemory,
                      [sourceKey]: draft.on_timeout ?? restoreSeconds,
                    };
                  }
                  this._updateSourceDraft(config, sourceIndex, {
                    ...draft,
                    on_timeout: checked ? null : restoreSeconds,
                  });
                }}
              />
              Indefinite (until ${labels.offState})
            </label>
          </div>

          ${supportsOffBehavior
            ? html`
                <div class="editor-field">
                  <div class="editor-label-row">
                    <label for="source-off-event-${sourceIndex}">${labels.offBehavior}</label>
                    <button
                      class="mini-button"
                      type="button"
                      data-testid="source-test-off"
                      ?disabled=${(draft.off_event || "none") !== "clear"}
                      @click=${() => this._handleTestSource(draft, "clear")}
                    >
                      Test Off
                    </button>
                  </div>
                  <select
                    id="source-off-event-${sourceIndex}"
                    .value=${draft.off_event || "none"}
                    @change=${(ev: Event) => {
                      this._updateSourceDraft(config, sourceIndex, {
                        ...draft,
                        off_event: (ev.target as HTMLSelectElement).value as "clear" | "none",
                      });
                    }}
                  >
                    <option value="none">No change</option>
                    <option value="clear">Mark vacant</option>
                  </select>
                </div>

                <div class="editor-field">
                  <label for="source-off-trailing-${sourceIndex}">${labels.offDelay}</label>
                  <div class="editor-timeout">
                    <input
                      id="source-off-trailing-${sourceIndex}"
                      type="range"
                      min="0"
                      max="120"
                      step="1"
                      .value=${String(offTrailingMinutes)}
                      ?disabled=${(draft.off_event || "none") !== "clear"}
                      @input=${(ev: Event) => {
                        const minutes = Math.max(0, Math.min(120, Number((ev.target as HTMLInputElement).value) || 0));
                        this._updateSourceDraft(config, sourceIndex, { ...draft, off_trailing: minutes * 60 });
                      }}
                    />
                    <input
                      type="number"
                      min="0"
                      max="120"
                      .value=${String(offTrailingMinutes)}
                      ?disabled=${(draft.off_event || "none") !== "clear"}
                      @change=${(ev: Event) => {
                        const minutes = Math.max(0, Math.min(120, Number((ev.target as HTMLInputElement).value) || 0));
                        this._updateSourceDraft(config, sourceIndex, { ...draft, off_trailing: minutes * 60 });
                      }}
                    />
                    <span class="text-muted">min</span>
                  </div>
                </div>
              `
            : ""}
        </div>
      </div>
    `;
  }

  private _normalizeActionTriggerType(value: unknown): TopomationActionRule["trigger_type"] {
    const normalized = String(value || "")
      .trim()
      .toLowerCase();
    if (normalized === "on_occupied") return "on_occupied";
    if (normalized === "on_vacant") return "on_vacant";
    if (normalized === "on_dark") return "on_dark";
    if (normalized === "on_bright") return "on_bright";
    if (normalized === "occupied") return "on_occupied";
    if (normalized === "vacant") return "on_vacant";
    if (normalized === "dark") return "on_dark";
    if (normalized === "bright") return "on_bright";
    return "on_occupied";
  }

  private _defaultActionAmbientConditionForTrigger(
    triggerType: TopomationActionRule["trigger_type"]
  ): "any" | "dark" | "bright" {
    if (triggerType === "on_dark") return "dark";
    if (triggerType === "on_bright") return "bright";
    return "any";
  }

  private _lockedActionAmbientConditionForTrigger(
    triggerType: TopomationActionRule["trigger_type"]
  ): "dark" | "bright" | undefined {
    if (triggerType === "on_dark") return "dark";
    if (triggerType === "on_bright") return "bright";
    return undefined;
  }

  private _isActionAmbientConditionLockedByTrigger(
    triggerType: TopomationActionRule["trigger_type"]
  ): boolean {
    return this._lockedActionAmbientConditionForTrigger(triggerType) !== undefined;
  }

  private _lockedActionMustBeOccupiedForTrigger(
    triggerType: TopomationActionRule["trigger_type"]
  ): boolean | undefined {
    if (triggerType === "on_occupied") return true;
    if (triggerType === "on_vacant") return false;
    return undefined;
  }

  private _isActionMustBeOccupiedLockedByTrigger(
    triggerType: TopomationActionRule["trigger_type"]
  ): boolean {
    return this._lockedActionMustBeOccupiedForTrigger(triggerType) !== undefined;
  }

  private _actionTriggerLabel(triggerType: TopomationActionRule["trigger_type"]): string {
    if (triggerType === "on_occupied") return "On occupied";
    if (triggerType === "on_vacant") return "On vacant";
    if (triggerType === "on_bright") return "On bright";
    return "On dark";
  }

  private _serviceLabel(actionService?: string): string {
    const raw = String(actionService || "").trim();
    if (!raw) return "";
    return raw.replace(/[_.]+/g, " ");
  }

  private _autoActionRuleName(rule: TopomationActionRule, index: number): string {
    const triggerType = this._normalizeActionTriggerType(rule.trigger_type);
    let name = this._actionTriggerLabel(triggerType);
    const targets = this._actionTargetsForRule(rule);
    const primaryAction = targets[0];
    const entityId = String(primaryAction?.entity_id || rule.action_entity_id || "").trim();
    if (entityId) {
      name = `${name}: ${this._entityName(entityId)}`;
      if (targets.length > 1) {
        name = `${name} +${targets.length - 1}`;
      }
    }
    const service = this._serviceLabel(primaryAction?.service || rule.action_service);
    if (service) {
      name = `${name} (${service})`;
    }
    if (rule.time_condition_enabled) {
      const begin = this._normalizeActionTime(rule.start_time, "18:00");
      const end = this._normalizeActionTime(rule.end_time, "23:59");
      name = `${name} ${begin}-${end}`;
    }
    if (name === this._actionTriggerLabel(triggerType)) {
      return `${name} (${index + 1})`;
    }
    return name;
  }

  private _isPlaceholderRuleName(name: string): boolean {
    const trimmed = String(name || "").trim();
    if (!trimmed) {
      return true;
    }
    return /^Rule \d+$/i.test(trimmed) || /^New rule$/i.test(trimmed);
  }

  private _resolveActionRuleName(rule: TopomationActionRule, index: number): string {
    const explicitName = String(rule.name || "").trim();
    if (!this._isPlaceholderRuleName(explicitName)) return explicitName;
    return this._autoActionRuleName(rule, index);
  }

  private _normalizeActionAmbientCondition(
    value: unknown,
    triggerType: TopomationActionRule["trigger_type"]
  ): "any" | "dark" | "bright" {
    const lockedAmbient = this._lockedActionAmbientConditionForTrigger(triggerType);
    if (lockedAmbient !== undefined) {
      return lockedAmbient;
    }
    const normalized = String(value || "")
      .trim()
      .toLowerCase();
    if (normalized === "any" || normalized === "dark" || normalized === "bright") {
      return normalized;
    }
    return this._defaultActionAmbientConditionForTrigger(triggerType);
  }

  private _normalizeActionMustBeOccupied(
    value: unknown,
    triggerType: TopomationActionRule["trigger_type"]
  ): boolean | undefined {
    const lockedMustBeOccupied = this._lockedActionMustBeOccupiedForTrigger(triggerType);
    if (lockedMustBeOccupied !== undefined) {
      return lockedMustBeOccupied;
    }
    return typeof value === "boolean" ? value : undefined;
  }

  private _normalizeActionTargets(
    rawTargets: unknown,
    triggerType: TopomationActionRule["trigger_type"]
  ): RuleActionTarget[] {
    if (!Array.isArray(rawTargets)) return [];
    const normalized: RuleActionTarget[] = [];
    const seenEntityIds = new Set<string>();
    for (const rawTarget of rawTargets) {
      if (!rawTarget || typeof rawTarget !== "object" || Array.isArray(rawTarget)) continue;
      const entityId = String((rawTarget as { entity_id?: unknown }).entity_id || "").trim();
      if (!entityId || seenEntityIds.has(entityId)) continue;
      const serviceRaw = String((rawTarget as { service?: unknown }).service || "").trim();
      const service = serviceRaw || this._defaultActionServiceForTrigger(entityId, triggerType);
      const data = this._normalizeActionDataForRule(
        (rawTarget as { data?: unknown }).data,
        entityId,
        service
      );
      normalized.push({
        entity_id: entityId,
        service,
        ...(data ? { data } : {}),
      });
      seenEntityIds.add(entityId);
    }
    return normalized;
  }

  private _actionTargetsForRule(rule: Partial<TopomationActionRule>): RuleActionTarget[] {
    const triggerType = this._normalizeActionTriggerType(rule.trigger_type);
    const normalizedTargets = this._normalizeActionTargets(
      (rule as { actions?: unknown }).actions,
      triggerType
    );
    if (normalizedTargets.length > 0) {
      return normalizedTargets;
    }

    const entityId = String(rule.action_entity_id || "").trim();
    if (!entityId) return [];
    const serviceRaw = String(rule.action_service || "").trim();
    const service = serviceRaw || this._defaultActionServiceForTrigger(entityId, triggerType);
    const data = this._normalizeActionDataForRule(rule.action_data, entityId, service);
    return [
      {
        entity_id: entityId,
        service,
        ...(data ? { data } : {}),
      },
    ];
  }

  private _setActionTargetsForRule(
    rule: Partial<TopomationActionRule>,
    nextTargetsRaw: RuleActionTarget[]
  ): Pick<TopomationActionRule, "actions" | "action_entity_id" | "action_service" | "action_data"> {
    const triggerType = this._normalizeActionTriggerType(rule.trigger_type);
    const nextTargets = this._normalizeActionTargets(nextTargetsRaw, triggerType);
    const primary = nextTargets[0];
    return {
      actions: nextTargets,
      action_entity_id: primary?.entity_id,
      action_service: primary?.service,
      action_data: primary?.data,
    };
  }

  private _normalizeActionTime(value: unknown, fallback: string): string {
    const raw = String(value || "").trim();
    if (!raw) return fallback;
    const parts = raw.split(":");
    if (parts.length < 2) return fallback;
    const hour = Number(parts[0]);
    const minute = Number(parts[1]);
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return fallback;
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return fallback;
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }

  private _generateRuleUuid(): string {
    const cryptoApi = (globalThis as any)?.crypto;
    if (cryptoApi && typeof cryptoApi.randomUUID === "function") {
      const uuid = String(cryptoApi.randomUUID()).trim().toLowerCase();
      if (uuid) return uuid;
    }
    return `rule_${Date.now().toString(36)}_${Math.floor(Math.random() * 1_000_000)
      .toString(36)
      .padStart(4, "0")}`;
  }

  private _normalizeRuleUuid(rawValue: unknown, fallbackSeed?: string): string {
    const raw =
      typeof rawValue === "string" && rawValue.trim().length > 0
        ? rawValue.trim().toLowerCase()
        : "";
    const cleanedRaw = raw.replace(/[^a-z0-9_-]+/g, "").replace(/^[-_]+|[-_]+$/g, "");
    if (cleanedRaw.length >= 8) {
      return cleanedRaw.slice(0, 64);
    }

    const fallback = String(fallbackSeed || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "")
      .replace(/^[-_]+|[-_]+$/g, "");
    if (fallback.length >= 8) {
      return fallback.slice(-64);
    }
    return this._generateRuleUuid();
  }

  private _defaultActionServiceForTrigger(
    entityId: string,
    triggerType: TopomationActionRule["trigger_type"]
  ): string {
    const domain = String(entityId || "").split(".", 1)[0];
    const prefersOff = triggerType === "on_vacant" || triggerType === "on_bright";
    if (domain === "media_player") {
      return prefersOff ? "media_stop" : "media_play";
    }
    if (domain === "switch") {
      return prefersOff ? "turn_off" : "turn_on";
    }
    if (domain === "light") {
      return prefersOff ? "turn_off" : "turn_on";
    }
    if (prefersOff) {
      return "turn_off";
    }
    return "turn_on";
  }

  private _tabSupportsActionAmbient(tab: DeviceAutomationTab): boolean {
    return tab === "lighting";
  }

  private _ruleTabForEditing(rule: Partial<TopomationActionRule>): DeviceAutomationTab | undefined {
    const actionEntityId = String(rule.action_entity_id || "").trim();
    if (actionEntityId) {
      return this._tabForActionEntity(actionEntityId);
    }
    const ruleId = String(rule.id || "").trim();
    if (ruleId) {
      return this._actionRuleTabById[ruleId];
    }
    return undefined;
  }

  private _effectiveAmbientConditionForRule(
    rule: Partial<TopomationActionRule>,
    tab?: DeviceAutomationTab
  ): "any" | "dark" | "bright" {
    const resolvedTab = tab ?? this._ruleTabForEditing(rule);
    if (resolvedTab && !this._tabSupportsActionAmbient(resolvedTab)) {
      return "any";
    }
    return this._normalizeActionAmbientCondition(
      rule.ambient_condition,
      this._normalizeActionTriggerType(rule.trigger_type)
    );
  }

  private _normalizeActionBrightnessPct(rawValue: unknown, fallback = 30): number {
    const numeric = Number(rawValue);
    if (Number.isFinite(numeric) && numeric > 0) {
      return Math.max(1, Math.min(100, Math.round(numeric)));
    }
    return Math.max(1, Math.min(100, Math.round(fallback)));
  }

  private _normalizeActionPercent(rawValue: unknown, fallback = 30): number {
    const numeric = Number(rawValue);
    if (Number.isFinite(numeric)) {
      return Math.max(0, Math.min(100, Math.round(numeric)));
    }
    return Math.max(0, Math.min(100, Math.round(fallback)));
  }

  private _normalizeActionVolumeLevel(rawValue: unknown, fallback = 30): number {
    const numeric = Number(rawValue);
    if (Number.isFinite(numeric) && numeric >= 0 && numeric <= 1) {
      return Math.round(numeric * 100);
    }
    return this._normalizeActionPercent(rawValue, fallback);
  }

  private _normalizeActionDataForRule(
    rawData: unknown,
    actionEntityId: string,
    actionService: string
  ): Record<string, unknown> | undefined {
    if (!rawData || typeof rawData !== "object" || Array.isArray(rawData)) {
      return undefined;
    }
    const normalizedEntityId = String(actionEntityId || "").trim();
    const normalizedService = String(actionService || "").trim();
    const data = { ...(rawData as Record<string, unknown>) };
    delete data.entity_id;

    const dimmableLightTurnOn =
      normalizedEntityId.startsWith("light.") &&
      this._isDimmableEntity(normalizedEntityId) &&
      normalizedService === "turn_on";
    const mediaMuteAction =
      normalizedEntityId.startsWith("media_player.") && normalizedService === "volume_mute";
    const mediaVolumeAction =
      normalizedEntityId.startsWith("media_player.") && normalizedService === "volume_set";
    const fanPercentageAction =
      normalizedEntityId.startsWith("fan.") && normalizedService === "set_percentage";

    if (Object.prototype.hasOwnProperty.call(data, "brightness_pct")) {
      if (dimmableLightTurnOn) {
        data.brightness_pct = this._normalizeActionBrightnessPct(data.brightness_pct, 30);
      } else {
        delete data.brightness_pct;
      }
    }

    if (Object.prototype.hasOwnProperty.call(data, "is_volume_muted")) {
      if (mediaMuteAction && typeof data.is_volume_muted === "boolean") {
        data.is_volume_muted = Boolean(data.is_volume_muted);
      } else {
        delete data.is_volume_muted;
      }
    }

    if (Object.prototype.hasOwnProperty.call(data, "volume_level")) {
      if (mediaVolumeAction) {
        data.volume_level = this._normalizeActionVolumeLevel(data.volume_level, 30) / 100;
      } else {
        delete data.volume_level;
      }
    }

    if (Object.prototype.hasOwnProperty.call(data, "percentage")) {
      if (fanPercentageAction) {
        data.percentage = this._normalizeActionPercent(data.percentage, 30);
      } else {
        delete data.percentage;
      }
    }

    for (const [key, value] of Object.entries(data)) {
      if (value === undefined || value === null || value === "") {
        delete data[key];
      }
    }
    return Object.keys(data).length > 0 ? data : undefined;
  }

  private _actionServiceOptionsForRule(
    entityId: string,
    triggerType: TopomationActionRule["trigger_type"]
  ): Array<{ value: string; label: string; service: string; data?: Record<string, unknown> }> {
    const normalizedEntityId = String(entityId || "").trim();
    if (!normalizedEntityId) return [];
    const domain = normalizedEntityId.split(".", 1)[0];
    if (domain === "media_player") {
      const options = [
        { value: "turn_on", label: "Power on", service: "turn_on" },
        { value: "turn_off", label: "Power off", service: "turn_off" },
        { value: "media_play", label: "Play", service: "media_play" },
        { value: "media_play_pause", label: "Play/Pause", service: "media_play_pause" },
        { value: "media_pause", label: "Pause", service: "media_pause" },
        { value: "media_stop", label: "Stop", service: "media_stop" },
        { value: "volume_set", label: "Set volume", service: "volume_set", data: { volume_level: 0.3 } },
        { value: "volume_mute:true", label: "Mute", service: "volume_mute", data: { is_volume_muted: true } },
        { value: "volume_mute:false", label: "Unmute", service: "volume_mute", data: { is_volume_muted: false } },
      ];
      const preferredOrder =
        triggerType === "on_vacant"
          ? ["media_pause", "media_stop", "turn_off", "volume_mute:true"]
          : ["media_play", "turn_on", "volume_mute:false", "volume_set"];
      return options.sort((a, b) => {
        const aIndex = preferredOrder.indexOf(a.value);
        const bIndex = preferredOrder.indexOf(b.value);
        if (aIndex >= 0 || bIndex >= 0) {
          if (aIndex < 0) return 1;
          if (bIndex < 0) return -1;
          return aIndex - bIndex;
        }
        return a.label.localeCompare(b.label);
      });
    }
    if (domain === "fan") {
      const options = [
        { value: "turn_on", label: "Turn on", service: "turn_on" },
        { value: "turn_off", label: "Turn off", service: "turn_off" },
        { value: "set_percentage", label: "Set speed", service: "set_percentage", data: { percentage: 30 } },
      ];
      const defaultService = this._defaultActionServiceForTrigger(normalizedEntityId, triggerType);
      return options.sort((a, b) => {
        if (a.service === defaultService) return -1;
        if (b.service === defaultService) return 1;
        return a.label.localeCompare(b.label);
      });
    }
    if (domain === "switch") {
      return [
        { value: "turn_on", label: "Turn on", service: "turn_on" },
        { value: "turn_off", label: "Turn off", service: "turn_off" },
        { value: "toggle", label: "Toggle", service: "toggle" },
      ];
    }
    if (domain === "light") {
      return [
        { value: "turn_on", label: "Turn on", service: "turn_on" },
        { value: "turn_off", label: "Turn off", service: "turn_off" },
        { value: "toggle", label: "Toggle", service: "toggle" },
      ];
    }
    const defaultService = this._defaultActionServiceForTrigger(normalizedEntityId, triggerType);
    return [
      { value: "turn_on", label: "Turn on", service: "turn_on" },
      { value: "turn_off", label: "Turn off", service: "turn_off" },
    ].sort((a, b) => (a.value === defaultService ? -1 : b.value === defaultService ? 1 : 0));
  }

  private _actionServiceOptionValue(actionService?: string, actionData?: unknown): string {
    const normalizedService = String(actionService || "").trim();
    if (normalizedService === "volume_mute") {
      const isMuted =
        typeof (actionData as { is_volume_muted?: unknown } | undefined)?.is_volume_muted === "boolean"
          ? Boolean((actionData as { is_volume_muted?: unknown }).is_volume_muted)
          : true;
      return `volume_mute:${isMuted ? "true" : "false"}`;
    }
    if (normalizedService === "volume_set") {
      return "volume_set";
    }
    if (normalizedService === "set_percentage") {
      return "set_percentage";
    }
    return normalizedService;
  }

  private _mediaVolumePercent(actionData?: unknown): number {
    return this._normalizeActionVolumeLevel(
      (actionData as { volume_level?: unknown } | undefined)?.volume_level,
      30
    );
  }

  private _fanSpeedPercent(actionData?: unknown): number {
    return this._normalizeActionPercent(
      (actionData as { percentage?: unknown } | undefined)?.percentage,
      30
    );
  }

  private _actionServiceSelection(
    optionValue: string,
    entityId: string,
    triggerType: TopomationActionRule["trigger_type"]
  ): { service: string; data?: Record<string, unknown> } {
    const options = this._actionServiceOptionsForRule(entityId, triggerType);
    const match = options.find((option) => option.value === optionValue);
    if (match) {
      return {
        service: match.service,
        ...(match.data ? { data: match.data } : {}),
      };
    }
    return {
      service: String(optionValue || "").trim() || this._defaultActionServiceForTrigger(entityId, triggerType),
    };
  }

  private _actionDomainsForTab(tab: DeviceAutomationTab): string[] {
    if (tab === "lighting") return ["light"];
    if (tab === "media") return ["media_player"];
    return ["fan", "switch"];
  }

  private _tabForActionEntity(entityId: string): DeviceAutomationTab | undefined {
    const domain = String(entityId || "").split(".", 1)[0];
    if (domain === "light") return "lighting";
    if (domain === "media_player") return "media";
    if (domain === "switch") return "hvac";
    if (domain === "fan") return "hvac";
    return undefined;
  }

  private _isActionRuleEntity(entityId: string, tab?: DeviceAutomationTab): boolean {
    const stateObj = this.hass?.states?.[entityId];
    if (!stateObj) return false;
    const domain = entityId.split(".", 1)[0];
    if (!tab) {
      return domain === "light" || domain === "switch" || domain === "media_player" || domain === "fan";
    }
    return this._actionDomainsForTab(tab).includes(domain);
  }

  private _actionRuleTargetEntities(tab?: DeviceAutomationTab): string[] {
    if (!this.location) return [];
    const ids = new Set<string>();
    for (const entityId of this.location.entity_ids || []) {
      if (this._isActionRuleEntity(entityId, tab)) {
        ids.add(entityId);
      }
    }
    if (this.location.ha_area_id) {
      for (const entityId of this._entitiesForArea(this.location.ha_area_id)) {
        if (this._isActionRuleEntity(entityId, tab)) {
          ids.add(entityId);
        }
      }
    }
    return [...ids].sort((a, b) => this._entityName(a).localeCompare(this._entityName(b)));
  }

  private _normalizeActionRule(
    rule: Partial<TopomationActionRule>,
    index: number
  ): TopomationActionRule {
    const triggerType = this._normalizeActionTriggerType(rule.trigger_type);
    const id =
      typeof rule.id === "string" && rule.id.trim().length > 0
        ? rule.id
        : `action_rule_${index + 1}`;
    const explicitTargets = this._actionTargetsForRule(rule);
    const actions = explicitTargets;
    const primaryAction = actions[0];
    const actionEntityId = primaryAction?.entity_id;
    const actionService = primaryAction?.service;
    const actionData = primaryAction?.data;
    const ruleUuid = this._normalizeRuleUuid(rule.rule_uuid, id);
    return {
      id,
      entity_id:
        typeof rule.entity_id === "string" && rule.entity_id.trim().length > 0
          ? rule.entity_id
          : `automation.${id}`,
      name:
        typeof rule.name === "string" && rule.name.trim().length > 0
          ? rule.name.trim()
          : "New rule",
      rule_uuid: ruleUuid,
      trigger_type: triggerType,
      actions,
      action_entity_id: actionEntityId || undefined,
      action_service: actionService || undefined,
      action_data: actionData,
      ambient_condition: this._normalizeActionAmbientCondition(
        rule.ambient_condition,
        triggerType
      ),
      must_be_occupied: this._normalizeActionMustBeOccupied(rule.must_be_occupied, triggerType),
      time_condition_enabled: Boolean(rule.time_condition_enabled),
      start_time: this._normalizeActionTime(rule.start_time, "18:00"),
      end_time: this._normalizeActionTime(rule.end_time, "23:59"),
      run_on_startup: false,
      enabled: rule.enabled !== false,
      require_dark: this._normalizeActionAmbientCondition(rule.ambient_condition, triggerType) === "dark",
    };
  }

  private _workingActionRules(): TopomationActionRule[] {
    const source = this._actionRulesDraft ?? this._actionRules;
    return source.map((rule, index) => this._normalizeActionRule(rule, index));
  }

  private _rulesForDeviceAutomationTab(tab: DeviceAutomationTab): TopomationActionRule[] {
    const rules = this._workingActionRules();
    return rules.filter((rule) => {
      const actionEntityId = String(rule.action_entity_id || "").trim();
      if (!actionEntityId) {
        return this._actionRuleTabById[String(rule.id || "")] === tab;
      }
      const entityTab = this._tabForActionEntity(actionEntityId);
      return entityTab === tab;
    });
  }

  private _resetActionRulesDraftFromLoaded(): void {
    const normalizedRules = this._actionRules.map((rule, index) =>
      this._normalizeActionRule(rule, index)
    );
    this._actionRulesDraft = normalizedRules;
    this._actionRulesDraftDirty = false;
    this._actionRulesSaveError = undefined;
    this._editingActionRuleNameId = undefined;
    this._editingActionRuleNameValue = "";
    this._actionRuleTabById = {};
    for (const rule of normalizedRules) {
      const ruleId = String(rule.id || "");
      const tab = this._tabForActionEntity(String(rule.action_entity_id || "").trim());
      if (ruleId && tab) {
        this._actionRuleTabById[ruleId] = tab;
      }
    }
  }

  private _setActionRulesDraft(rules: TopomationActionRule[]): void {
    const normalizedRules = rules.map((rule, index) => this._normalizeActionRule(rule, index));
    const nextRuleIds = new Set(normalizedRules.map((rule) => String(rule.id || "")));
    const nextTabById: Record<string, DeviceAutomationTab> = {};
    for (const [ruleId, tab] of Object.entries(this._actionRuleTabById)) {
      if (nextRuleIds.has(ruleId)) {
        nextTabById[ruleId] = tab;
      }
    }
    for (const rule of normalizedRules) {
      const ruleId = String(rule.id || "");
      const entityTab = this._tabForActionEntity(String(rule.action_entity_id || "").trim());
      if (ruleId && entityTab) {
        nextTabById[ruleId] = entityTab;
      }
    }
    this._actionRuleTabById = nextTabById;
    this._actionRulesDraft = normalizedRules;
    this._actionRulesDraftDirty = this._computeActionRulesDraftDirty(normalizedRules);
    this._actionRulesSaveError = undefined;
    this.requestUpdate();
  }

  private _actionRuleLookup(
    sourceRules: TopomationActionRule[]
  ): { byId: Map<string, TopomationActionRule>; byRuleUuid: Map<string, TopomationActionRule> } {
    const byId = new Map<string, TopomationActionRule>();
    const byRuleUuid = new Map<string, TopomationActionRule>();
    sourceRules.forEach((rawRule, index) => {
      const rule = this._normalizeActionRule(rawRule, index);
      const ruleId = String(rule.id || "").trim();
      if (ruleId) {
        byId.set(ruleId, rule);
      }
      const ruleUuid = this._normalizeRuleUuid(rule.rule_uuid, ruleId);
      if (ruleUuid) {
        byRuleUuid.set(ruleUuid, rule);
      }
    });
    return { byId, byRuleUuid };
  }

  private _persistedActionRuleForDraft(
    draftRule: TopomationActionRule,
    sourceRules?: TopomationActionRule[]
  ): TopomationActionRule | undefined {
    const rules = sourceRules ?? this._actionRules;
    const lookup = this._actionRuleLookup(rules);
    const draftId = String(draftRule.id || "").trim();
    if (draftId && lookup.byId.has(draftId)) {
      return lookup.byId.get(draftId);
    }
    const draftRuleUuid = this._normalizeRuleUuid(draftRule.rule_uuid, draftId);
    if (draftRuleUuid && lookup.byRuleUuid.has(draftRuleUuid)) {
      return lookup.byRuleUuid.get(draftRuleUuid);
    }
    return undefined;
  }

  private _actionRuleComparableSignature(
    rawRule: TopomationActionRule,
    index: number
  ): string {
    const rule = this._normalizeActionRule(rawRule, index);
    const actions = this._actionTargetsForRule(rule).map((target) => ({
      entity_id: target.entity_id,
      service: target.service,
      data: this._normalizeActionDataForRule(target.data, target.entity_id, target.service) || {},
    }));
    return JSON.stringify({
      name: this._resolveActionRuleName(rule, index),
      trigger_type: this._normalizeActionTriggerType(rule.trigger_type),
      actions,
      ambient_condition: this._effectiveAmbientConditionForRule(rule),
      must_be_occupied:
        typeof rule.must_be_occupied === "boolean" ? rule.must_be_occupied : null,
      time_condition_enabled: Boolean(rule.time_condition_enabled),
      start_time: this._normalizeActionTime(rule.start_time, "18:00"),
      end_time: this._normalizeActionTime(rule.end_time, "23:59"),
      enabled: rule.enabled !== false,
    });
  }

  private _isActionRuleDirty(
    draftRule: TopomationActionRule,
    index: number,
    persistedRule?: TopomationActionRule
  ): boolean {
    const baselineRule = persistedRule ?? this._persistedActionRuleForDraft(draftRule);
    if (!baselineRule) {
      return true;
    }
    const baselineRuleId = String(baselineRule.id || "").trim();
    const normalizedDraftRule = this._normalizeActionRule(
      {
        ...draftRule,
        ...(baselineRuleId ? { id: baselineRuleId } : {}),
      },
      index
    );
    return (
      this._actionRuleComparableSignature(normalizedDraftRule, index) !==
      this._actionRuleComparableSignature(baselineRule, index)
    );
  }

  private _computeActionRulesDraftDirty(draftRules: TopomationActionRule[]): boolean {
    const normalizedDraftRules = draftRules.map((rule, index) => this._normalizeActionRule(rule, index));
    const normalizedPersistedRules = this._actionRules.map((rule, index) =>
      this._normalizeActionRule(rule, index)
    );

    if (normalizedDraftRules.length !== normalizedPersistedRules.length) {
      return true;
    }

    const persistedLookup = this._actionRuleLookup(normalizedPersistedRules);
    const matchedPersistedRuleIds = new Set<string>();
    for (const [index, draftRule] of normalizedDraftRules.entries()) {
      const persistedRule = this._persistedActionRuleForDraft(draftRule, normalizedPersistedRules);
      if (!persistedRule) {
        return true;
      }
      matchedPersistedRuleIds.add(String(persistedRule.id || ""));
      if (this._isActionRuleDirty(draftRule, index, persistedRule)) {
        return true;
      }
      const draftRuleUuid = this._normalizeRuleUuid(draftRule.rule_uuid, draftRule.id);
      if (draftRuleUuid && !persistedLookup.byRuleUuid.has(draftRuleUuid)) {
        return true;
      }
    }
    return matchedPersistedRuleIds.size !== normalizedPersistedRules.length;
  }

  private _rebuildActionRulesDraftAfterSync(
    syncedRules: TopomationActionRule[],
    previousDraftRules: TopomationActionRule[],
    exclusions: { ruleIds?: Set<string>; ruleUuids?: Set<string> } = {}
  ): void {
    const normalizedSyncedRules = syncedRules.map((rule, index) => this._normalizeActionRule(rule, index));
    const syncedLookup = this._actionRuleLookup(normalizedSyncedRules);
    const mergedRules = [...normalizedSyncedRules];

    const excludedIds = exclusions.ruleIds || new Set<string>();
    const excludedRuleUuids = exclusions.ruleUuids || new Set<string>();
    for (const [draftIndex, rawDraftRule] of previousDraftRules.entries()) {
      const draftRule = this._normalizeActionRule(rawDraftRule, draftIndex);
      const draftRuleId = String(draftRule.id || "").trim();
      const draftRuleUuid = this._normalizeRuleUuid(draftRule.rule_uuid, draftRuleId);
      if (excludedIds.has(draftRuleId) || excludedRuleUuids.has(draftRuleUuid)) {
        continue;
      }
      const syncedRule =
        (draftRuleId ? syncedLookup.byId.get(draftRuleId) : undefined) ||
        (draftRuleUuid ? syncedLookup.byRuleUuid.get(draftRuleUuid) : undefined);
      if (!syncedRule) {
        mergedRules.push(draftRule);
        continue;
      }
      const syncedIndex = mergedRules.findIndex((rule) => String(rule.id || "") === String(syncedRule.id || ""));
      if (syncedIndex < 0) {
        continue;
      }
      if (!this._isActionRuleDirty(draftRule, syncedIndex, syncedRule)) {
        continue;
      }
      mergedRules[syncedIndex] = this._normalizeActionRule(
        {
          ...draftRule,
          id: syncedRule.id,
          entity_id: syncedRule.entity_id,
          rule_uuid: syncedRule.rule_uuid,
        },
        syncedIndex
      );
    }

    this._actionRules = normalizedSyncedRules;
    this._setActionRulesDraft(mergedRules);
  }

  private _mergeSavedActionRuleLocally(
    savedRule: TopomationActionRule,
    previousDraftRules: TopomationActionRule[],
    previousRuleId: string
  ): void {
    const normalizedSavedRule = this._normalizeActionRule(savedRule, 0);
    const savedRuleId = String(normalizedSavedRule.id || "").trim();
    const savedRuleUuid = this._normalizeRuleUuid(normalizedSavedRule.rule_uuid, savedRuleId);

    const nextPersistedRules = this._actionRules
      .filter((rule) => {
        const existingId = String(rule.id || "").trim();
        const existingUuid = this._normalizeRuleUuid(rule.rule_uuid, existingId);
        if (existingId && savedRuleId && existingId === savedRuleId) return false;
        if (existingId && previousRuleId && existingId === previousRuleId) return false;
        if (savedRuleUuid && existingUuid === savedRuleUuid) return false;
        return true;
      })
      .map((rule, index) => this._normalizeActionRule(rule, index));
    nextPersistedRules.push(normalizedSavedRule);

    const nextDraftRules = previousDraftRules
      .filter((rule) => String(rule.id || "").trim() !== previousRuleId)
      .map((rule, index) => this._normalizeActionRule(rule, index));
    nextDraftRules.push(normalizedSavedRule);

    this._actionRules = nextPersistedRules;
    this._setActionRulesDraft(nextDraftRules);

    if (previousRuleId && previousRuleId !== savedRuleId) {
      const previousTab = this._actionRuleTabById[previousRuleId];
      if (previousTab && savedRuleId) {
        this._actionRuleTabById = {
          ...this._actionRuleTabById,
          [savedRuleId]: previousTab,
        };
        delete this._actionRuleTabById[previousRuleId];
      }
    }
  }

  private _addActionRule(tab: DeviceAutomationTab): void {
    const rules = this._workingActionRules();
    const candidates = this._actionRuleTargetEntities(tab);
    const actionEntityId = candidates[0] || "";
    const triggerType: TopomationActionRule["trigger_type"] = tab === "lighting" ? "on_dark" : "on_occupied";
    const nextRuleId = `action_rule_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    this._actionRuleTabById[nextRuleId] = tab;
    const nextRule: TopomationActionRule = {
      id: nextRuleId,
      entity_id: "",
      name: "New rule",
      rule_uuid: this._generateRuleUuid(),
      trigger_type: triggerType,
      actions: actionEntityId
        ? [
            {
              entity_id: actionEntityId,
              service: this._defaultActionServiceForTrigger(actionEntityId, triggerType),
            },
          ]
        : [],
      action_entity_id: actionEntityId || undefined,
      action_service: this._defaultActionServiceForTrigger(actionEntityId, triggerType),
      ambient_condition: this._defaultActionAmbientConditionForTrigger(triggerType),
      must_be_occupied: this._normalizeActionMustBeOccupied(undefined, triggerType),
      time_condition_enabled: false,
      start_time: "18:00",
      end_time: "23:59",
      run_on_startup: false,
      enabled: true,
    };
    this._setActionRulesDraft([...rules, nextRule]);
  }

  private _updateActionRule(
    ruleId: string,
    patch: Partial<TopomationActionRule>
  ): void {
    const rules = this._workingActionRules().map((rule, index) => {
      if (rule.id !== ruleId) return this._normalizeActionRule(rule, index);
      const previousTriggerType = this._normalizeActionTriggerType(rule.trigger_type);
      const merged = {
        ...rule,
        ...patch,
      };
      let mergedTargets = this._actionTargetsForRule(merged);
      if (Object.prototype.hasOwnProperty.call(patch, "trigger_type")) {
        const triggerType = this._normalizeActionTriggerType(patch.trigger_type);
        merged.trigger_type = triggerType;
        if (!Object.prototype.hasOwnProperty.call(patch, "ambient_condition")) {
          const movedOffAmbientDerivedTrigger =
            this._isActionAmbientConditionLockedByTrigger(previousTriggerType) &&
            !this._isActionAmbientConditionLockedByTrigger(triggerType);
          merged.ambient_condition = movedOffAmbientDerivedTrigger
            ? this._defaultActionAmbientConditionForTrigger(triggerType)
            : this._normalizeActionAmbientCondition(merged.ambient_condition, triggerType);
        }
        if (!Object.prototype.hasOwnProperty.call(patch, "must_be_occupied")) {
          const movedOffOccupancyDerivedTrigger =
            this._isActionMustBeOccupiedLockedByTrigger(previousTriggerType) &&
            !this._isActionMustBeOccupiedLockedByTrigger(triggerType);
          merged.must_be_occupied = movedOffOccupancyDerivedTrigger
            ? this._normalizeActionMustBeOccupied(undefined, triggerType)
            : this._normalizeActionMustBeOccupied(merged.must_be_occupied, triggerType);
        }
        if (
          !Object.prototype.hasOwnProperty.call(patch, "action_service") &&
          !Object.prototype.hasOwnProperty.call(patch, "actions")
        ) {
          mergedTargets = mergedTargets.map((target) => {
            const nextService = this._defaultActionServiceForTrigger(target.entity_id, triggerType);
            const nextData = this._normalizeActionDataForRule(
              target.data,
              target.entity_id,
              nextService
            );
            return {
              entity_id: target.entity_id,
              service: nextService,
              ...(nextData ? { data: nextData } : {}),
            };
          });
        }
      }
      if (Object.prototype.hasOwnProperty.call(patch, "actions")) {
        mergedTargets = this._normalizeActionTargets(
          patch.actions as unknown,
          this._normalizeActionTriggerType(merged.trigger_type)
        );
      }
      if (Object.prototype.hasOwnProperty.call(patch, "action_entity_id")) {
        const entityId = String(patch.action_entity_id || "").trim();
        if (!entityId) {
          mergedTargets = [];
        } else if (mergedTargets.length === 0) {
          const nextService = this._defaultActionServiceForTrigger(
            entityId,
            this._normalizeActionTriggerType(merged.trigger_type)
          );
          mergedTargets = [{ entity_id: entityId, service: nextService }];
        } else {
          const firstTarget = { ...mergedTargets[0], entity_id: entityId };
          if (!Object.prototype.hasOwnProperty.call(patch, "action_service")) {
            firstTarget.service = this._defaultActionServiceForTrigger(
              entityId,
              this._normalizeActionTriggerType(merged.trigger_type)
            );
          }
          firstTarget.data = this._normalizeActionDataForRule(
            firstTarget.data,
            firstTarget.entity_id,
            firstTarget.service
          );
          mergedTargets = [
            {
              entity_id: firstTarget.entity_id,
              service: firstTarget.service,
              ...(firstTarget.data ? { data: firstTarget.data } : {}),
            },
            ...mergedTargets.slice(1),
          ];
        }
      }
      if (Object.prototype.hasOwnProperty.call(patch, "action_service")) {
        const nextService = String(patch.action_service || "").trim();
        if (mergedTargets.length === 0) {
          const currentEntityId = String(merged.action_entity_id || "").trim();
          if (currentEntityId && nextService) {
            mergedTargets = [
              {
                entity_id: currentEntityId,
                service: nextService,
              },
            ];
          }
        } else {
          const firstTarget = mergedTargets[0];
          const normalizedData = this._normalizeActionDataForRule(
            Object.prototype.hasOwnProperty.call(patch, "action_data")
              ? patch.action_data
              : firstTarget.data,
            firstTarget.entity_id,
            nextService
          );
          mergedTargets = [
            {
              entity_id: firstTarget.entity_id,
              service: nextService,
              ...(normalizedData ? { data: normalizedData } : {}),
            },
            ...mergedTargets.slice(1),
          ];
        }
      }
      if (
        Object.prototype.hasOwnProperty.call(patch, "action_data") &&
        !Object.prototype.hasOwnProperty.call(patch, "action_service")
      ) {
        if (mergedTargets.length > 0) {
          const firstTarget = mergedTargets[0];
          const normalizedData = this._normalizeActionDataForRule(
            patch.action_data,
            firstTarget.entity_id,
            firstTarget.service
          );
          mergedTargets = [
            {
              entity_id: firstTarget.entity_id,
              service: firstTarget.service,
              ...(normalizedData ? { data: normalizedData } : {}),
            },
            ...mergedTargets.slice(1),
          ];
        }
      }
      const targetFields = this._setActionTargetsForRule(merged, mergedTargets);
      merged.actions = targetFields.actions;
      merged.action_entity_id = targetFields.action_entity_id;
      merged.action_service = targetFields.action_service;
      merged.action_data = targetFields.action_data;
      return this._normalizeActionRule(merged, index);
    });
    this._setActionRulesDraft(rules);
  }

  private _removeActionRule(ruleId: string): void {
    const rules = this._workingActionRules().filter((rule) => rule.id !== ruleId);
    this._setActionRulesDraft(rules);
  }

  private _startActionRuleNameEdit(ruleId: string, currentName: string): void {
    this._editingActionRuleNameId = ruleId;
    this._editingActionRuleNameValue = currentName;
    this.requestUpdate();
  }

  private _cancelActionRuleNameEdit(): void {
    this._editingActionRuleNameId = undefined;
    this._editingActionRuleNameValue = "";
  }

  private _commitActionRuleNameEdit(ruleId: string, fallback: string): void {
    const value = this._editingActionRuleNameValue.trim() || fallback;
    this._cancelActionRuleNameEdit();
    this._updateActionRule(ruleId, { name: value });
  }

  private _actionRuleValidationErrors(rules: TopomationActionRule[]): string[] {
    const errors: string[] = [];
    const hhmmPattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
    rules.forEach((rule, index) => {
      const label = rule.name?.trim() || "New rule";
      const targets = this._actionTargetsForRule(rule);
      if (targets.length === 0) {
        errors.push(`${label}: select at least one target device.`);
      }
      if (targets.some((target) => !target.service)) {
        errors.push(`${label}: select an action service for each target.`);
      }
      if (rule.time_condition_enabled) {
        if (!hhmmPattern.test(String(rule.start_time || ""))) {
          errors.push(`${label}: begin time must be HH:MM.`);
        }
        if (!hhmmPattern.test(String(rule.end_time || ""))) {
          errors.push(`${label}: end time must be HH:MM.`);
        }
      }
    });
    return errors;
  }

  private async _saveActionRulesDraft(): Promise<void> {
    if (!this.location || !this.hass || this._savingActionRules) return;
    const rules = this._workingActionRules().map((rule, index) => ({
      ...rule,
      name: this._resolveActionRuleName(rule, index),
    }));
    const validationErrors = this._actionRuleValidationErrors(rules);
    if (validationErrors.length > 0) {
      this._actionRulesSaveError = validationErrors[0];
      this.requestUpdate();
      return;
    }

    this._savingActionRules = true;
    this._actionRulesSaveError = undefined;
    this.requestUpdate();

    try {
      const existingRules = await listTopomationActionRules(
        this.hass,
        this.location.id,
        this.entryId
      );
      const existingById = new Map(existingRules.map((rule) => [String(rule.id || ""), rule]));
      const existingByRuleUuid = new Map(
        existingRules
          .map((rule) => {
            const rawRuleUuid = String(rule.rule_uuid || "").trim();
            if (!rawRuleUuid) {
              return ["", rule] as const;
            }
            return [this._normalizeRuleUuid(rawRuleUuid, rule.id), rule] as const;
          })
          .filter(([ruleUuid]) => ruleUuid.length > 0)
      );
      const retainedRuleIds = new Set<string>();
      for (const [index, rule] of rules.entries()) {
        const normalizedRule = this._normalizeActionRule(rule, index);
        const ruleTargets = this._actionTargetsForRule(normalizedRule);
        const primaryAction = ruleTargets[0];
        if (!primaryAction) continue;
        const existing =
          existingById.get(String(normalizedRule.id || "")) ||
          existingByRuleUuid.get(
            this._normalizeRuleUuid(normalizedRule.rule_uuid, normalizedRule.id)
          );
        const ruleTab = this._ruleTabForEditing(normalizedRule);
        const ambientCondition = this._effectiveAmbientConditionForRule(normalizedRule, ruleTab);
        const automationId = existing ? String(existing.id || "") : undefined;
        const createdRule = await createTopomationActionRule(
          this.hass,
          {
            location: this.location,
            name: normalizedRule.name || "New rule",
            rule_uuid: normalizedRule.rule_uuid,
            automation_id: automationId || undefined,
            trigger_type: normalizedRule.trigger_type,
            actions: ruleTargets,
            action_entity_id: primaryAction.entity_id,
            action_service: primaryAction.service,
            action_data: primaryAction.data,
            ambient_condition: ambientCondition,
            must_be_occupied: normalizedRule.must_be_occupied,
            time_condition_enabled: Boolean(normalizedRule.time_condition_enabled),
            start_time: normalizedRule.start_time,
            end_time: normalizedRule.end_time,
            require_dark: ambientCondition === "dark",
          },
          this.entryId
        );
        retainedRuleIds.add(String(createdRule.id || ""));
      }

      const deleteOps = existingRules
        .filter((rule) => !retainedRuleIds.has(String(rule.id || "")))
        .map((rule) => deleteTopomationActionRule(this.hass, rule, this.entryId));
      if (deleteOps.length > 0) {
        await Promise.all(deleteOps);
      }

      const syncedRules = await listTopomationActionRules(
        this.hass,
        this.location.id,
        this.entryId
      );
      this._actionRules = syncedRules;
      this._resetActionRulesDraftFromLoaded();
      this._showToast("Action rules saved", "success");
    } catch (err: any) {
      this._actionRulesSaveError = err?.message || "Failed to save action rules";
      this._showToast(this._actionRulesSaveError, "error");
    } finally {
      this._savingActionRules = false;
      this.requestUpdate();
    }
  }

  private _discardActionRuleEdits(ruleId: string): void {
    const currentRules = this._workingActionRules();
    const nextRules: TopomationActionRule[] = [];
    for (const [index, rawRule] of currentRules.entries()) {
      const rule = this._normalizeActionRule(rawRule, index);
      if (String(rule.id || "") !== ruleId) {
        nextRules.push(rule);
        continue;
      }
      const persistedRule = this._persistedActionRuleForDraft(rule);
      if (persistedRule) {
        nextRules.push(this._normalizeActionRule(persistedRule, index));
      }
    }
    this._setActionRulesDraft(nextRules);
    this._showToast("Rule edits discarded", "success");
  }

  private async _saveOrUpdateActionRule(ruleId: string): Promise<void> {
    if (!this.location || !this.hass || this._savingActionRules) {
      return;
    }
    const previousDraftRules = this._workingActionRules();
    const ruleIndex = previousDraftRules.findIndex((rule) => String(rule.id || "") === ruleId);
    if (ruleIndex < 0) {
      return;
    }
    const rule = this._normalizeActionRule(previousDraftRules[ruleIndex], ruleIndex);
    const validationErrors = this._actionRuleValidationErrors([
      {
        ...rule,
        name: this._resolveActionRuleName(rule, ruleIndex),
      },
    ]);
    if (validationErrors.length > 0) {
      this._actionRulesSaveError = validationErrors[0];
      this.requestUpdate();
      return;
    }

    const persistedRule = this._persistedActionRuleForDraft(rule);
    this._savingActionRules = true;
    this._actionRulesSaveError = undefined;
    this.requestUpdate();

    try {
      const ruleTargets = this._actionTargetsForRule(rule);
      const primaryAction = ruleTargets[0];
      const ruleTab = this._ruleTabForEditing(rule);
      const ambientCondition = this._effectiveAmbientConditionForRule(rule, ruleTab);
      if (!primaryAction) {
        throw new Error("Select at least one target device before saving.");
      }
      const savedRule = await createTopomationActionRule(
        this.hass,
        {
          location: this.location,
          name: this._resolveActionRuleName(rule, ruleIndex),
          rule_uuid: rule.rule_uuid,
          automation_id: persistedRule ? String(persistedRule.id || "").trim() || undefined : undefined,
          trigger_type: rule.trigger_type,
          actions: ruleTargets,
          action_entity_id: primaryAction.entity_id,
          action_service: primaryAction.service,
          action_data: primaryAction.data,
          ambient_condition: ambientCondition,
          must_be_occupied: rule.must_be_occupied,
          time_condition_enabled: Boolean(rule.time_condition_enabled),
          start_time: rule.start_time,
          end_time: rule.end_time,
          run_on_startup: false,
          require_dark: ambientCondition === "dark",
        },
        this.entryId
      );
      this._mergeSavedActionRuleLocally(savedRule, previousDraftRules, ruleId);
      window.setTimeout(() => {
        void this._loadActionRules();
      }, 250);
      this._showToast(persistedRule ? "Rule updated" : "Rule saved", "success");
    } catch (err: any) {
      this._actionRulesSaveError = err?.message || "Failed to save action rule";
      this._showToast(this._actionRulesSaveError, "error");
    } finally {
      this._savingActionRules = false;
      this.requestUpdate();
    }
  }

  private async _deleteActionRule(ruleId: string): Promise<void> {
    if (!this.location || !this.hass || this._savingActionRules) {
      return;
    }
    const previousDraftRules = this._workingActionRules();
    const draftRuleIndex = previousDraftRules.findIndex((rule) => String(rule.id || "") === ruleId);
    if (draftRuleIndex < 0) {
      return;
    }
    const draftRule = this._normalizeActionRule(previousDraftRules[draftRuleIndex], draftRuleIndex);
    const persistedRule = this._persistedActionRuleForDraft(draftRule);
    if (!persistedRule) {
      this._removeActionRule(ruleId);
      this._showToast("Rule removed", "success");
      return;
    }

    this._savingActionRules = true;
    this._actionRulesSaveError = undefined;
    this.requestUpdate();

    try {
      await deleteTopomationActionRule(this.hass, persistedRule, this.entryId);
      const syncedRules = await listTopomationActionRules(this.hass, this.location.id, this.entryId);
      this._rebuildActionRulesDraftAfterSync(syncedRules, previousDraftRules, {
        ruleIds: new Set([ruleId]),
        ruleUuids: new Set([this._normalizeRuleUuid(draftRule.rule_uuid, ruleId)]),
      });
      this._showToast("Rule deleted", "success");
    } catch (err: any) {
      this._actionRulesSaveError = err?.message || "Failed to delete action rule";
      this._showToast(this._actionRulesSaveError, "error");
    } finally {
      this._savingActionRules = false;
      this.requestUpdate();
    }
  }

  private _resetActionRulesDraft(): void {
    this._resetActionRulesDraftFromLoaded();
    this._showToast("Action rule changes reverted", "success");
  }

  private _deviceAutomationTabMeta(
    tab: DeviceAutomationTab
  ): { icon: string; label: string; emptyMessage: string } {
    if (tab === "lighting") {
      return {
        icon: "mdi:lightbulb-group",
        label: "Lighting Rules",
        emptyMessage: "No lighting rules configured yet.",
      };
    }
    if (tab === "media") {
      return {
        icon: "mdi:speaker-wireless",
        label: "Media Rules",
        emptyMessage: "No media rules configured yet.",
      };
    }
    return {
      icon: "mdi:fan",
      label: "HVAC Rules",
      emptyMessage: "No HVAC rules configured yet.",
    };
  }

  private _renderLightingRuleActionRows(
    ruleId: string,
    rule: TopomationActionRule,
    busy: boolean,
    entityOptions: string[]
  ) {
    const ruleTargets = this._actionTargetsForRule(rule);
    const targetByEntity = new Map(ruleTargets.map((target) => [target.entity_id, target] as const));
    const rowEntityIds = [...entityOptions];
    for (const target of ruleTargets) {
      if (!rowEntityIds.includes(target.entity_id)) {
        rowEntityIds.unshift(target.entity_id);
      }
    }
    if (rowEntityIds.length === 0) {
      return html`<div class="text-muted">No local lights found for this location.</div>`;
    }

    return html`
      <div class="dusk-light-actions" data-testid=${`action-rule-${ruleId}-actions`}>
        ${rowEntityIds.map((entityId, index) => {
          const target = targetByEntity.get(entityId);
          const included = Boolean(target);
          const dimmable = this._isDimmableEntity(entityId);
          const defaultService = this._defaultActionServiceForTrigger(entityId, rule.trigger_type);
          const activeService = String(target?.service || defaultService);
          const targetData = this._normalizeActionDataForRule(target?.data, entityId, activeService);
          const brightnessPct = this._normalizeActionBrightnessPct(
            (targetData as { brightness_pct?: unknown } | undefined)?.brightness_pct,
            30
          );
          const modeValue = included
            ? activeService === "turn_off"
              ? "off"
              : activeService === "toggle"
                ? "toggle"
                : "on"
            : defaultService === "turn_off"
              ? "off"
              : "on";
          const level = included && activeService === "turn_off" ? 0 : brightnessPct;

          const upsertTarget = (patch: Partial<RuleActionTarget>) => {
            const nextTargets = ruleTargets.map((item) => ({ ...item }));
            const targetIndex = nextTargets.findIndex((item) => item.entity_id === entityId);
            const baseTarget =
              targetIndex >= 0
                ? { ...nextTargets[targetIndex] }
                : {
                    entity_id: entityId,
                    service: defaultService,
                  };
            const nextServiceRaw = String(patch.service ?? baseTarget.service ?? "").trim();
            const nextService = nextServiceRaw || defaultService;
            const nextData = this._normalizeActionDataForRule(
              patch.data ?? baseTarget.data,
              entityId,
              nextService
            );
            const nextTarget: RuleActionTarget = {
              entity_id: entityId,
              service: nextService,
              ...(nextData ? { data: nextData } : {}),
            };
            if (targetIndex >= 0) {
              nextTargets[targetIndex] = nextTarget;
            } else {
              nextTargets.push(nextTarget);
            }
            this._updateActionRule(ruleId, { actions: nextTargets });
          };

          const removeTarget = () => {
            this._updateActionRule(ruleId, {
              actions: ruleTargets.filter((item) => item.entity_id !== entityId),
            });
          };

          return html`
            <div class="dusk-light-action-row" data-testid=${`action-rule-${ruleId}-device-row-${index}`}>
              <div class="dusk-light-action-grid ${included ? "" : "disabled"}">
                <input
                  type="checkbox"
                  class="switch-input"
                  .checked=${included}
                  ?disabled=${busy}
                  data-testid=${`action-rule-${ruleId}-device-include-${index}`}
                  @change=${(ev: Event) => {
                    const checked = (ev.target as HTMLInputElement).checked;
                    if (!checked) {
                      if (!included) return;
                      removeTarget();
                      return;
                    }
                    const nextActionData =
                      dimmable && defaultService === "turn_on"
                        ? {
                            brightness_pct: brightnessPct,
                          }
                        : {};
                    upsertTarget({
                      service: defaultService,
                      data: nextActionData,
                    });
                  }}
                />
                <div class="dusk-light-entity-meta">
                  <span>${this._entityName(entityId)}</span>
                  <code>${entityId}</code>
                </div>
                ${dimmable
                  ? html`
                      <label class="dusk-level-control">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          class="dusk-level-slider"
                          .value=${String(level)}
                          ?disabled=${busy || !included}
                          data-testid=${`action-rule-${ruleId}-device-level-${index}`}
                          @input=${(ev: Event) => {
                            const rawLevel = Number((ev.target as HTMLInputElement).value);
                            const nextLevel = Number.isFinite(rawLevel)
                              ? Math.max(0, Math.min(100, Math.round(rawLevel)))
                              : brightnessPct;
                            if (nextLevel <= 0) {
                              upsertTarget({
                                service: "turn_off",
                                data: {},
                              });
                              return;
                            }
                            upsertTarget({
                              service: "turn_on",
                              data: {
                                ...((targetData as Record<string, unknown>) || {}),
                                brightness_pct: nextLevel,
                              },
                            });
                          }}
                        />
                        <span class="dusk-level-value">${level}%</span>
                      </label>
                    `
                  : html`
                      <select
                        .value=${modeValue}
                        ?disabled=${busy || !included}
                        data-testid=${`action-rule-${ruleId}-device-action-${index}`}
                        @change=${(ev: Event) => {
                          const mode = String((ev.target as HTMLSelectElement).value || "on");
                          const service =
                            mode === "off" ? "turn_off" : mode === "toggle" ? "toggle" : "turn_on";
                          upsertTarget({
                            service,
                            data: {},
                          });
                        }}
                      >
                        <option value="on">Turn on</option>
                        <option value="off">Turn off</option>
                        <option value="toggle">Toggle</option>
                      </select>
                    `}
                <span class="text-muted">-</span>
                <span class="text-muted">-</span>
              </div>
            </div>
          `;
        })}
      </div>
    `;
  }

  private _renderDeviceAutomationTab(tab: DeviceAutomationTab) {
    if (!this.location) return "";
    const busy = this._savingActionRules || this._loadingActionRules;
    const meta = this._deviceAutomationTabMeta(tab);
    const rules = this._rulesForDeviceAutomationTab(tab);
    const entityOptions = this._actionRuleTargetEntities(tab);
    const triggerOptions =
      tab === "lighting"
        ? [
            { value: "on_dark", label: "On dark" },
            { value: "on_bright", label: "On bright" },
            { value: "on_occupied", label: "On occupied" },
            { value: "on_vacant", label: "On vacant" },
          ]
        : [
            { value: "on_occupied", label: "On occupied" },
            { value: "on_vacant", label: "On vacant" },
          ];
    const compatibleDeviceLabel =
      tab === "lighting"
        ? "light"
        : tab === "media"
          ? "media"
          : "HVAC or ventilation";
    const hasRuleInEditState = rules.some((rule, index) => {
      const persistedRule = this._persistedActionRuleForDraft(rule);
      return !persistedRule || this._isActionRuleDirty(rule, index, persistedRule);
    });

    return html`
      <div class="card-section" data-testid="actions-rules-section">
        <div class="section-title-row">
          <div class="section-title">
            <ha-icon .icon=${meta.icon}></ha-icon>
            ${meta.label}
          </div>
        </div>
        ${this._actionRulesError
          ? html`<div class="policy-warning">${this._actionRulesError}</div>`
          : ""}
        ${this._actionRulesSaveError
          ? html`<div class="policy-warning">${this._actionRulesSaveError}</div>`
          : ""}

        <div class="dusk-block-list">
          ${rules.length === 0
            ? html`
                <div class="text-muted">
                  ${meta.emptyMessage}
                  ${entityOptions.length === 0
                    ? html`No compatible ${compatibleDeviceLabel} devices found in this location.`
                    : ""}
                </div>
              `
            : rules.map((rule, index) => {
                const ruleId = String(rule.id || "");
                const editingName = this._editingActionRuleNameId === ruleId;
                const label = rule.name?.trim() || `Rule ${index + 1}`;
                const triggerType = this._normalizeActionTriggerType(rule.trigger_type);
                const supportsAmbientCondition = this._tabSupportsActionAmbient(tab);
                const selectedActionEntityId = String(rule.action_entity_id || "").trim();
                const normalizedActionData = this._normalizeActionDataForRule(
                  rule.action_data,
                  selectedActionEntityId,
                  String(rule.action_service || "")
                );
                const ambientLocked = this._isActionAmbientConditionLockedByTrigger(triggerType);
                const ambientCondition = this._normalizeActionAmbientCondition(
                  rule.ambient_condition,
                  triggerType
                );
                const mustBeOccupiedLocked =
                  this._isActionMustBeOccupiedLockedByTrigger(triggerType);
                const mustBeOccupied = this._normalizeActionMustBeOccupied(
                  rule.must_be_occupied,
                  triggerType
                );
                const showAmbientConditionRow = supportsAmbientCondition && !ambientLocked;
                const showOccupancyConditionRow = tab === "lighting";
                const occupancyConditionLabel = mustBeOccupied ? "Must be occupied" : "Must be vacant";
                const persistedRule = this._persistedActionRuleForDraft(rule);
                const isPersisted = Boolean(persistedRule);
                const hasRuleEdits = this._isActionRuleDirty(rule, index, persistedRule);
                const serviceOptions = this._actionServiceOptionsForRule(
                  selectedActionEntityId,
                  triggerType
                );
                const selectedServiceOptionValue = this._actionServiceOptionValue(
                  rule.action_service,
                  normalizedActionData
                );
                const showMediaVolumeRow =
                  tab === "media" &&
                  selectedActionEntityId.startsWith("media_player.") &&
                  selectedServiceOptionValue === "volume_set";
                const showFanSpeedRow =
                  tab === "hvac" &&
                  selectedActionEntityId.startsWith("fan.") &&
                  selectedServiceOptionValue === "set_percentage";
                return html`
                  <div class="dusk-block-row" data-testid=${`action-rule-${ruleId}`}>
                    <div class="dusk-block-head">
                      ${editingName
                        ? html`
                            <input
                              type="text"
                              class="input dusk-block-title-input"
                              .value=${this._editingActionRuleNameValue}
                              ?disabled=${busy}
                              @input=${(ev: Event) => {
                                this._editingActionRuleNameValue = (ev.target as HTMLInputElement).value;
                              }}
                              @blur=${() =>
                                this._commitActionRuleNameEdit(
                                  ruleId,
                                  "New rule"
                                )}
                              @keydown=${(ev: KeyboardEvent) => {
                                if (ev.key === "Enter") {
                                  this._commitActionRuleNameEdit(
                                    ruleId,
                                    "New rule"
                                  );
                                } else if (ev.key === "Escape") {
                                  this._cancelActionRuleNameEdit();
                                }
                              }}
                            />
                          `
                        : html`
                            <button
                              type="button"
                              class="dusk-block-title-button"
                              ?disabled=${busy}
                              @click=${() =>
                                this._startActionRuleNameEdit(
                                  ruleId,
                                  label
                                )}
                            >
                              ${label}
                            </button>
                          `}
                    </div>

                    <div class="dusk-rule-row">
                      <span class="config-label">Trigger</span>
                      <select
                        class="dusk-wide-select"
                        ?disabled=${busy}
                        @change=${(ev: Event) =>
                          this._updateActionRule(ruleId, {
                            trigger_type: this._normalizeActionTriggerType(
                              (ev.target as HTMLSelectElement).value
                            ),
                          })}
                      >
                        ${triggerOptions.map(
                          (option) => html`
                            <option
                              value=${option.value}
                              ?selected=${option.value === triggerType}
                            >
                              ${option.label}
                            </option>
                          `
                        )}
                      </select>
                    </div>

                    <div class="dusk-rule-section-title">Conditions</div>
                    <div class="dusk-conditions">
                      ${showAmbientConditionRow
                        ? html`
                            <div class="config-row">
                              <div>
                                <div class="config-label">Ambient must be</div>
                                <div class="config-help">Optional ambient filter at trigger time.</div>
                              </div>
                              <div class="config-value">
                                <select
                                  class="dusk-wide-select"
                                  .value=${ambientCondition}
                                  ?disabled=${busy}
                                  @change=${(ev: Event) =>
                                    this._updateActionRule(ruleId, {
                                      ambient_condition: this._normalizeActionAmbientCondition(
                                        (ev.target as HTMLSelectElement).value,
                                        triggerType
                                      ),
                                    })}
                                >
                                  <option value="any">Ignore ambient</option>
                                  <option value="dark">Must be dark</option>
                                  <option value="bright">Must be bright</option>
                                </select>
                              </div>
                            </div>
                          `
                        : ""}

                      ${showOccupancyConditionRow
                        ? html`
                            <div class="config-row">
                              <div>
                                <div class="config-label">Occupancy must be</div>
                                <div class="config-help">
                                  ${mustBeOccupiedLocked
                                    ? "Derived from trigger."
                                    : "Require the location to be occupied or vacant at trigger time."}
                                </div>
                              </div>
                              <div class="config-value">
                                ${mustBeOccupiedLocked
                                  ? html`
                                      <div class="dusk-condition-derived">
                                        <span>${occupancyConditionLabel}</span>
                                        <span class="dusk-condition-derived-note">Set by trigger</span>
                                      </div>
                                    `
                                  : html`
                                      <select
                                        class="dusk-wide-select"
                                        .value=${typeof mustBeOccupied === "boolean"
                                          ? mustBeOccupied
                                            ? "occupied"
                                            : "vacant"
                                          : "ignore"}
                                        ?disabled=${busy}
                                        @change=${(ev: Event) => {
                                          const nextValue = String(
                                            (ev.target as HTMLSelectElement).value || "ignore"
                                          ).trim();
                                          this._updateActionRule(ruleId, {
                                            must_be_occupied:
                                              nextValue === "occupied"
                                                ? true
                                                : nextValue === "vacant"
                                                  ? false
                                                  : undefined,
                                          });
                                        }}
                                      >
                                        <option value="ignore">Doesn't matter</option>
                                        <option value="occupied">Must be occupied</option>
                                        <option value="vacant">Must be vacant</option>
                                      </select>
                                    `}
                              </div>
                            </div>
                          `
                        : ""}

                      <div class="config-row">
                        <div>
                          <div class="config-label">Use time window</div>
                          <div class="config-help">
                            Limit this rule to a time range. Crossing midnight is supported.
                          </div>
                        </div>
                        <div class="config-value">
                          <input
                            type="checkbox"
                            class="switch-input"
                            .checked=${Boolean(rule.time_condition_enabled)}
                            ?disabled=${busy}
                            @change=${(ev: Event) =>
                              this._updateActionRule(ruleId, {
                                time_condition_enabled: (ev.target as HTMLInputElement).checked,
                              })}
                          />
                        </div>
                      </div>

                      ${rule.time_condition_enabled
                        ? html`
                            <div class="dusk-time-fields" style="margin-top: 8px;">
                              <label class="dusk-time-field">
                                <span class="config-label">Begin</span>
                                <input
                                  type="time"
                                  class="input"
                                  .value=${String(rule.start_time || "18:00")}
                                  ?disabled=${busy}
                                  @change=${(ev: Event) =>
                                    this._updateActionRule(ruleId, {
                                      start_time: this._normalizeActionTime(
                                        (ev.target as HTMLInputElement).value,
                                        "18:00"
                                      ),
                                    })}
                                />
                              </label>
                              <label class="dusk-time-field">
                                <span class="config-label">End</span>
                                <input
                                  type="time"
                                  class="input"
                                  .value=${String(rule.end_time || "23:59")}
                                  ?disabled=${busy}
                                  @change=${(ev: Event) =>
                                    this._updateActionRule(ruleId, {
                                      end_time: this._normalizeActionTime(
                                        (ev.target as HTMLInputElement).value,
                                        "23:59"
                                      ),
                                    })}
                                />
                              </label>
                            </div>
                          `
                        : ""}
                    </div>

                    <div class="dusk-rule-section-title">Actions</div>
                    ${tab === "lighting"
                      ? this._renderLightingRuleActionRows(
                          ruleId,
                          rule,
                          busy,
                          entityOptions
                        )
                      : html`
                          <div class="dusk-rule-row">
                            <span class="config-label">Target device</span>
                            <select
                              class="dusk-wide-select"
                              .value=${selectedActionEntityId}
                              ?disabled=${busy}
                              @change=${(ev: Event) => {
                                const entityId = String((ev.target as HTMLSelectElement).value || "").trim();
                                if (!entityId) {
                                  this._updateActionRule(ruleId, {
                                    action_entity_id: undefined,
                                    action_service: undefined,
                                    action_data: {},
                                  });
                                  return;
                                }
                                const nextService = this._defaultActionServiceForTrigger(
                                  entityId,
                                  rule.trigger_type
                                );
                                this._updateActionRule(ruleId, {
                                  action_entity_id: entityId,
                                  action_service: nextService,
                                  action_data: {},
                                });
                              }}
                            >
                              <option value="">Select device...</option>
                              ${entityOptions.map((entityId) => html`
                                <option value=${entityId}>
                                  ${this._entityName(entityId)}
                                </option>
                              `)}
                            </select>
                          </div>
                          <div class="dusk-rule-row">
                            <span class="config-label">Action</span>
                            <select
                              class="dusk-wide-select"
                              .value=${selectedServiceOptionValue}
                              ?disabled=${busy || !selectedActionEntityId}
                              @change=${(ev: Event) => {
                                const nextSelection = String(
                                  (ev.target as HTMLSelectElement).value || ""
                                ).trim();
                                const nextAction = this._actionServiceSelection(
                                  nextSelection,
                                  selectedActionEntityId,
                                  rule.trigger_type
                                );
                                this._updateActionRule(ruleId, {
                                  action_service: nextAction.service,
                                  action_data: nextAction.data || {},
                                });
                              }}
                            >
                              ${!selectedActionEntityId
                                ? html`<option value="">Select device first...</option>`
                                : serviceOptions.map(
                                    (option) => html`<option value=${option.value}>${option.label}</option>`
                                  )}
                            </select>
                          </div>
                          ${showMediaVolumeRow
                            ? html`
                                <div class="dusk-rule-row">
                                  <span class="config-label">Volume</span>
                                  <div class="config-value">
                                    <div class="dusk-slider-row">
                                      <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="1"
                                        .value=${String(this._mediaVolumePercent(normalizedActionData))}
                                        ?disabled=${busy}
                                        @input=${(ev: Event) => {
                                          const percent = this._normalizeActionPercent(
                                            (ev.target as HTMLInputElement).value,
                                            30
                                          );
                                          this._updateActionRule(ruleId, {
                                            action_data: { volume_level: percent / 100 },
                                          });
                                        }}
                                      />
                                      <span class="text-muted">
                                        ${this._mediaVolumePercent(normalizedActionData)}%
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              `
                            : ""}
                          ${showFanSpeedRow
                            ? html`
                                <div class="dusk-rule-row">
                                  <span class="config-label">Fan speed</span>
                                  <div class="config-value">
                                    <div class="dusk-slider-row">
                                      <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="1"
                                        .value=${String(this._fanSpeedPercent(normalizedActionData))}
                                        ?disabled=${busy}
                                        @input=${(ev: Event) => {
                                          const percent = this._normalizeActionPercent(
                                            (ev.target as HTMLInputElement).value,
                                            30
                                          );
                                          this._updateActionRule(ruleId, {
                                            action_data: { percentage: percent },
                                          });
                                        }}
                                      />
                                      <span class="text-muted">
                                        ${this._fanSpeedPercent(normalizedActionData)}%
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              `
                            : ""}
                        `}
                    <div class="dusk-block-footer">
                      ${!isPersisted
                        ? html`
                            <button
                              class="button button-primary"
                              type="button"
                              data-testid=${`action-rule-${ruleId}-save`}
                              ?disabled=${busy}
                              @click=${() => this._saveOrUpdateActionRule(ruleId)}
                            >
                              Save rule
                            </button>
                            <button
                              class="button button-secondary"
                              type="button"
                              data-testid=${`action-rule-${ruleId}-remove`}
                              ?disabled=${busy}
                              @click=${() => this._removeActionRule(ruleId)}
                            >
                              Remove rule
                            </button>
                          `
                        : hasRuleEdits
                          ? html`
                              <button
                                class="button button-primary"
                                type="button"
                                data-testid=${`action-rule-${ruleId}-update`}
                                ?disabled=${busy}
                                @click=${() => this._saveOrUpdateActionRule(ruleId)}
                              >
                                Update rule
                              </button>
                              <button
                                class="button button-secondary"
                                type="button"
                                data-testid=${`action-rule-${ruleId}-discard-edits`}
                                ?disabled=${busy}
                                @click=${() => this._discardActionRuleEdits(ruleId)}
                              >
                                Discard edits
                              </button>
                              <button
                                class="button button-secondary dusk-delete-rule-button"
                                type="button"
                                data-testid=${`action-rule-${ruleId}-delete`}
                                ?disabled=${busy}
                                @click=${() => this._deleteActionRule(ruleId)}
                              >
                                Delete rule
                              </button>
                            `
                          : html`
                              <button
                                class="button button-secondary dusk-delete-rule-button"
                                type="button"
                                data-testid=${`action-rule-${ruleId}-delete`}
                                ?disabled=${busy}
                                @click=${() => this._deleteActionRule(ruleId)}
                              >
                                Delete rule
                              </button>
                            `}
                    </div>
                  </div>
                `;
              })}
        </div>

        ${hasRuleInEditState
          ? ""
          : html`
              <div class="dusk-list-footer">
                <button
                  class="button button-primary"
                  data-testid="action-rule-add"
                  ?disabled=${busy}
                  @click=${() => this._addActionRule(tab)}
                >
                  Add rule
                </button>
              </div>
            `}
      </div>
    `;
  }

  private _workingSources(config: OccupancyConfig): OccupancySource[] {
    return [...(config.occupancy_sources || [])];
  }

  private _setWorkingSources(config: OccupancyConfig, sources: OccupancySource[]): void {
    const normalized = sources.map((source) => this._normalizeSource(source.entity_id, source));
    const nextMemory = { ...this._onTimeoutMemory };
    for (const source of normalized) {
      if (typeof source.on_timeout === "number" && source.on_timeout > 0) {
        nextMemory[this._sourceKeyFromSource(source)] = source.on_timeout;
      }
    }
    this._onTimeoutMemory = nextMemory;
    this._setOccupancyDraft({
      ...config,
      occupancy_sources: normalized,
    });
  }

  private _updateSourceDraft(config: OccupancyConfig, sourceIndex: number, draft: OccupancySource): void {
    const sources = this._workingSources(config);
    const current = sources[sourceIndex];
    if (!current) return;
    const supportedModes = this._modeOptionsForEntity(current.entity_id).map((opt) => opt.value);
    const normalizedDraft = this._normalizeSource(
      current.entity_id,
      {
        ...draft,
        mode: supportedModes.includes(draft.mode) ? draft.mode : supportedModes[0],
      }
    );
    sources[sourceIndex] = normalizedDraft;
    this._setWorkingSources(config, sources);
  }

  private _removeSource(sourceIndex: number, config: OccupancyConfig): void {
    const sources = this._workingSources(config);
    const removed = sources[sourceIndex];
    if (!removed) return;
    sources.splice(sourceIndex, 1);
    const nextMemory = { ...this._onTimeoutMemory };
    delete nextMemory[this._sourceKeyFromSource(removed)];
    this._onTimeoutMemory = nextMemory;
    this._setWorkingSources(config, sources);
  }

  private _removeSourcesByKey(keys: string[], config: OccupancyConfig): void {
    if (!keys.length) return;
    const keySet = new Set(keys);
    const sources = this._workingSources(config);
    const retained = sources.filter((source) => !keySet.has(this._sourceKeyFromSource(source)));
    if (retained.length === sources.length) return;

    const nextMemory = { ...this._onTimeoutMemory };
    for (const source of sources) {
      const sourceKey = this._sourceKeyFromSource(source);
      if (keySet.has(sourceKey)) {
        delete nextMemory[sourceKey];
      }
    }
    this._onTimeoutMemory = nextMemory;
    this._setWorkingSources(config, retained);
  }

  private _addSourceWithDefaults(
    entityId: string,
    config: OccupancyConfig,
    options?: { resetExternalPicker?: boolean; signalKey?: SourceSignalKey }
  ): boolean {
    if (!this.location) return false;
    if (this._isFloorLocation()) {
      this._showToast("Floor locations do not support occupancy sources.", "error");
      return false;
    }
    const existing = this._workingSources(config);
    const targetKey = this._sourceKey(entityId, options?.signalKey);
    if (existing.some((source) => this._sourceKeyFromSource(source) === targetKey)) {
      return false;
    }

    const entity = this.hass.states[entityId];
    if (!entity) {
      this._showToast(`Entity not found: ${entityId}`, "error");
      return false;
    }

    const defaults = getSourceDefaultsForEntity(entity);
    let signalDefaults: Partial<OccupancySource> = defaults;
    if (options?.signalKey === "playback" || options?.signalKey === "volume" || options?.signalKey === "mute") {
      signalDefaults = this._mediaSignalDefaults(entityId, options.signalKey);
    } else if (options?.signalKey === "power" || options?.signalKey === "level" || options?.signalKey === "color") {
      signalDefaults = this._lightSignalDefaults(entityId, options.signalKey);
    }
    const source = this._normalizeSource(entityId, signalDefaults);
    this._setWorkingSources(config, [...existing, source]);

    if (options?.resetExternalPicker) {
      this._externalAreaId = "";
      this._externalEntityId = "";
      this.requestUpdate();
    }
    return true;
  }

  private _resetSourceDraftState(): void {
    // Detection edits are staged in the occupancy draft and committed via Save.
  }

  private _normalizeSource(entityId: string, partial: Partial<OccupancySource>): OccupancySource {
    const isMedia = this._isMediaEntity(entityId);
    const isDimmable = this._isDimmableEntity(entityId);
    const isColorCapable = this._isColorCapableEntity(entityId);
    const signalFromSourceId = partial.source_id?.includes("::")
      ? (partial.source_id.split("::")[1] as SourceSignalKey)
      : undefined;
    const defaultSignalKey = this._defaultSignalKeyForEntity(entityId);
    const requestedSignalKey = partial.signal_key || signalFromSourceId || defaultSignalKey;
    let signalKey: SourceSignalKey | undefined;

    if (isMedia && (requestedSignalKey === "playback" || requestedSignalKey === "volume" || requestedSignalKey === "mute")) {
      signalKey = requestedSignalKey;
    } else if ((isDimmable || isColorCapable) && (requestedSignalKey === "power" || requestedSignalKey === "level" || requestedSignalKey === "color")) {
      signalKey = requestedSignalKey;
    }

    const sourceId = partial.source_id || this._sourceKey(entityId, signalKey);

    return {
      entity_id: entityId,
      source_id: sourceId,
      signal_key: signalKey,
      mode: (partial.mode || "any_change") as "any_change" | "specific_states",
      on_event: (partial.on_event || "trigger") as "trigger" | "none",
      on_timeout: partial.on_timeout,
      off_event: (partial.off_event || "none") as "clear" | "none",
      off_trailing: partial.off_trailing ?? 0,
    };
  }

  private _getOccupancyConfig(): OccupancyConfig {
    if (!this.location) {
      return this._sanitizeOccupancyConfig(this._occupancyDefaults());
    }
    return this._sanitizeOccupancyConfig(this._occupancyDraft || this._persistedOccupancyConfig(), this.location.id);
  }

  private _availableSourceAreas(): Array<{ area_id: string; name: string }> {
    if (this._isSiblingAreaSourceScope()) {
      return this._siblingSourceAreas();
    }

    const currentAreaId = this.location?.ha_area_id;
    const shadowAreaIds = this._managedShadowAreaIdSet();
    const areaMap = this.hass?.areas || {};
    const areas = Object.values(areaMap) as Array<{ area_id?: string; name?: string }>;
    return areas
      .filter((area) => !!area.area_id)
      .filter((area) => area.area_id !== currentAreaId)
      .filter((area) => !shadowAreaIds.has(area.area_id!))
      .map((area) => ({
        area_id: area.area_id!,
        name: area.name || area.area_id!,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  private _isSiblingAreaSourceScope(): boolean {
    if (!this.location) return false;
    if (getLocationType(this.location) !== "area") return false;
    if (!this.location.ha_area_id) return false;
    const allLocations = this.allLocations || [];
    if (allLocations.length === 0) return false;
    const parentId = this.location.parent_id ?? null;
    if (!parentId) return false;
    const parent = allLocations.find((candidate) => candidate.id === parentId);
    return !!parent && getLocationType(parent) === "floor";
  }

  private _siblingSourceAreas(): Array<{ area_id: string; name: string }> {
    if (!this.location || !this._isSiblingAreaSourceScope()) return [];
    const parentId = this.location.parent_id ?? null;
    if (!parentId) return [];
    const currentLocationId = this.location.id;
    const seen = new Set<string>();
    const managedShadowIds = this._managedShadowLocationIds();

    return (this.allLocations || [])
      .filter((candidate) => candidate.id !== currentLocationId)
      .filter((candidate) => (candidate.parent_id ?? null) === parentId)
      .filter((candidate) => getLocationType(candidate) === "area")
      .filter((candidate) => !this._isManagedShadowLocation(candidate, managedShadowIds))
      .filter((candidate) => !!candidate.ha_area_id)
      .filter((candidate) => {
        const areaId = candidate.ha_area_id!;
        if (seen.has(areaId)) return false;
        seen.add(areaId);
        return true;
      })
      .map((candidate) => ({
        area_id: candidate.ha_area_id!,
        name: candidate.name || candidate.ha_area_id!,
      }))
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  private _managedShadowAreaIdSet(): Set<string> {
    const ids = new Set<string>();
    const managedShadowIds = this._managedShadowLocationIds();
    for (const location of this.allLocations || []) {
      if (!this._isManagedShadowLocation(location, managedShadowIds)) continue;
      if (!location.ha_area_id) continue;
      ids.add(location.ha_area_id);
    }
    return ids;
  }

  private _entitiesForArea(areaId: string): string[] {
    const states = this.hass?.states || {};
    if (areaId === "__all__") {
      return Object.keys(states)
        .filter((entityId) => this._isCandidateEntity(entityId))
        .sort((a, b) => this._entityName(a).localeCompare(this._entityName(b)));
    }
    return Object.keys(states)
      .filter((entityId) => {
        const registryAreaId = this._entityAreaById[entityId];
        if (registryAreaId !== undefined && registryAreaId !== null) {
          return registryAreaId === areaId;
        }
        return states[entityId]?.attributes?.area_id === areaId;
      })
      .filter((entityId) => this._isCandidateEntity(entityId))
      .sort((a, b) => this._entityName(a).localeCompare(this._entityName(b)));
  }

  private _isCandidateEntity(entityId: string): boolean {
    const stateObj = this.hass?.states?.[entityId];
    if (!stateObj) return false;
    const registryMeta = this._entityRegistryMetaById[entityId];
    if (registryMeta?.hiddenBy || registryMeta?.disabledBy || registryMeta?.entityCategory) {
      return false;
    }
    const attrs = stateObj.attributes || {};
    if (this._isTopomationOccupancyOutput(attrs)) return false;
    const domain = entityId.split(".", 1)[0];
    if (["person", "device_tracker", "light", "switch", "fan", "media_player"].includes(domain)) {
      return true;
    }
    if (domain === "binary_sensor") {
      const deviceClass = String(attrs.device_class || "");
      if (!deviceClass) return true;
      return [
        "motion",
        "presence",
        "occupancy",
        "door",
        "garage_door",
        "opening",
        "window",
        "lock",
        "vibration",
        "sound",
      ].includes(deviceClass);
    }
    return false;
  }

  private _isCoreAreaSourceEntity(entityId: string): boolean {
    const stateObj = this.hass?.states?.[entityId];
    if (!stateObj) return false;
    const registryMeta = this._entityRegistryMetaById[entityId];
    if (registryMeta?.hiddenBy || registryMeta?.disabledBy || registryMeta?.entityCategory) {
      return false;
    }

    const attrs = stateObj.attributes || {};
    if (this._isTopomationOccupancyOutput(attrs)) return false;

    const domain = entityId.split(".", 1)[0];
    if (domain === "light" || domain === "fan" || domain === "media_player") {
      return true;
    }

    if (domain === "switch") {
      return this._isLightClassifiedSwitch(attrs);
    }

    if (domain === "binary_sensor") {
      const deviceClass = String(attrs.device_class || "");
      if (!deviceClass) return true;
      return [
        "motion",
        "presence",
        "occupancy",
        "door",
        "garage_door",
        "opening",
        "window",
        "lock",
        "vibration",
        "sound",
      ].includes(deviceClass);
    }

    return false;
  }

  private _isLightClassifiedSwitch(attrs: Record<string, any>): boolean {
    return String(attrs.device_class || "").toLowerCase() === "light";
  }

  private _isTopomationOccupancyOutput(attrs: Record<string, any>): boolean {
    if (attrs.device_class !== "occupancy") return false;
    const locationId = attrs.location_id;
    return typeof locationId === "string" && locationId.trim().length > 0;
  }

  private _getOccupancyState() {
    if (!this.location) return undefined;
    const locationId = this.location.id;
    const liveState = this._liveOccupancyStateByLocation[locationId];
    if (liveState) {
      return liveState;
    }
    const states = this.hass?.states || {};
    for (const stateObj of Object.values(states)) {
      const attrs = stateObj?.attributes || {};
      if (attrs.device_class !== "occupancy") continue;
      if (attrs.location_id !== this.location.id) continue;
      return stateObj as Record<string, any>;
    }
    return undefined;
  }

  private _resolveOccupiedState(occupancyState?: Record<string, any>): boolean | undefined {
    const locationId = this.location?.id;
    const override = locationId ? this.occupancyStates?.[locationId] : undefined;
    if (typeof override === "boolean") {
      return override;
    }
    if (!occupancyState) {
      return undefined;
    }
    if (occupancyState.state === "on") {
      return true;
    }
    if (occupancyState.state === "off") {
      return false;
    }
    return undefined;
  }

  private _activeContributorsExcluding(sourceId: string): string[] {
    const occupancyState = this._getOccupancyState();
    if ((occupancyState?.state || "").toLowerCase() !== "on") return [];

    const attrs = occupancyState?.attributes || {};
    const contributions = Array.isArray(attrs.contributions) ? attrs.contributions : [];
    if (!contributions.length) return [];

    const normalizedSource = String(sourceId || "").trim();
    const active = contributions
      .map((item: any) => String(item?.source_id || "").trim())
      .filter((id: string) => id.length > 0 && id !== normalizedSource);

    return Array.from(new Set(active));
  }

  private _getLockState(): InspectorLockState {
    const occupancyState = this._getOccupancyState();
    const attrs = occupancyState?.attributes || {};
    const lockedByRaw = attrs.locked_by;
    const lockModesRaw = attrs.lock_modes;
    const directLocksRaw = attrs.direct_locks;

    const lockedBy = Array.isArray(lockedByRaw) ? lockedByRaw.map((item: unknown) => String(item)) : [];
    const lockModes = Array.isArray(lockModesRaw) ? lockModesRaw.map((item: unknown) => String(item)) : [];
    const directLocks = Array.isArray(directLocksRaw)
      ? directLocksRaw
          .map((item: any) => ({
            sourceId: String(item?.source_id || "unknown"),
            mode: String(item?.mode || "freeze"),
            scope: String(item?.scope || "self"),
          }))
          .sort((a: OccupancyLockDirective, b: OccupancyLockDirective) =>
            `${a.sourceId}:${a.mode}:${a.scope}`.localeCompare(`${b.sourceId}:${b.mode}:${b.scope}`)
          )
      : [];

    return {
      isLocked: Boolean(attrs.is_locked),
      lockedBy,
      lockModes,
      directLocks,
    };
  }

  private _resolveVacantAt(attrs: Record<string, any>, occupied: boolean): Date | null | undefined {
    if (!occupied) return undefined;

    const explicitVacantAt = this._parseDateValue(attrs.vacant_at) || this._parseDateValue(attrs.effective_timeout_at);
    if (explicitVacantAt) {
      return explicitVacantAt;
    }

    const contributions = Array.isArray(attrs.contributions) ? attrs.contributions : [];
    if (!contributions.length) {
      return undefined;
    }

    let hasIndefiniteContribution = false;
    let latestExpiry: Date | undefined;
    for (const contribution of contributions) {
      const expiresAt = contribution?.expires_at;
      if (expiresAt === null || expiresAt === undefined) {
        hasIndefiniteContribution = true;
        continue;
      }
      const parsed = this._parseDateValue(expiresAt);
      if (!parsed) continue;
      if (!latestExpiry || parsed.getTime() > latestExpiry.getTime()) {
        latestExpiry = parsed;
      }
    }

    if (hasIndefiniteContribution) {
      return null;
    }
    return latestExpiry;
  }

  private _formatVacantAtLabel(vacantAt: Date | null | undefined): string {
    if (vacantAt instanceof Date) {
      return this._formatDateTime(vacantAt);
    }
    // Treat missing/unparseable timeout metadata as unscheduled, never "Unknown".
    return "No timeout scheduled";
  }

  private _resolveVacancyReason(
    occupancyState: Record<string, any> | undefined,
    occupiedState: boolean | undefined
  ): string | undefined {
    if (occupiedState !== false) return undefined;
    const locationId = this.location?.id;
    if (!locationId) return undefined;

    const transitionReason = this.occupancyTransitions?.[locationId]?.reason;
    const transitionOccupied = this.occupancyTransitions?.[locationId]?.occupied;
    if (transitionOccupied === false) {
      const formattedTransitionReason = this._formatOccupancyReason(transitionReason);
      if (formattedTransitionReason) return formattedTransitionReason;
    }

    return this._formatOccupancyReason(occupancyState?.attributes?.reason);
  }

  private _resolveOccupiedReason(
    occupancyState: Record<string, any> | undefined,
    occupiedState: boolean | undefined
  ): string | undefined {
    if (occupiedState !== true) return undefined;
    const locationId = this.location?.id;
    if (!locationId) return undefined;

    const transitionReason = this.occupancyTransitions?.[locationId]?.reason;
    const transitionOccupied = this.occupancyTransitions?.[locationId]?.occupied;
    if (transitionOccupied === true) {
      const formattedTransitionReason = this._formatOccupancyReason(transitionReason);
      if (formattedTransitionReason) return formattedTransitionReason;
    }

    const occupancyReason = this._formatOccupancyReason(occupancyState?.attributes?.reason);
    if (occupancyReason) return occupancyReason;

    const contributions = this._occupancyContributions(this._getOccupancyConfig(), true);
    if (!contributions.length) return "Active source events detected";
    const topContributor = contributions[0];
    return `Contributed by ${topContributor.sourceLabel}`;
  }

  private _formatOccupancyReason(reason: unknown): string | undefined {
    if (typeof reason !== "string") return undefined;
    const rawReason = reason.trim();
    if (!rawReason) return undefined;
    const normalizedReason = rawReason.toLowerCase();

    if (normalizedReason === "timeout") {
      return "Vacated by timeout";
    }
    if (normalizedReason === "propagation:parent") {
      return "Vacated by parent propagation";
    }
    if (normalizedReason.startsWith("propagation:child:")) {
      return "Vacated by child propagation";
    }
    if (normalizedReason.startsWith("event:")) {
      const eventType = normalizedReason.split(":", 2)[1];
      if (eventType === "clear") return "Vacated by clear event";
      if (eventType === "vacate") return "Vacated explicitly";
      if (eventType) return this._formatOccupancyEventReason(eventType, "vacancy");
    }
    if (normalizedReason.startsWith("occupancy:")) {
      const eventType = normalizedReason.split(":", 2)[1];
      if (eventType) return this._formatOccupancyEventReason(eventType, "occupied");
    }
    return `Reason: ${rawReason}`;
  }

  private _formatOccupancyEventReason(eventType: string, mode: "occupied" | "vacancy"): string {
    const prefixes = {
      occupied: "Occupied by",
      vacancy: "Vacated by",
    };
    const prefix = prefixes[mode];

    if (eventType === "handoff") {
      return `${prefix} room handoff`;
    }
    if (eventType === "trigger") {
      return `${prefix} trigger`;
    }
    if (eventType === "inherit") {
      return `${prefix} inherited state`;
    }
    return `${prefix} ${eventType} event`;
  }

  private _occupancyContributions(
    config: OccupancyConfig,
    onlyActive = false
  ): Array<{ sourceLabel: string; sourceId: string; stateLabel: string; relativeTime: string }>{
    const occupancyState = this._getOccupancyState();
    if (!occupancyState) return [];
    const attrs = occupancyState.attributes || {};
    const rawContributions = Array.isArray(attrs.contributions)
      ? attrs.contributions
      : [];

    const nowMs = this._nowEpochMs;
    const rows = rawContributions
      .map((contribution: any) => {
        const rawSourceId =
          typeof contribution?.source_id === "string" && contribution.source_id
            ? contribution.source_id
            : typeof contribution?.source === "string" && contribution.source
              ? contribution.source
              : "";
        if (!rawSourceId) return undefined;

        const sourceLabel = this._sourceLabelForSourceId(config, rawSourceId);
        const state = String(contribution?.state || contribution?.state_value || "").trim() || "active";
        const timestamp =
          this._parseDateValue(contribution?.updated_at) ||
          this._parseDateValue(contribution?.changed_at) ||
          this._parseDateValue(contribution?.last_changed) ||
          this._parseDateValue(contribution?.timestamp);

        const relativeTime = timestamp
          ? `${this._formatRelativeDuration(timestamp)} ago`
          : this._isContributionActive(contribution)
            ? "active"
            : "inactive";

        return {
          sourceLabel,
          sourceId: rawSourceId,
          stateLabel: state,
          relativeTime,
          _timestampMs: timestamp ? timestamp.getTime() : nowMs + (state === "active" ? 0 : -1),
          _active: this._isContributionActive(contribution),
        };
      })
      .filter((item): item is { sourceLabel: string; sourceId: string; stateLabel: string; relativeTime: string; _timestampMs: number; _active: boolean } =>
        Boolean(item)
      );

    const ordered = [...rows].sort((left, right) => {
      if (left._active !== right._active) return left._active ? -1 : 1;
      return right._timestampMs - left._timestampMs;
    });

    const filtered = onlyActive ? ordered.filter((item) => item._active) : ordered;
    return filtered.map(({ sourceLabel, stateLabel, relativeTime, sourceId }) => ({
      sourceLabel: `${sourceLabel}${sourceLabel === sourceId ? "" : ` (${sourceId})`}`,
      sourceId,
      stateLabel,
      relativeTime,
    }));
  }

  private _isContributionActive(contribution: any): boolean {
    if (!contribution) return false;
    const state = String(contribution.state || contribution.value || "").toLowerCase();
    if (state === "on" || state === "active" || state === "occupied" || state === "trigger") {
      return true;
    }

    const expiresAt = this._parseDateValue(contribution.expires_at);
    if (!expiresAt) return false;
    return expiresAt.getTime() > this._nowEpochMs;
  }

  private _sourceLabelForSourceId(config: OccupancyConfig, sourceId: string): string {
    const exact = (config.occupancy_sources || []).find(
      (source) => source.source_id === sourceId || source.entity_id === sourceId
    );
    if (exact) {
      return this._candidateTitle(
        exact.entity_id,
        exact.signal_key || this._normalizedSignalKey(exact.entity_id, undefined)
      );
    }

    if (sourceId.includes("::")) {
      const [entityId, rawSignal] = sourceId.split("::");
      const normalizedSignal = this._normalizedSignalKey(entityId, rawSignal as SourceSignalKey);
      const fallback = (config.occupancy_sources || []).find(
        (source) => source.entity_id === entityId
      );
      if (fallback) {
        return this._candidateTitle(fallback.entity_id, fallback.signal_key || normalizedSignal);
      }
      return this._candidateTitle(entityId, normalizedSignal);
    }

    return this._entityName(sourceId);
  }

  private _parseDateValue(value: unknown): Date | undefined {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value;
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      const milli = value > 1e12 ? value : value * 1000;
      const dateValue = new Date(milli);
      return Number.isNaN(dateValue.getTime()) ? undefined : dateValue;
    }
    if (typeof value !== "string" || !value) return undefined;
    const dateValue = new Date(value);
    return Number.isNaN(dateValue.getTime()) ? undefined : dateValue;
  }

  private _formatDateTime(value: Date): string {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(value);
  }

  private _formatRelativeDuration(target: Date): string {
    const totalSeconds = Math.max(0, Math.floor((target.getTime() - this._nowEpochMs) / 1000));
    if (totalSeconds <= 0) return "now";

    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0 && parts.length < 2) parts.push(`${minutes}m`);
    if (parts.length === 0 || (days === 0 && hours === 0 && minutes === 0)) parts.push(`${seconds}s`);

    return parts.slice(0, 2).join(" ");
  }

  private _lockModeLabel(mode: string): string {
    if (mode === "block_occupied") return "Block occupied";
    if (mode === "block_vacant") return "Block vacant";
    return "Freeze";
  }

  private _lockScopeLabel(scope: string): string {
    if (scope === "subtree") return "Subtree";
    return "Self";
  }

  private _startClockTicker(): void {
    if (this._clockTimer !== undefined) return;
    this._clockTimer = window.setInterval(() => {
      this._nowEpochMs = Date.now();
    }, 1000);
  }

  private _stopClockTicker(): void {
    if (this._clockTimer === undefined) return;
    window.clearInterval(this._clockTimer);
    this._clockTimer = undefined;
  }

  private _describeSource(source: any, defaultTimeout: number): string {
    const mode = source.mode === "any_change" ? "Any change" : "Specific states";
    const onTimeout = source.on_timeout === null ? null : (source.on_timeout ?? defaultTimeout);
    const offTrailing = source.off_trailing ?? 0;
    const onBehavior =
      source.on_event === "trigger"
        ? `ON: trigger (${this._formatDuration(onTimeout)})`
        : "ON: ignore";
    const offBehavior =
      source.off_event === "clear"
        ? `OFF: clear (${this._formatDuration(offTrailing)})`
        : "OFF: ignore";
    return `${mode} • ${onBehavior} • ${offBehavior}`;
  }

  private _renderSourceEventChips(source: any, defaultTimeout: number) {
    const chips = [];
    const onTimeout = source.on_timeout === null ? null : (source.on_timeout ?? defaultTimeout);
    const offTrailing = source.off_trailing ?? 0;
    if (source.on_event === "trigger") {
      chips.push(html`<span class="event-chip">ON -> trigger (${this._formatDuration(onTimeout)})</span>`);
    } else {
      chips.push(html`<span class="event-chip ignore">ON ignored</span>`);
    }

    if (source.off_event === "clear") {
      chips.push(
        html`<span class="event-chip off">OFF -> clear (${this._formatDuration(offTrailing)})</span>`
      );
    } else {
      chips.push(html`<span class="event-chip ignore">OFF ignored</span>`);
    }
    return chips;
  }

  private _modeOptionsForEntity(entityId: string): Array<{ value: "any_change" | "specific_states"; label: string }> {
    const stateObj = this.hass?.states?.[entityId];
    const attrs = stateObj?.attributes || {};
    const domain = entityId.split(".", 1)[0];
    const deviceClass = String(attrs.device_class || "");

    if (domain === "person" || domain === "device_tracker") {
      return [{ value: "specific_states", label: "Specific states" }];
    }

    if (domain === "binary_sensor") {
      if (
        [
          "door",
          "garage_door",
          "opening",
          "window",
          "motion",
          "presence",
          "occupancy",
          "vibration",
          "sound",
        ].includes(deviceClass)
      ) {
        return [{ value: "specific_states", label: "Specific states" }];
      }
      return [
        { value: "specific_states", label: "Specific states" },
        { value: "any_change", label: "Any change" },
      ];
    }

    if (["light", "switch", "fan", "media_player"].includes(domain)) {
      return [{ value: "any_change", label: "Any change" }];
    }

    return [
      { value: "specific_states", label: "Specific states" },
      { value: "any_change", label: "Any change" },
    ];
  }

  private _supportsOffBehavior(source: OccupancySource): boolean {
    const domain = source.entity_id.split(".", 1)[0];
    if (domain === "media_player" && (source.signal_key === "volume" || source.signal_key === "mute")) {
      return false;
    }
    if (domain === "light" && (source.signal_key === "level" || source.signal_key === "color")) {
      return false;
    }
    return true;
  }

  private _eventLabelsForSource(source: OccupancySource): {
    onState: string;
    offState: string;
    onBehavior: string;
    onTimeout: string;
    offBehavior: string;
    offDelay: string;
  } {
    const entityId = source.entity_id;
    const stateObj = this.hass?.states?.[entityId];
    const attrs = stateObj?.attributes || {};
    const domain = entityId.split(".", 1)[0];
    const deviceClass = String(attrs.device_class || "");

    let onState = "ON";
    let offState = "OFF";

    if (domain === "binary_sensor" && ["door", "garage_door", "opening", "window"].includes(deviceClass)) {
      onState = "Open";
      offState = "Closed";
    } else if (domain === "binary_sensor" && deviceClass === "motion") {
      onState = "Motion";
      offState = "No motion";
    } else if (domain === "binary_sensor" && ["presence", "occupancy"].includes(deviceClass)) {
      onState = "Detected";
      offState = "Not detected";
    } else if (domain === "person" || domain === "device_tracker") {
      onState = "Home";
      offState = "Away";
    } else if (domain === "media_player") {
      if (source.signal_key === "volume") {
        onState = "Volume change";
        offState = "No volume change";
      } else if (source.signal_key === "mute") {
        onState = "Mute change";
        offState = "No mute change";
      } else {
        onState = "Playing";
        offState = "Paused/idle";
      }
    } else if (domain === "light" && source.signal_key === "level") {
      onState = "Brightness change";
      offState = "No brightness change";
    } else if (domain === "light" && source.signal_key === "color") {
      onState = "Color change";
      offState = "No color change";
    } else if (domain === "light" && source.signal_key === "power") {
      onState = "On";
      offState = "Off";
    } else if (domain === "light" || domain === "switch" || domain === "fan") {
      onState = "On";
      offState = "Off";
    }

    return {
      onState,
      offState,
      onBehavior: "When activity is detected",
      onTimeout: "Occupied hold time",
      offBehavior: "When activity stops",
      offDelay: "Vacant delay",
    };
  }

  private _formatDuration(seconds?: number | null): string {
    if (seconds === null) return "indefinite";
    if (!seconds || seconds <= 0) return "0m";
    return `${Math.floor(seconds / 60)}m`;
  }

  private _entityName(entityId: string): string {
    return this.hass.states[entityId]?.attributes?.friendly_name || entityId;
  }

  private _entityState(entityId: string): string {
    const state = this.hass.states[entityId]?.state;
    if (!state) return "unknown";
    return state;
  }

  private async _handleTestSource(source: any, action: "trigger" | "clear"): Promise<void> {
    if (!this.location || this._isFloorLocation()) return;

    try {
      if (action === "trigger") {
        const fallback = this._getOccupancyConfig().default_timeout || 300;
        const timeout = source.on_timeout === null ? fallback : (source.on_timeout ?? fallback);
        const sourceId = source.source_id || source.entity_id;
        await this.hass.callWS({
          type: "call_service",
          domain: "topomation",
          service: "trigger",
          service_data: this._serviceDataWithEntryId({
            location_id: this.location.id,
            source_id: sourceId,
            timeout,
          }),
        });
        this.dispatchEvent(
          new CustomEvent("source-test", {
            detail: {
              action: "trigger",
              locationId: this.location.id,
              sourceId,
              timeout,
            },
            bubbles: true,
            composed: true,
          })
        );
        this._showToast(`Triggered ${sourceId}`, "success");
        return;
      }

      const trailing_timeout = source.off_trailing ?? 0;
      const sourceId = source.source_id || source.entity_id;
      await this.hass.callWS({
        type: "call_service",
        domain: "topomation",
        service: "clear",
        service_data: this._serviceDataWithEntryId({
          location_id: this.location.id,
          source_id: sourceId,
          trailing_timeout: Math.max(0, trailing_timeout),
        }),
      });
      this.dispatchEvent(
        new CustomEvent("source-test", {
          detail: {
            action: "clear",
            locationId: this.location.id,
            sourceId,
            trailing_timeout,
          },
          bubbles: true,
          composed: true,
        })
      );
      const normalizedTrailingTimeout = Math.max(0, trailing_timeout);
      if (normalizedTrailingTimeout > 0) {
        this._showToast(
          `Cleared ${sourceId} with ${this._formatDuration(normalizedTrailingTimeout)} trailing`,
          "success"
        );
      } else {
        this._showToast(`Cleared ${sourceId}`, "success");
      }
      const blockers = this._activeContributorsExcluding(sourceId);
      if (blockers.length > 0) {
        const preview = blockers.slice(0, 2).join(", ");
        const suffix = blockers.length > 2 ? ` +${blockers.length - 2} more` : "";
        this._showToast(`Still occupied by ${preview}${suffix}`, "error");
      }
    } catch (err: any) {
      console.error("Failed to test source event:", err);
      this._showToast(err?.message || "Failed to run source test", "error");
    }
  }

  private _showToast(message: string, type: "success" | "error" = "success"): void {
    this.dispatchEvent(
      new CustomEvent("hass-notification", {
        detail: {
          message,
          type: type === "error" ? "error" : undefined,
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  private async _runSyncImport(): Promise<void> {
    if (this._syncImportInProgress) return;
    this._syncImportInProgress = true;
    try {
      const response = await this.hass.callWS(
        this._withEntryId({
          type: "topomation/sync/import",
          force: true,
        })
      );
      const message =
        typeof (response as Record<string, unknown>)?.message === "string"
          ? String((response as Record<string, unknown>).message)
          : "Sync import completed";
      this._showToast(message, "success");
    } catch (err: any) {
      console.error("Failed to run sync import:", err);
      this._showToast(err?.message || "Failed to run sync import", "error");
    } finally {
      this._syncImportInProgress = false;
    }
  }

  private async _updateModuleConfig(moduleId: string, config: any): Promise<void> {
    if (!this.location) return;

    try {
      await this.hass.callWS(
        this._withEntryId({
          type: "topomation/locations/set_module_config",
          location_id: this.location.id,
          module_id: moduleId,
          config,
        })
      );

      // Update local state
      this.location.modules[moduleId] = config;
      this.requestUpdate();
    } catch (err) {
      console.error("Failed to update config:", err);
      alert("Failed to update configuration");
    }
  }

  private _toggleEnabled(_e?: Event): void {
    if (!this.location || this._isFloorLocation()) return;

    const config = this._getOccupancyConfig();
    const newEnabled = !(config.enabled ?? true);

    this._setOccupancyDraft({ ...config, enabled: newEnabled });
  }

  private _withEntryId<T extends Record<string, any>>(payload: T): T {
    const entryId = typeof this.entryId === "string" ? this.entryId.trim() : "";
    if (!entryId) {
      return payload;
    }
    return {
      ...payload,
      entry_id: entryId,
    };
  }

  private _serviceDataWithEntryId<T extends Record<string, any>>(serviceData: T): T {
    const entryId = typeof this.entryId === "string" ? this.entryId.trim() : "";
    if (!entryId) {
      return serviceData;
    }
    return {
      ...serviceData,
      entry_id: entryId,
    };
  }

  private _handleTimeoutSliderInput(e: Event): void {
    const slider = e.target as HTMLInputElement;
    const container = slider.closest(".config-value");
    if (!container) return;
    const numberInput = container.querySelector("input.input") as HTMLInputElement | null;
    if (numberInput) {
      numberInput.value = slider.value;
    }
  }

  private _handleTimeoutChange(e: Event): void {
    const input = e.target as HTMLInputElement;
    const parsed = parseInt(input.value, 10);
    if (Number.isNaN(parsed)) return;
    const minutes = Math.max(1, Math.min(120, parsed));
    input.value = String(minutes);
    const seconds = minutes * 60;

    const container = input.closest(".config-value");
    if (container) {
      const slider = container.querySelector("input.timeout-slider") as HTMLInputElement | null;
      if (slider) slider.value = String(minutes);
      const numberInput = container.querySelector("input.input") as HTMLInputElement | null;
      if (numberInput) numberInput.value = String(minutes);
    }

    if (!this.location || this._isFloorLocation()) return;

    const config = this._getOccupancyConfig();
    this._setOccupancyDraft({ ...config, default_timeout: seconds });
  }

  private _isFloorLocation(): boolean {
    return !!this.location && getLocationType(this.location) === "floor";
  }
}

if (!customElements.get("ht-location-inspector")) {
  try {
    customElements.define("ht-location-inspector", HtLocationInspector);
  } catch (err) {
    console.error("[ht-location-inspector] failed to define element", err);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ht-location-inspector": HtLocationInspector;
  }
}
