import { planPointToWorld, type FloorSpec } from "@cabane/engine";
import { PlanStroke } from "../editor-preview/construct/PlanDrawing";
import type { FloorReferenceDirection } from "./useAdjacentFloorReferences";

/** Noninteractive plan reference; enabled neighbors also supply alignment snaps. */
export function AdjacentFloorGuide({ floor, direction }: { floor: FloorSpec; direction: FloorReferenceDirection }) {
  const color = direction === "above" ? "#b7c4cc" : "#c6c9bd";
  return <group name={`adjacent-floor-guide-${direction}`} userData={{ floorId: floor.id }}>
    {floor.walls.map((wall) => <PlanStroke key={wall.id} from={planPointToWorld(wall.from, floor.coordinates)}
      to={planPointToWorld(wall.to, floor.coordinates)} color={color} width={.035} elevation={-.012} />)}
    {(floor.outdoorPlatforms ?? []).map(platform => <group key={platform.id} name={`adjacent-platform-${platform.id}`}>
      {platform.polygon.map((point, index, polygon) => <PlanStroke key={index}
        from={planPointToWorld(point, floor.coordinates)}
        to={planPointToWorld(polygon[(index + 1) % polygon.length], floor.coordinates)}
        color={color} width={.035} elevation={-.012} />)}
    </group>)}
  </group>;
}
