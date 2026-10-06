import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";
import { MixingBowl } from "./mixing-bowl";
export const STAND_MIXER_SIZE = [0.28, 0.4, 0.4] as const;
export function StandMixer({
  size = STAND_MIXER_SIZE,
  variant = "default",
}: {
  size?: SceneItemSize;
  variant?: string;
}) {
  const color = variant === "black" ? "#303436" : "#853c48";
  return (
    <group
      userData={{ walkCollider: true }}
      name="stand-mixer"
      scale={[
        size[0] / STAND_MIXER_SIZE[0],
        size[1] / STAND_MIXER_SIZE[1],
        size[2] / STAND_MIXER_SIZE[2],
      ]}
    >
      <RoundedFurniturePanel
        name="mixer-base"
        size={[0.28, 0.035, 0.4]}
        position={[0, 0.0175, 0]}
        color={color}
        radius={0.015}
      />
      <RoundedFurniturePanel
        name="rear-column"
        size={[0.1, 0.29, 0.11]}
        position={[0, 0.175, -0.115]}
        color={color}
        radius={0.022}
      />
      <group name="tilting-head" position={[0, 0.335, -0.14]}>
        <RoundedFurniturePanel
          name="motor-head"
          size={[0.13, 0.11, 0.36]}
          position={[0, 0.01, 0.145]}
          color={color}
          radius={0.035}
        />
        <mesh name="mixing-shaft" position={[0, -0.06, 0.205]}>
          <cylinderGeometry args={[0.005, 0.005, 0.08, 12]} />
          <ToonMaterial color="#abb2ae" />
        </mesh>
      </group>
      <MixingBowl />
      <mesh name="hinge" position={[0.052, 0.335, -0.14]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.019, 0.019, 0.009, 16]} />
        <ToonMaterial color="#969f9a" />
      </mesh>
    </group>
  );
}
