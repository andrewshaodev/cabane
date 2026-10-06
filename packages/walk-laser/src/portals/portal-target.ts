import { Plane, Vector3, type Ray } from "three";
import { PORTAL_HEIGHT, PORTAL_WIDTH, type PortalPair } from "./portal-contract";

/** Hit the physical entrance oval, never the remote image; nearer scene geometry occludes it. */
export function targetPortal(ray: Ray, pair: PortalPair, obstructionDistance = 30) {
  let nearest = Math.min(30, obstructionDistance + .025);
  let result: { color: "blue" | "gold"; point: Vector3; normal: Vector3 } | null = null;
  for (const color of ["blue", "gold"] as const) {
    const anchor = pair[color];
    if (!anchor || ray.direction.dot(anchor.normal) >= -.001) continue;
    const point = ray.intersectPlane(new Plane().setFromNormalAndCoplanarPoint(anchor.normal, anchor.center), new Vector3());
    if (!point) continue;
    const distance = point.distanceTo(ray.origin);
    const local = point.clone().sub(anchor.center).applyQuaternion(anchor.rotation.clone().invert());
    if (distance > nearest || (local.x / PORTAL_WIDTH) ** 2 + (local.y / PORTAL_HEIGHT) ** 2 > 1) continue;
    nearest = distance;
    result = { color, point, normal: anchor.normal };
  }
  return result;
}
