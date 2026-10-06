import type { PlanPoint } from "../types";
import type { OutdoorPlatformBarrier } from "./platform-barriers";

export const PLATFORM_LOW_WALL_THICKNESS = 0.15;
const samePoint = (a: PlanPoint, b: PlanPoint) => Math.hypot(a[0] - b[0], a[1] - b[1]) < 1e-6;
const direction = ({ from, to }: OutdoorPlatformBarrier): PlanPoint => {
  const length = Math.hypot(to[0] - from[0], to[1] - from[1]);
  return [(to[0] - from[0]) / length, (to[1] - from[1]) / length];
};

/** Offset both adjoining centerlines to the same miter. Clipped facade ends stay square. */
export function derivePlatformLowWallFootprints(
  barriers: readonly OutdoorPlatformBarrier[],
): PlanPoint[][] {
  return barriers.map((barrier) => {
    const unit = direction(barrier);
    const neighborAt = (point: PlanPoint, start: boolean) =>
      barriers.find(
        (other) =>
          other !== barrier &&
          other.platformId === barrier.platformId &&
          other.configuration.kind === "low-wall" &&
          samePoint(start ? other.to : other.from, point),
      );
    const corner = (
      point: PlanPoint,
      neighbor: OutdoorPlatformBarrier | undefined,
      side: number,
    ): PlanPoint => {
      const half = PLATFORM_LOW_WALL_THICKNESS / 2;
      let offset: PlanPoint = [-unit[1] * half, unit[0] * half];
      if (neighbor) {
        const adjacent = direction(neighbor);
        const denominator = 1 + unit[0] * adjacent[0] + unit[1] * adjacent[1];
        // Degenerate reversals cannot form a finite miter; keep their end caps.
        if (denominator > 1e-6) {
          offset = [
            (-(unit[1] + adjacent[1]) * half) / denominator,
            ((unit[0] + adjacent[0]) * half) / denominator,
          ];
        }
      }
      return [point[0] + side * offset[0], point[1] + side * offset[1]];
    };
    const previous = neighborAt(barrier.from, true);
    const next = neighborAt(barrier.to, false);
    return [
      corner(barrier.from, previous, 1),
      corner(barrier.to, next, 1),
      corner(barrier.to, next, -1),
      corner(barrier.from, previous, -1),
    ];
  });
}
