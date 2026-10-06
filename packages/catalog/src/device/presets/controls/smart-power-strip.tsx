import { RoundedBox } from "@cabane/engine";
import { Outlines, ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { palette, StatusBeacon } from "../../visuals/device-visual-state";

export function SmartPowerStripModel({ visualState }: HomeDeviceModelProps) {
  return (
    <group name="catalog-smart-power-strip" userData={{ walkCollider: true }}>
      <RoundedBox
        args={[0.34, 0.055, 0.065]}
        radius={0.014}
        smoothness={2}
        position={[0, 0.0275, 0]}
        castShadow
      >
        <ToonMaterial color={palette.body} />
        <Outlines color={palette.charcoal} thickness={0.003} />
      </RoundedBox>
      {[-0.115, -0.058, 0, 0.058, 0.115].map((x) => (
        <mesh key={x} position={[x, 0.052, 0]}>
          <cylinderGeometry args={[0.021, 0.021, 0.006, 16]} />
          <ToonMaterial color="#aeb4af" />
        </mesh>
      ))}
      <mesh position={[0.148, 0.052, 0]}>
        <cylinderGeometry args={[0.011, 0.011, 0.006, 16]} />
        <ToonMaterial color={visualState === "connected-active" ? palette.coral : palette.green} />
      </mesh>
      <StatusBeacon visualState={visualState} position={[0.148, 0.047, 0]} scale={0.12} />
    </group>
  );
}
