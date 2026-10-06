import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";
export const HANGING_BLUE_BATHROBE_SIZE = [0.355, 1.15, 0.075] as const;
export function HangingBlueBathrobe({
  size = HANGING_BLUE_BATHROBE_SIZE,
}: {
  size?: SceneItemSize;
}) {
  return (
    <group name="hanging-blue-bathrobe" scale={[size[0] / 0.355, size[1] / 1.15, size[2] / 0.075]}>
      <RoundedFurniturePanel
        name="robe-body"
        size={[0.21, 0.93, 0.04]}
        position={[0, 0.465, 0.035]}
        color="#8cb7cf"
        radius={0.018}
        outline={false}
      />
      <RoundedFurniturePanel
        name="robe-shoulders"
        size={[0.3, 0.11, 0.035]}
        position={[0, 0.93, 0.035]}
        color="#8cb7cf"
        radius={0.025}
        outline={false}
      />
      {[-0.145, 0.145].map((x) => (
        <RoundedFurniturePanel
          key={x}
          name="robe-sleeve"
          size={[0.065, 0.3, 0.035]}
          position={[x, 0.8, 0.035]}
          color="#8cb7cf"
          radius={0.022}
          outline={false}
        />
      ))}
      <mesh name="robe-hood" position={[0, 1.05, 0.0375]} scale={[1, 1, 0.375]}>
        <sphereGeometry args={[0.1, 24, 16]} />
        <ToonMaterial color="#8cb7cf" />
      </mesh>
    </group>
  );
}
