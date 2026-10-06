import { RoundedBox } from "@cabane/engine";
import { Outlines, ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { palette, StatusBeacon } from "../../visuals/device-visual-state";

export function SmartButtonModel({ visualState }: HomeDeviceModelProps) {
  const pressed = visualState === "connected-active";
  return (
    <group name="catalog-smart-button">
      <RoundedBox args={[0.09, 0.09, 0.025]} radius={0.014} smoothness={2} position={[0, 0.045, 0.0125]} castShadow>
        <ToonMaterial color={palette.body} />
        <Outlines color={palette.charcoal} thickness={0.0025} />
      </RoundedBox>
      <mesh name="smart-button-control" position={[0, 0.045, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.032, 0.032, 0.01, 22]} />
        <ToonMaterial color={pressed ? palette.coral : palette.bodyDark} />
        <Outlines color={palette.charcoal} thickness={0.002} />
      </mesh>
      <mesh position={[0, 0.045, 0.0345]}>
        <ringGeometry args={[0.012, 0.017, 18]} />
        <ToonMaterial color={pressed ? "#fff0df" : "#65706b"} />
      </mesh>
      <StatusBeacon visualState={visualState} position={[0.029, 0.074, 0.03]} scale={0.1} />
    </group>
  );
}
