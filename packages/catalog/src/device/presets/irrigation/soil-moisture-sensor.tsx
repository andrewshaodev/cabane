import { RoundedBox, ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { StatusBeacon } from "../../visuals/device-visual-state";

/** Ground-contact origin; buried sensing probes intentionally omitted. */
export function SoilMoistureSensorModel({ visualState }: HomeDeviceModelProps) {
  return <group name="catalog-soil-moisture-sensor">
    <mesh position={[0, .025, 0]}><cylinderGeometry args={[.012, .01, .05, 12]} /><ToonMaterial color="#697b6e" /></mesh>
    <RoundedBox args={[.065, .075, .04]} radius={.012} smoothness={2} position={[0, .0825, 0]}><ToonMaterial color="#bdcbb5" /></RoundedBox>
    <mesh position={[0, .084, .022]}><boxGeometry args={[.035, .021, .004]} /><ToonMaterial color="#3c6054" /></mesh>
    <StatusBeacon visualState={visualState} position={[0, .107, .022]} scale={.1} />
  </group>;
}
