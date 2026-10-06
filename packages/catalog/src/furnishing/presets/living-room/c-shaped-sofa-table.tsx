import { type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const C_SHAPED_SOFA_TABLE_SIZE = [0.4, 0.62, 0.45] as const;

/** Oak overhanging top and charcoal steel C frame. */
export function CShapedSofaTable({ size = C_SHAPED_SOFA_TABLE_SIZE }: { size?: SceneItemSize } = {}) {
  return <group name="c-shaped-sofa-table" scale={[size[0] / 0.4, size[1] / 0.62, size[2] / 0.45]}
    userData={{ walkCollider: true }}>
    <RoundedFurniturePanel name="top" size={[0.4, 0.035, 0.45]} position={[0, 0.6025, 0]} color="#bd9367" radius={0.006} />
    <RoundedFurniturePanel name="floor-plate" size={[0.36, 0.025, 0.43]} position={[0, 0.0125, 0]} color="#424748" radius={0.006} outline={false} />
    <RoundedFurniturePanel name="rear-upright" size={[0.035, 0.56, 0.035]} position={[0, 0.305, -0.1975]} color="#424748" radius={0.006} />
    <RoundedFurniturePanel name="top-bracket" size={[0.3, 0.025, 0.035]} position={[0, 0.5725, -0.1975]} color="#424748" radius={0.006} />
  </group>;
}
