import { lazy } from "react";
import type { WalkToolDefinition } from "@cabane/engine";
import { LaserIcon } from "./LaserIcon";

export const laserWalkTool: WalkToolDefinition = {
  id: "cabane.laser",
  label: "Laser",
  defaultShortcut: true,
  shortcutKey: "G",
  Icon: LaserIcon,
  Scene: lazy(() => import("./LaserWalkTool").then(module => ({ default: module.LaserWalkTool }))),
};
