import { RoundedBox } from "@cabane/engine";
import { Outlines, ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { palette, StatusBeacon } from "../../visuals/device-visual-state";

export function CarbonMonoxideAlarmModel({ visualState }: HomeDeviceModelProps) {
  const alert = visualState === "connected-active";
  return (
    <group name="catalog-carbon-monoxide-alarm">
      <RoundedBox args={[0.11, 0.11, 0.03]} radius={0.015} smoothness={2} position={[0, 0.055, 0.015]} castShadow>
        <ToonMaterial color={palette.body} />
        <Outlines color={palette.charcoal} thickness={0.0025} />
      </RoundedBox>
      <mesh position={[0, 0.068, 0.0325]}>
        <boxGeometry args={[0.052, 0.026, 0.005]} />
        <ToonMaterial color="#34413f" emissive={alert ? palette.coral : "#6fa096"} emissiveIntensity={0.22} />
      </mesh>
      {[-0.028, -0.014, 0, 0.014, 0.028].map((x) => (
        <mesh key={x} position={[x, 0.034, 0.033]}>
          <boxGeometry args={[0.006, 0.022, 0.004]} />
          <ToonMaterial color="#909792" />
        </mesh>
      ))}
      <StatusBeacon visualState={visualState} position={[0.039, 0.092, 0.028]} scale={0.15} />
    </group>
  );
}
