import type { Vector3 } from "three";

/** Interpolate angular coordinates so opposite sun positions never cross zero. */
export function transitionSolarDirection(current: Vector3, target: Vector3, progress: number) {
  const radius = current.length();
  const targetRadius = target.length();
  if (radius < 1e-8 || targetRadius < 1e-8) return current.copy(target);
  const azimuth = Math.atan2(current.z, current.x);
  const targetAzimuth = Math.atan2(target.z, target.x);
  const turn = Math.atan2(Math.sin(targetAzimuth - azimuth), Math.cos(targetAzimuth - azimuth));
  const elevation = Math.asin(Math.min(1, Math.max(-1, current.y / radius)));
  const targetElevation = Math.asin(Math.min(1, Math.max(-1, target.y / targetRadius)));
  const nextElevation = elevation + (targetElevation - elevation) * progress;
  const nextAzimuth = azimuth + turn * progress;
  const nextRadius = radius + (targetRadius - radius) * progress;
  return current.set(
    nextRadius * Math.cos(nextElevation) * Math.cos(nextAzimuth),
    nextRadius * Math.sin(nextElevation),
    nextRadius * Math.cos(nextElevation) * Math.sin(nextAzimuth),
  );
}
