import { RoundedBox } from "@cabane/engine";
import { Outlines, ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { palette, StatusBeacon } from "../../visuals/device-visual-state";

export function HumiditySensorModel({ state, visualState }: HomeDeviceModelProps) {
  const humidity = typeof state?.attributes.native_value === "number"
    ? state.attributes.native_value
    : Number(state?.state ?? 50);
  const high = Number.isFinite(humidity) && humidity >= 65;
  return (
    <group name="catalog-humidity-sensor">
      <RoundedBox args={[0.085, 0.085, 0.025]} radius={0.012} smoothness={2} position={[0, 0.0425, 0.0125]} castShadow>
        <ToonMaterial color={palette.body} />
        <Outlines color={palette.charcoal} thickness={0.002} />
      </RoundedBox>
      <mesh position={[0, 0.05, 0.0275]}>
        <boxGeometry args={[0.05, 0.026, 0.005]} />
        <ToonMaterial color="#354441" emissive={high ? palette.coral : palette.paleBlue} emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[-0.023, 0.018, 0.025]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.005, 0.016, 10]} />
        <ToonMaterial color={high ? palette.coral : palette.paleBlue} />
      </mesh>
      <StatusBeacon visualState={visualState} position={[0.027, 0.018, 0.025]} scale={0.13} />
    </group>
  );
}
