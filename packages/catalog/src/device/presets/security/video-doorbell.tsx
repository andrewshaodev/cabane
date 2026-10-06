import { RoundedBox } from "@cabane/engine";
import { Outlines, ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { palette, StatusBeacon } from "../../visuals/device-visual-state";

export function VideoDoorbellModel({ visualState }: HomeDeviceModelProps) {
  const active = visualState === "connected-active";
  return (
    <group name="catalog-video-doorbell">
      <RoundedBox args={[0.05, 0.135, 0.03]} radius={0.01} smoothness={2} position={[0, 0.0675, 0.015]} castShadow>
        <ToonMaterial color="#4d5855" />
        <Outlines color="#252d2b" thickness={0.002} />
      </RoundedBox>
      <mesh position={[0, 0.098, 0.0315]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.014, 0.014, 0.007, 18]} />
        <ToonMaterial color="#182322" emissive="#3f7775" emissiveIntensity={active ? 0.35 : 0.05} />
        <Outlines color="#111716" thickness={0.0015} />
      </mesh>
      <mesh position={[0, 0.038, 0.0315]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.007, 18]} />
        <ToonMaterial color={active ? palette.coral : palette.bodyDark} />
      </mesh>
      <StatusBeacon visualState={visualState} position={[0.017, 0.118, 0.029]} scale={0.14} />
    </group>
  );
}
