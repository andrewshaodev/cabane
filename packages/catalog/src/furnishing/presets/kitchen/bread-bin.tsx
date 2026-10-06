import { type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const BREAD_BIN_SIZE = [0.4, 0.25, 0.25] as const;

/** Warm-white box with rounded lid and oak front pull. */
export function BreadBin({ size = BREAD_BIN_SIZE }: { size?: SceneItemSize } = {}) {
  return <group name="bread-bin" scale={[size[0] / 0.4, size[1] / 0.25, size[2] / 0.25]} userData={{ walkCollider: true }}>
    <RoundedFurniturePanel name="box" size={[0.4, 0.215, 0.235]} position={[0, 0.1075, -0.0075]} color="#e8e5dc" radius={0.025} outline={false} />
    <RoundedFurniturePanel name="lid" size={[0.4, 0.035, 0.235]} position={[0, 0.2325, -0.0075]} color="#e8e5dc" radius={0.014} />
    <RoundedFurniturePanel name="pull" size={[0.14, 0.022, 0.02]} position={[0, 0.2, 0.115]} color="#bd9367" radius={0.006} />
  </group>;
}
