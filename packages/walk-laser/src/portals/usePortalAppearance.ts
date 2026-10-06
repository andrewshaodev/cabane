import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useRef } from "react";
import type { Group, Mesh, MeshToonMaterial } from "three";
import type { PortalAnchor } from "./portal-contract";

/** Bloom from the impact, briefly overshoot, then settle while an energy ring dissipates. */
export function usePortalAppearance(anchor: PortalAnchor, reducedMotion: boolean) {
  const opening = useRef<Group>(null);
  const ripple = useRef<Mesh>(null);
  const age = useRef(0);
  useLayoutEffect(() => {
    age.current = 0;
    opening.current?.scale.setScalar(reducedMotion ? 1 : 0);
    if (ripple.current) ripple.current.visible = false;
  }, [anchor, reducedMotion]);
  useFrame((_, delta) => {
    age.current += delta;
    const progress = Math.min(1, age.current / .55);
    const remaining = progress - 1;
    const bloom = 1 + 2.4 * remaining ** 3 + 1.4 * remaining ** 2;
    opening.current?.scale.setScalar(reducedMotion ? 1 : Math.max(0, bloom));
    if (ripple.current) {
      ripple.current.visible = !reducedMotion && age.current < .8;
      ripple.current.scale.setScalar(.7 + Math.min(1, age.current / .8) * .75);
      (ripple.current.material as MeshToonMaterial).opacity = .7 * Math.max(0, 1 - age.current / .8) ** 2;
    }
  });
  return { opening, ripple };
}
