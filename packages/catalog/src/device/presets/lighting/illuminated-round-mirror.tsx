import { Outlines, ToonMaterial, lightBrightnessRatio } from "@cabane/engine";
import type { HomeDeviceModelProps } from "@cabane/engine";
import { StatusBeacon } from "../../visuals/device-visual-state";
import { connectedLightFinish } from "./connected-light-finish";

export const ILLUMINATED_ROUND_MIRROR_SIZE = [0.8, 0.8, 0.045] as const;

export function IlluminatedRoundMirrorModel({ state, visualState }: HomeDeviceModelProps) {
  const finish = connectedLightFinish(visualState);
  return (
    <group name="catalog-illuminated-round-mirror">
      <mesh position={[0, 0.4, 0.006]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.4, 0.012, 32]} />
        <ToonMaterial color="#d7d3cb" />
        <Outlines color="#8f918d" thickness={0.003} />
      </mesh>
      <mesh position={[0, 0.4, 0.045]}>
        <circleGeometry args={[0.356, 32]} />
        <ToonMaterial color="#afc5c7" />
      </mesh>
      <mesh name="illuminated-mirror-light-ring" position={[0, 0.4, 0.026]}>
        <torusGeometry args={[0.382, 0.018, 8, 32]} />
        <ToonMaterial
          color={finish.color}
          emissive="#f5dba1"
          emissiveIntensity={finish.emissiveIntensity * lightBrightnessRatio(state)}
        />
        <Outlines color="#b3a98e" thickness={0.002} />
      </mesh>
      <StatusBeacon visualState={visualState} position={[0, 0.08, 0.0415]} scale={0.15} />
    </group>
  );
}
