import type { HomeAssistant, Location } from "./types";

export type ActionTriggerType = "on_occupied" | "on_vacant" | "on_dark" | "on_bright";
export type ActionAmbientCondition = "any" | "dark" | "bright";

export interface TopomationRuleAction {
  entity_id: string;
  service: string;
  data?: Record<string, unknown>;
}

export interface TopomationActionRule {
  id: string;
  entity_id: string;
  name: string;
  trigger_type: ActionTriggerType;
  rule_uuid?: string;
  actions?: TopomationRuleAction[];
  action_entity_id?: string;
  action_service?: string;
  action_data?: Record<string, unknown>;
  ambient_condition?: ActionAmbientCondition;
  must_be_occupied?: boolean;
  time_condition_enabled?: boolean;
  start_time?: string;
  end_time?: string;
  run_on_startup?: boolean;
  // Compatibility field retained for payload normalization.
  require_dark?: boolean;
  enabled: boolean;
}

function normalizeMustBeOccupied(rawValue: unknown): boolean | undefined {
  return typeof rawValue === "boolean" ? rawValue : undefined;
}

const WS_TYPE_ACTION_RULES_LIST = "topomation/actions/rules/list";
const WS_TYPE_ACTION_RULES_CREATE = "topomation/actions/rules/create";
const WS_TYPE_ACTION_RULES_DELETE = "topomation/actions/rules/delete";
const WS_TYPE_ACTION_RULES_SET_ENABLED = "topomation/actions/rules/set_enabled";

function extractWsErrorCode(err: unknown): string | undefined {
  if (!err || typeof err !== "object") return undefined;
  const candidate = err as { code?: unknown; error?: unknown };
  if (typeof candidate.code === "string" && candidate.code.trim()) {
    return candidate.code.trim().toLowerCase();
  }
  if (typeof candidate.error === "string" && candidate.error.trim()) {
    return candidate.error.trim().toLowerCase();
  }
  return undefined;
}

function isWsCommandUnavailable(err: unknown): boolean {
  const code = extractWsErrorCode(err);
  if (
    code &&
    (code === "unknown_command" ||
      code === "not_found" ||
      code === "not_loaded" ||
      code.endsWith("_not_loaded"))
  ) {
    return true;
  }

  const message = readErrorMessage(err).toLowerCase();
  return (
    message.includes("unknown_command") ||
    message.includes("unknown command") ||
    message.includes("unsupported command") ||
    message.includes("command is unsupported") ||
    message.includes("not loaded") ||
    message.includes("not_loaded") ||
    message.includes("invalid handler")
  );
}

function wsUnavailableError(operation: string): Error {
  return new Error(
    `Topomation managed-action backend is unavailable for ${operation}. ` +
      "Reload Home Assistant to ensure this integration version is fully active."
  );
}

function normalizeTriggerType(raw: unknown): ActionTriggerType | null {
  const normalized = String(raw || "")
    .trim()
    .toLowerCase();
  if (normalized === "occupied") return "on_occupied";
  if (normalized === "vacant") return "on_vacant";
  if (normalized === "dark") return "on_dark";
  if (normalized === "bright") return "on_bright";
  if (normalized === "on_occupied" || normalized === "on_vacant" || normalized === "on_dark" || normalized === "on_bright") {
    return normalized;
  }
  return null;
}

function defaultAmbientCondition(triggerType: ActionTriggerType): ActionAmbientCondition {
  if (triggerType === "on_dark") return "dark";
  if (triggerType === "on_bright") return "bright";
  return "any";
}

function normalizeAmbientCondition(
  triggerType: ActionTriggerType,
  rawAmbientCondition: unknown,
  requireDark: boolean
): ActionAmbientCondition {
  const normalized = String(rawAmbientCondition || "")
    .trim()
    .toLowerCase();
  if (normalized === "any" || normalized === "dark" || normalized === "bright") {
    return normalized;
  }
  if (requireDark) return "dark";
  return defaultAmbientCondition(triggerType);
}

function normalizeActionData(raw: unknown): Record<string, unknown> | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const data = { ...(raw as Record<string, unknown>) };
  delete data.entity_id;

  if (Object.prototype.hasOwnProperty.call(data, "brightness_pct")) {
    const numeric = Number(data.brightness_pct);
    if (Number.isFinite(numeric) && numeric > 0) {
      data.brightness_pct = Math.max(1, Math.min(100, Math.round(numeric)));
    } else {
      delete data.brightness_pct;
    }
  }

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null || value === "") {
      delete data[key];
    }
  }
  return Object.keys(data).length > 0 ? data : undefined;
}

function normalizeRuleActionsFromPayload(
  rule: Partial<TopomationActionRule>,
  fallbackTriggerType: ActionTriggerType
): TopomationRuleAction[] {
  const rawActions = Array.isArray(rule.actions) ? rule.actions : [];
  const normalizedActions = rawActions
    .map((action) => {
      if (!action || typeof action !== "object") return undefined;
      const entityId = String((action as any).entity_id || "").trim();
      if (!entityId) return undefined;
      const serviceRaw = String((action as any).service || "").trim();
      const service = serviceRaw || defaultActionServiceForTrigger(entityId, fallbackTriggerType);
      return {
        entity_id: entityId,
        service,
        ...(normalizeActionData((action as any).data) ? { data: normalizeActionData((action as any).data) } : {}),
      } satisfies TopomationRuleAction;
    })
    .filter((action): action is TopomationRuleAction => !!action);
  if (normalizedActions.length > 0) {
    return normalizedActions;
  }

  const fallbackEntityId = String(rule.action_entity_id || "").trim();
  if (!fallbackEntityId) return [];
  const fallbackServiceRaw = String(rule.action_service || "").trim();
  const fallbackService =
    fallbackServiceRaw || defaultActionServiceForTrigger(fallbackEntityId, fallbackTriggerType);
  return [
    {
      entity_id: fallbackEntityId,
      service: fallbackService,
      ...(normalizeActionData(rule.action_data) ? { data: normalizeActionData(rule.action_data) } : {}),
    },
  ];
}

function readErrorMessage(err: unknown): string {
  if (typeof err === "string" && err.trim()) return err.trim();
  if (err instanceof Error && err.message.trim()) return err.message.trim();
  if (err && typeof err === "object" && "message" in err) {
    const maybeMessage = (err as { message?: unknown }).message;
    if (typeof maybeMessage === "string" && maybeMessage.trim()) {
      return maybeMessage.trim();
    }
  }
  return "unknown automation/config error";
}

export async function listTopomationActionRules(
  hass: HomeAssistant,
  locationId: string,
  entryId?: string
): Promise<TopomationActionRule[]> {
  try {
    const response = await hass.callWS<{ rules?: TopomationActionRule[] }>({
      type: WS_TYPE_ACTION_RULES_LIST,
      location_id: locationId,
      ...(entryId ? { entry_id: entryId } : {}),
    });
    if (Array.isArray(response?.rules)) {
      return response.rules
        .map((rule) => {
          const triggerType = normalizeTriggerType(rule.trigger_type);
          if (!triggerType) return null;
          const requireDark = Boolean(rule.require_dark);
          const ambientCondition = normalizeAmbientCondition(
            triggerType,
            rule.ambient_condition,
            requireDark
          );
          const actions = normalizeRuleActionsFromPayload(rule, triggerType);
          const primaryAction = actions[0];
          return {
            ...rule,
            trigger_type: triggerType,
            actions,
            ambient_condition: ambientCondition,
            must_be_occupied: normalizeMustBeOccupied(rule.must_be_occupied),
            time_condition_enabled: Boolean(rule.time_condition_enabled),
            start_time:
              typeof rule.start_time === "string" && rule.start_time.length > 0
                ? rule.start_time
                : undefined,
            end_time:
              typeof rule.end_time === "string" && rule.end_time.length > 0
                ? rule.end_time
                : undefined,
            run_on_startup:
              typeof rule.run_on_startup === "boolean" ? rule.run_on_startup : undefined,
            require_dark: requireDark || ambientCondition === "dark",
            action_entity_id: primaryAction?.entity_id,
            action_service: primaryAction?.service,
            action_data: primaryAction?.data,
          } satisfies TopomationActionRule;
        })
        .filter((rule): rule is TopomationActionRule => !!rule)
        .sort((a, b) => a.name.localeCompare(b.name));
    }
  } catch (err) {
    if (isWsCommandUnavailable(err)) {
      throw wsUnavailableError("rule listing");
    }
    throw err;
  }

  throw wsUnavailableError("rule listing");
}

export async function createTopomationActionRule(
  hass: HomeAssistant,
  args: {
    location: Location;
    name: string;
    trigger_type: ActionTriggerType;
    actions?: TopomationRuleAction[];
    action_entity_id?: string;
    action_service?: string;
    action_data?: Record<string, unknown>;
    ambient_condition?: ActionAmbientCondition;
    must_be_occupied?: boolean;
    time_condition_enabled?: boolean;
    start_time?: string;
    end_time?: string;
    run_on_startup?: boolean;
    require_dark?: boolean;
    automation_id?: string;
    rule_uuid?: string;
  },
  entryId?: string
): Promise<TopomationActionRule> {
  const normalizedActions = normalizeRuleActionsFromPayload(
    {
      actions: args.actions,
      action_entity_id: args.action_entity_id,
      action_service: args.action_service,
      action_data: args.action_data,
    },
    args.trigger_type
  );
  const primaryAction = normalizedActions[0];
  if (!primaryAction) {
    throw new Error("At least one action target is required");
  }
  const runOnStartup =
    typeof args.run_on_startup === "boolean" ? args.run_on_startup : undefined;

  try {
    const response = await hass.callWS<{ rule?: TopomationActionRule }>({
      type: WS_TYPE_ACTION_RULES_CREATE,
      location_id: args.location.id,
      name: args.name,
      trigger_type: args.trigger_type,
      action_entity_id: primaryAction.entity_id,
      action_service: primaryAction.service,
      action_data: primaryAction.data,
      actions: normalizedActions,
      ambient_condition: args.ambient_condition,
      ...(typeof args.must_be_occupied === "boolean"
        ? { must_be_occupied: args.must_be_occupied }
        : {}),
      time_condition_enabled: Boolean(args.time_condition_enabled),
      start_time: args.start_time,
      end_time: args.end_time,
      ...(typeof runOnStartup === "boolean" ? { run_on_startup: runOnStartup } : {}),
      require_dark: Boolean(args.require_dark),
      ...(args.automation_id ? { automation_id: args.automation_id } : {}),
      ...(args.rule_uuid ? { rule_uuid: args.rule_uuid } : {}),
      ...(entryId ? { entry_id: entryId } : {}),
    });

    if (response?.rule) {
      const normalizedTrigger = normalizeTriggerType(response.rule.trigger_type) || args.trigger_type;
      const requireDark = Boolean(response.rule.require_dark);
      const ambientCondition = normalizeAmbientCondition(
        normalizedTrigger,
        response.rule.ambient_condition,
        requireDark
      );
      const actions = normalizeRuleActionsFromPayload(response.rule, normalizedTrigger);
      const responsePrimaryAction = actions[0] || primaryAction;
      return {
        ...response.rule,
        trigger_type: normalizedTrigger,
        rule_uuid:
          typeof response.rule.rule_uuid === "string" && response.rule.rule_uuid.trim().length > 0
            ? response.rule.rule_uuid.trim()
            : args.rule_uuid,
        actions,
        ambient_condition: ambientCondition,
        action_entity_id: responsePrimaryAction?.entity_id,
        action_service: responsePrimaryAction?.service,
        action_data: responsePrimaryAction?.data,
        must_be_occupied: normalizeMustBeOccupied(response.rule.must_be_occupied),
        time_condition_enabled: Boolean(response.rule.time_condition_enabled),
        start_time:
          typeof response.rule.start_time === "string" && response.rule.start_time.length > 0
            ? response.rule.start_time
            : undefined,
        end_time:
          typeof response.rule.end_time === "string" && response.rule.end_time.length > 0
            ? response.rule.end_time
            : undefined,
        run_on_startup:
          typeof response.rule.run_on_startup === "boolean"
            ? response.rule.run_on_startup
            : runOnStartup,
        require_dark: requireDark || ambientCondition === "dark",
      };
    }
  } catch (err) {
    if (!isWsCommandUnavailable(err)) {
      throw err;
    }
    throw wsUnavailableError("rule creation");
  }

  throw wsUnavailableError("rule creation");
}

export async function deleteTopomationActionRule(
  hass: HomeAssistant,
  ruleOrAutomationId: string | Pick<TopomationActionRule, "id" | "entity_id">,
  entryId?: string
): Promise<void> {
  const automationId =
    typeof ruleOrAutomationId === "string" ? ruleOrAutomationId : ruleOrAutomationId.id;
  const entityId =
    typeof ruleOrAutomationId === "string" ? undefined : ruleOrAutomationId.entity_id;

  try {
    const response = await hass.callWS<{ success?: boolean }>({
      type: WS_TYPE_ACTION_RULES_DELETE,
      automation_id: automationId,
      ...(entityId ? { entity_id: entityId } : {}),
      ...(entryId ? { entry_id: entryId } : {}),
    });

    if (response?.success === true) {
      return;
    }
  } catch (err) {
    if (!isWsCommandUnavailable(err)) {
      throw err;
    }
    throw wsUnavailableError("rule deletion");
  }

  throw wsUnavailableError("rule deletion");
}

export async function setTopomationActionRuleEnabled(
  hass: HomeAssistant,
  rule: TopomationActionRule,
  enabled: boolean,
  entryId?: string
): Promise<void> {
  try {
    const response = await hass.callWS<{ success?: boolean }>({
      type: WS_TYPE_ACTION_RULES_SET_ENABLED,
      entity_id: rule.entity_id,
      enabled,
      ...(entryId ? { entry_id: entryId } : {}),
    });
    if (response?.success === true) {
      return;
    }
  } catch (err) {
    if (!isWsCommandUnavailable(err)) {
      throw err;
    }
    throw wsUnavailableError("rule enable/disable");
  }

  throw wsUnavailableError("rule enable/disable");
}

export function ruleEditPath(rule: TopomationActionRule): string {
  return `/config/automation/edit/${encodeURIComponent(rule.id)}`;
}
