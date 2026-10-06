import type { FloorSpec, ResolvedHomeBindings } from "./types";
import { rollUpDoorGeometry } from "./roll-up-door-geometry";
import { WALK_EYE_HEIGHT, WALK_PLAYER_RADIUS } from "./navigation/walk-navigation-contract";
export const WALK_HEAD_MARGIN = 0.18;
export type OpeningPositions = Readonly<Record<string, number>>;
export type RetainedOpeningPositions = Map<string, { bindingKey: string; position: number }>;

/** Move roll-up doors toward the latest reported position at a steady normalized speed. */
export function advanceRollUpDoorPositions(
  current: OpeningPositions,
  target: OpeningPositions,
  doorIds: readonly string[],
  deltaSeconds: number,
): { positions: OpeningPositions; moving: boolean } {
  const positions: Record<string, number> = {};
  let moving = false;
  const step = Math.max(0, Math.min(0.05, deltaSeconds)) * 0.7;
  for (const id of doorIds) {
    const from = current[id] ?? target[id] ?? 0;
    const to = target[id] ?? 0;
    const next = from + Math.max(-step, Math.min(step, to - from));
    positions[id] = next;
    if (Math.abs(next - to) > 0.000001) moving = true;
  }
  return { positions, moving };
}

/** Bound state wins over local proximity; retained poses belong to one binding identity. */
export function resolveOpeningPositions(
  automatic: ReadonlySet<string>,
  bindings: ResolvedHomeBindings["openings"],
  retained: RetainedOpeningPositions,
): OpeningPositions {
  const result: Record<string, number> = {};
  for (const id of retained.keys()) if (!bindings[id]) retained.delete(id);
  for (const [id, binding] of Object.entries(bindings)) {
    const previous = retained.get(id);
    if (!binding.bound) {
      retained.delete(id);
      result[id] = automatic.has(id) ? 1 : 0;
      continue;
    }
    const position =
      binding.position ?? (previous?.bindingKey === binding.bindingKey ? previous.position : 0);
    retained.set(id, { bindingKey: binding.bindingKey, position });
    result[id] = position;
  }
  for (const id of automatic) if (!(id in result)) result[id] = 1;
  return result;
}

export function passableOpeningIds(
  floors: readonly FloorSpec[],
  positions: OpeningPositions,
  jumpHeight = 0,
): ReadonlySet<string> {
  const result = new Set<string>();
  for (const floor of floors)
    for (const opening of floor.openings) {
      const position = positions[opening.id] ?? 0;
      if (opening.kind === "door" && opening.operation === "roll-up") {
        const geometry = rollUpDoorGeometry(
          opening.widthPlanUnits * floor.coordinates.metersPerPlanUnit,
          opening.openingHeightMeters,
          position,
        );
        if (
          geometry.travel >= WALK_EYE_HEIGHT + WALK_HEAD_MARGIN + jumpHeight &&
          geometry.clearWidth >= WALK_PLAYER_RADIUS * 2
        )
          result.add(opening.id);
      } else if (position > 0) result.add(opening.id);
    }
  return result;
}
