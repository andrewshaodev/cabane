import type { StairFlight } from "./flight-geometry";
import type { StairPathPoint } from "./types";

/** Closest route position, retaining elevation at the coincident ends of a full spiral. */
export function projectStairPath(
  flight: StairFlight,
  point: { x: number; z: number },
  nearElevation?: number,
) {
  let best: {
    x: number;
    z: number;
    elevation: number;
    distance: number;
    segment: number;
    t: number;
  } | null = null;
  flight.path.slice(1).forEach((b, i) => {
    const a = flight.path[i],
      dx = b.x - a.x,
      dz = b.z - a.z,
      l2 = dx * dx + dz * dz;
    const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.z - a.z) * dz) / l2));
    const x = a.x + dx * t,
      z = a.z + dz * t,
      elevation = a.elevation + (b.elevation - a.elevation) * t;
    const distance = Math.hypot(point.x - x, point.z - z);
    if (nearElevation !== undefined && Math.abs(elevation - nearElevation) > 0.4) return;
    if (
      !best ||
      distance < best.distance - 1e-7 ||
      (Math.abs(distance - best.distance) < 1e-7 &&
        nearElevation !== undefined &&
        Math.abs(elevation - nearElevation) < Math.abs(best.elevation - nearElevation))
    )
      best = { x, z, elevation, distance, segment: i, t };
  });
  return best as {
    x: number;
    z: number;
    elevation: number;
    distance: number;
    segment: number;
    t: number;
  } | null;
}
export function stairEndCoordinates(
  point: { x: number; z: number },
  end: StairPathPoint,
  forward: readonly [number, number],
) {
  const dx = point.x - end.x,
    dz = point.z - end.z;
  return { along: dx * forward[0] + dz * forward[1], across: dx * forward[1] - dz * forward[0] };
}
