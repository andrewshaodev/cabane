import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const FLAT_DOOR_WARDROBE_SIZE = [2, 2.2, .6] as const;

export function FlatDoorWardrobe({ size = FLAT_DOOR_WARDROBE_SIZE }: { size?: SceneItemSize }) {
  return <group name="flat-door-wardrobe" scale={[size[0] / 2, size[1] / 2.2, size[2] / .6]}
    userData={{ walkCollider: true }}>
    <mesh position={[0, .04, -.015]} castShadow receiveShadow>
      <boxGeometry args={[1.86, .08, .51]} /><ToonMaterial color="#b49368" />
    </mesh>
    <RoundedFurniturePanel size={[2, 2.12, .57]} position={[0, 1.14, -.015]}
      color="#d4b586" radius={.008} />
    {[-.7365, -.2455, .2455, .7365].map((x, index) => <group key={x}>
      <RoundedFurniturePanel name="wardrobe-flat-door" size={[.485, 2.064, .022]}
        position={[x, 1.14, .283]} color="#eeeade" radius={.003} outlineColor="#a49b88" />
      <RoundedFurniturePanel name="wardrobe-oak-pull" size={[.018, .27, .018]}
        position={[x + (index % 2 === 0 ? .185 : -.185), 1.08, .291]}
        color="#bf9967" radius={.004} outline={false} />
    </group>)}
  </group>;
}
