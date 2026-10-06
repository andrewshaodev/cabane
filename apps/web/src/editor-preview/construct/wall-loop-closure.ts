import { type EditorWall, type PlanPoint } from "@cabane/engine";

const samePlanPoint = (left: PlanPoint, right: PlanPoint) =>
  Math.hypot(left[0] - right[0], left[1] - right[1]) <= 1e-7;

const cross = (left: PlanPoint, right: PlanPoint) => left[0] * right[1] - left[1] * right[0];

const pointOnWall = (point: PlanPoint, wall: Pick<EditorWall, "from" | "to">) => {
  const direction: PlanPoint = [wall.to[0] - wall.from[0], wall.to[1] - wall.from[1]];
  const relative: PlanPoint = [point[0] - wall.from[0], point[1] - wall.from[1]];
  const lengthSquared = direction[0] ** 2 + direction[1] ** 2;
  if (lengthSquared <= 1e-14) return samePlanPoint(point, wall.from);
  const tolerance = 1e-7 * Math.max(1, Math.sqrt(lengthSquared));
  if (Math.abs(cross(direction, relative)) > tolerance) return false;
  const progress = relative[0] * direction[0] + relative[1] * direction[1];
  return progress >= -tolerance && progress <= lengthSquared + tolerance;
};

const wallsIntersect = (left: EditorWall, right: EditorWall) => {
  const leftDirection: PlanPoint = [left.to[0] - left.from[0], left.to[1] - left.from[1]];
  const rightDirection: PlanPoint = [right.to[0] - right.from[0], right.to[1] - right.from[1]];
  const betweenStarts: PlanPoint = [right.from[0] - left.from[0], right.from[1] - left.from[1]];
  const denominator = cross(leftDirection, rightDirection);
  if (Math.abs(denominator) <= 1e-10) {
    return (
      pointOnWall(left.from, right) ||
      pointOnWall(left.to, right) ||
      pointOnWall(right.from, left) ||
      pointOnWall(right.to, left)
    );
  }
  const leftProgress = cross(betweenStarts, rightDirection) / denominator;
  const rightProgress = cross(betweenStarts, leftDirection) / denominator;
  return (
    leftProgress >= -1e-7 &&
    leftProgress <= 1 + 1e-7 &&
    rightProgress >= -1e-7 &&
    rightProgress <= 1 + 1e-7
  );
};

/**
 * A new segment closes a region when its endpoints were already connected by
 * the existing wall network. Walls are connected at endpoints, T-junctions,
 * and implicit crossings so the interaction does not depend on topology having
 * already split every segment. Reaching an unrelated component keeps the wall
 * chain active.
 */
export const closesWallLoop = (walls: readonly EditorWall[], from: PlanPoint, to: PlanPoint) => {
  if (samePlanPoint(from, to)) return false;
  const targetWalls = new Set(
    walls.map((wall, index) => (pointOnWall(to, wall) ? index : -1)).filter((index) => index >= 0),
  );
  if (targetWalls.size === 0) return false;
  const pending = walls
    .map((wall, index) => (pointOnWall(from, wall) ? index : -1))
    .filter((index) => index >= 0);
  const visited = new Set<number>();

  while (pending.length > 0) {
    const wallIndex = pending.pop()!;
    if (visited.has(wallIndex)) continue;
    if (targetWalls.has(wallIndex)) return true;
    visited.add(wallIndex);

    for (let candidateIndex = 0; candidateIndex < walls.length; candidateIndex += 1) {
      if (!visited.has(candidateIndex) && wallsIntersect(walls[wallIndex], walls[candidateIndex])) {
        pending.push(candidateIndex);
      }
    }
  }
  return false;
};
