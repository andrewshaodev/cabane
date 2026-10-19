import { bindingCanMutate } from "./home-assistant-resolver";
import {
  lightBrightnessCall,
  supportsLightBrightness,
  toggleEntityCall,
} from "./home-assistant-controls";
import type { ExtensionInteractionTarget, ResolvedDeviceBinding } from "./types";

/** Scene gestures and runtime commands must agree on one usable primary light. */
export function orbitLightEntity(device: ResolvedDeviceBinding) {
  if (device.issues.some((issue) => issue.severity === "error")) return undefined;
  const primarySlot = device.slot.entitySlots.find((slot) => slot.deviceRole === "primary");
  const entities = device.entities.filter((entity) => entity.slotId === primarySlot?.id);
  if (entities.length !== 1) return undefined;
  const entity = entities[0];
  return entity.domain === "light" &&
    bindingCanMutate(entity) &&
    entity.state &&
    ["on", "off"].includes(entity.state.state)
    ? entity.state
    : undefined;
}

export function orbitLightCall(device: ResolvedDeviceBinding, target: ExtensionInteractionTarget) {
  const entity = orbitLightEntity(device);
  if (
    !entity ||
    (target.slotId &&
      !device.entities.some(
        (binding) => binding.slotId === target.slotId && binding.entityId === entity.entityId,
      ))
  )
    return null;
  if (target.intent === "light-toggle") return toggleEntityCall(entity);
  if (
    target.intent === "light-dim" &&
    supportsLightBrightness(entity) &&
    typeof target.brightnessPercent === "number" &&
    Number.isFinite(target.brightnessPercent)
  )
    return {
      ...lightBrightnessCall(entity, target.brightnessPercent),
      delivery: { mode: "continuous-value" as const, channel: "brightness" as const },
    };
  return null;
}
