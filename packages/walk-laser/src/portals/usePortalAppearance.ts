import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useRef } from "react";
import type { Group, Mesh, MeshToonMaterial } from "three";
import type { PortalAnchor } from "./portal-contract";

/** Bloom from the impact, briefly overshoot, then settle while an energy ring dissipates. */
export function usePortalAppearance(anchor: PortalAnchor, reducedMotion: boolean, closing = false, onClosed?: () => void) {
  const opening = useRef<Group>(null);
  const ripple = useRef<Mesh>(null);
  const age = useRef(0);
  const finished = useRef(false);
  useLayoutEffect(() => {
    age.current = 0;
    finished.current = false;
    opening.current?.scale.setScalar(closing || reducedMotion ? 1 : 0);
    if (ripple.current) ripple.current.visible = false;
  }, [anchor, reducedMotion, closing]);
  useFrame((_, delta) => {
    age.current += delta;
    if (closing) {
      const duration = reducedMotion ? .12 : .4;
      const progress = Math.min(1, age.current / duration);
      // A small energy swell folds inward, reversing the opening bloom.
      const scale = reducedMotion ? 1 : (1 - progress ** 3) * (1 + .12 * Math.sin(progress * Math.PI));
      opening.current?.scale.setScalar(Math.max(0, scale));
      if (ripple.current) {
        ripple.current.visible = !reducedMotion && progress < 1;
        ripple.current.scale.setScalar(1.3 - progress * .5);
        (ripple.current.material as MeshToonMaterial).opacity = .65 * (1 - progress);
      }
      if (progress === 1 && !finished.current) { finished.current = true; onClosed?.(); }
      return;
    }
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
