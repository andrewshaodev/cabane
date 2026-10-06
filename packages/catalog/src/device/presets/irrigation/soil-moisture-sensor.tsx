import { RoundedBox, ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { StatusBeacon } from "../../visuals/device-visual-state";

/** Ground-contact origin; buried sensing probes intentionally omitted. */
export function SoilMoistureSensorModel({ visualState }: HomeDeviceModelProps) {
  return (
    <group name="catalog-soil-moisture-sensor">
      <mesh position={[0, 0.025, 0]}>
        <cylinderGeometry args={[0.012, 0.01, 0.05, 12]} />
        <ToonMaterial color="#697b6e" />
      </mesh>
      <RoundedBox
        args={[0.065, 0.075, 0.04]}
        radius={0.012}
        smoothness={2}
        position={[0, 0.0825, 0]}
      >
        <ToonMaterial color="#bdcbb5" />
      </RoundedBox>
      <mesh position={[0, 0.084, 0.022]}>
        <boxGeometry args={[0.035, 0.021, 0.004]} />
        <ToonMaterial color="#3c6054" />
      </mesh>
      <StatusBeacon visualState={visualState} position={[0, 0.107, 0.022]} scale={0.1} />
    </group>
  );
}
