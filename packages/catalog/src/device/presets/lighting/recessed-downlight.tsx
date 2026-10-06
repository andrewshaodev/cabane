import { Outlines, ToonMaterial, lightBrightnessRatio } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { connectedLightFinish } from "./connected-light-finish";

export function RecessedDownlightModel({ state, visualState }: HomeDeviceModelProps) {
  const finish = connectedLightFinish(visualState);
  return (
    <group name="catalog-recessed-downlight">
      <mesh position={[0, 0.006, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.008, 32]} />
        <ToonMaterial color="#e5e3de" />
        <Outlines color="#92918c" thickness={0.001} screenspace={false} />
      </mesh>
      {/* The diffuser underside is 2 mm below the trim, with a concealed overlap. */}
      <mesh position={[0, 0.002, 0]}>
        <cylinderGeometry args={[0.046, 0.046, 0.004, 32]} />
        <ToonMaterial color={visualState === "connected-active" ? "#fffaf0" : finish.color} emissive="#fff3d6" emissiveIntensity={finish.emissiveIntensity * lightBrightnessRatio(state)} />
      </mesh>
    </group>
  );
}
