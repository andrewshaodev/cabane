import { planPointToWorld } from "../geometry";
import type { FloorSpec } from "../types";
import type { ItemPlacement } from "./types";

export interface ResolvedItemTransform {
  position: readonly [number, number, number];
  rotationYRadians: number;
}

export const resolveItemTransform = (
  placement: ItemPlacement,
  floor: Pick<FloorSpec, "coordinates" | "walls" | "ceilings" | "defaultCeilingHeightMeters">,
): ResolvedItemTransform => {
  if (placement.kind === "absolute") {
    const [x, z] = planPointToWorld(placement.at, floor.coordinates);
    return {
      position: [x, placement.elevationMeters, z],
      rotationYRadians: placement.rotationYRadians,
    };
  }

  if (placement.kind === "ceiling") {
    const ceiling = floor.ceilings?.find(
      (candidate) => candidate.kind === "flat" && candidate.roomIds.includes(placement.roomId),
    );
    const height =
      ceiling?.kind === "flat" ? ceiling.heightMeters : floor.defaultCeilingHeightMeters;
    const [x, z] = planPointToWorld(placement.at, floor.coordinates);
    return {
      position: [x, height - placement.dropMeters, z],
      rotationYRadians: placement.rotationYRadians,
    };
  }

  const wall = floor.walls.find((candidate) => candidate.id === placement.wallId);
  if (!wall) {
    throw new Error(`Wall ${placement.wallId} does not exist.`);
  }

  const dx = wall.to[0] - wall.from[0];
  const dz = wall.to[1] - wall.from[1];
  const planLength = Math.hypot(dx, dz);
  if (planLength === 0) {
    throw new Error(`Wall ${placement.wallId} has no length.`);
  }

  const ux = dx / planLength;
  const uz = dz / planLength;
  const rightNormalX = -uz;
  const rightNormalZ = ux;
  const side = placement.face === "left" ? -1 : 1;
  const normalX = rightNormalX * side;
  const normalZ = rightNormalZ * side;
  const normalMeters =
    Math.round((wall.thicknessMeters / 2 + placement.depthOffsetMeters) * 1e12) / 1e12;
  const normalPlan = normalMeters / floor.coordinates.metersPerPlanUnit;
  const at = [
    wall.from[0] + ux * placement.offsetFromWallStartPlanUnits + normalX * normalPlan,
    wall.from[1] + uz * placement.offsetFromWallStartPlanUnits + normalZ * normalPlan,
  ] as const;
  const [x, z] = planPointToWorld(at, floor.coordinates);

  return {
    position: [x, placement.elevationMeters, z],
    rotationYRadians:
      Math.atan2(rightNormalX, rightNormalZ) +
      (placement.face === "left" ? Math.PI : 0) +
      placement.rotationOffsetRadians,
  };
};
