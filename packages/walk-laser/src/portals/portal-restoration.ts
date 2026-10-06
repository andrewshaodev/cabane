import { createPortalSupportQuery } from "./portal-support-query";
import { type WalkToolNavigation } from "@cabane/engine";
import { Raycaster, type Object3D } from "three";
import type { PortalPair } from "./portal-contract";
import { placePortal } from "./portal-placement";

/** Home edits may remove a support or obstruct an exit while the tool is stowed. */
export function validateRestoredPortals(
  pair: PortalPair,
  scene: Object3D,
  navigation: WalkToolNavigation,
): PortalPair {
  const result: PortalPair = {};
  const probe = new Raycaster();
  scene.updateMatrixWorld(true);
  const query = createPortalSupportQuery(scene);
  for (const color of ["blue", "gold"] as const) {
    const anchor = pair[color];
    if (!anchor) continue;
    probe.set(
      anchor.center.clone().addScaledVector(anchor.normal, 0.1),
      anchor.normal.clone().negate(),
    );
    probe.far = 0.2;
    const hit = query(probe).hit;
    const valid = hit && placePortal(hit, scene, navigation, query);
    if (
      valid &&
      valid.center.distanceTo(anchor.center) < 0.025 &&
      valid.normal.dot(anchor.normal) > 0.999 &&
      valid.landing.floorId === anchor.landing.floorId &&
      Math.abs(valid.landing.elevation - anchor.landing.elevation) < 0.025 &&
      Math.hypot(valid.landing.x - anchor.landing.x, valid.landing.z - anchor.landing.z) < 0.025
    )
      result[color] = anchor;
  }
  return result;
}
