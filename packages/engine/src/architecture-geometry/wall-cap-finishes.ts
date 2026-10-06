import type { MultiPolygon, Polygon } from "polygon-clipping";
import type { FloorSpec, WallSpec } from "../types";
import { differenceClippingGeometry, unionClippingPolygons } from "./architecture-clipping";
import { wallEdgeFinish } from "./wall-face-finish";
import { wallAssemblyFootprintPolygons } from "./wall-solid-footprints";

/** Partition before triangulating so a cap triangle cannot cross finish boundaries. */
export function wallCapFinishRegions(
  surface: MultiPolygon,
  walls: readonly WallSpec[],
  floor: FloorSpec,
  fallback: string,
): { surface: MultiPolygon; color: string }[] {
  if (!surface.length) return [];
  if (walls.every((wall) => wallEdgeFinish(wall, fallback) === fallback))
    return [{ surface, color: fallback }];
  const polygonsByFinish = new Map<string, Polygon[]>();
  for (const wall of walls) {
    const finish = wallEdgeFinish(wall, fallback);
    const polygons = polygonsByFinish.get(finish) ?? [];
    polygons.push(...wallAssemblyFootprintPolygons(wall, floor));
    polygonsByFinish.set(finish, polygons);
  }
  const groups = [...polygonsByFinish].map(([color, polygons]) => ({
    color,
    footprint: unionClippingPolygons(polygons),
  }));
  const regions = groups.map(({ color, footprint }, index) => ({
    color,
    surface: differenceClippingGeometry(
      surface,
      differenceClippingGeometry(surface, footprint),
      ...groups.filter((_, other) => other !== index).map((group) => group.footprint),
    ),
  }));
  return [
    ...regions,
    {
      color: fallback,
      surface: differenceClippingGeometry(surface, ...regions.map((r) => r.surface)),
    },
  ].filter((region) => region.surface.length > 0);
}
