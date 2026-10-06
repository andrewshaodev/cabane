import type { WalkToolLanding } from "@cabane/engine";
import type { Quaternion, Vector3 } from "three";

export type PortalColor = "blue" | "gold";
export interface PortalAnchor {
  center: Vector3;
  normal: Vector3;
  rotation: Quaternion;
  landing: WalkToolLanding;
}
export type PortalPair = Partial<Record<PortalColor, PortalAnchor>>;
export const PORTAL_WIDTH = 0.58;
export const PORTAL_HEIGHT = 1.1;
export const PORTAL_CENTER_HEIGHT = 1.18;
export const PORTAL_EXIT_DISTANCE = 0.72;
export const otherPortal = (color: PortalColor): PortalColor =>
  color === "blue" ? "gold" : "blue";

export const PORTAL_COLORS = { blue: "#42cfff", gold: "#efa632" } as const;
export type PortalPlaced = (
  point: Vector3,
  normal: Vector3,
  color: string,
  nextColor: PortalColor,
) => void;
