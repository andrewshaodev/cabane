import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";
export const FOLDED_BATH_SCREEN_SIZE = [0.42, 1.5, 0.055] as const;
/** Three 40 cm leaves stacked as a folded 120 cm bath screen. */
export function FoldedBathScreen({ size = FOLDED_BATH_SCREEN_SIZE }: { size?: SceneItemSize }) {
  return (
    <group name="folded-bath-screen" scale={[size[0] / 0.42, size[1] / 1.5, size[2] / 0.055]}>
      {[0.006, 0.026, 0.046].map((z) => (
        <group key={z}>
          <mesh name="folded-screen-glass" position={[0, 0.75, z]}>
            <boxGeometry args={[0.396, 1.5, 0.006]} />
            <ToonMaterial color="#b4d0cf" transparent opacity={0.2} depthWrite={false} />
          </mesh>
          {[-0.204, 0.204].map((x) => (
            <mesh key={x} name="screen-edge" position={[x, 0.75, z]}>
              <cylinderGeometry args={[0.006, 0.006, 1.5, 12]} />
              <ToonMaterial color="#a5b1b0" />
            </mesh>
          ))}
        </group>
      ))}
      {[0.15, 1.35].map((y) => (
        <RoundedFurniturePanel
          key={y}
          name="screen-fold-hinge"
          size={[0.015, 0.07, 0.055]}
          position={[-0.2025, y, 0.0275]}
          color="#a5b1b0"
          radius={0.002}
          outline={false}
        />
      ))}
    </group>
  );
}
