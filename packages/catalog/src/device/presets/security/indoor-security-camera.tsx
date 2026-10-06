import { Outlines, ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { palette, StatusBeacon } from "../../visuals/device-visual-state";

export function IndoorSecurityCameraModel({ visualState }: HomeDeviceModelProps) {
  const active = visualState === "connected-active";
  return (
    <group name="catalog-indoor-security-camera" userData={{ walkCollider: true }}>
      <mesh position={[0, 0.0125, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.025, 20]} />
        <ToonMaterial color={palette.bodyDark} />
        <Outlines color={palette.charcoal} thickness={0.003} />
      </mesh>
      <mesh position={[0, 0.055, 0]}>
        <cylinderGeometry args={[0.018, 0.025, 0.06, 12]} />
        <ToonMaterial color="#88918d" />
      </mesh>
      <mesh position={[0, 0.11, 0]} castShadow>
        <sphereGeometry args={[0.05, 20, 12]} />
        <ToonMaterial color={palette.body} />
        <Outlines color={palette.charcoal} thickness={0.003} />
      </mesh>
      <mesh position={[0, 0.112, 0.047]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 0.006, 20]} />
        <ToonMaterial color="#182322" emissive="#477b78" emissiveIntensity={active ? 0.4 : 0.04} />
      </mesh>
      <StatusBeacon visualState={visualState} position={[0.026, 0.085, 0.043]} scale={0.18} />
    </group>
  );
}
