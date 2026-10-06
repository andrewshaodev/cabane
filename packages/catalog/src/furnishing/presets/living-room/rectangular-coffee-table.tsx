import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const RECTANGULAR_COFFEE_TABLE_SIZE = [1.1, .4, .6] as const;

/** Low oak coffee table with a softly rounded top and a useful lower rail. */
export function RectangularCoffeeTable({ size = RECTANGULAR_COFFEE_TABLE_SIZE }: { size?: SceneItemSize }) {
  return <group name="rectangular-coffee-table"
    scale={[size[0] / 1.1, size[1] / .4, size[2] / .6]}
    userData={{ walkCollider: true }}>
    <RoundedFurniturePanel name="coffee-table-top" size={[1.1, .05, .6]}
      position={[0, .375, 0]} color="#d7b783" radius={.018} />
    {[-.45, .45].flatMap((x) => [-.20, .20].map((z) => <mesh
      key={`${x}-${z}`} name="coffee-table-leg" position={[x, .175, z]} castShadow receiveShadow>
      <boxGeometry args={[.055, .35, .055]} /><ToonMaterial color="#b98f5e" />
    </mesh>))}
    <RoundedFurniturePanel name="coffee-table-lower-rail" size={[.88, .035, .42]}
      position={[0, .13, 0]} color="#c9a370" radius={.008} />
  </group>;
}
