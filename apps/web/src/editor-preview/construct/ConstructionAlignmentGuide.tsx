import type { FloorCoordinates, SnapTarget } from "@cabane/engine";
import { constructPlanToWorld } from "./drag-geometry";
import { PlanStroke } from "./PlanDrawing";

export function ConstructionAlignmentGuide({
  snap,
  coordinates,
}: {
  snap: SnapTarget | null;
  coordinates: FloorCoordinates;
}) {
  if (!snap?.guideFrom) return null;
  return (
    <group name="construction-alignment-guide">
      <PlanStroke
        from={constructPlanToWorld(snap.guideFrom, coordinates)}
        to={constructPlanToWorld(snap.point, coordinates)}
        color="#cf6648"
        width={0.018}
        elevation={0.8}
      />
    </group>
  );
}
