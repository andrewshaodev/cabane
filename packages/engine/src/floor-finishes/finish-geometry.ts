import { cutSurfaceShapes } from "../stairs/surface-apertures";
import { cutPoolOpenings } from "../pools/pool-shapes";
import polygonClipping from "polygon-clipping";
import { BufferAttribute, ShapeGeometry } from "three";
import {
  planPointToWorld,
  pointInsidePolygon,
  polygonSelfIntersects,
  polygonSignedArea,
} from "../geometry";
import type { FloorCoordinates, FloorSpec, PlanPoint, Polygon } from "../types";

const EPSILON = 1e-8;

const pointOnPolygonBoundary = (point: PlanPoint, polygon: readonly PlanPoint[]) =>
  polygon.some((from, index) => {
    const to = polygon[(index + 1) % polygon.length];
    const dx = to[0] - from[0];
    const dy = to[1] - from[1];
    const squared = dx * dx + dy * dy;
    if (squared <= EPSILON) {
      return Math.hypot(point[0] - from[0], point[1] - from[1]) <= EPSILON;
    }
    const progress = Math.max(
      0,
      Math.min(1, ((point[0] - from[0]) * dx + (point[1] - from[1]) * dy) / squared),
    );
    return (
      Math.hypot(point[0] - (from[0] + progress * dx), point[1] - (from[1] + progress * dy)) <=
      EPSILON
    );
  });

export const floorZonePointWithinRoom = (point: PlanPoint, polygon: readonly PlanPoint[]) =>
  pointInsidePolygon(point, polygon) || pointOnPolygonBoundary(point, polygon);

const closedRing = (polygon: readonly PlanPoint[]) => [
  ...polygon.map((point) => [point[0], point[1]] as [number, number]),
  [polygon[0][0], polygon[0][1]] as [number, number],
];

const ringArea = (ring: readonly (readonly [number, number])[]) =>
  Math.abs(polygonSignedArea(ring.slice(0, -1)));

export const isFloorZoneOutline = (value: unknown): value is Polygon => {
  if (
    !Array.isArray(value) ||
    value.length < 3 ||
    !value.every(
      (point) => Array.isArray(point) && point.length === 2 && point.every(Number.isFinite),
    )
  )
    return false;
  const points = value as unknown as readonly PlanPoint[];
  return Math.abs(polygonSignedArea(points)) > EPSILON && !polygonSelfIntersects(points);
};

export const floorZoneWithinRoom = (zone: Polygon, room: Polygon) => {
  if (!isFloorZoneOutline(zone) || !isFloorZoneOutline(room)) return false;
  if (!zone.every((point) => floorZonePointWithinRoom(point, room))) {
    return false;
  }
  try {
    const outside = polygonClipping.difference([closedRing(zone)], [closedRing(room)]);
    return outside.every(
      (polygon) => polygon.reduce((area, ring) => area + ringArea(ring), 0) <= EPSILON,
    );
  } catch {
    return false;
  }
};

const footprintRegions = (floor: Pick<FloorSpec, "footprint" | "footprintRegions">) =>
  floor.footprintRegions ?? [floor.footprint];

export const pointStrictlyOutsideFloorFootprint = (
  point: PlanPoint,
  floor: Pick<FloorSpec, "footprint" | "footprintRegions">,
) => footprintRegions(floor).every((region) => !floorZonePointWithinRoom(point, region));

export const groundZonePointOutsideFootprint = (
  point: PlanPoint,
  floor: Pick<FloorSpec, "footprint" | "footprintRegions">,
) =>
  footprintRegions(floor).every(
    (region) => pointOnPolygonBoundary(point, region) || !pointInsidePolygon(point, region),
  );

/** Allows contact with an exterior wall, but never positive-area overlap. */
export const groundZoneOutsideFootprint = (
  zone: Polygon,
  floor: Pick<FloorSpec, "footprint" | "footprintRegions">,
) => {
  if (!isFloorZoneOutline(zone)) return false;
  try {
    return footprintRegions(floor).every((region) => {
      if (!isFloorZoneOutline(region)) return false;
      const overlap = polygonClipping.intersection([closedRing(zone)], [closedRing(region)]);
      return overlap.every(
        (polygon) => polygon.reduce((area, ring) => area + ringArea(ring), 0) <= EPSILON,
      );
    });
  } catch {
    return false;
  }
};

export const createFloorFinishGeometry = (
  polygon: Polygon,
  coordinates: FloorCoordinates,
  repeatMeters: number,
  apertures: readonly Polygon[] = [],
  poolFloor?: FloorSpec,
) => {
  const surfaceShapes = cutSurfaceShapes(polygon, coordinates, apertures);
  const shapes = poolFloor
    ? surfaceShapes.flatMap((shape) => cutPoolOpenings(shape, poolFloor))
    : surfaceShapes;
  const geometry = new ShapeGeometry(shapes);
  const position = geometry.getAttribute("position");
  const uv = new Float32Array(position.count * 2);
  for (let index = 0; index < position.count; index += 1) {
    uv[index * 2] = position.getX(index) / repeatMeters;
    uv[index * 2 + 1] = -position.getY(index) / repeatMeters;
  }
  geometry.setAttribute("uv", new BufferAttribute(uv, 2));
  return geometry;
};
