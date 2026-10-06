import type { FloorSpec, WallNicheSpec, WallSpec } from "../types";
import { wallFrame } from "./wall-coordinate-frame";

/** Partial-depth aperture: its back never crosses the opposite wall face. */
export function wallNicheCutPolygon(wall: WallSpec, niche: WallNicheSpec, floor: FloorSpec) {
  const frame = wallFrame(wall, floor);
  const scale = floor.coordinates.metersPerPlanUnit;
  const start = niche.offsetFromWallStartPlanUnits * scale;
  const end = start + niche.widthPlanUnits * scale;
  const sign = niche.side === "left" ? 1 : -1;
  const face = sign * (wall.thicknessMeters / 2 + 0.001);
  const back = sign * (wall.thicknessMeters / 2 - niche.depthMeters);
  return [
    [
      [start, back],
      [end, back],
      [end, face],
      [start, face],
      [start, back],
    ].map(
      ([distance, across]) =>
        [
          frame.from[0] + frame.direction[0] * distance + frame.normal[0] * across,
          frame.from[1] + frame.direction[1] * distance + frame.normal[1] * across,
        ] as [number, number],
    ),
  ];
}
