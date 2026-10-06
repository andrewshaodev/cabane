import { WALK_EYE_HEIGHT } from "@cabane/engine";
import type { PortalTravel } from "./portal-transition";
import { Vector3 } from "three";
import {
  PORTAL_CENTER_HEIGHT,
  PORTAL_HEIGHT,
  PORTAL_WIDTH,
  otherPortal,
  type PortalAnchor,
  type PortalColor,
  type PortalPair,
} from "./portal-contract";

function localPlayer(portal: PortalAnchor, eye: Vector3) {
  const body = eye.clone();
  body.y -= WALK_EYE_HEIGHT - (portal.normal.y > 0.98 ? 0 : PORTAL_CENTER_HEIGHT);
  return body.sub(portal.center).applyQuaternion(portal.rotation.clone().invert());
}
function insideOpening(point: Vector3) {
  return (point.x / (PORTAL_WIDTH - 0.22)) ** 2 + (point.y / (PORTAL_HEIGHT - 0.22)) ** 2 < 1;
}

/** Detect entry before solid-wall collision stops the player. Never disable home collision. */
export function createPortalTraversal() {
  let previous: Vector3 | null = null;
  let blocked: PortalColor | null = null;
  return {
    reset(this: void) {
      previous = null;
      blocked = null;
    },
    step(
      pair: PortalPair,
      eye: Vector3,
      facing: { yaw: number; pitch: number },
      travel: (request: PortalTravel) => boolean,
    ) {
      const from = previous;
      previous = eye.clone();
      if (!pair.blue || !pair.gold || !from || from.distanceTo(eye) > 1) return false;
      if (blocked && pair[blocked] && localPlayer(pair[blocked]!, eye).length() > 1.4)
        blocked = null;
      for (const color of ["blue", "gold"] as const) {
        if (color === blocked) continue;
        const entry = pair[color]!,
          exit = pair[otherPortal(color)]!;
        const now = localPlayer(entry, eye),
          before = localPlayer(entry, from);
        const approaching = now.z < before.z - 0.0001;
        const entered =
          entry.normal.y > 0.98
            ? !insideOpening(before) || (before.z > 0.25 && approaching)
            : approaching && before.z > 0.32;
        if (!entered || now.z < -0.08 || now.z > 0.32 || !insideOpening(now)) continue;
        const exitYaw = Math.atan2(-exit.normal.x, -exit.normal.z);
        const entryYaw = Math.atan2(-entry.normal.x, -entry.normal.z);
        const yaw =
          exit.normal.y > 0.98
            ? facing.yaw
            : entry.normal.y > 0.98
              ? exitYaw
              : facing.yaw + exitYaw - entryYaw + Math.PI;
        if (
          !travel({
            landing: exit.landing,
            facing: { yaw: Math.atan2(Math.sin(yaw), Math.cos(yaw)), pitch: facing.pitch },
            entry: color,
            exit: otherPortal(color),
          })
        )
          return false;
        blocked = otherPortal(color);
        previous = null;
        return true;
      }
      return false;
    },
  };
}
