import polygonClipping, { type MultiPolygon } from "polygon-clipping";
import { Path, Shape } from "three";
import { planPointToWorld } from "../geometry";
import type { FloorCoordinates, Polygon } from "../types";

/** Excavate stair access through every terrain layer, retaining pool openings. */
export function cutStairGroundOpenings(
  shapes: Shape[],
  coordinates: FloorCoordinates,
  apertures: readonly Polygon[],
): Shape[] {
  if (!apertures.length) return shapes;
  const outlines: MultiPolygon = shapes.map((shape) =>
    [shape, ...shape.holes].map((path) => path.getPoints(12).map((point) => [point.x, point.y])),
  );
  const cuts = apertures.map((polygon) => [
    polygon.map((point) => {
      const [x, z] = planPointToWorld(point, coordinates);
      return [x, -z] as [number, number];
    }),
  ]);
  return polygonClipping.difference(outlines, ...cuts).map((rings) => {
    const shape = new Shape();
    rings.forEach((ring, index) => {
      const path = index === 0 ? shape : new Path();
      ring.forEach(([x, y], index) => (index === 0 ? path.moveTo(x, y) : path.lineTo(x, y)));
      path.closePath();
      if (index > 0) shape.holes.push(path);
    });
    return shape;
  });
}
