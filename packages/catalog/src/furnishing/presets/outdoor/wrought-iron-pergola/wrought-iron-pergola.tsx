import type { SceneModelProps } from "@cabane/engine";
import { PergolaFrame, WROUGHT_IRON_PERGOLA_SIZE } from "./pergola-frame";

export function WroughtIronPergola({
  size = WROUGHT_IRON_PERGOLA_SIZE,
}: Partial<Pick<SceneModelProps, "size">>) {
  return (
    <group scale={[size[0] / 4, size[1] / 2.7, size[2] / 3]}>
      <PergolaFrame />
    </group>
  );
}
