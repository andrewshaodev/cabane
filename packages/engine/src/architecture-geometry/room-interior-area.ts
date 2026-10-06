import { type Polygon as ClippingPolygon } from "polygon-clipping";

import { planPointToWorld, polygonSignedArea } from "../geometry";

import type { FloorSpec, RoomSpec } from "../types";
import { differenceClippingGeometry, unionClippingPolygons } from "./architecture-clipping";
import { junctionExteriorMiterPolygon, orientedWallPolygon } from "./wall-solid-footprints";

/** Interior floor area in m², excluding wall footprints and doorway recesses. */
export const roomInteriorAreaSquareMeters = (
  room: Pick<RoomSpec, "polygon">,
  floor: FloorSpec,
): number => {
  const contour: ClippingPolygon = [
    room.polygon.map(
      (point) => [...planPointToWorld(point, floor.coordinates)] as [number, number],
    ),
  ];
  // Subtract occupied space rather than insetting the room again: imported
  // room polygons may already follow the inside faces of the walls.
  const walls = [
    ...floor.walls.map((wall) => orientedWallPolygon(wall, floor)),
    ...floor.wallJunctions.flatMap((junction) => {
      const miter = junctionExteriorMiterPolygon(junction, floor.walls, floor);
      return miter ? [miter] : [];
    }),
  ];
  const interior = differenceClippingGeometry(contour, unionClippingPolygons(walls));
  return interior.reduce(
    (total, [exterior, ...holes]) =>
      total +
      Math.abs(polygonSignedArea(exterior)) -
      holes.reduce((area, hole) => area + Math.abs(polygonSignedArea(hole)), 0),
    0,
  );
};
