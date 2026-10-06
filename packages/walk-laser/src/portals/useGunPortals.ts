import { raycastWalkScene, type WalkToolNavigation } from "@cabane/engine";
import { useFrame, useThree } from "@react-three/fiber";
import { useCallback, useMemo, useState } from "react";
import { Raycaster, Vector2 } from "three";
import { PORTAL_COLORS, type PortalPair, type PortalPlaced } from "./portal-contract";
import { placePortal } from "./portal-placement";
import { createPortalPair } from "./portal-pair";
import { createPortalTraversal } from "./portal-traversal";
import { usePortalTransition } from "./usePortalTransition";
import { usePortalInput } from "./usePortalInput";

/** Session-local pair: successful placements alternate; stowing the gun destroys both. */
export function useGunPortals(active: boolean, navigation: WalkToolNavigation, onPlaced: PortalPlaced, reducedMotion: boolean) {
  const { camera, scene } = useThree();
  const [pair, setPair] = useState<PortalPair>({});
  const portals = useMemo(createPortalPair, []);
  const ray = useMemo(() => new Raycaster(), []);
  const traversal = useMemo(createPortalTraversal, []);
  const transit = usePortalTransition(active, reducedMotion, navigation, traversal.reset);
  const place = useCallback(() => {
    if (!active || transit.transition.busy) return;
    scene.updateMatrixWorld(true);
    ray.setFromCamera(new Vector2(), camera);
    ray.far = 30;
    const hit = raycastWalkScene(ray, scene).hit;
    const anchor = hit && placePortal(hit, scene, navigation);
    if (!anchor) return;
    const color = portals.nextColor;
    const updated = portals.place(anchor);
    if (!updated) return;
    traversal.reset();
    setPair(updated);
    onPlaced(anchor.center, anchor.normal, PORTAL_COLORS[color], portals.nextColor);
  }, [active, camera, scene, ray, navigation, traversal, portals, onPlaced, transit.transition]);
  usePortalInput(active, place);
  useFrame(() => {
    if (!active) { traversal.reset(); return; }
    if (transit.transition.busy) return;
    traversal.step(portals.current, camera.position, { yaw: camera.rotation.y, pitch: camera.rotation.x }, transit.travel);
  });
  return { pair, place, veil: transit.veil, iris: transit.iris };
}
