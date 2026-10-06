import { bindingCanMutate } from "../home-assistant-resolver";
import { toggleEntityCall, type SupportedServiceCall } from "../home-assistant-controls";
import type { ExtensionInteractionTarget, ResolvedHomeBindings } from "../types";
import type { WalkToolResult } from "./types";

/** The host owns authorization and entity resolution; tools see modeled targets only. */
export async function activateWalkTarget(
  target: ExtensionInteractionTarget,
  bindings: ResolvedHomeBindings,
  runtime: { canMutate: boolean; callService: (call: SupportedServiceCall) => Promise<unknown> },
): Promise<WalkToolResult> {
  const resolved = resolveWalkTarget(target, bindings, runtime.canMutate);
  if ("status" in resolved) return resolved;
  const light = resolved;
  try {
    await runtime.callService(toggleEntityCall(light.state));
    return { status: "activated", message: `${target.label} toggled` };
  } catch {
    return { status: "unavailable", message: "The light could not be toggled. Try again." };
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
  if (!canMutate) return unavailable("Connect Home Assistant to control this light.");
  const device = Object.values(bindings.rooms)
    .flatMap((room) => room.devices)
    .find(
      (device) =>
        device.slot.id === target.id ||
        (target.slotId && device.slot.entitySlots.some((slot) => slot.id === target.slotId)),
    );
  if (!device) return unavailable("Aim at a connected light.");
  if (device.issues.some((issue) => issue.severity === "error"))
    return unavailable("Review this device in Connect.");
  const lights = device.entities.filter(
    (entity) => entity.domain === "light" && (!target.slotId || entity.slotId === target.slotId),
  );
  if (lights.length !== 1)
    return unavailable(
      lights.length ? "Open this device to choose a light." : "This tool supports lights only.",
    );
  const light = lights[0];
  if (!bindingCanMutate(light) || !light.state || !["on", "off"].includes(light.state.state))
    return unavailable("This light is unavailable. Review it in Connect.");
  return { ...light, state: light.state };
}
