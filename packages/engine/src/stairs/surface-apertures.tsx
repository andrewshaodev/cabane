import { createContext, useContext } from "react";
import polygonClipping from "polygon-clipping";
import { Path, Shape } from "three";
import { planPointToWorld } from "../geometry";
import type { FloorCoordinates, PlanPoint, Polygon } from "../types";

export const StairSurfaceApertures = createContext<{
  floor: readonly Polygon[];
  ceiling: readonly Polygon[];
}>({ floor: [], ceiling: [] });
export const useStairSurfaceApertures = (surface: "floor" | "ceiling") =>
  useContext(StairSurfaceApertures)[surface];
export const cutSurfaceShapes = (
  polygon: Polygon,
  coordinates: FloorCoordinates,
  apertures: readonly Polygon[],
): Shape[] => {
  const ring = (points: readonly PlanPoint[]): [number, number][] =>
    [...points, points[0]].map((p) => [p[0], p[1]]);
  const clipped = apertures.length
    ? polygonClipping.difference([ring(polygon)], ...apertures.map((hole) => [ring(hole)]))
    : [[ring(polygon)]];
  return clipped.map((rings) => {
    const shape = new Shape();
    rings.forEach((points, index) => {
      const path = index === 0 ? shape : new Path();
      points.forEach((point, i) => {
        const [x, z] = planPointToWorld(point, coordinates);
        if (i === 0) path.moveTo(x, -z);
        else path.lineTo(x, -z);
      });
      path.closePath();
      if (index > 0) shape.holes.push(path);
    });
    return shape;
  });
};
