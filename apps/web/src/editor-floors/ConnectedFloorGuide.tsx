import { Html } from "@react-three/drei";
import { planPointToWorld, type FloorSpec, type PlanPoint } from "@cabane/engine";
import { PlanStroke } from "../editor-preview/construct/PlanDrawing";

/** Both above and below references use the same noninteractive plan projection. */
export function ConnectedFloorGuide({ floor }: { floor: FloorSpec }) {
  const polygon = (points: readonly PlanPoint[], prefix: string) => points.map((from, index) =>
    <PlanStroke key={`${prefix}-${index}`} from={planPointToWorld(from, floor.coordinates)}
      to={planPointToWorld(points[(index + 1) % points.length], floor.coordinates)}
      color="#b4bcb9" width={.025} elevation={.11} overlay />);
  const anchor = floor.footprint[0] ? planPointToWorld(floor.footprint[0], floor.coordinates) : [0, 0];
  return <group name="connected-floor-guide">
    {polygon(floor.footprint, "footprint")}
    {floor.walls.map(wall => <PlanStroke key={wall.id} from={planPointToWorld(wall.from, floor.coordinates)}
      to={planPointToWorld(wall.to, floor.coordinates)} color="#b4bcb9" width={.045} elevation={.11} overlay />)}
    {floor.openings.map(opening => {
      const wall = floor.walls.find(w => w.id === opening.wallId);
      if (!wall) return null;
      const from = planPointToWorld(wall.from, floor.coordinates), to = planPointToWorld(wall.to, floor.coordinates);
      const length = Math.hypot(to[0] - from[0], to[1] - from[1]);
      if (!length) return null;
      const offset = opening.offsetFromWallStartPlanUnits * floor.coordinates.metersPerPlanUnit;
      const point = (distance: number): [number, number] => [from[0] + (to[0] - from[0]) * distance / length, from[1] + (to[1] - from[1]) * distance / length];
      return <PlanStroke key={opening.id} from={point(offset)} to={point(offset + opening.widthPlanUnits * floor.coordinates.metersPerPlanUnit)}
        color="#d8dfdc" width={.10} elevation={.115} overlay />;
    })}
    {(floor.pools ?? []).flatMap(pool => polygon(pool.polygon, pool.id))}
    <Html position={[anchor[0], .12, anchor[1]]} style={{ pointerEvents: "none", whiteSpace: "nowrap", color: "#667773" }}>
      {floor.name} · reference
    </Html>
  </group>;
}
