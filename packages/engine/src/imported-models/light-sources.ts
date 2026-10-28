import type { CustomModelLight, CustomModelLightSource, ModelVector } from "./contracts";

/** Read old single-point/strip declarations without rewriting saved projects. */
export function modelLightSources(light: CustomModelLight): readonly CustomModelLightSource[] {
  return (
    light.sources ??
    (light.strip
      ? [{ kind: "strip", start: light.position, ...light.strip }]
      : [light.position, ...(light.points ?? [])].map((position) => ({ kind: "point", position })))
  );
}

/** Expand a strip once at model resolution, never per frame. */
export function importedLightSources(light: CustomModelLight) {
  const sources = modelLightSources(light);
  return sources.flatMap((source) => {
    const positions: readonly ModelVector[] =
      source.kind === "point"
        ? [source.position]
        : Array.from(
            { length: source.samples },
            (_, index) =>
              source.start.map(
                (n, axis) => n + ((source.end[axis] - n) * index) / (source.samples - 1),
              ) as [number, number, number],
          );
    return positions.map((position) => ({
      position,
      color: light.color,
      maxIntensity:
        light.illuminate === false ? 0 : light.maxIntensity / sources.length / positions.length,
      distance: light.distance,
    }));
  });
}
