import { worldPointToPlan, type FloorCoordinates, type StraightStairSpec } from "@cabane/engine";

export interface StairPlacementPoint { x: number; z: number }

/** The bottom and top are center-line endpoints, in world metres. */
export function stairFromEndpoints(stair: StraightStairSpec, coordinates: FloorCoordinates,
  start: StairPlacementPoint, end: StairPlacementPoint): StraightStairSpec | null {
  const dx = end.x - start.x, dz = end.z - start.z;
  const run = Math.hypot(dx, dz);
  if (!Number.isFinite(run) || run < .1) return null;
  return { ...stair, at: worldPointToPlan(start, coordinates),
    runMeters: Number(run.toFixed(2)), rotationYRadians: Math.atan2(dx, dz) };
}

export type StairEditHandle = "body" | "bottom" | "top" | "left" | "right";
export function editStairFromPoint(stair: StraightStairSpec, coordinates: FloorCoordinates,
  start: StairPlacementPoint, grab: StairPlacementPoint, point: StairPlacementPoint, handle: StairEditHandle): StraightStairSpec | null {
  const forward = { x: Math.sin(stair.rotationYRadians), z: Math.cos(stair.rotationYRadians) };
  const end = { x: start.x + forward.x * stair.runMeters, z: start.z + forward.z * stair.runMeters };
  if (handle === "body") return { ...stair, at: worldPointToPlan({
    x: start.x + point.x - grab.x, z: start.z + point.z - grab.z,
  }, coordinates) };
  if (handle === "bottom") return stairFromEndpoints(stair, coordinates, point, end);
  if (handle === "top") return stairFromEndpoints(stair, coordinates, start, point);
  const across = (point.x - start.x) * forward.z - (point.z - start.z) * forward.x;
  const widthMeters = Number((Math.abs(across) * 2).toFixed(2));
  return widthMeters >= .1 ? { ...stair, widthMeters } : null;
}
