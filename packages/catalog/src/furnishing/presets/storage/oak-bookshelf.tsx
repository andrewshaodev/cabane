import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const OAK_BOOKSHELF_SIZE = [0.8, 1.9, 0.3] as const;

/** Five usable shelf levels, including the bottom shelf, below a separate top. */
export function OakBookshelf({ size = OAK_BOOKSHELF_SIZE }: { size?: SceneItemSize }) {
  return (
    <group
      name="oak-bookshelf"
      scale={[size[0] / 0.8, size[1] / 1.9, size[2] / 0.3]}
      userData={{ walkCollider: true }}
    >
      <mesh position={[0, 0.0325, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.73, 0.065, 0.25]} />
        <ToonMaterial color="#b28f5f" />
      </mesh>
      {[-0.3875, 0.3875].map((x) => (
        <RoundedFurniturePanel
          key={x}
          size={[0.025, 1.85, 0.3]}
          position={[x, 0.975, 0]}
          color="#d1ae7c"
          radius={0.004}
        />
      ))}
      <RoundedFurniturePanel
        size={[0.75, 1.8, 0.012]}
        position={[0, 0.968, -0.144]}
        color="#b99768"
        radius={0.003}
        outline={false}
      />
      {[0.08, 0.44, 0.8, 1.16, 1.52].map((y) => (
        <RoundedFurniturePanel
          key={y}
          name="bookshelf-shelf"
          size={[0.75, 0.026, 0.28]}
          position={[0, y, 0]}
          color="#dabc8e"
          radius={0.004}
        />
      ))}
      <RoundedFurniturePanel
        size={[0.8, 0.026, 0.28]}
        position={[0, 1.887, 0]}
        color="#dabc8e"
        radius={0.004}
      />
    </group>
  );
}
