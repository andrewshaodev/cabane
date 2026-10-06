import { Outlines, ToonMaterial, lightBrightnessRatio } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { palette, StatusBeacon } from "../../visuals/device-visual-state";
import { connectedLightFinish } from "./connected-light-finish";

export function RecessedDownlightModel({ state, visualState }: HomeDeviceModelProps) {
  const finish = connectedLightFinish(visualState);
  return (
    <group name="catalog-recessed-downlight">
      <mesh position={[0, 0.034, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.012, 20]} />
        <ToonMaterial color={palette.body} />
        <Outlines color={palette.charcoal} thickness={0.002} />
      </mesh>
      <mesh position={[0, 0.014, 0]}>
        <cylinderGeometry args={[0.038, 0.045, 0.028, 20]} />
        <ToonMaterial color={finish.color} emissive="#f2c66d" emissiveIntensity={finish.emissiveIntensity * lightBrightnessRatio(state)} />
      </mesh>
      <StatusBeacon visualState={visualState} position={[0.028, 0.033, 0]} scale={0.18} />
    </group>
  );
}
