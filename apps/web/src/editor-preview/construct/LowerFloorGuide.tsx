import { planPointToWorld, type FloorSpec } from "@cabane/engine";
import { PlanStroke } from "./PlanDrawing";
/** Read-only alignment reference, deliberately absent from snap and hit-test inputs. */
export function LowerFloorGuide({ floor }: { floor: FloorSpec }) {
  return <group name="lower-floor-guide">
    {floor.walls.map((wall) => <PlanStroke key={wall.id} from={planPointToWorld(wall.from, floor.coordinates)}
      to={planPointToWorld(wall.to, floor.coordinates)} color="#c6c9bd" width={.035} elevation={-.012} />)}
  </group>;
}
