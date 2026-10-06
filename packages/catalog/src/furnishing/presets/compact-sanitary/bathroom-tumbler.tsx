import { type SceneItemSize } from "@cabane/engine";
import { HollowBathroomCup } from "./hollow-bathroom-cup";
export const BATHROOM_TUMBLER_SIZE = [0.07, 0.1, 0.07] as const;
export function BathroomTumbler({
  size = BATHROOM_TUMBLER_SIZE,
  variant = "default",
}: {
  size?: SceneItemSize;
  variant?: string;
}) {
  return (
    <group name="bathroom-tumbler" scale={[size[0] / 0.07, size[1] / 0.1, size[2] / 0.07]}>
      <HollowBathroomCup color={variant === "white" ? "#e9e5da" : "#974879"} />
    </group>
  );
}
