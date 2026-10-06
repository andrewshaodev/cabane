import { RoundedBox } from "@cabane/engine";
import { Outlines, ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { palette, StatusBeacon } from "../../visuals/device-visual-state";

export function SmartThermostatModel({ state, visualState }: HomeDeviceModelProps) {
  const temperature = typeof state?.attributes.current_temperature === "number"
    ? Math.round(state.attributes.current_temperature)
    : 21;
  return (
    <group name="catalog-smart-thermostat">
      <RoundedBox args={[0.12, 0.12, 0.025]} radius={0.018} smoothness={2} position={[0, 0.06, 0.0125]} castShadow>
        <ToonMaterial color={palette.body} />
        <Outlines color={palette.charcoal} thickness={0.003} />
      </RoundedBox>
      <mesh position={[0, 0.068, 0.03]}>
        <boxGeometry args={[0.074, 0.052, 0.01]} />
        <ToonMaterial color="#31413f" emissive="#5d9993" emissiveIntensity={0.18} />
      </mesh>
      {Array.from({ length: Math.max(1, Math.min(3, temperature - 19)) }, (_, index) => (
        <mesh key={index} position={[-0.018 + index * 0.018, 0.068, 0.035]}>
          <boxGeometry args={[0.01, 0.022 + index * 0.006, 0.001]} />
          <ToonMaterial color="#a8ddd5" emissive="#5fb4aa" emissiveIntensity={0.45} />
        </mesh>
      ))}
      <StatusBeacon visualState={visualState} position={[0.042, 0.022, 0.028]} scale={0.24} />
    </group>
  );
}
