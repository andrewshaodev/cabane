import { type Polygon as ClippingPolygon } from "polygon-clipping";

import { ShapeUtils, Vector2 } from "three";

import { planPointToWorld, worldPointToPlan } from "../geometry";

import type { FloorSpec, WallJunctionSpec, WallSpec } from "../types";
import { unionClippingPolygons } from "./architecture-clipping";
import { EPSILON, Horizontal, MaterialBucket } from "./architecture-geometry-contract";
import { geometryFromBuckets, pushTriangle, uniqueSorted } from "./architecture-mesh-buckets";
import {
  junctionArmHalfLength,
  normalize,
  pointInsideFloorFootprint,
  wallExteriorNormal,
  wallFrame,
} from "./wall-coordinate-frame";

const armPolygon = (
  wall: WallSpec,
  junction: WallJunctionSpec,
  floor: FloorSpec,
): ClippingPolygon => {
  const frame = wallFrame(wall, floor);
  const center = planPointToWorld(junction.at, floor.coordinates);
  const along = junctionArmHalfLength(junction, floor);
  const across = wall.thicknessMeters / 2;
  const atStart =
    Math.hypot(junction.at[0] - wall.from[0], junction.at[1] - wall.from[1]) <= EPSILON;
  const atEnd = Math.hypot(junction.at[0] - wall.to[0], junction.at[1] - wall.to[1]) <= EPSILON;
  const startDistance = atStart ? 0 : -along;
  const endDistance = atEnd ? 0 : along;
  const corners = [
    [startDistance, -across],
    [endDistance, -across],
    [endDistance, across],
    [startDistance, across],
    [startDistance, -across],
  ].map(
    ([distance, side]) =>
      [
        center[0] + frame.direction[0] * distance + frame.normal[0] * side,
        center[1] + frame.direction[1] * distance + frame.normal[1] * side,
      ] as [number, number],
  );
  return [corners];
};

const polygonGeometry = (
  rings: readonly (readonly [number, number][])[],
  bottom: number,
  top: number,
  floor: FloorSpec,
) => {
  const buckets: [number[], number[]] = [[], []];
  const contour = rings[0].slice(0, -1).map(([x, z]) => new Vector2(x, z));
  const holes = rings.slice(1).map((ring) => ring.slice(0, -1).map(([x, z]) => new Vector2(x, z)));
  for (const triangle of ShapeUtils.triangulateShape(contour, holes)) {
    const vertices = [...contour, ...holes.flat()];
    const [a, b, c] = triangle.map((index) => vertices[index]);
    pushTriangle(buckets, 0, [a.x, top, a.y], [c.x, top, c.y], [b.x, top, b.y]);
    if (bottom === 0)
      pushTriangle(buckets, 0, [a.x, bottom, a.y], [b.x, bottom, b.y], [c.x, bottom, c.y]);
  }
  rings.forEach((ring, ringIndex) => {
    for (let index = 0; index < ring.length - 1; index += 1) {
      const a = ring[index];
      const b = ring[index + 1];
      const dx = b[0] - a[0];
      const dz = b[1] - a[1];
      const normal = normalize(ringIndex === 0 ? [dz, -dx] : [-dz, dx]);
      const sample = worldPointToPlan(
        { x: (a[0] + b[0]) / 2 + normal[0] * 0.06, z: (a[1] + b[1]) / 2 + normal[1] * 0.06 },
        floor.coordinates,
      );
      const material: MaterialBucket = pointInsideFloorFootprint(sample, floor) ? 0 : 1;
      pushTriangle(
        buckets,
        material,
        [a[0], bottom, a[1]],
        [b[0], bottom, b[1]],
        [b[0], top, b[1]],
      );
      pushTriangle(buckets, material, [a[0], bottom, a[1]], [b[0], top, b[1]], [a[0], top, a[1]]);
    }
  });
  return geometryFromBuckets(buckets);
};

export const buildWallJunctionGeometries = (junction: WallJunctionSpec, floor: FloorSpec) => {
  const walls = floor.walls.filter((wall) => junction.wallIds.includes(wall.id));
  const heights = uniqueSorted([
    0,
    ...walls.map((wall) => wall.heightMeters ?? floor.defaultWallHeightMeters),
  ]);
  return heights.slice(0, -1).flatMap((bottom, index) => {
    const top = heights[index + 1];
    const active = walls.filter(
      (wall) => (wall.heightMeters ?? floor.defaultWallHeightMeters) >= top - EPSILON,
    );
    const arms = active.map((wall) => armPolygon(wall, junction, floor));
    if (!arms[0]) return [];
    const merged = unionClippingPolygons(arms);
    return merged.flatMap((polygon, polygonIndex) => ({
      id: `${junction.id}-${index}-${polygonIndex}`,
      geometry: polygonGeometry(polygon, bottom, top, floor),
    }));
  });
};

export const junctionFadeNormal = (
  junction: WallJunctionSpec,
  floor: FloorSpec,
): Horizontal | null => {
  const normals = floor.walls
    .filter((wall) => junction.wallIds.includes(wall.id))
    .map((wall) => wallExteriorNormal(wall, floor))
    .filter((normal): normal is Horizontal => normal !== null);
  if (!normals.length) return null;
  return normalize(
    normals.reduce<readonly [number, number]>(
      (sum, normal) => [sum[0] + normal[0], sum[1] + normal[1]],
      [0, 0],
    ),
  );
};
