import type { SceneItemSize } from "@cabane/engine";
import { FourLegOakTable } from "../construction";

export const RECTANGULAR_DINING_TABLE_SIZE = [1.8, 0.75, 0.9] as const;

export function RectangularDiningTable({
  size = RECTANGULAR_DINING_TABLE_SIZE,
}: {
  size?: SceneItemSize;
}) {
  return (
    <group
      name="rectangular-dining-table"
      scale={[size[0] / 1.8, size[1] / 0.75, size[2] / 0.9]}
      userData={{ walkCollider: true }}
    >
      <FourLegOakTable
        width={1.8}
        height={0.75}
        depth={0.9}
        topThickness={0.035}
        legWidth={0.055}
      />
    </group>
  );
}
