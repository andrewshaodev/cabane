import type { WallSpec } from "../types";

/** One precedence rule for wall faces and the roof infill continuing them. */
export function wallFaceFinish(
  wall: WallSpec,
  side: "left" | "right",
  outside: boolean,
  fallback: string,
): string {
  return wall.faceColors?.[side] ?? (outside ? wall.exteriorColor : undefined) ?? fallback;
}

/** Auto caps follow matching authored faces, then exterior paint, then the general finish. */
export function wallEdgeFinish(wall: WallSpec, fallback: string): string {
  return (
    wall.edgeColor ??
    (wall.faceColors?.left && wall.faceColors.left === wall.faceColors.right
      ? wall.faceColors.left
      : ((wall.classification === "exterior" ? wall.exteriorColor : undefined) ?? fallback))
  );
}
