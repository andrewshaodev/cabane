import { type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const BLANKET_STORAGE_TRUNK_SIZE = [0.95, 0.46, 0.48] as const;

/** Closed oak blanket chest with lid seam, brass latch and short feet. */
export function BlanketStorageTrunk({ size = BLANKET_STORAGE_TRUNK_SIZE }: { size?: SceneItemSize } = {}) {
  return <group name="blanket-storage-trunk" scale={[size[0] / 0.95, size[1] / 0.46, size[2] / 0.48]}
    userData={{ walkCollider: true }}>
    <RoundedFurniturePanel name="foot" size={[0.06, 0.06, 0.06]} position={[-0.38, 0.03, -0.15]} color="#bd9367" radius={0.003} outline={false} />
    <RoundedFurniturePanel name="foot" size={[0.06, 0.06, 0.06]} position={[-0.38, 0.03, 0.15]} color="#bd9367" radius={0.003} outline={false} />
    <RoundedFurniturePanel name="foot" size={[0.06, 0.06, 0.06]} position={[0.38, 0.03, -0.15]} color="#bd9367" radius={0.003} outline={false} />
    <RoundedFurniturePanel name="foot" size={[0.06, 0.06, 0.06]} position={[0.38, 0.03, 0.15]} color="#bd9367" radius={0.003} outline={false} />
    <RoundedFurniturePanel name="chest" size={[0.93, 0.36, 0.45]} position={[0, 0.24, -0.005]} color="#bd9367" radius={0.006} />
    <RoundedFurniturePanel name="lid" size={[0.95, 0.04, 0.48]} position={[0, 0.44, 0]} color="#cbaa82" radius={0.006} />
    <RoundedFurniturePanel name="latch" size={[0.055, 0.07, 0.02]} position={[0, 0.38, 0.23]} color="#9b7840" radius={0.003} />
  </group>;
}
