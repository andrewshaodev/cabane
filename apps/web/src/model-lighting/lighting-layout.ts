import { Euler, Matrix4, Vector3 } from "three";
import type { CustomModelNormalization } from "@cabane/engine";
import type { CustomModelLight, DeviceModelBounds, ModelVector } from "@cabane/engine";
export const stripSamples = (start: ModelVector, end: ModelVector) =>
  Math.min(8, Math.max(2, Math.ceil(Math.hypot(...start.map((n, i) => n - end[i])) / 0.6) + 1));
export function fittedStrip(light: CustomModelLight, bounds: DeviceModelBounds): CustomModelLight {
  const lengths = bounds.max.map((n, i) => n - bounds.min[i]);
  const axis = lengths.indexOf(Math.max(...lengths));
  const start = bounds.min.map((n, i) =>
    i === axis ? n + lengths[i] * 0.05 : (n + bounds.max[i]) / 2,
  ) as [number, number, number];
  const end = start.map((n, i) => (i === axis ? bounds.max[i] - lengths[i] * 0.05 : n)) as [
    number,
    number,
    number,
  ];
  const { points: _points, ...shared } = light;
  return { ...shared, position: start, strip: { end, samples: stripSamples(start, end) } };
}
export function lightingError(light: CustomModelLight | null): string | null {
  if (!light) return null;
  if (
    ![light.position, ...(light.points ?? []), ...(light.strip ? [light.strip.end] : [])].every(
      (v) => v.every(Number.isFinite),
    )
  )
    return "Enter finite coordinates for every light source.";
  if (![light.maxIntensity, light.distance].every((n) => Number.isFinite(n) && n >= 0))
    return "Brightness and range must be zero or greater.";
  if (light.strip && light.strip.end.every((n, i) => n === light.position[i]))
    return "Place the strip end away from its start.";
  return null;
}

export function renormalizeLighting(
  light: CustomModelLight,
  previous: CustomModelNormalization,
  next: CustomModelNormalization,
): CustomModelLight {
  const matrix = (normalization: CustomModelNormalization) =>
    new Matrix4()
      .makeTranslation(...normalization.offset)
      .multiply(new Matrix4().makeRotationFromEuler(new Euler(...normalization.rotation)))
      .multiply(
        new Matrix4().makeScale(normalization.scale, normalization.scale, normalization.scale),
      );
  const delta = matrix(next).multiply(matrix(previous).invert());
  const transform = (point: ModelVector) =>
    new Vector3(...point).applyMatrix4(delta).toArray() as [number, number, number];
  return {
    ...light,
    position: transform(light.position),
    distance: (light.distance * next.scale) / previous.scale,
    ...(light.points ? { points: light.points.map(transform) } : {}),
    ...(light.strip ? { strip: { ...light.strip, end: transform(light.strip.end) } } : {}),
  };
}
