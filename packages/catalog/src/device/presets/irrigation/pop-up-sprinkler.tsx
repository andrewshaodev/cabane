import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Group, MathUtils } from "three";
import { ToonMaterial, Outlines } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { SprinklerSpray } from "./sprinkler-spray";

export function PopUpSprinklerModel({ visualState, reducedMotion }: HomeDeviceModelProps) {
  const active = visualState === "connected-active";
  const riser = useRef<Group>(null);
  const initialScale = useRef<[number, number, number]>([1, active ? 1 : 0.08, 1]);
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    invalidate();
  }, [active, reducedMotion, invalidate]);
  useFrame((_, delta) => {
    if (!riser.current) return;
    const target = active ? 1 : 0.08;
    riser.current.scale.y = reducedMotion
      ? target
      : MathUtils.damp(riser.current.scale.y, target, 9, Math.min(delta, 0.05));
    if (Math.abs(riser.current.scale.y - target) > 0.0001) invalidate();
  });
  return (
    <group name="catalog-pop-up-sprinkler">
      <mesh position={[0, 0.015, 0]}>
        <cylinderGeometry args={[0.07, 0.065, 0.03, 24]} />
        <ToonMaterial color="#34433e" />
        <Outlines color="#24312c" thickness={0.001} screenspace={false} />
      </mesh>
      <group
        ref={riser}
        name="sprinkler-riser"
        position={[0, 0.03, 0]}
        scale={initialScale.current}
      >
        <mesh position={[0, 0.065, 0]}>
          <cylinderGeometry args={[0.018, 0.022, 0.13, 16]} />
          <ToonMaterial color="#899b99" />
        </mesh>
        <mesh position={[0, 0.14, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.02, 20]} />
          <ToonMaterial color="#283c32" />
        </mesh>
        <mesh position={[0, 0.151, 0]}>
          <cylinderGeometry args={[0.016, 0.016, 0.002, 16]} />
          <ToonMaterial color={active ? "#73c398" : "#60876b"} />
        </mesh>
        {active && (
          <group position={[0, 0.1, 0]}>
            <SprinklerSpray reducedMotion={reducedMotion ?? false} />
          </group>
        )}
      </group>
    </group>
  );
}
