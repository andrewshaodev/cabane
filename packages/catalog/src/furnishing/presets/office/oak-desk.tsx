import type { SceneItemSize } from "@cabane/engine";
import { FourLegOakTable } from "../construction";

export const OAK_DESK_SIZE = [1.4, 0.74, 0.7] as const;

export function OakDesk({ size = OAK_DESK_SIZE }: { size?: SceneItemSize }) {
  return (
    <group
      name="oak-desk"
      scale={[size[0] / 1.4, size[1] / 0.74, size[2] / 0.7]}
      userData={{ walkCollider: true }}
    >
      <FourLegOakTable
        width={1.4}
        height={0.74}
        depth={0.7}
        topThickness={0.025}
        legWidth={0.045}
      />
    </group>
  );
}
