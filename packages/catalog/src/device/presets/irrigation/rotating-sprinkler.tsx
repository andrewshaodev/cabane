import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group } from "three";
import { ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { SprinklerSpray } from "./sprinkler-spray";

export function RotatingSprinklerModel({ visualState, reducedMotion }: HomeDeviceModelProps) {
  const head = useRef<Group>(null);
  const active = visualState === "connected-active";
  useFrame(({ invalidate }, delta) => {
    if (!active || reducedMotion || !head.current) return;
    head.current.rotation.y += Math.min(delta, 0.05) * 1.5;
    invalidate();
  });
  return (
    <group name="catalog-rotating-sprinkler">
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.14, 0.14, 0.04, 24]} />
        <ToonMaterial color="#466b51" />
      </mesh>
      <mesh position={[0, 0.075, 0]}>
        <cylinderGeometry args={[0.022, 0.03, 0.11, 16]} />
        <ToonMaterial color="#687d77" />
      </mesh>
      <group ref={head} name="sprinkler-rotor" position={[0, 0.14, 0]}>
        {[0, 1, 2].map((i) => (
          <group key={i} rotation={[0, (i * Math.PI * 2) / 3, 0]}>
            <mesh position={[0.052, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.012, 0.012, 0.12, 12]} />
              <ToonMaterial color="#a4b4ae" />
            </mesh>
            <mesh position={[0.105, 0.012, 0]}>
              <cylinderGeometry args={[0.015, 0.012, 0.024, 12]} />
              <ToonMaterial color="#334f3d" />
            </mesh>
          </group>
        ))}
        {active && <SprinklerSpray reducedMotion={reducedMotion ?? false} />}
      </group>
    </group>
  );
}
