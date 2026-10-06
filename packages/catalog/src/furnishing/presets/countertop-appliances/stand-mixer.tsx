import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";
import { MixingBowl } from "./mixing-bowl";
export const STAND_MIXER_SIZE = [0.28, 0.4, 0.4] as const;
export const RAISED_STAND_MIXER_SIZE = [0.28, 0.493143318, 0.4] as const;
function MixerAssembly({
  size,
  raised,
  variant,
}: {
  size: SceneItemSize;
  raised: boolean;
  variant?: string;
}) {
  const nominal = raised ? RAISED_STAND_MIXER_SIZE : STAND_MIXER_SIZE;
  const color = raised || variant === "black" ? "#303436" : "#853c48";
  return (
    <group
      userData={{ walkCollider: true }}
      name={raised ? "raised-stand-mixer" : "stand-mixer"}
      scale={[size[0] / nominal[0], size[1] / nominal[1], size[2] / nominal[2]]}
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
      <group name="tilting-head" position={[0, 0.335, -0.14]} rotation={[raised ? -0.3 : 0, 0, 0]}>
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
export function StandMixer({
  size = STAND_MIXER_SIZE,
  variant = "default",
}: {
  size?: SceneItemSize;
  variant?: string;
}) {
  return <MixerAssembly size={size} raised={false} variant={variant} />;
}
export function RaisedStandMixer({ size = RAISED_STAND_MIXER_SIZE }: { size?: SceneItemSize }) {
  return <MixerAssembly size={size} raised />;
}
