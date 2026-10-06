import type { SceneItemSize } from "@cabane/engine";
import { RoundPlatformVent } from "./round-platform-vent";

export const ROUND_WALL_VENT_SIZE = [0.11, 0.11, 0.01] as const;

/** Static circular white ventilation cover, back plane Z=0 and front +Z. */
export function RoundWallVent({ size = ROUND_WALL_VENT_SIZE }: { size?: SceneItemSize }) {
  return (
    <group name="round-wall-vent" position={[0, size[1] / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <RoundPlatformVent size={[size[0], size[2], size[1]]} />
    </group>
  );
}
