import { openingWorldPlacement, type FloorSpec } from "@cabane/engine";
import { memo } from "react";
import { openingPlanSymbol } from "../construct/opening-plan-symbol";
import { PlanStroke } from "../construct/PlanDrawing";

/** Door swing symbols keep openings legible over the 3D scene in Arrange's top view. */
export const ArrangePlanOpenings = memo(function ArrangePlanOpenings({ floor }: { floor: FloorSpec }) {
  return (
    <group name="arrange-plan-openings">
      {floor.openings.map((opening) => {
        if (opening.kind !== "door") return null;
        const wall = floor.walls.find((candidate) => candidate.id === opening.wallId);
        if (!wall) return null;
        const placement = openingWorldPlacement(wall, opening, floor.coordinates);
        return (
          <group
            key={opening.id}
            name={`arrange-plan-opening-${opening.id}`}
            position={[placement.start[0], 0, placement.start[1]]}
            rotation={[0, placement.rotationY, 0]}
          >
            {openingPlanSymbol(opening, placement.widthMeters, wall.thicknessMeters).map((stroke, index) => (
              <PlanStroke key={index} {...stroke} overlay />
            ))}
          </group>
        );
      })}
    </group>
  );
});
