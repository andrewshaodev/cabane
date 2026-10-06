import type { SpiralStairSpec, StairShapeGeometry } from "./types";
export const SPIRAL_CORE_RADIUS_METERS = 0.1;

export function spiralGeometry(
  stair: SpiralStairSpec,
  rise: number,
  steps: number,
): StairShapeGeometry {
  const radius = stair.diameterMeters / 2;
  const inner = SPIRAL_CORE_RADIUS_METERS;
  const walkingRadius = (radius + inner) / 2;
  const sign = stair.direction === "clockwise" ? 1 : -1;
  const turn = (stair.totalTurnDegrees * Math.PI) / 180;
  const point = (r: number, angle: number): [number, number] => [
    r * Math.cos(angle),
    r * Math.sin(angle),
  ];
  const samples = Math.max(2, Math.ceil(stair.totalTurnDegrees / 3));
  return {
    widthMeters: radius - inner,
    runMeters: walkingRadius * turn,
    path: Array.from({ length: samples + 1 }, (_, i) => ({
      x: walkingRadius * Math.cos((sign * turn * i) / samples),
      z: walkingRadius * Math.sin((sign * turn * i) / samples),
      elevation: (rise * i) / samples,
    })),
    footprint: Array.from({ length: 96 }, (_, i) => point(radius, (2 * Math.PI * i) / 96)),
    treads: Array.from({ length: steps }, (_, i) => {
      const a = (sign * turn * i) / steps,
        b = (sign * turn * (i + 1)) / steps;
      const divisions = Math.max(1, Math.ceil(Math.abs(b - a) / 0.1));
      return {
        elevation: (rise * (i + 1)) / steps,
        polygon: [
          ...Array.from({ length: divisions + 1 }, (_, j) =>
            point(radius, a + ((b - a) * j) / divisions),
          ),
          ...Array.from({ length: divisions + 1 }, (_, j) =>
            point(inner, b + ((a - b) * j) / divisions),
          ),
        ],
      };
    }),
  };
}
