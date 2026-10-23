import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const RECTANGULAR_COFFEE_TABLE_SIZE = [1.1, 0.4, 0.6] as const;

/** Low oak coffee table with a softly rounded top and a useful lower rail. */
export function RectangularCoffeeTable({
  size = RECTANGULAR_COFFEE_TABLE_SIZE,
}: {
  size?: SceneItemSize;
}) {
  return (
    <group
      name="rectangular-coffee-table"
      scale={[size[0] / 1.1, size[1] / 0.4, size[2] / 0.6]}
      userData={{ walkCollider: true, walkSupport: true }}
    >
      <RoundedFurniturePanel
        name="coffee-table-top"
        size={[1.1, 0.05, 0.6]}
        position={[0, 0.375, 0]}
        color="#d7b783"
        radius={0.018}
      />
      {[-0.45, 0.45].flatMap((x) =>
        [-0.2, 0.2].map((z) => (
          <mesh
            key={`${x}-${z}`}
            name="coffee-table-leg"
            position={[x, 0.175, z]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[0.055, 0.35, 0.055]} />
            <ToonMaterial color="#b98f5e" />
          </mesh>
        )),
      )}
      <RoundedFurniturePanel
        name="coffee-table-lower-rail"
        size={[0.88, 0.035, 0.42]}
        position={[0, 0.13, 0]}
        color="#c9a370"
        radius={0.008}
      />
    </group>
  );
}
