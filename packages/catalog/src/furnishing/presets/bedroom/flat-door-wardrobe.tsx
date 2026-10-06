import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const FLAT_DOOR_WARDROBE_SIZE = [2, 2.2, 0.6] as const;

export function FlatDoorWardrobe({ size = FLAT_DOOR_WARDROBE_SIZE }: { size?: SceneItemSize }) {
  return (
    <group
      name="flat-door-wardrobe"
      scale={[size[0] / 2, size[1] / 2.2, size[2] / 0.6]}
      userData={{ walkCollider: true }}
    >
      <mesh position={[0, 0.04, -0.015]} castShadow receiveShadow>
        <boxGeometry args={[1.86, 0.08, 0.51]} />
        <ToonMaterial color="#b49368" />
      </mesh>
      <RoundedFurniturePanel
        size={[2, 2.12, 0.57]}
        position={[0, 1.14, -0.015]}
        color="#d4b586"
        radius={0.008}
      />
      {[-0.7365, -0.2455, 0.2455, 0.7365].map((x, index) => (
        <group key={x}>
          <RoundedFurniturePanel
            name="wardrobe-flat-door"
            size={[0.485, 2.064, 0.022]}
            position={[x, 1.14, 0.283]}
            color="#eeeade"
            radius={0.003}
            outlineColor="#a49b88"
          />
          <RoundedFurniturePanel
            name="wardrobe-oak-pull"
            size={[0.018, 0.27, 0.018]}
            position={[x + (index % 2 === 0 ? 0.185 : -0.185), 1.08, 0.291]}
            color="#bf9967"
            radius={0.004}
            outline={false}
          />
        </group>
      ))}
    </group>
  );
}
