import {
  openingWorldPlacement,
  rollUpDoorGeometry,
  type ArchitectureModelProps,
  type DoorSpec,
} from "@cabane/engine";
import { omitUndefinedProperties } from "@cabane/engine";
import { RollUpDoorFrame } from "./roll-up-door-frame";
import { RollUpDoorSlats } from "./roll-up-door-slats";
export function RollUpDoorModel({
  wall,
  opening,
  floor,
  position,
}: ArchitectureModelProps<Extract<DoorSpec, { operation: "roll-up" }>>) {
  const placement = openingWorldPlacement(wall, opening, floor.coordinates);
  const width = placement.widthMeters,
    height = opening.openingHeightMeters;
  const geometry = rollUpDoorGeometry(width, height, position);
  return (
    <group
      name="opening-roll-up-door"
      position={[placement.start[0], opening.sillHeightMeters, placement.start[1]]}
      rotation={[0, placement.rotationY, 0]}
    >
      <RollUpDoorFrame
        {...omitUndefinedProperties({ color: opening.color })}
        width={width}
        height={height}
        depth={wall.thicknessMeters}
        {...geometry}
      />
      <group position={[width / 2, 0, 0]}>
        <RollUpDoorSlats
          width={geometry.clearWidth}
          {...geometry}
          finish={opening.finish}
          {...omitUndefinedProperties({ color: opening.color })}
          side={opening.openingSide === "left" ? -1 : 1}
        />
      </group>
    </group>
  );
}
