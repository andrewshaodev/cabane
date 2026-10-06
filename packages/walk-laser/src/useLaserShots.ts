import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { Vector3, type Camera, type Group } from "three";
import type { ShotVisual } from "./LaserShot";

/** Shared shot effects for primary and secondary fire, including lifetime and recoil. */
export function useLaserShots(
  muzzle: RefObject<Group | null>,
  camera: Camera,
  reducedMotion: boolean,
) {
  const [shots, setShots] = useState<ShotVisual[]>([]);
  const [trigger, setTrigger] = useState<{ id: number; color?: string }>({ id: 0 });
  const sequence = useRef(0);
  const recoil = useRef(0);
  useEffect(() => {
    if (!shots.length) return;
    const timer = window.setTimeout(
      () =>
        setShots((previous) =>
          previous.filter((item) => performance.now() - (item.createdAt ?? 0) < 3400),
        ),
      250,
    );
    return () => window.clearTimeout(timer);
  }, [shots]);
  const emitShot = useCallback(
    (effect: Omit<ShotVisual, "id" | "start" | "createdAt">) => {
      const id = ++sequence.current;
      setTrigger({ id, ...(effect.color === undefined ? {} : { color: effect.color }) });
      if (reducedMotion) return;
      muzzle.current?.updateWorldMatrix(true, false);
      const start = muzzle.current?.getWorldPosition(new Vector3()) ?? camera.position.clone();
      const shot = { ...effect, start, id, createdAt: performance.now() };
      setShots((previous) => [...previous.slice(-11), shot]);
      recoil.current = 0.055;
    },
    [muzzle, camera, reducedMotion],
  );
  return { shots, triggerId: trigger.id, triggerColor: trigger.color, recoil, emitShot };
}
