import type { ActionBarItem } from "./action-bar-config";
import type { EntityId, HomeAssistantRuntimeSnapshot, RuntimeBindingProfile } from "../types";
import type { SupportedServiceCall } from "../home-assistant-controls";

export function resolveHaActionShortcut(
  item: ActionBarItem,
  profile: RuntimeBindingProfile,
  runtime: HomeAssistantRuntimeSnapshot,
) {
  const kind = item.target.kind;
  const entityId = profile.actionEntityIdsByShortcutId?.[item.id];
  const state = entityId ? runtime.entityStates[entityId] : undefined;
  const entry = runtime.entityRegistry.find((entry) => entry.entity_id === entityId);
  const name = entry?.name || state?.attributes.friendly_name || entry?.original_name;
  const label = typeof name === "string" ? name : (entityId ?? `Unmapped ${kind}`);
  const reason = !entityId
    ? `Choose a ${kind} in Shortcuts.`
    : runtime.status !== "connected" || !runtime.canMutate
      ? "Home Assistant is not connected."
      : !entityId.startsWith(`${kind}.`)
        ? "The shortcut mapping has an incompatible domain."
        : !state
          ? `This ${kind} is missing. Replace it in Shortcuts.`
          : state.stale ||
              state.state === "unavailable" ||
              entry?.disabled_by ||
              entry?.hidden_by ||
              (!state.available && !(kind === "scene" && state.state === "unknown"))
            ? `This ${kind} is unavailable.`
            : undefined;
  return { label, available: !reason, reason, entityId };
}

/** Scenes can be unknown until first activated; they never have an on/off state. */
export function haActionShortcutCall(
  item: ActionBarItem,
  profile: RuntimeBindingProfile,
  runtime: HomeAssistantRuntimeSnapshot,
): SupportedServiceCall {
  if (item.target.kind !== "scene" && item.target.kind !== "script")
    throw new Error("This shortcut is not an HA action.");
  const target = resolveHaActionShortcut(item, profile, runtime);
  if (!target.available || !target.entityId) throw new Error(target.reason);
  return { domain: item.target.kind, service: "turn_on", target: { entity_id: target.entityId } };
}

export function haActionShortcutChoices(
  kind: "scene" | "script",
  runtime: HomeAssistantRuntimeSnapshot,
) {
  return Object.keys(runtime.entityStates)
    .filter((id) => id.startsWith(`${kind}.`))
    .map((id) => {
      const entityId = id as EntityId;
      const item: ActionBarItem = { id: "choice", target: { kind } };
      const profile: RuntimeBindingProfile = {
        schemaVersion: 1,
        homeId: "",
        roomAreaIds: {},
        entityIdsBySlotId: {},
        actionEntityIdsByShortcutId: { choice: entityId },
      };
      return { ...resolveHaActionShortcut(item, profile, runtime), entityId };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}
