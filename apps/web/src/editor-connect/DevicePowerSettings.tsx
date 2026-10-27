import {
  createBrowserUuid,
  isDevicePowerSlot,
  type DeviceSlotSpec,
  type EntityBindingSlotSpec,
  type EntityId,
  type HomeAssistantRuntimeSnapshot,
  type RuntimeBindingProfile,
} from "@cabane/engine";
import { NumericField } from "../editor-preview/furnish/NumericField";

export function DevicePowerSettings({
  device,
  profile,
  runtime,
  disconnected,
  onChange,
}: {
  device: DeviceSlotSpec;
  profile: RuntimeBindingProfile;
  runtime: HomeAssistantRuntimeSnapshot;
  disconnected: boolean;
  onChange: (slot: EntityBindingSlotSpec, entityId: EntityId | null) => void;
}) {
  const primary = device.entitySlots.find((slot) => slot.deviceRole === "primary");
  const power = device.entitySlots.find(isDevicePowerSlot);
  const primaryEntity = primary && profile.entityIdsBySlotId[primary.id];
  if (!primary?.compatibleDomains.includes("switch") && !primaryEntity?.startsWith("switch."))
    return null;
  const current = power ? profile.entityIdsBySlotId[power.id] : undefined;
  const primaryDeviceId = runtime.entityRegistry.find(
    (entry) => entry.entity_id === primaryEntity,
  )?.device_id;
  const candidates = runtime.entityRegistry
    .filter(
      (entry) =>
        entry.entity_id.startsWith("sensor.") &&
        runtime.entityStates[entry.entity_id]?.attributes.device_class === "power",
    )
    .map((entry) => {
      const state = runtime.entityStates[entry.entity_id];
      const friendlyName = state?.attributes.friendly_name;
      return {
        entry,
        label:
          entry.name ||
          (typeof friendlyName === "string" ? friendlyName : entry.original_name) ||
          entry.entity_id,
        sameDevice: Boolean(primaryDeviceId && entry.device_id === primaryDeviceId),
        unavailable: !state?.available || state.stale || Boolean(entry.disabled_by),
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
  const update = (slot: EntityBindingSlotSpec, entityId = current ?? null) =>
    onChange(slot, entityId);
  const selectSensor = (entityId: string) => {
    if (!power && !entityId) return;
    update(
      power ?? {
        id: createBrowserUuid(),
        compatibleDomains: ["sensor"],
        compatibleDeviceClasses: ["power"],
        required: false,
        autoMap: "manual",
        deviceRole: "secondary",
        presentation: { label: "Power", dashboardRole: "secondary" },
      },
      (entityId as EntityId) || null,
    );
  };
  return (
    <fieldset className="connect-power-settings">
      <legend>Power & animation</legend>
      <label>
        <span>Power sensor</span>
        <select
          aria-label="Power sensor"
          value={current ?? ""}
          onChange={(event) => selectSensor(event.target.value)}
        >
          <option value="">No power sensor</option>
          {current && !candidates.some(({ entry }) => entry.entity_id === current) && (
            <option value={current}>Saved power sensor unavailable</option>
          )}
          {[true, false].map((sameDevice) => {
            const entries = candidates.filter((candidate) => candidate.sameDevice === sameDevice);
            return (
              entries.length > 0 && (
                <optgroup
                  key={String(sameDevice)}
                  label={sameDevice ? "Same Home Assistant device" : "Other power sensors"}
                >
                  {entries.map(({ entry, label, unavailable }) => (
                    <option
                      key={entry.entity_id}
                      value={entry.entity_id}
                      disabled={disconnected && entry.entity_id !== current}
                    >
                      {label}
                      {unavailable ? " · Unavailable" : ""}
                    </option>
                  ))}
                </optgroup>
              )
            );
          })}
        </select>
      </label>
      <p className="connect-note">
        Choose a power sensor to show live watts in the device controls.
      </p>
      {power && (
        <>
          <label>
            <span>Animate using</span>
            <select
              aria-label="Animate using"
              value={power.activityThresholdWatts === undefined ? "switch" : "power"}
              onChange={(event) => {
                if (event.target.value === "power") update({ ...power, activityThresholdWatts: 5 });
                else {
                  const next = { ...power };
                  delete next.activityThresholdWatts;
                  update(next);
                }
              }}
            >
              <option value="switch">Switch state</option>
              <option value="power">Power threshold</option>
            </select>
          </label>
          {power.activityThresholdWatts !== undefined && (
            <>
              <NumericField
                label="Animation threshold"
                unit="W"
                min={0}
                step={1}
                value={power.activityThresholdWatts}
                onChange={(activityThresholdWatts) => update({ ...power, activityThresholdWatts })}
              />
              <p className="connect-note">
                Animate only above this value while the switch is on. Missing or unavailable power
                readings stop the animation.
              </p>
            </>
          )}
        </>
      )}
    </fieldset>
  );
}
