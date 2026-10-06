import type { resolveOpeningOrientation } from "@cabane/engine";
import { OpeningFrameBox } from "../opening-frame-box";

const RAIL_DEPTH_METERS = 0.055;
const WALL_GAP_METERS = 0.004;
const RAIL_END_OVERHANG_METERS = 0.04;

export function plankDoorRailSpan({
  openingWidth,
  leafWidth,
  orientation,
}: {
  openingWidth: number;
  leafWidth: number;
  orientation: ReturnType<typeof resolveOpeningOrientation>;
}) {
  let startX = Number.POSITIVE_INFINITY;
  let endX = Number.NEGATIVE_INFINITY;

  for (const leaf of orientation.leaves) {
    const closedStart = leaf.startRatio * openingWidth;
    const closedEnd = closedStart + leafWidth;
    const direction = leaf.slideSign;
    const openStart = closedStart + direction * leafWidth;
    const openEnd = closedEnd + direction * leafWidth;
    startX = Math.min(startX, closedStart, openStart);
    endX = Math.max(endX, closedEnd, openEnd);
  }

  return {
    startX: startX - RAIL_END_OVERHANG_METERS,
    endX: endX + RAIL_END_OVERHANG_METERS,
  };
}

export function PlankDoorRail({
  width,
  height,
  wallThickness,
  leafWidth,
  orientation,
}: {
  width: number;
  height: number;
  wallThickness: number;
  leafWidth: number;
  orientation: ReturnType<typeof resolveOpeningOrientation>;
}) {
  const { startX, endX } = plankDoorRailSpan({
    openingWidth: width,
    leafWidth,
    orientation,
  });
  const railWidth = endX - startX;
  const railCenterX = (startX + endX) / 2;
  const wallSurfaceZ = wallThickness / 2;
  const railCenterZ = wallSurfaceZ + WALL_GAP_METERS + RAIL_DEPTH_METERS / 2;

  return (
    <group name="opening-plank-rail" position={[0, 0, railCenterZ * orientation.sideSign]}>
      <group name="opening-plank-rail-bar" position={[railCenterX, 0, 0]}>
        <OpeningFrameBox
          size={[railWidth, 0.065, RAIL_DEPTH_METERS]}
          position={[0, height + 0.13, 0]}
          color="#242525"
        />
      </group>
      {([startX, endX] as const).map((x) => (
        <OpeningFrameBox
          key={x}
          size={[0.075, 0.13, RAIL_DEPTH_METERS]}
          position={[x, height + 0.13, 0]}
          color="#242525"
        />
      ))}
    </group>
  );
}
