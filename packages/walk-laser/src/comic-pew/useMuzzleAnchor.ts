import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type RefObject } from "react";
import { Vector3, type Group } from "three";

/** Project the actual moving muzzle into the existing fullscreen HUD, after gun posing. */
export function useMuzzleAnchor(muzzle: RefObject<Group | null>) {
  const anchor = useRef<HTMLDivElement>(null);
  const point = useMemo(() => new Vector3(), []);
  useFrame(({ camera, size }) => {
    if (!anchor.current || !muzzle.current) return;
    muzzle.current.updateWorldMatrix(true, false);
    muzzle.current.getWorldPosition(point).project(camera);
    const width = Math.min(250, Math.max(148, size.width * .23)) * .7;
    const x = Math.max(width / 2 + 12, Math.min(size.width - width / 2 - 12, (point.x + 1) * size.width / 2));
    const y = Math.max(width * .6 + 16, (1 - point.y) * size.height / 2 - 14);
    anchor.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    anchor.current.style.width = `${width}px`;
  }, 1);
  return anchor;
}
