import { raycastWalkScene, type WalkToolNavigation } from "@cabane/engine";
import { Matrix3, Quaternion, Raycaster, Vector3, type Intersection, type Object3D } from "three";
import { PORTAL_CENTER_HEIGHT, PORTAL_EXIT_DISTANCE, PORTAL_HEIGHT, PORTAL_WIDTH, type PortalAnchor } from "./portal-contract";

const surfaceNormal = (hit: Intersection) => hit.face?.normal.clone()
  .applyMatrix3(new Matrix3().getNormalMatrix(hit.object.matrixWorld)).normalize();

/** Fit the whole oval on a flat surface and reserve a supported exit before accepting it. */
export function placePortal(hit: Intersection, scene: Object3D, navigation: WalkToolNavigation,
  surfaceQuery: (ray: Raycaster, scene: Object3D) => { hit: Intersection | null } = raycastWalkScene): PortalAnchor | null {
  const normal = surfaceNormal(hit);
  if (!normal || (Math.abs(normal.y) > .05 && normal.y < .98)) return null;
  for (let object: Object3D | null = hit.object; object; object = object.parent) {
    if (object.userData.walkDeviceInteraction || object.userData.walkCollider) return null;
  }
  const horizontal = normal.y > .98;
  normal.set(normal.x, horizontal ? 1 : 0, normal.z).normalize();
  const exit = hit.point.clone().addScaledVector(normal, horizontal ? 0 : PORTAL_EXIT_DISTANCE);
  if (!horizontal) exit.y -= PORTAL_CENTER_HEIGHT;
  const landing = navigation.resolveLanding(exit);
  if (!landing || (horizontal && Math.abs(landing.elevation - hit.point.y) > .12)) return null;
  const center = hit.point.clone();
  if (!horizontal) center.y = landing.elevation + PORTAL_CENTER_HEIGHT;
  const rotation = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), normal);
  const probe = new Raycaster();
  // Include center and perimeter so corners, doors, tiny objects and curved surfaces fail cleanly.
  for (let i = -1; i < 24; i++) {
    const angle = i * Math.PI / 12;
    const offset = i < 0 ? new Vector3() : new Vector3(Math.cos(angle) * (PORTAL_WIDTH + .04), Math.sin(angle) * (PORTAL_HEIGHT + .04), 0);
    const sample = offset.applyQuaternion(rotation).add(center);
    probe.set(sample.clone().addScaledVector(normal, .08), normal.clone().negate());
    probe.far = .16;
    const surface = surfaceQuery(probe, scene).hit;
    if (!surface || Math.abs(surface.point.clone().sub(sample).dot(normal)) > .025
      || (surfaceNormal(surface)?.dot(normal) ?? 0) < .98) return null;
  }
  return { center: center.addScaledVector(normal, .018), normal, rotation, landing };
}

export function portalsOverlap(a: PortalAnchor, b: PortalAnchor) {
  // Conservative separation prevents intersecting triggers on walls meeting at corners.
  return a.center.distanceTo(b.center) < PORTAL_WIDTH * 2 + .18;
}
