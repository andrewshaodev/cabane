import { Outlines, ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { palette, StatusBeacon } from "../../visuals/device-visual-state";

export function SmartPanelRadiatorModel({ visualState }: HomeDeviceModelProps) {
  return (
    <group name="catalog-smart-panel-radiator">
      <mesh position={[0, 0.28, 0.05]} castShadow receiveShadow>
        <boxGeometry args={[0.98, 0.56, 0.1]} />
        <ToonMaterial color="#eeeae2" />
        <Outlines color="#7f817c" thickness={0.005} />
      </mesh>
      {Array.from({ length: 8 }, (_, index) => -0.39 + index * 0.112).map((x) => (
        <mesh key={x} position={[x, 0.31, 0.11]}>
          <boxGeometry args={[0.018, 0.47, 0.02]} />
          <ToonMaterial color="#d6d7d2" />
        </mesh>
      ))}
      <mesh position={[0, 0.58, 0.055]}>
        <boxGeometry args={[1, 0.04, 0.11]} />
        <ToonMaterial color="#c9ccc7" />
      </mesh>
      <mesh position={[0.44, 0.095, 0.105]}>
        <boxGeometry args={[0.1, 0.15, 0.03]} />
        <ToonMaterial color={palette.charcoal} />
      </mesh>
      <StatusBeacon visualState={visualState} position={[0.44, 0.11, 0.106]} scale={0.45} />
    </group>
  );
}
