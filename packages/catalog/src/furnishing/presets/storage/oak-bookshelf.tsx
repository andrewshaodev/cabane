import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const OAK_BOOKSHELF_SIZE = [.8, 1.9, .3] as const;

/** Five usable shelf levels, including the bottom shelf, below a separate top. */
export function OakBookshelf({ size = OAK_BOOKSHELF_SIZE }: { size?: SceneItemSize }) {
  return <group name="oak-bookshelf" scale={[size[0] / .8, size[1] / 1.9, size[2] / .3]}
    userData={{ walkCollider: true }}>
    <mesh position={[0, .0325, 0]} castShadow receiveShadow>
      <boxGeometry args={[.73, .065, .25]} /><ToonMaterial color="#b28f5f" />
    </mesh>
    {[-.3875, .3875].map((x) => <RoundedFurniturePanel key={x} size={[.025, 1.85, .3]}
      position={[x, .975, 0]} color="#d1ae7c" radius={.004} />)}
    <RoundedFurniturePanel size={[.75, 1.80, .012]} position={[0, .968, -.144]}
      color="#b99768" radius={.003} outline={false} />
    {[.08, .44, .80, 1.16, 1.52].map((y) => <RoundedFurniturePanel key={y}
      name="bookshelf-shelf" size={[.75, .026, .28]} position={[0, y, 0]}
      color="#dabc8e" radius={.004} />)}
    <RoundedFurniturePanel size={[.8, .026, .28]} position={[0, 1.887, 0]} color="#dabc8e" radius={.004} />
  </group>;
}
