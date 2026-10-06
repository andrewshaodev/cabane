import { RoundedBox } from "@cabane/engine";
import { Outlines, ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { palette, StatusBeacon } from "../../visuals/device-visual-state";

/** Generic pipe-mounted actuator for water, gas, or irrigation valves. */
export function MotorizedValveModel({ visualState }: HomeDeviceModelProps) {
  const open = visualState === "connected-active";
  return (
    <group name="catalog-motorized-valve">
      <RoundedBox args={[0.12, 0.22, 0.04]} radius={0.012} smoothness={2} position={[0, 0.11, 0.02]} castShadow>
        <ToonMaterial color="#a9b1ac" />
        <Outlines color={palette.charcoal} thickness={0.003} />
      </RoundedBox>
      <mesh name="motorized-valve-pipe" position={[0, 0.055, 0.06]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.035, 0.035, 0.24, 16]} />
        <ToonMaterial color="#77827d" />
      </mesh>
      <mesh position={[0, 0.055, 0.06]}>
        <sphereGeometry args={[0.055, 16, 10]} />
        <ToonMaterial color="#9b754e" />
      </mesh>
      <RoundedBox args={[0.12, 0.12, 0.08]} radius={0.016} smoothness={2} position={[0, 0.15, 0.08]}>
        <ToonMaterial color={palette.body} />
      </RoundedBox>
      <mesh position={[0, 0.151, 0.118]}>
        <boxGeometry args={[0.062, 0.034, 0.004]} />
        <ToonMaterial color={open ? palette.green : "#46534f"} emissive={palette.green} emissiveIntensity={open ? 0.3 : 0.04} />
      </mesh>
      <mesh position={[0, 0.102, 0.06]}>
        <cylinderGeometry args={[0.012, 0.012, 0.04, 12]} />
        <ToonMaterial color="#59645f" />
      </mesh>
      <StatusBeacon visualState={visualState} position={[0.04, 0.19, 0.114]} scale={0.15} />
    </group>
  );
}
