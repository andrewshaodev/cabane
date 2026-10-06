import { type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";
import { CabinetMeetingPulls } from "./cabinet-meeting-pulls";
export const TWO_DOOR_WALL_CABINET_SIZE = [0.85, 1.32, 0.275] as const;
/** Two full-height fronts over a closed wall-supported case; no invented side opening. */
export function TwoDoorWallCabinet({
  size = TWO_DOOR_WALL_CABINET_SIZE,
  variant = "default",
  pullHeightRatio = 0.033 / 1.32,
  showPulls = true,
}: {
  size?: SceneItemSize;
  variant?: string;
  pullHeightRatio?: number;
  showPulls?: boolean;
}) {
  const color =
    variant === "oak"
      ? "#c7a67b"
      : variant === "charcoal"
        ? "#303430"
        : variant === "white"
          ? "#e9e8e1"
          : "#26364d";
  return (
    <group name="two-door-wall-cabinet" scale={[size[0] / 0.85, size[1] / 1.32, size[2] / 0.275]}>
      <RoundedFurniturePanel
        name="cabinet-back"
        size={[0.85, 1.32, 0.012]}
        position={[0, 0.66, 0.006]}
        color={color}
        radius={0.002}
        outline={false}
      />
      {[-0.418, 0.418].map((x) => (
        <RoundedFurniturePanel
          key={x}
          name="cabinet-side"
          size={[0.014, 1.32, 0.226]}
          position={[x, 0.66, 0.125]}
          color={color}
          radius={0.002}
          outline={false}
        />
      ))}
      {[0.008, 1.312].map((y) => (
        <RoundedFurniturePanel
          key={y}
          name="cabinet-horizontal"
          size={[0.822, 0.016, 0.226]}
          position={[0, y, 0.125]}
          color={color}
          radius={0.002}
          outline={false}
        />
      ))}
      {[-0.2135, 0.2135].map((x) => (
        <RoundedFurniturePanel
          key={x}
          name="cabinet-door"
          size={[0.423, 1.314, 0.012]}
          position={[x, 0.66, 0.244]}
          color={color}
          radius={0.002}
          outline={false}
        />
      ))}
      {showPulls && (
        <CabinetMeetingPulls
          height={pullHeightRatio * 1.32}
          color={variant === "charcoal" || variant === "oak" ? "#252a25" : "#bfa068"}
        />
      )}
    </group>
  );
}
