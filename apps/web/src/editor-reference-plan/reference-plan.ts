/** Editor-only values. Never part of HomeProject or a workspace transfer. */
export type ReferencePoint = readonly [number, number];
export interface ReferencePlan {
  assetId: string;
  name: string;
  pixelWidth: number;
  pixelHeight: number;
  center: ReferencePoint;
  width: number;
  angle: number;
}
export type ReferencePlans = Record<string, ReferencePlan>;
export interface ReferencePreference {
  visible: boolean;
  opacity: number;
}
export const defaultReferencePreference: ReferencePreference = { visible: true, opacity: 0.5 };
export const referenceHeight = (plan: ReferencePlan) =>
  (plan.width * plan.pixelHeight) / plan.pixelWidth;
export const rotatePoint = ([x, y]: ReferencePoint, angle: number): ReferencePoint => {
  const r = (angle * Math.PI) / 180;
  return [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)];
};
export const imagePointToWorld = (plan: ReferencePlan, [u, v]: ReferencePoint): ReferencePoint => {
  const [x, y] = rotatePoint(
    [(u - 0.5) * plan.width, (v - 0.5) * referenceHeight(plan)],
    plan.angle,
  );
  return [plan.center[0] + x, plan.center[1] + y];
};
export const worldPointToImage = (plan: ReferencePlan, point: ReferencePoint): ReferencePoint => {
  const [x, y] = rotatePoint([point[0] - plan.center[0], point[1] - plan.center[1]], -plan.angle);
  return [x / plan.width + 0.5, y / referenceHeight(plan) + 0.5];
};
export function calibrateReference(
  plan: ReferencePlan,
  from: ReferencePoint,
  to: ReferencePoint,
  distance: number,
): ReferencePlan {
  const a = imagePointToWorld(plan, from),
    b = imagePointToWorld(plan, to);
  const measured = Math.hypot(b[0] - a[0], b[1] - a[1]);
  if (!Number.isFinite(distance) || distance <= 0)
    throw new Error("Enter a distance greater than zero in metres.");
  if (measured < 0.000001) throw new Error("Choose two different points on the image.");
  const scale = distance / measured;
  return {
    ...plan,
    width: plan.width * scale,
    center: [a[0] + (plan.center[0] - a[0]) * scale, a[1] + (plan.center[1] - a[1]) * scale],
  };
}
/** Resize about the opposite corner; project onto the original diagonal to preserve proportions. */
export function resizeReference(
  plan: ReferencePlan,
  corner: ReferencePoint,
  point: ReferencePoint,
): ReferencePlan {
  const anchor = imagePointToWorld(plan, [1 - corner[0], 1 - corner[1]]);
  const moving = imagePointToWorld(plan, corner);
  const dx = moving[0] - anchor[0],
    dy = moving[1] - anchor[1];
  const scale = Math.max(
    0.01 / plan.width,
    ((point[0] - anchor[0]) * dx + (point[1] - anchor[1]) * dy) / (dx * dx + dy * dy),
  );
  return {
    ...plan,
    width: plan.width * scale,
    center: [anchor[0] + (dx * scale) / 2, anchor[1] + (dy * scale) / 2],
  };
}
