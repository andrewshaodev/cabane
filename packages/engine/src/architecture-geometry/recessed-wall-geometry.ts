import type { FloorSpec, WallSpec } from "../types";
import { EPSILON, type MaterialBucket } from "./architecture-geometry-contract";
import { geometryFromBuckets, pushTriangle, uniqueSorted } from "./architecture-mesh-buckets";
import { wallFrame } from "./wall-coordinate-frame";

type Aperture = { start: number; end: number; bottom: number; top: number };

/** Only exposed faces of the wall's three-dimensional rectangular cell grid. */
export function buildRecessedWallGeometry(
  wall: WallSpec,
  floor: FloorSpec,
  openings: readonly Aperture[],
  trims: readonly (readonly [number, number])[],
  plusMaterial: MaterialBucket,
  minusMaterial: MaterialBucket,
  startCap: boolean,
  endCap: boolean,
) {
  const frame = wallFrame(wall, floor),
    scale = floor.coordinates.metersPerPlanUnit;
  const half = wall.thicknessMeters / 2,
    height = wall.heightMeters ?? floor.defaultWallHeightMeters;
  const niches = (wall.niches ?? []).map((n) => ({
    start: n.offsetFromWallStartPlanUnits * scale,
    end: (n.offsetFromWallStartPlanUnits + n.widthPlanUnits) * scale,
    bottom: n.bottomMeters,
    top: n.bottomMeters + n.heightMeters,
    back: n.side === "left" ? half - n.depthMeters : -half + n.depthMeters,
    side: n.side,
    shelves: (n.shelfHeightsMeters ?? []).map((level) => ({
      bottom: n.bottomMeters + level,
      top: n.bottomMeters + level + (n.shelfThicknessMeters ?? 0.025),
    })),
  }));
  const xs = uniqueSorted([
    0,
    frame.length,
    ...openings.flatMap((o) => [o.start, o.end]),
    ...niches.flatMap((n) => [n.start, n.end]),
    ...trims.flatMap((t) => t),
  ]);
  const ys = uniqueSorted([
    0,
    height,
    ...openings.flatMap((o) => [o.bottom, o.top]),
    ...niches.flatMap((n) => [n.bottom, n.top, ...n.shelves.flatMap((s) => [s.bottom, s.top])]),
  ]);
  const zs = uniqueSorted([-half, half, ...niches.map((n) => n.back)]);
  const occupied = (x: number, y: number, z: number) => {
    if (x < 0 || y < 0 || z < 0 || x >= xs.length - 1 || y >= ys.length - 1 || z >= zs.length - 1)
      return false;
    const mx = (xs[x] + xs[x + 1]) / 2,
      my = (ys[y] + ys[y + 1]) / 2,
      mz = (zs[z] + zs[z + 1]) / 2;
    return (
      !trims.some(([a, b]) => mx > a - EPSILON && mx < b + EPSILON) &&
      !openings.some(
        (o) =>
          mx > o.start - EPSILON &&
          mx < o.end + EPSILON &&
          my > o.bottom - EPSILON &&
          my < o.top + EPSILON,
      ) &&
      !niches.some(
        (n) =>
          mx > n.start - EPSILON &&
          mx < n.end + EPSILON &&
          my > n.bottom - EPSILON &&
          my < n.top + EPSILON &&
          !n.shelves.some((s) => my > s.bottom - EPSILON && my < s.top + EPSILON) &&
          (n.side === "left" ? mz > n.back - EPSILON : mz < n.back + EPSILON),
      )
    );
  };
  const point = (x: number, y: number, z: number): readonly [number, number, number] => [
    frame.from[0] + frame.direction[0] * x + frame.normal[0] * z,
    y,
    frame.from[1] + frame.direction[1] * x + frame.normal[1] * z,
  ];
  const buckets: [number[], number[]] = [[], []];
  const quad = (
    material: MaterialBucket,
    a: readonly [number, number, number],
    b: readonly [number, number, number],
    c: readonly [number, number, number],
    d: readonly [number, number, number],
  ) => {
    pushTriangle(buckets, material, a, b, c);
    pushTriangle(buckets, material, a, c, d);
  };
  for (let x = 0; x < xs.length - 1; x++)
    for (let y = 0; y < ys.length - 1; y++)
      for (let z = 0; z < zs.length - 1; z++) {
        if (!occupied(x, y, z)) continue;
        const [x0, x1] = [xs[x], xs[x + 1]],
          [y0, y1] = [ys[y], ys[y + 1]],
          [z0, z1] = [zs[z], zs[z + 1]];
        const m0 = point(x0, y0, z0),
          m1 = point(x1, y0, z0),
          m2 = point(x1, y1, z0),
          m3 = point(x0, y1, z0);
        const p0 = point(x0, y0, z1),
          p1 = point(x1, y0, z1),
          p2 = point(x1, y1, z1),
          p3 = point(x0, y1, z1);
        if (!occupied(x, y, z + 1)) quad(plusMaterial, p0, p1, p2, p3);
        if (!occupied(x, y, z - 1)) quad(minusMaterial, m0, m3, m2, m1);
        if (!occupied(x - 1, y, z) && (x > 0 || startCap)) quad(0, m0, p0, p3, m3);
        if (!occupied(x + 1, y, z) && (x < xs.length - 2 || endCap)) quad(0, p1, m1, m2, p2);
        if (!occupied(x, y - 1, z)) quad(0, m0, m1, p1, p0);
        if (!occupied(x, y + 1, z)) quad(0, p3, p2, m2, m3);
      }
  return geometryFromBuckets(buckets);
}
