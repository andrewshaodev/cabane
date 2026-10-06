import { RoundedBox } from "@cabane/engine";
import { Outlines, ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { palette, StatusBeacon } from "../../visuals/device-visual-state";

export function RefrigeratorModel({ visualState }: HomeDeviceModelProps) {
  return (
    <group name="catalog-refrigerator" userData={{ walkCollider: true }}>
      <RoundedBox
        args={[0.7, 1.85, 0.69]}
        radius={0.025}
        smoothness={2}
        position={[0, 0.925, -0.015]}
        castShadow
        receiveShadow
      >
        <ToonMaterial color="#dfe3df" />
        <Outlines color={palette.charcoal} thickness={0.006} />
      </RoundedBox>
      <mesh position={[0, 1.305, 0.345]} castShadow>
        <boxGeometry args={[0.67, 1.04, 0.03]} />
        <ToonMaterial color="#e9ece8" />
      </mesh>
      <mesh position={[0, 0.39, 0.345]} castShadow>
        <boxGeometry args={[0.67, 0.72, 0.03]} />
        <ToonMaterial color="#d8ddda" />
      </mesh>
      {[0.39, 1.305].map((y) => (
        <mesh key={y} position={[0.285, y, 0.351]}>
          <boxGeometry args={[0.025, y > 1 ? 0.58 : 0.36, 0.018]} />
          <ToonMaterial color="#717b77" />
        </mesh>
      ))}
      <mesh position={[0.18, 1.58, 0.351]}>
        <boxGeometry args={[0.16, 0.09, 0.018]} />
        <ToonMaterial color="#31413f" emissive="#5d9993" emissiveIntensity={0.15} />
      </mesh>
      <StatusBeacon visualState={visualState} position={[0.25, 1.58, 0.345]} scale={0.38} />
    </group>
  );
}
