import { Outlines, ToonMaterial } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { palette, StatusBeacon } from "../../visuals/device-visual-state";

const numericState = (state: HomeDeviceModelProps["state"]) => {
  const value = Number(state?.state);
  return Number.isFinite(value) ? value : 20;
};

export function ThermometerModel({ state, visualState }: HomeDeviceModelProps) {
  const temperature = Math.max(-10, Math.min(40, numericState(state)));
  const angle = ((temperature + 10) / 50 - 0.5) * Math.PI * 1.3;
  return (
    <group name="catalog-thermometer">
      <mesh position={[0, 0.08, 0.022]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.075, 0.075, 0.035, 18]} />
        <ToonMaterial color={palette.body} />
        <Outlines color={palette.charcoal} thickness={0.005} />
      </mesh>
      <mesh position={[0, 0.08, 0.043]} rotation={[0, 0, -angle]}>
        <boxGeometry args={[0.008, 0.052, 0.008]} />
        <ToonMaterial color={palette.coral} />
      </mesh>
      <mesh position={[0, 0.08, 0.048]}>
        <sphereGeometry args={[0.013, 10, 6]} />
        <ToonMaterial color={palette.charcoal} />
      </mesh>
      <StatusBeacon visualState={visualState} position={[0.045, 0.035, 0.046]} scale={0.55} />
    </group>
  );
}
