import { useMemo } from "react";
import { ToonMaterial } from "../rendering";
import type { FloorCoordinates, PoolSpec } from "../types";
import { POOL_RIM_BASE_Y, poolRimFootprint } from "./pool-footprint";
import { poolShapes } from "./pool-shapes";

export function PoolRim({ pool, coordinates }: { pool: PoolSpec; coordinates: FloorCoordinates }) {
  const shapes = useMemo(() => poolShapes(poolRimFootprint(pool.polygon, coordinates)), [pool.polygon, coordinates]);
  return <mesh name={`pool-rim-${pool.id}`} position={[0, POOL_RIM_BASE_Y, 0]}
    rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
    <extrudeGeometry args={[shapes, { depth: .1, bevelEnabled: false }]} />
    <ToonMaterial color="#e2d9c6" />
  </mesh>;
}
