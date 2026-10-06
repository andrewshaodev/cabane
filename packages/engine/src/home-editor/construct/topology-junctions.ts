/*
 * Planar face traversal follows the conventional directed half-edge walk used
 * by OpenPlan3D and ai_room_planner (MIT). The implementation is original to
 * Cabane and keeps the data model independent from either application.
 */

import type {
  WallJunctionSpec
} from "../../types";
import { EditorWall, Node } from "./topology-contract";
import { pointKey, pointOnSegment, samePoint } from "./topology-plan-math";

export const deriveJunctions = (
  walls: readonly EditorWall[],
  nodes: readonly Node[],
  previous: readonly WallJunctionSpec[],
) => nodes.flatMap((node): WallJunctionSpec[] => {
  const wallIds = walls.filter((wall) => pointOnSegment(node.point, wall)).map((wall) => wall.id).sort();
  if (wallIds.length < 2) return [];
  const prior = previous.find((junction) => samePoint(junction.at, node.point) &&
    [...junction.wallIds].sort().join("|") === wallIds.join("|"));
  return [{
    id: prior?.id ?? `junction-${wallIds.join("-")}-${pointKey(node.point).replaceAll(",", "-").replaceAll(".", "_")}`,
    at: node.point,
    wallIds: wallIds as [string, string, ...string[]],
  }];
});
