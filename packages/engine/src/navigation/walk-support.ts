import type { BoxWalkCollider, WalkPoint } from "./walk-navigation-contract";

const SUPPORT_EPSILON = 1e-7;

export interface WalkSupport {
  id: string;
  elevation: number;
}

const containsWalkPoint = (collider: BoxWalkCollider, point: WalkPoint) =>
  point.x >= collider.minX - SUPPORT_EPSILON &&
  point.x <= collider.maxX + SUPPORT_EPSILON &&
  point.z >= collider.minZ - SUPPORT_EPSILON &&
  point.z <= collider.maxZ + SUPPORT_EPSILON;

export const retainedWalkSupport = (
  colliders: readonly BoxWalkCollider[],
  point: WalkPoint,
  supportId: string,
): WalkSupport | null => {
  const collider = colliders.find(
    (candidate) =>
      candidate.id === supportId &&
      candidate.supportY !== undefined &&
      containsWalkPoint(candidate, point),
  );
  return collider?.supportY === undefined
    ? null
    : { id: collider.id, elevation: collider.supportY };
};

export const crossedWalkSupport = (
  colliders: readonly BoxWalkCollider[],
  point: WalkPoint,
  previousFeetElevation: number,
  feetElevation: number,
): WalkSupport | null => {
  if (feetElevation > previousFeetElevation + SUPPORT_EPSILON) return null;
  let support: WalkSupport | null = null;
  for (const collider of colliders) {
    const elevation = collider.supportY;
    if (
      elevation === undefined ||
      elevation > previousFeetElevation + SUPPORT_EPSILON ||
      elevation < feetElevation - SUPPORT_EPSILON ||
      !containsWalkPoint(collider, point) ||
      (support !== null && elevation <= support.elevation)
    )
      continue;
    support = { id: collider.id, elevation };
  }
  return support;
};
