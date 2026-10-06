import type { PlanPoint } from "../../types";
import type { EditorWall } from "./topology";
import { FLOOR_EDITOR_ANGLE_STEP_RADIANS, FLOOR_EDITOR_ANGLE_SNAP_TOLERANCE_RADIANS } from "./draft-contract";

const same = (a: PlanPoint, b: PlanPoint) => Math.hypot(a[0] - b[0], a[1] - b[1]) < 1e-7;
export interface SnapRay { origin: PlanPoint; angle: number }

/** Fixed neighbors supply the same relative angle references used by a drawing chain. */
export function cornerSnapRays(candidate: PlanPoint, walls: readonly EditorWall[], moving: PlanPoint | undefined,
  origin: PlanPoint | undefined, reference: number): SnapRay[] {
  const anchors = moving ? walls.filter(w => same(w.from, moving) || same(w.to, moving))
    .map(w => same(w.from, moving) ? w.to : w.from) : origin ? [origin] : [];
  if (!anchors.length && origin) anchors.push(origin);
  return anchors.flatMap(anchor => {
    const neighbors = moving ? walls.filter(w => !same(w.from, moving) && !same(w.to, moving)
      && (same(w.from, anchor) || same(w.to, anchor))) : [];
    const references = neighbors.length ? neighbors.map(w => Math.atan2(w.to[1] - w.from[1], w.to[0] - w.from[0])) : [reference];
    const pointerAngle = Math.atan2(candidate[1] - anchor[1], candidate[0] - anchor[0]);
    return references.flatMap(base => {
      const angle = base + Math.round((pointerAngle - base) / FLOOR_EDITOR_ANGLE_STEP_RADIANS) * FLOOR_EDITOR_ANGLE_STEP_RADIANS;
      return Math.abs(pointerAngle - angle) <= FLOOR_EDITOR_ANGLE_SNAP_TOLERANCE_RADIANS + 1e-12
        ? [{ origin: anchor, angle }] : [];
    });
  });
}

export function snapAlignment(candidate: PlanPoint, rays: readonly SnapRay[], endpoints: readonly PlanPoint[], threshold: number) {
  const results: { point: PlanPoint; guideFrom: PlanPoint; distance: number; paired: boolean }[] = [];
  const add = (point: PlanPoint, guideFrom: PlanPoint, paired = false) => {
    const distance = Math.hypot(point[0] - candidate[0], point[1] - candidate[1]);
    if (distance <= threshold && !same(point, guideFrom)) results.push({ point, guideFrom, distance, paired });
  };
  for (const ray of rays) {
    const dx = Math.cos(ray.angle), dy = Math.sin(ray.angle);
    for (const endpoint of endpoints) {
      const length = (endpoint[0] - ray.origin[0]) * dx + (endpoint[1] - ray.origin[1]) * dy;
      if (length <= 1e-7) continue;
      add([ray.origin[0] + length * dx, ray.origin[1] + length * dy], endpoint);
    }
    for (const other of rays) {
      if (same(ray.origin, other.origin)) continue;
      const ox = Math.cos(other.angle), oy = Math.sin(other.angle);
      const cross = dx * oy - dy * ox;
      if (Math.abs(cross) < 1e-7) continue;
      const length = ((other.origin[0] - ray.origin[0]) * oy - (other.origin[1] - ray.origin[1]) * ox) / cross;
      if (length <= 1e-7) continue;
      const point: PlanPoint = [ray.origin[0] + length * dx, ray.origin[1] + length * dy];
      if ((point[0] - other.origin[0]) * ox + (point[1] - other.origin[1]) * oy <= 1e-7) continue;
      add(point, other.origin, true);
    }
  }
  return results.sort((a, b) => Number(b.paired) - Number(a.paired) || a.distance - b.distance)[0];
}
