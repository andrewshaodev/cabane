import type { CustomModelLight, ModelVector } from "./contracts";
import { CUSTOM_MODEL_LIMITS } from "./contracts";

/** Expand a strip once at model resolution, never per frame. */
export function importedLightSources(light: CustomModelLight) {
  const positions: readonly ModelVector[] = light.strip
    ? Array.from(
        { length: light.strip.samples },
        (_, index) =>
          light.position.map(
            (n, axis) => n + ((light.strip!.end[axis] - n) * index) / (light.strip!.samples - 1),
          ) as [number, number, number],
      )
    : [light.position, ...(light.points ?? [])];
  return positions.slice(0, CUSTOM_MODEL_LIMITS.lightPoints).map((position) => ({
    position,
    color: light.color,
    maxIntensity: light.maxIntensity / positions.length,
    distance: light.distance,
  }));
}
