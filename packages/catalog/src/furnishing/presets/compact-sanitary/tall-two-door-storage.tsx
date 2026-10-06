import { type SceneItemSize } from "@cabane/engine";
import { TwoDoorWallCabinet } from "./two-door-wall-cabinet";
import { CabinetMeetingPulls } from "./cabinet-meeting-pulls";
export const TALL_TWO_DOOR_STORAGE_SIZE = [1, 2.364, 0.425] as const;
/** 38 cm case plus fronts and pulls; full envelope is 42.5 cm. */
export function TallTwoDoorStorage({
  size = TALL_TWO_DOOR_STORAGE_SIZE,
  variant = "default",
}: {
  size?: SceneItemSize;
  variant?: string;
}) {
  return (
    <group
      name="tall-two-door-storage"
      scale={[size[0], size[1] / 2.364, size[2] / 0.425]}
      userData={{ walkCollider: true }}
    >
      <TwoDoorWallCabinet
        size={[1, 2.364, (0.38 * 0.275) / 0.238]}
        variant={variant === "oak" ? "oak" : "white"}
        showPulls={false}
      />
      <group position={[0, 1.017, 0.15]}>
        <CabinetMeetingPulls color={variant === "oak" ? "#252a25" : "#bfa068"} />
      </group>
    </group>
  );
}
