import type { HomeAssistant } from "./types";

export interface VacuumRuleActionLike {
  entity_id?: string;
  service?: string;
}

/** True when the primary managed action is vacuum.start (ADR-HA-091). */
export function vacuumRuleUsesStartAction(
  actions?: VacuumRuleActionLike[] | null
): boolean {
  if (!Array.isArray(actions) || actions.length === 0) {
    return false;
  }
  const primary = actions[0];
  const entityId = String(primary?.entity_id || "").trim();
  const service = String(primary?.service || "").trim();
  return entityId.startsWith("vacuum.") && service === "start";
}

export function effectiveDailyGatingEnabled(
  dailyGatingEnabled: boolean | undefined,
  actions?: VacuumRuleActionLike[] | null
): boolean {
  return Boolean(dailyGatingEnabled) && vacuumRuleUsesStartAction(actions);
}

export function automationEntityIdForRule(rule: {
  id?: string;
  entity_id?: string;
}): string {
  const entityId = String(rule.entity_id || "").trim();
  if (entityId.startsWith("automation.")) {
    return entityId;
  }
  const id = String(rule.id || "").trim();
  if (id.startsWith("automation.")) {
    return id;
  }
  if (id && !id.startsWith("action_rule_")) {
    return `automation.${id}`;
  }
  return "";
}

/** Informational label for vacuum.start rules with daily gating enabled. */
export function vacuumDailyRunStatusLabel(
  hass: HomeAssistant | undefined,
  automationEntityId: string
): string {
  if (!automationEntityId.startsWith("automation.")) {
    return "Save the rule to track daily run status.";
  }
  const state = hass?.states?.[automationEntityId];
  const lastTriggered = state?.attributes?.last_triggered as string | undefined;
  if (!lastTriggered) {
    return "Eligible to run today (has not run yet)";
  }
  const last = new Date(lastTriggered);
  if (Number.isNaN(last.getTime())) {
    return "Eligible to run today";
  }
  const now = new Date();
  const sameDay =
    last.getFullYear() === now.getFullYear() &&
    last.getMonth() === now.getMonth() &&
    last.getDate() === now.getDate();
  if (!sameDay) {
    return "Eligible to run today";
  }
  const time = last.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return `Already ran today at ${time}`;
}
