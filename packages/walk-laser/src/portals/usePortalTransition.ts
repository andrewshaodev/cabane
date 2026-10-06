import type { WalkToolNavigation } from "@cabane/engine";
import { useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type { PerspectiveCamera } from "three";
import { PORTAL_COLORS } from "./portal-contract";
import { createPortalTransition, type PortalTravel } from "./portal-transition";

/** Own only temporary presentation; the injected controller still validates and moves the walker. */
export function usePortalTransition(
  active: boolean,
  reducedMotion: boolean,
  navigation: WalkToolNavigation,
  onRejected: () => void,
) {
  const { camera } = useThree();
  const transition = useMemo(createPortalTransition, []);
  const veil = useRef<HTMLDivElement>(null);
  const iris = useRef<HTMLDivElement>(null);
  const baseFov = useRef<number | null>(null);
  const restoreCamera = useCallback(() => {
    if (baseFov.current === null) return;
    const lens = camera as PerspectiveCamera;
    lens.fov = baseFov.current;
    lens.updateProjectionMatrix();
    baseFov.current = null;
  }, [camera]);
  useEffect(
    () => () => {
      transition.cancel();
      restoreCamera();
    },
    [transition, restoreCamera],
  );
  const travel = useCallback(
    (request: PortalTravel) => transition.start(request, reducedMotion),
    [transition, reducedMotion],
  );
  useFrame((_, delta) => {
    if (!active) transition.cancel();
    const sample = transition.advance(delta, (request) => {
      const accepted = navigation.teleport(request.landing, request.facing);
      if (!accepted) onRejected();
      return accepted;
    });
    if (veil.current) {
      veil.current.style.opacity = String(sample.opacity);
      veil.current.style.visibility = sample.opacity > 0 ? "visible" : "hidden";
      veil.current.style.setProperty("--portal-color", PORTAL_COLORS[sample.color]);
    }
    if (iris.current) {
      iris.current.style.display = sample.reduced ? "none" : "block";
      iris.current.style.transform = `translate(-50%, -50%) scale(${sample.ringScale})`;
    }
    if (sample.fovOffset > 0 && (camera as PerspectiveCamera).isPerspectiveCamera) {
      const lens = camera as PerspectiveCamera;
      baseFov.current ??= lens.fov;
      lens.fov = baseFov.current + sample.fovOffset;
      lens.updateProjectionMatrix();
    } else restoreCamera();
  });
  return { transition, travel, veil, iris };
}
