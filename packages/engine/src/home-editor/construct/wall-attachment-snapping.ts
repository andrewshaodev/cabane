import type { PlanPoint } from "../../types";
import type { EditorWall } from "./topology";
import type { SnapRay } from "./snap-alignment";
import { FLOOR_EDITOR_ANGLE_SNAP_TOLERANCE_RADIANS } from "./draft-contract";

/** Attach to the wall along an assisted ray, rather than projecting the raw cursor. */
export function snapWallAttachment(
  candidate: PlanPoint,
  wall: EditorWall,
  rays: readonly SnapRay[],
  angleOrigin: PlanPoint | undefined,
  threshold: number,
): PlanPoint | undefined {
  const wx = wall.to[0] - wall.from[0],
    wy = wall.to[1] - wall.from[1];
  const intersection = (ray: SnapRay) => {
    const dx = Math.cos(ray.angle),
      dy = Math.sin(ray.angle);
    const cross = dx * wy - dy * wx;
    if (Math.abs(cross) <= 1e-10 * Math.max(1, Math.hypot(wx, wy))) return undefined;
    const ax = wall.from[0] - ray.origin[0],
      ay = wall.from[1] - ray.origin[1];
    const alongRay = (ax * wy - ay * wx) / cross;
    const alongWall = (ax * dy - ay * dx) / cross;
    if (alongRay <= 1e-7 || alongWall < 0 || alongWall > 1) return undefined;
    const point: PlanPoint = [wall.from[0] + alongWall * wx, wall.from[1] + alongWall * wy];
    const distance = Math.hypot(candidate[0] - point[0], candidate[1] - point[1]);
    return distance <= threshold ? { point, distance } : undefined;
  };
  const assisted = rays
    .map(intersection)
    .filter((result) => result !== undefined)
    .sort((a, b) => a.distance - b.distance)[0];
  if (assisted) return assisted.point;
  // Without a reachable active direction, offer a nearby perpendicular landing.
  // This also supports attachment to rotated walls without forcing an angle.
  if (!angleOrigin || Math.hypot(wx, wy) <= 1e-7) return undefined;
  const pointerAngle = Math.atan2(candidate[1] - angleOrigin[1], candidate[0] - angleOrigin[0]);
  const normal = Math.atan2(wy, wx) + Math.PI / 2;
  const angle = normal + Math.round((pointerAngle - normal) / Math.PI) * Math.PI;
  if (Math.abs(pointerAngle - angle) > FLOOR_EDITOR_ANGLE_SNAP_TOLERANCE_RADIANS + 1e-12)
    return undefined;
  return intersection({ origin: angleOrigin, angle })?.point;
}
