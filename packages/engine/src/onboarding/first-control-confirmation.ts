import type { SupportedServiceCall } from "../home-assistant-controls";
import type { EntityStateSnapshot } from "../types";

export function matchesRequestedState(
  call: SupportedServiceCall,
  state: EntityStateSnapshot,
): boolean {
  if (!state.available || state.stale || !state.entityId.startsWith(`${call.domain}.`))
    return false;
  const data = call.data ?? {};
  if (["light", "switch", "input_boolean"].includes(call.domain)) {
    if (call.service === "turn_off") return state.state === "off";
    if (call.service === "turn_on") {
      if (typeof data.brightness_pct === "number")
        return (
          state.state === "on" &&
          Math.abs(Number(state.attributes.brightness) - data.brightness_pct * 2.55) <= 1
        );
      return state.state === "on";
    }
  }
  if (call.domain === "cover") {
    const target =
      call.service === "open_cover"
        ? 100
        : call.service === "close_cover"
          ? 0
          : call.service === "set_cover_position"
            ? data.position
            : null;
    return typeof target === "number" && Number(state.attributes.current_position) === target;
  }
  if (call.domain === "climate") {
    if (call.service === "set_temperature")
      return (
        typeof data.temperature === "number" &&
        Number(state.attributes.temperature) === data.temperature
      );
    if (call.service === "set_hvac_mode") return state.state === data.hvac_mode;
  }
  return false;
}

export function confirmsFirstControl(
  call: SupportedServiceCall,
  before: EntityStateSnapshot,
  after: EntityStateSnapshot,
  succeeded: boolean,
): boolean {
  const marker = (state: EntityStateSnapshot) =>
    state.lastConfirmedAt ?? state.lastUpdated ?? state.lastChanged;
  return (
    succeeded &&
    before.entityId === after.entityId &&
    !matchesRequestedState(call, before) &&
    matchesRequestedState(call, after) &&
    after !== before &&
    (marker(before) === undefined || marker(after) !== marker(before))
  );
}
