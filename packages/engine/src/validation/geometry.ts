import { segmentsIntersect } from "../geometry";
import type { PlanPoint } from "../types";

export const JUNCTION_EPSILON = 1e-6;

export const planPointsEqual = (left: PlanPoint, right: PlanPoint) =>
  Math.hypot(left[0] - right[0], left[1] - right[1]) <= JUNCTION_EPSILON;

export const pointOnWallSegment = (point: PlanPoint, wall: { from: PlanPoint; to: PlanPoint }) => {
  const dx = wall.to[0] - wall.from[0];
  const dy = wall.to[1] - wall.from[1];
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared <= JUNCTION_EPSILON ** 2) return false;
  const progress =
    ((point[0] - wall.from[0]) * dx + (point[1] - wall.from[1]) * dy) / lengthSquared;
  if (progress < -JUNCTION_EPSILON || progress > 1 + JUNCTION_EPSILON) return false;
  const projected: PlanPoint = [wall.from[0] + dx * progress, wall.from[1] + dy * progress];
  return planPointsEqual(point, projected);
};

export const wallIntersectionPoints = (
  left: { from: PlanPoint; to: PlanPoint },
  right: { from: PlanPoint; to: PlanPoint },
) => {
  const result: PlanPoint[] = [];
  const pushUnique = (point: PlanPoint) => {
    if (!result.some((candidate) => planPointsEqual(candidate, point))) result.push(point);
  };
  for (const point of [left.from, left.to]) {
    if (pointOnWallSegment(point, right)) pushUnique(point);
  }
  for (const point of [right.from, right.to]) {
    if (pointOnWallSegment(point, left)) pushUnique(point);
  }
  const leftDx = left.to[0] - left.from[0];
  const leftDy = left.to[1] - left.from[1];
  const rightDx = right.to[0] - right.from[0];
  const rightDy = right.to[1] - right.from[1];
  const denominator = leftDx * rightDy - leftDy * rightDx;
  if (Math.abs(denominator) <= JUNCTION_EPSILON) return result;
  const offsetX = right.from[0] - left.from[0];
  const offsetY = right.from[1] - left.from[1];
  const leftProgress = (offsetX * rightDy - offsetY * rightDx) / denominator;
  const rightProgress = (offsetX * leftDy - offsetY * leftDx) / denominator;
  if (
    leftProgress >= -JUNCTION_EPSILON &&
    leftProgress <= 1 + JUNCTION_EPSILON &&
    rightProgress >= -JUNCTION_EPSILON &&
    rightProgress <= 1 + JUNCTION_EPSILON
  ) {
    pushUnique([left.from[0] + leftDx * leftProgress, left.from[1] + leftDy * leftProgress]);
  }
  return result;
};

export const junctionTopologyIsValid = (
  at: PlanPoint,
  walls: readonly { from: PlanPoint; to: PlanPoint }[],
) => {
  const rays: PlanPoint[] = [];
  for (const wall of walls) {
    for (const endpoint of [wall.from, wall.to]) {
      const dx = endpoint[0] - at[0];
      const dy = endpoint[1] - at[1];
      const length = Math.hypot(dx, dy);
      if (length > JUNCTION_EPSILON) rays.push([dx / length, dy / length]);
    }
  }
  const unique = rays.filter(
    (ray, index) =>
      !rays
        .slice(0, index)
        .some(
          (candidate) =>
            Math.hypot(ray[0] - candidate[0], ray[1] - candidate[1]) <= JUNCTION_EPSILON,
        ),
  );
  return unique.length === rays.length && unique.length >= 2;
};

export const pointOnPolygonBoundary = (point: PlanPoint, polygon: readonly PlanPoint[]) => {
  for (let index = 0; index < polygon.length; index += 1) {
    const start = polygon[index];
    const end = polygon[(index + 1) % polygon.length];
    if (
      segmentsIntersect(start, end, point, point) &&
      Math.abs(
        (end[0] - start[0]) * (point[1] - start[1]) - (end[1] - start[1]) * (point[0] - start[0]),
      ) < 1e-8
    )
      return true;
  }
  return false;
};
