import { RoundedBox } from "@cabane/engine";
import { Outlines, ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { palette, StatusBeacon } from "../../visuals/device-visual-state";

export function EnergyMonitorModel({ visualState }: HomeDeviceModelProps) {
  return (
    <group name="catalog-energy-monitor">
      <RoundedBox args={[0.2, 0.3, 0.08]} radius={0.018} smoothness={2} position={[0, 0.15, 0.04]} castShadow>
        <ToonMaterial color="#d8ddd7" />
        <Outlines color={palette.charcoal} thickness={0.004} />
      </RoundedBox>
      <mesh position={[0, 0.205, 0.085]}>
        <boxGeometry args={[0.13, 0.07, 0.01]} />
        <ToonMaterial color="#293936" emissive="#4f9a8e" emissiveIntensity={0.2} />
      </mesh>
      {[-0.045, 0, 0.045].map((x, index) => (
        <mesh key={x} position={[x, 0.09, 0.085]}>
          <boxGeometry args={[0.028, 0.07 + index * 0.018, 0.01]} />
          <ToonMaterial color={index === 1 ? palette.coral : palette.paleBlue} />
        </mesh>
      ))}
      <StatusBeacon visualState={visualState} position={[0.068, 0.265, 0.075]} scale={0.28} />
    </group>
  );
}
