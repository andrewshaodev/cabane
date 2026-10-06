import type { LShapedStairSpec, StairShapeGeometry, StairTread } from "./types";

/** Flight runs exclude the square, level landing. Coordinates are local metres. */
export function lShapedGeometry(
  stair: LShapedStairSpec,
  rise: number,
  steps: number,
): StairShapeGeometry {
  const { widthMeters: w, lowerRunMeters: a, upperRunMeters: b } = stair;
  const sign = stair.turn === "right" ? 1 : -1;
  const lowerSteps = Math.max(1, Math.min(steps - 1, Math.round((steps * a) / (a + b))));
  const upperSteps = steps - lowerSteps;
  const landingHeight = (rise * lowerSteps) / steps;
  const rectangle = (x1: number, z1: number, x2: number, z2: number): [number, number][] => [
    [x1 * sign, z1],
    [x2 * sign, z1],
    [x2 * sign, z2],
    [x1 * sign, z2],
  ];
  const treads: StairTread[] = [
    ...Array.from({ length: lowerSteps }, (_, i) => ({
      polygon: rectangle(-w / 2, (a * i) / lowerSteps, w / 2, (a * (i + 1)) / lowerSteps),
      elevation: (rise * (i + 1)) / steps,
    })),
    { polygon: rectangle(-w / 2, a, w / 2, a + w), elevation: landingHeight },
    ...Array.from({ length: upperSteps }, (_, i) => ({
      polygon: rectangle(
        w / 2 + (b * i) / upperSteps,
        a,
        w / 2 + (b * (i + 1)) / upperSteps,
        a + w,
      ),
      elevation: (rise * (lowerSteps + i + 1)) / steps,
    })),
  ];
  return {
    widthMeters: w,
    runMeters: a + b,
    path: [
      { x: 0, z: 0, elevation: 0 },
      { x: 0, z: a, elevation: landingHeight },
      { x: 0, z: a + w / 2, elevation: landingHeight },
      { x: (sign * w) / 2, z: a + w / 2, elevation: landingHeight },
      { x: sign * (w / 2 + b), z: a + w / 2, elevation: rise },
    ],
    footprint: [
      [-w / 2, 0],
      [w / 2, 0],
      [w / 2, a],
      [w / 2 + b, a],
      [w / 2 + b, a + w],
      [-w / 2, a + w],
    ].map(([x, z]) => [x * sign, z]),
    treads,
  };
}
