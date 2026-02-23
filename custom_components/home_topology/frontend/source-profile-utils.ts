import type { OccupancySourceConfig } from "./types";

export interface SourceTemplate {
  id: string;
  label: string;
  description: string;
  config: Partial<OccupancySourceConfig>;
}

const THIRTY_MIN = 30 * 60;
const FIVE_MIN = 5 * 60;

function domainOf(entityId?: string): string {
  if (!entityId) return "";
  const idx = entityId.indexOf(".");
  return idx >= 0 ? entityId.slice(0, idx) : "";
}

function isDoorClass(deviceClass?: string): boolean {
  return ["door", "garage_door", "opening", "window"].includes(deviceClass || "");
}

function isPresenceClass(deviceClass?: string): boolean {
  return ["presence", "occupancy"].includes(deviceClass || "");
}

function isMotionClass(deviceClass?: string): boolean {
  return deviceClass === "motion";
}

function isMediaDomain(domain?: string): boolean {
  return domain === "media_player";
}

export function getSourceDefaultsForEntity(entity: any): OccupancySourceConfig {
  const domain = domainOf(entity?.entity_id);
  const deviceClass = entity?.attributes?.device_class as string | undefined;

  if (isMediaDomain(domain)) {
    // Media should behave as interaction/activity source, not state lock.
    return {
      entity_id: entity?.entity_id || "",
      mode: "any_change",
      on_event: "trigger",
      on_timeout: THIRTY_MIN,
      off_event: "none",
      off_trailing: 0,
    };
  }

  if (domain === "light" || domain === "switch") {
    return {
      entity_id: entity?.entity_id || "",
      mode: "any_change",
      on_event: "trigger",
      on_timeout: THIRTY_MIN,
      off_event: "none",
      off_trailing: 0,
    };
  }

  if (domain === "person" || domain === "device_tracker") {
    return {
      entity_id: entity?.entity_id || "",
      mode: "specific_states",
      on_event: "trigger",
      on_timeout: null,
      off_event: "clear",
      off_trailing: FIVE_MIN,
    };
  }

  if (domain === "binary_sensor") {
    if (isPresenceClass(deviceClass)) {
      return {
        entity_id: entity?.entity_id || "",
        mode: "specific_states",
        on_event: "trigger",
        on_timeout: null,
        off_event: "clear",
        off_trailing: FIVE_MIN,
      };
    }
    if (isMotionClass(deviceClass)) {
      return {
        entity_id: entity?.entity_id || "",
        mode: "specific_states",
        on_event: "trigger",
        on_timeout: THIRTY_MIN,
        off_event: "none",
        off_trailing: 0,
      };
    }
    if (isDoorClass(deviceClass)) {
      return {
        entity_id: entity?.entity_id || "",
        mode: "specific_states",
        on_event: "trigger",
        on_timeout: THIRTY_MIN,
        off_event: "none",
        off_trailing: 0,
      };
    }
  }

  return {
    entity_id: entity?.entity_id || "",
    mode: "any_change",
    on_event: "trigger",
    on_timeout: THIRTY_MIN,
    off_event: "none",
    off_trailing: 0,
  };
}

export function applyModeDefaults(
  current: Partial<OccupancySourceConfig>,
  mode: "any_change" | "specific_states",
  entity: any
): Partial<OccupancySourceConfig> {
  const domain = domainOf(entity?.entity_id);
  const defaults = getSourceDefaultsForEntity(entity);

  if (isMediaDomain(domain)) {
    const timeout = current.on_timeout && current.on_timeout > 0 ? current.on_timeout : THIRTY_MIN;
    return {
      ...current,
      mode: "any_change",
      on_event: "trigger",
      on_timeout: timeout,
      off_event: "none",
      off_trailing: 0,
    };
  }

  if (mode === "any_change") {
    const timeout = current.on_timeout ?? (defaults.mode === "any_change" ? defaults.on_timeout : THIRTY_MIN);
    return {
      ...current,
      mode,
      on_event: "trigger",
      on_timeout: timeout,
      off_event: "none",
      off_trailing: 0,
    };
  }

  const specificDefaults =
    defaults.mode === "specific_states"
      ? defaults
      : {
          ...defaults,
          mode: "specific_states" as const,
          on_event: "trigger" as const,
          on_timeout: THIRTY_MIN,
          off_event: "none" as const,
          off_trailing: 0,
        };

  return {
    ...current,
    mode,
    on_event: current.on_event ?? specificDefaults.on_event,
    on_timeout: current.on_timeout ?? specificDefaults.on_timeout,
    off_event: current.off_event ?? specificDefaults.off_event,
    off_trailing: current.off_trailing ?? specificDefaults.off_trailing,
  };
}

export function getTemplatesForEntity(
  entity: any,
  mode: "any_change" | "specific_states"
): SourceTemplate[] {
  const defaults = getSourceDefaultsForEntity(entity);
  const domain = domainOf(entity?.entity_id);
  const deviceClass = entity?.attributes?.device_class as string | undefined;

  if (isMediaDomain(domain)) {
    return [
      {
        id: "media_interaction",
        label: "Media Interaction (30m)",
        description: "Play and volume/mute interactions keep occupancy active for 30 minutes.",
        config: { on_event: "trigger", on_timeout: THIRTY_MIN, off_event: "none", off_trailing: 0 },
      },
    ];
  }

  if (mode === "any_change") {
    if (domain === "light" || domain === "switch") {
      return [
        {
          id: "light_activity",
          label: "Light Activity (30m)",
          description: "State/level changes keep occupancy active for 30 minutes.",
          config: { on_event: "trigger", on_timeout: THIRTY_MIN, off_event: "none", off_trailing: 0 },
        },
      ];
    }
    return [
      {
        id: "activity_default",
        label: "Activity (30m)",
        description: "Any change keeps occupancy active for 30 minutes.",
        config: { on_event: "trigger", on_timeout: THIRTY_MIN, off_event: "none", off_trailing: 0 },
      },
    ];
  }

  if (isPresenceClass(deviceClass) || domain === "person" || domain === "device_tracker") {
    return [
      {
        id: "presence_state",
        label: "Presence State",
        description: "Present keeps occupancy active; away clears after 5 minutes.",
        config: { on_event: "trigger", on_timeout: null, off_event: "clear", off_trailing: FIVE_MIN },
      },
    ];
  }

  if (isDoorClass(deviceClass)) {
    return [
      {
        id: "door_entry_30",
        label: "Entry Door (30m)",
        description: "Door open triggers occupancy for 30 minutes; close ignored.",
        config: { on_event: "trigger", on_timeout: THIRTY_MIN, off_event: "none", off_trailing: 0 },
      },
      {
        id: "door_state",
        label: "Door State Mapping",
        description: "Open keeps occupancy active; close clears immediately.",
        config: { on_event: "trigger", on_timeout: null, off_event: "clear", off_trailing: 0 },
      },
    ];
  }

  if (isMotionClass(deviceClass)) {
    return [
      {
        id: "motion_default",
        label: "Motion (30m)",
        description: "Motion ON triggers occupancy for 30 minutes; OFF ignored.",
        config: { on_event: "trigger", on_timeout: THIRTY_MIN, off_event: "none", off_trailing: 0 },
      },
    ];
  }

  return [
    {
      id: "state_default",
      label: "State Sensor",
      description: "ON triggers occupancy; OFF ignored.",
      config: {
        on_event: defaults.on_event,
        on_timeout: defaults.on_timeout,
        off_event: defaults.off_event,
        off_trailing: defaults.off_trailing,
      },
    },
  ];
}
