import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";
export const ELECTRIC_TOOTHBRUSH_SIZE = [0.03, 0.22, 0.03] as const;
/** Generic standing electric brush; appearance only, no runtime capability inferred. */
export function ElectricToothbrush({ size = ELECTRIC_TOOTHBRUSH_SIZE }: { size?: SceneItemSize }) {
  return (
    <group name="electric-toothbrush" scale={[size[0] / 0.03, size[1] / 0.22, size[2] / 0.03]}>
      <mesh name="brush-foot" position={[0, 0.003, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.006, 24]} />
        <ToonMaterial color="#e9e8df" />
      </mesh>
      <RoundedFurniturePanel
        name="brush-handle"
        size={[0.028, 0.15, 0.028]}
        position={[0, 0.075, 0]}
        color="#e9e8df"
        radius={0.01}
        outline={false}
      />
      <mesh name="brush-neck" position={[0, 0.175, 0]}>
        <cylinderGeometry args={[0.004, 0.004, 0.05, 16]} />
        <ToonMaterial color="#e9e8df" />
      </mesh>
      <mesh name="brush-head" position={[0, 0.21, 0]}>
        <cylinderGeometry args={[0.007, 0.007, 0.02, 16]} />
        <ToonMaterial color="#e9e8df" />
      </mesh>
      <mesh name="blue-bristles" position={[0, 0.21, 0.006]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.004, 16]} />
        <ToonMaterial color="#80b5be" />
      </mesh>
      <RoundedFurniturePanel
        name="brush-button"
        size={[0.006, 0.012, 0.002]}
        position={[0, 0.11, 0.014]}
        color="#d2d3c9"
        radius={0.001}
        outline={false}
      />
    </group>
  );
}
