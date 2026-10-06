import { bindingCanMutate } from "../home-assistant-resolver";
import {
  toggleEntityCall,
  valveActionCall,
  type SupportedServiceCall,
} from "../home-assistant-controls";
import type { ExtensionInteractionTarget, ResolvedHomeBindings } from "../types";
import type { WalkToolResult } from "./types";

const powerStates: Readonly<Record<string, readonly string[]>> = {
  light: ["on", "off"],
  switch: ["on", "off"],
  fan: ["on", "off"],
  climate: ["off", "heat", "cool", "heat_cool", "auto", "dry", "fan_only"],
  media_player: ["off", "on", "idle", "playing", "paused", "standby", "buffering"],
  valve: ["open", "closed", "opening", "closing"],
};

/** The host owns authorization and entity resolution; tools see modeled targets only. */
export async function activateWalkTarget(
  target: ExtensionInteractionTarget,
  bindings: ResolvedHomeBindings,
  runtime: { canMutate: boolean; callService: (call: SupportedServiceCall) => Promise<unknown> },
): Promise<WalkToolResult> {
  const resolved = resolveWalkTarget(target, bindings, runtime.canMutate);
  if ("status" in resolved) return resolved;
  const entity = resolved;
  try {
    await runtime.callService(
      entity.domain === "valve"
        ? valveActionCall(
            entity.state,
            entity.state.state === "closed" ? "open_valve" : "close_valve",
          )
        : toggleEntityCall(entity.state),
    );
    return { status: "activated", message: `${target.label} toggled` };
  } catch {
    return { status: "unavailable", message: "The device could not be toggled. Try again." };
  }
}

/** Read-only eligibility uses exactly the same guards as activation. */
export function canActivateWalkTarget(
  target: ExtensionInteractionTarget,
  bindings: ResolvedHomeBindings,
  canMutate: boolean,
): boolean {
  return !("status" in resolveWalkTarget(target, bindings, canMutate));
}

function resolveWalkTarget(
  target: ExtensionInteractionTarget,
  bindings: ResolvedHomeBindings,
  canMutate: boolean,
) {
  const unavailable = (message: string): WalkToolResult => ({ status: "unavailable", message });
  if (!canMutate) return unavailable("Connect Home Assistant to control this device.");
  const device = Object.values(bindings.rooms)
    .flatMap((room) => room.devices)
    .find(
      (device) =>
        device.slot.id === target.id ||
        (target.slotId && device.slot.entitySlots.some((slot) => slot.id === target.slotId)),
    );
  if (!device) return unavailable("Aim at a connected device.");
  if (device.issues.some((issue) => issue.severity === "error"))
    return unavailable("Review this device in Connect.");
  const entities = device.entities.filter(
    (entity) => entity.domain in powerStates && (!target.slotId || entity.slotId === target.slotId),
  );
  if (entities.length !== 1)
    return unavailable(
      entities.length
        ? "Open this device to choose a control."
        : "This device does not support gun controls.",
    );
  const entity = entities[0];
  if (
    !bindingCanMutate(entity) ||
    !entity.state ||
    !powerStates[entity.domain]?.includes(entity.state.state)
  )
    return unavailable("This device is unavailable. Review it in Connect.");
  return { ...entity, state: entity.state };
}
