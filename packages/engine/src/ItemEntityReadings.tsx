import { Html } from "@react-three/drei";
import { resolveItemTransform, type SceneItemSpec } from "./home-project";
import type { EntityBindingSlotSpec, EntityStateSnapshot, FloorSpec } from "./types";

export const itemEntityReadings = (
  slots: readonly EntityBindingSlotSpec[],
  states: Readonly<Record<string, EntityStateSnapshot>>,
) =>
  slots
    .filter((slot) => slot.presentation.showInScene === true)
    .map((slot) => {
      const state = states[slot.id];
      const unit = state?.attributes.unit_of_measurement;
      const value = !state
        ? "Not connected"
        : !state.available
          ? "Unavailable"
          : state.stale
            ? "Stale"
            : `${state.state}${typeof unit === "string" && unit ? ` ${unit}` : ""}`;
      return { id: slot.id, label: slot.presentation.label, value };
    });

export function ItemEntityReadings({
  item,
  floor,
  states,
}: {
  item: SceneItemSpec;
  floor: FloorSpec;
  states: Readonly<Record<string, EntityStateSnapshot>>;
}) {
  const readings = itemEntityReadings(item.entitySlots ?? [], states);
  if (!readings.length) return null;
  const { position } = resolveItemTransform(item.placement, floor);
  const height = item.placement.kind === "ceiling" ? 0 : item.size[1];
  return (
    <Html
      position={[position[0], position[1] + height + 0.15, position[2]]}
      center
      zIndexRange={[7, 0]}
      pointerEvents="none"
    >
      <div className="item-entity-readings">
        {readings.map((reading) => (
          <div key={reading.id}>
            <span>{reading.label}</span>
            <strong>{reading.value}</strong>
          </div>
        ))}
      </div>
    </Html>
  );
}
