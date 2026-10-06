import {
  planPointToWorld,
  worldPointToPlan,
  pointOnFloorSupport,
  type FloorSpec,
  type PlanPoint,
} from "@cabane/engine";
import { PlanOverlayMaterial, noPlanRaycast } from "./PlanDrawing";

/** The placement surface intercepts clicks before the construction geometry. */
export function WalkStartPointer({
  floor,
  start,
  placing,
  onPlace,
}: {
  floor: FloorSpec;
  start?: { floorId: string; at: PlanPoint } | undefined;
  placing: boolean;
  onPlace: (at: PlanPoint) => void;
}) {
  const position =
    start?.floorId === floor.id ? planPointToWorld(start.at, floor.coordinates) : null;
  return (
    <>
      {placing && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 10, 0]}
          onPointerDown={(event) => event.stopPropagation()}
          onPointerUp={(event) => event.stopPropagation()}
          onPointerMove={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            if (event.button !== 0) return;
            const at = worldPointToPlan(event.point, floor.coordinates);
            if (pointOnFloorSupport(at, floor)) onPlace(at);
          }}
        >
          <planeGeometry args={[10000, 10000]} />
          <PlanOverlayMaterial visible={false} transparent opacity={0} depthWrite={false} />
        </mesh>
      )}
      {position && (
        <group position={[position[0], 0.2, position[1]]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={100} raycast={noPlanRaycast}>
            <ringGeometry args={[0.18, 0.25, 32]} />
            <PlanOverlayMaterial color="#d16c39" depthTest={false} depthWrite={false} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={101} raycast={noPlanRaycast}>
            <circleGeometry args={[0.14, 3]} />
            <PlanOverlayMaterial color="#d16c39" depthTest={false} depthWrite={false} />
          </mesh>
        </group>
      )}
    </>
  );
}
