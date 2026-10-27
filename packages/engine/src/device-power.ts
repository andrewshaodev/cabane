import { deviceVisualStateForSnapshot } from "./devices";
import type { EntityBindingSlotSpec, EntityStateSnapshot, ResolvedDeviceBinding } from "./types";

/** Observational slots do not change the modeled device's control domains. */
export const isDevicePowerSlot = (slot: EntityBindingSlotSpec) =>
  slot.deviceRole === "secondary" &&
  slot.compatibleDomains?.length === 1 &&
  slot.compatibleDomains[0] === "sensor" &&
  slot.compatibleDeviceClasses?.length === 1 &&
  slot.compatibleDeviceClasses[0] === "power";

const wattsPerUnit: Readonly<Record<string, number>> = {
  W: 1,
  kW: 1_000,
  MW: 1_000_000,
  GW: 1_000_000_000,
  mW: 0.001,
  µW: 0.000001,
  μW: 0.000001,
};

export const powerInWatts = (state: EntityStateSnapshot | undefined): number | null => {
  if (
    !state?.available ||
    state.stale ||
    !state.entityId.startsWith("sensor.") ||
    state.attributes.device_class !== "power" ||
    !state.state.trim()
  )
    return null;
  const unit = state.attributes.unit_of_measurement;
  const factor =
    typeof unit === "string" && Object.hasOwn(wattsPerUnit, unit) ? wattsPerUnit[unit] : undefined;
  const watts = factor === undefined ? NaN : Number(state.state) * factor;
  return Number.isFinite(watts) ? watts : null;
};

export const deviceVisualStateWithPower = (
  device: ResolvedDeviceBinding,
  primaryState: EntityStateSnapshot | undefined,
) => {
  const fallback = deviceVisualStateForSnapshot(primaryState);
  const slot = device.slot.entitySlots.find(
    (entry) => isDevicePowerSlot(entry) && entry.activityThresholdWatts !== undefined,
  );
  if (!slot || fallback !== "connected-active") return fallback;
  const sensor = device.entities.find((entry) => entry.slotId === slot.id);
  const watts = sensor?.issues.some((entry) => entry.severity === "error")
    ? null
    : powerInWatts(sensor?.state);
  return watts !== null && watts > slot.activityThresholdWatts!
    ? "connected-active"
    : "connected-inactive";
};
