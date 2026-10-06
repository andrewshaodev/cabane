import { RollUpDoorModel } from "./roll-up-door-model";
import { openingWorldPlacement, resolveOpeningOrientation } from "@cabane/engine";
import type { DoorSpec } from "@cabane/engine";
import { AnimatedOpeningLeaf } from "../animation/animated-opening-leaf";
import { DoorFrame } from "./door-frame";
import { DoorLeaf } from "./door-leaf";
import type { OpeningModelProps } from "../opening-model-props";
import { PlankDoorRail } from "./plank-door-rail";
import { PLANK_DOOR_LEAF_DEPTH_METERS } from "./plank-door-leaf";

const PLANK_DOOR_WALL_GAP_METERS = 0.004;

export function DoorModel({
  wall,
  opening,
  floor,
  position,
  reducedMotion,
}: OpeningModelProps<DoorSpec>) {
  if (opening.operation === "roll-up")
    return (
      <RollUpDoorModel
        wall={wall}
        opening={opening}
        floor={floor}
        position={position}
        reducedMotion={reducedMotion}
      />
    );
  const placement = openingWorldPlacement(wall, opening, floor.coordinates);
  const orientation = resolveOpeningOrientation(opening);
  const paired = opening.leafCount === 2;
  // Opposing door leaves meet at the center instead of each losing clearance.
  const gap = paired ? 0 : 0.018;
  const leafWidth = Math.max(0.08, placement.widthMeters / opening.leafCount - gap);
  const leafHeight = Math.max(0.08, opening.openingHeightMeters - 0.03);
  const frontMountedPlankDoor = opening.operation === "sliding" && opening.variant === "plank";
  const plankLeafCenterZ =
    wall.thicknessMeters / 2 + PLANK_DOOR_WALL_GAP_METERS + PLANK_DOOR_LEAF_DEPTH_METERS / 2;

  return (
    <group
      name={`opening-model-${opening.variant}`}
      position={[placement.start[0], opening.sillHeightMeters, placement.start[1]]}
      rotation={[0, placement.rotationY, 0]}
    >
      {opening.variant !== "full-glass" && (
        <DoorFrame wall={wall} width={placement.widthMeters} height={opening.openingHeightMeters} />
      )}
      {opening.operation === "sliding" && opening.variant === "plank" && (
        <PlankDoorRail
          width={placement.widthMeters}
          height={opening.openingHeightMeters}
          wallThickness={wall.thicknessMeters}
          leafWidth={leafWidth}
          orientation={orientation}
        />
      )}
      {orientation.leaves.map((leaf, index) => {
        const hinged = opening.operation === "hinged";
        const hingeAtEnd = hinged && leaf.hingeAtEnd;
        const segmentStart = leaf.startRatio * placement.widthMeters;
        const pivotX = hinged ? leaf.pivotRatio * placement.widthMeters : segmentStart;
        const childX = hingeAtEnd ? -leafWidth / 2 : leafWidth / 2;
        const direction = hinged ? leaf.rotationSign : leaf.slideSign;

        return (
          <group
            key={index}
            name={frontMountedPlankDoor ? "opening-plank-sliding-leaf-mount" : undefined}
            position={[
              pivotX,
              opening.openingHeightMeters / 2,
              frontMountedPlankDoor
                ? plankLeafCenterZ * orientation.sideSign
                : (paired ? 0 : index % 2 === 0 ? -0.016 : 0.016) * orientation.sideSign,
            ]}
          >
            <AnimatedOpeningLeaf
              operation={opening.operation}
              open={position > 0}
              reducedMotion={reducedMotion}
              direction={direction}
              travel={leafWidth}
            >
              <group position={[childX, 0, 0]} scale={[1, 1, orientation.sideSign]}>
                <DoorLeaf
                  opening={opening}
                  width={leafWidth}
                  height={leafHeight}
                  handleSide={hinged ? leaf.extentSign : (-leaf.slideSign as -1 | 1)}
                />
              </group>
            </AnimatedOpeningLeaf>
          </group>
        );
      })}
    </group>
  );
}
