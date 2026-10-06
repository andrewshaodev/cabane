import type { FloorSpec, FloorEditorSelection } from "@cabane/engine";
import { constructPlanToWorld } from "./drag-geometry";
import { PlanStroke } from "./PlanDrawing";
import { useWallFinishPreview } from "./WallFinishPreview";
import { wallFinishSides } from "./wall-finish-sides";

export function WallFinishHighlight({
  floor,
  selection,
}: {
  floor: FloorSpec;
  selection: FloorEditorSelection;
}) {
  const { highlight } = useWallFinishPreview();
  if (
    !highlight ||
    highlight.floorId !== floor.id ||
    selection?.kind !== "wall" ||
    selection.id !== highlight.wallId
  )
    return null;
  const wall = floor.walls.find((candidate) => candidate.id === highlight.wallId);
  if (!wall) return null;
  const { normal, thickness } = wallFinishSides(wall, floor);
  const from = constructPlanToWorld(wall.from, floor.coordinates),
    to = constructPlanToWorld(wall.to, floor.coordinates);
  return (
    <group name="wall-finish-highlight">
      {highlight.sides.map((side) => {
        const offset = (side === "left" ? 1 : -1) * (thickness / 2 + 0.04);
        return (
          <PlanStroke
            key={side}
            from={[from[0] + normal[0] * offset, from[1] + normal[1] * offset]}
            to={[to[0] + normal[0] * offset, to[1] + normal[1] * offset]}
            color="#d48a54"
            width={0.055}
            elevation={0.12}
            overlay
          />
        );
      })}
    </group>
  );
}
