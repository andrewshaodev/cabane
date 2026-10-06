import { Outlines, ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { palette, StatusBeacon } from "../../visuals/device-visual-state";

export function AirPurifierModel({ visualState }: HomeDeviceModelProps) {
  const active = visualState === "connected-active";
  return (
    <group name="catalog-air-purifier" userData={{ walkCollider: true }}>
      <mesh position={[0, 0.235, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.135, 0.135, 0.47, 24]} />
        <ToonMaterial color={palette.body} />
        <Outlines color={palette.charcoal} thickness={0.005} />
      </mesh>
      <mesh position={[0, 0.495, 0]}>
        <cylinderGeometry args={[0.135, 0.125, 0.05, 24]} />
        <ToonMaterial color="#68736f" />
      </mesh>
      {Array.from({ length: 6 }, (_, index) => (
        <mesh key={index} position={[0, 0.09 + index * 0.048, 0.131]}>
          <boxGeometry args={[0.19, 0.012, 0.008]} />
          <ToonMaterial color="#9ba49f" />
        </mesh>
      ))}
      <mesh position={[0, 0.495, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.07, 0.008, 8, 20]} />
        <ToonMaterial color={active ? palette.green : palette.muted} emissive={palette.green} emissiveIntensity={active ? 0.3 : 0} />
      </mesh>
      <StatusBeacon visualState={visualState} position={[0.08, 0.445, 0.09]} scale={0.35} />
    </group>
  );
}
