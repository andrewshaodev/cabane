import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, type ReactNode } from "react";
import type { Group } from "three";
import type { DoorOperation, WindowOperation } from "@cabane/engine";

export function AnimatedOpeningLeaf({
  operation,
  open,
  reducedMotion,
  direction,
  travel,
  children,
}: {
  operation: DoorOperation | WindowOperation;
  open: boolean;
  reducedMotion: boolean;
  direction: -1 | 1;
  travel: number;
  children: ReactNode;
}) {
  const animated = useRef<Group>(null);
  const { invalidate } = useThree();

  useEffect(() => {
    invalidate();
  }, [invalidate, open, operation, reducedMotion, direction, travel]);
  useFrame((_, delta) => {
    if (!animated.current) return;
    const targetRotation =
      open && (operation === "hinged" || operation === "casement")
        ? direction * (operation === "hinged" ? Math.PI * 0.48 : 0.34)
        : 0;
    const targetX = open && operation === "sliding" ? direction * travel : 0;
    const response = reducedMotion ? 1 : 1 - Math.exp(-9 * delta);
    animated.current.rotation.y += (targetRotation - animated.current.rotation.y) * response;
    animated.current.position.x += (targetX - animated.current.position.x) * response;
    if (
      Math.abs(animated.current.rotation.y - targetRotation) > 0.002 ||
      Math.abs(animated.current.position.x - targetX) > 0.002
    )
      invalidate();
  });

  return (
    <group ref={animated} name="opening-leaf-motion">
      {children}
    </group>
  );
}
