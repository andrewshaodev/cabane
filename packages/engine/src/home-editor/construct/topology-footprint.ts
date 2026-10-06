/*
 * Planar face traversal follows the conventional directed half-edge walk used
 * by OpenPlan3D and ai_room_planner (MIT). The implementation is original to
 * Cabane and keeps the data model independent from either application.
 */
import polygonClipping, { type Polygon as ClippingPolygon } from "polygon-clipping";

import type { ManifestIssue, PlanPoint, Polygon } from "../../types";
import { FLOOR_EDITOR_EPSILON } from "./topology-contract";
import { cross, issue, point, samePoint } from "./topology-plan-math";

export const footprintForFaces = (
  faces: readonly Polygon[],
  issues: ManifestIssue[],
):
  | {
      footprint: Polygon;
      regions: readonly Polygon[];
    }
  | undefined => {
  if (faces.length === 0) return undefined;
  const polygons = faces.map((face) => [[...face, face[0]]] as ClippingPolygon);
  const merged = polygonClipping.union(polygons[0], ...polygons.slice(1));
  if (merged.some((polygon) => polygon.length !== 1)) {
    issues.push(
      issue(
        "topology.hole",
        "walls",
        "The browser editor does not support holes inside the floor footprint.",
      ),
    );
    return undefined;
  }
  const regions = merged.flatMap((polygon): Polygon[] => {
    const ring = polygon[0].slice(0, -1).map(([x, y]) => point(x, y));
    return ring.length >= 3 ? [[ring[0], ring[1], ring[2], ...ring.slice(3)]] : [];
  });
  if (regions.length !== merged.length) return undefined;
  if (merged.length !== 1) {
    // FloorSpec still owns one simple footprint polygon. For disconnected,
    // individually closed buildings, use their common outer envelope only as
    // the floor-level extent; rooms and walls retain the actual disjoint
    // topology, so no synthetic corridor or connecting wall is introduced.
    const candidates = faces.flatMap((face) => face);
    const sorted = [...candidates]
      .filter(
        (candidate, index, all) =>
          !all.slice(0, index).some((other) => samePoint(candidate, other)),
      )
      .sort((left, right) => left[0] - right[0] || left[1] - right[1]);
    if (sorted.length < 3) return undefined;
    const hullHalf = (values: readonly PlanPoint[]) => {
      const half: PlanPoint[] = [];
      values.forEach((candidate) => {
        while (
          half.length >= 2 &&
          cross(half[half.length - 2], half[half.length - 1], candidate) <= FLOOR_EDITOR_EPSILON
        ) {
          half.pop();
        }
        half.push(candidate);
      });
      return half;
    };
    const lower = hullHalf(sorted);
    const upper = hullHalf([...sorted].reverse());
    const hull = [...lower.slice(0, -1), ...upper.slice(0, -1)].map(([x, y]) => point(x, y));
    return hull.length >= 3
      ? {
          footprint: hull as [PlanPoint, PlanPoint, PlanPoint, ...PlanPoint[]],
          regions,
        }
      : undefined;
  }
  const ring = regions[0];
  if (ring.length < 3) return undefined;
  return { footprint: ring, regions };
};
