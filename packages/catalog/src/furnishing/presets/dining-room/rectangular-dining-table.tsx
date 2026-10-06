import type { SceneItemSize } from "@cabane/engine";
import { FourLegOakTable } from "../construction";

export const RECTANGULAR_DINING_TABLE_SIZE = [1.8, .75, .9] as const;

export function RectangularDiningTable({ size = RECTANGULAR_DINING_TABLE_SIZE }: { size?: SceneItemSize }) {
  return <group name="rectangular-dining-table" scale={[size[0] / 1.8, size[1] / .75, size[2] / .9]}
    userData={{ walkCollider: true }}>
    <FourLegOakTable width={1.8} height={.75} depth={.9} topThickness={.035} legWidth={.055} />
  </group>;
}
