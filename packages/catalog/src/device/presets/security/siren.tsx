import { Outlines, ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { palette, StatusBeacon } from "../../visuals/device-visual-state";

export function SirenModel({ visualState }: HomeDeviceModelProps) {
  const sounding = visualState === "connected-active";
  return (
    <group name="catalog-siren">
      <mesh position={[0, 0.08, 0.02]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.04, 24]} />
        <ToonMaterial color={palette.body} />
        <Outlines color={palette.charcoal} thickness={0.003} />
      </mesh>
      <mesh position={[0, 0.08, 0.055]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.055, 0.075, 0.03, 24]} />
        <ToonMaterial color={sounding ? "#d95f4b" : "#bdc5bf"} />
      </mesh>
      <mesh position={[0, 0.08, 0.0675]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.028, 0.028, 0.005, 18]} />
        <ToonMaterial
          color={sounding ? palette.coral : palette.charcoal}
          emissive={palette.coral}
          emissiveIntensity={sounding ? 0.42 : 0.03}
        />
      </mesh>
      {[-0.038, 0.038].map((x) => (
        <mesh key={x} position={[x, 0.08, 0.068]}>
          <boxGeometry args={[0.012, 0.05, 0.004]} />
          <ToonMaterial color="#69746f" />
        </mesh>
      ))}
      <StatusBeacon visualState={visualState} position={[0, 0.08, 0.066]} scale={0.1} />
    </group>
  );
}
