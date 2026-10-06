import { validateRestoredPortals } from "./portal-restoration";
import { raycastWalkScene, type WalkToolNavigation } from "@cabane/engine";
import { useFrame, useThree } from "@react-three/fiber";
import { useCallback, useMemo, useRef, useState } from "react";
import { Raycaster, Vector2, type Ray } from "three";
import { PORTAL_COLORS, type PortalPair, type PortalPlaced, type PortalColor } from "./portal-contract";
import { placePortal } from "./portal-placement";
import { createPortalPair } from "./portal-pair";
import { createPortalTraversal } from "./portal-traversal";
import { usePortalTransition } from "./usePortalTransition";
import { usePortalInput } from "./usePortalInput";
import { usePortalState } from "./usePortalState";
import { targetPortal } from "./portal-target";

/** The package owns persisted anchors, hit semantics and the transient closing visual. */
export function useGunPortals(active: boolean, navigation: WalkToolNavigation, onPlaced: PortalPlaced, reducedMotion: boolean) {
  const { camera, scene } = useThree();
  const { state, current, pending, commit } = usePortalState();
  const [closing, setClosing] = useState<PortalPair>({});
  const restored = useRef(false);
  const ray = useMemo(() => new Raycaster(), []);
  const traversal = useMemo(createPortalTraversal, []);
  const transit = usePortalTransition(active, reducedMotion, navigation, traversal.reset);
  const remove = useCallback((aim: Ray, obstructionDistance: number) => {
    const hit = targetPortal(aim, { ...closing, ...current.current.pair }, obstructionDistance);
    if (!hit) return null;
    if (!active || closing[hit.color] || pending.current || transit.transition.busy) return hit;
    const { pair, next } = current.current;
    const updated = { ...pair };
    delete updated[hit.color];
    traversal.reset();
    setClosing(previous => ({ ...previous, [hit.color]: pair[hit.color] }));
    void commit({ pair: updated, next }).then(saved => {
      if (!saved) setClosing(previous => { const remaining = { ...previous }; delete remaining[hit.color]; return remaining; });
    });
    return hit;
  }, [active, current, pending, commit, traversal, transit.transition, closing]);
  const closed = useCallback((color: PortalColor) => {
    setClosing(previous => { const remaining = { ...previous }; delete remaining[color]; return remaining; });
  }, []);
  const place = useCallback(() => {
    if (!active || pending.current || transit.transition.busy) return;
    scene.updateMatrixWorld(true);
    ray.setFromCamera(new Vector2(), camera);
    ray.far = 30;
    const hit = raycastWalkScene(ray, scene).hit;
    const removed = remove(ray.ray, hit?.distance ?? 30);
    if (removed) {
      onPlaced(removed.point, removed.normal, PORTAL_COLORS[removed.color], current.current.next);
      return;
    }
    if (Object.keys(closing).length) return;
    const anchor = hit && placePortal(hit, scene, navigation);
    if (!anchor) return;
    const portals = createPortalPair(current.current.pair, current.current.next);
    const color = portals.nextColor;
    const updated = portals.place(anchor);
    if (!updated) return;
    traversal.reset();
    void commit({ pair: updated, next: portals.nextColor });
    onPlaced(anchor.center, anchor.normal, PORTAL_COLORS[color], portals.nextColor);
  }, [active, camera, scene, ray, navigation, traversal, onPlaced, transit.transition, current, pending, commit, remove, closing]);
  usePortalInput(active, place);
  useFrame(() => {
    if (!active) { traversal.reset(); return; }
    if (!restored.current) {
      restored.current = true;
      const pair = validateRestoredPortals(current.current.pair, scene, navigation);
      if (Object.keys(pair).length !== Object.keys(current.current.pair).length) {
        void commit({ ...current.current, pair });
        return;
      }
    }
    if (transit.transition.busy || pending.current) return;
    traversal.step(current.current.pair, camera.position, { yaw: camera.rotation.y, pitch: camera.rotation.x }, transit.travel);
  });
  return { pair: state.pair, next: state.next, closing, closed, remove, place, veil: transit.veil, iris: transit.iris };
}
