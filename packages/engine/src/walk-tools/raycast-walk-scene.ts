import type { Object3D, Raycaster } from "three";
import type { ExtensionInteractionTarget } from "../types";

/** First visible surface wins, including non-device occluders. Tool visuals opt out. */
export function raycastWalkScene(raycaster: Raycaster, scene: Object3D) {
  const hit = raycaster.intersectObjects(scene.children, true).find((hit) => {
    for (let object: Object3D | null = hit.object; object; object = object.parent) {
      if (!object.visible || object.userData.walkToolVisual === true) return false;
    }
    return true;
  });
  let target: ExtensionInteractionTarget | null = null;
  for (let object: Object3D | null = hit?.object ?? null; object; object = object.parent) {
    if (object.userData.walkDeviceInteraction) {
      target = object.userData.walkDeviceInteraction as ExtensionInteractionTarget;
      break;
    }
  }
  return { hit: hit ?? null, target };
}
