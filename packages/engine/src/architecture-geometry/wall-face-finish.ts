import type { WallSpec } from "../types";

/** One precedence rule for wall faces and the roof infill continuing them. */
export function wallFaceFinish(wall: WallSpec, side: "left" | "right", outside: boolean, fallback: string): string {
  return wall.faceColors?.[side] ?? (outside ? wall.exteriorColor : undefined) ?? fallback;
}
