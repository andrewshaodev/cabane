import type { HomeDeviceModelProps } from "@cabane/engine";
import { WallTelevisionModel } from "./wall-television";

export const COMPACT_WALL_TELEVISION_SIZE = [1.58, 0.9, 0.07] as const;
/** Reuse the media-player display at ordinary living-room proportions. */
export function CompactWallTelevisionModel(props: HomeDeviceModelProps) {
  return (
    <group name="compact-wall-television" scale={[1.58 / 2.4, 0.9 / 1.36, 1]}>
      <WallTelevisionModel {...props} />
    </group>
  );
}
