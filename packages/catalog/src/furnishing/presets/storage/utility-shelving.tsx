import { type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const UTILITY_SHELVING_SIZE = [0.9, 1.8, 0.45] as const;

/** Four steel uprights and five full-width shelves. */
export function UtilityShelving({ size = UTILITY_SHELVING_SIZE }: { size?: SceneItemSize } = {}) {
  return <group name="utility-shelving" scale={[size[0] / 0.9, size[1] / 1.8, size[2] / 0.45]} userData={{ walkCollider: true }}>
    <RoundedFurniturePanel name="upright" size={[0.03, 1.8, 0.03]} position={[-0.435, 0.9, -0.21]} color="#606b70" radius={0.006} outline={false} />
    <RoundedFurniturePanel name="upright" size={[0.03, 1.8, 0.03]} position={[-0.435, 0.9, 0.21]} color="#606b70" radius={0.006} outline={false} />
    <RoundedFurniturePanel name="upright" size={[0.03, 1.8, 0.03]} position={[0.435, 0.9, -0.21]} color="#606b70" radius={0.006} outline={false} />
    <RoundedFurniturePanel name="upright" size={[0.03, 1.8, 0.03]} position={[0.435, 0.9, 0.21]} color="#606b70" radius={0.006} outline={false} />
    <RoundedFurniturePanel name="shelf" size={[0.86, 0.03, 0.41]} position={[0, 0.06, 0]} color="#e8e5dc" radius={0.006} />
    <RoundedFurniturePanel name="shelf" size={[0.86, 0.03, 0.41]} position={[0, 0.48, 0]} color="#e8e5dc" radius={0.006} />
    <RoundedFurniturePanel name="shelf" size={[0.86, 0.03, 0.41]} position={[0, 0.9, 0]} color="#e8e5dc" radius={0.006} />
    <RoundedFurniturePanel name="shelf" size={[0.86, 0.03, 0.41]} position={[0, 1.32, 0]} color="#e8e5dc" radius={0.006} />
    <RoundedFurniturePanel name="shelf" size={[0.86, 0.03, 0.41]} position={[0, 1.785, 0]} color="#e8e5dc" radius={0.006} />
  </group>;
}
