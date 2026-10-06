import { RoundedBox } from "@cabane/engine";
import { Outlines, ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { palette, StatusBeacon } from "../../visuals/device-visual-state";

export function SmartLockModel({ visualState }: HomeDeviceModelProps) {
  const active = visualState === "connected-active";
  return (
    <group name="catalog-smart-lock">
      <RoundedBox
        args={[0.07, 0.18, 0.035]}
        radius={0.012}
        smoothness={2}
        position={[0, 0.09, 0.0175]}
        castShadow
      >
        <ToonMaterial color={palette.body} />
        <Outlines color={palette.charcoal} thickness={0.0025} />
      </RoundedBox>
      <mesh position={[0, 0.142, 0.0375]}>
        <boxGeometry args={[0.034, 0.022, 0.005]} />
        <ToonMaterial
          color={active ? palette.green : "#42504c"}
          emissive={palette.green}
          emissiveIntensity={active ? 0.3 : 0.04}
        />
      </mesh>
      <mesh name="smart-lock-thumbturn" position={[0, 0.065, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.016, 18]} />
        <ToonMaterial color="#69736f" />
      </mesh>
      <mesh position={[0, 0.065, 0.059]} rotation={[0, 0, active ? Math.PI / 2 : 0]}>
        <boxGeometry args={[0.012, 0.044, 0.002]} />
        <ToonMaterial color="#394541" />
      </mesh>
      <StatusBeacon visualState={visualState} position={[0.021, 0.16, 0.037]} scale={0.12} />
    </group>
  );
}
