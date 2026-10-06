import { useEffect, useMemo } from "react";
import { BufferGeometry, Float32BufferAttribute } from "three";
import { noPlanRaycast, PlanMaterial } from "./PlanDrawing";

export interface BatchedPlanStroke {
  from: readonly [number, number];
  to: readonly [number, number];
  color: string;
  width?: number;
  elevation?: number;
  overlay?: boolean;
}

/** Same rectangular strokes as PlanStroke, combined by drawing style. */
export function planStrokePositions(stroke: BatchedPlanStroke): number[] {
  const { from, to, width = 0.025, elevation = 0.045 } = stroke;
  const dx = to[0] - from[0],
    dz = to[1] - from[1];
  const length = Math.hypot(dx, dz);
  if (length === 0) return [];
  const nx = ((-dz / length) * width) / 2,
    nz = ((dx / length) * width) / 2;
  const a = [from[0] + nx, elevation, from[1] + nz];
  const b = [to[0] + nx, elevation, to[1] + nz];
  const c = [to[0] - nx, elevation, to[1] - nz];
  const d = [from[0] - nx, elevation, from[1] - nz];
  return [...a, ...b, ...c, ...a, ...c, ...d];
}

export function PlanStrokeBatch({
  strokes,
  name,
}: {
  strokes: readonly BatchedPlanStroke[];
  name: string;
}) {
  const batches = useMemo(() => {
    const groups = new Map<string, { color: string; overlay: boolean; positions: number[] }>();
    for (const stroke of strokes) {
      const key = JSON.stringify([stroke.color, Boolean(stroke.overlay)]);
      if (!groups.has(key))
        groups.set(key, { color: stroke.color, overlay: Boolean(stroke.overlay), positions: [] });
      groups.get(key)!.positions.push(...planStrokePositions(stroke));
    }
    return [...groups].map(([key, { positions, ...style }]) => {
      const geometry = new BufferGeometry();
      geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
      geometry.computeVertexNormals();
      geometry.computeBoundingSphere();
      return { key, geometry, ...style };
    });
  }, [strokes]);
  useEffect(() => () => batches.forEach((batch) => batch.geometry.dispose()), [batches]);
  return (
    <group name={name}>
      {batches.map((batch) => (
        <mesh
          key={batch.key}
          geometry={batch.geometry}
          raycast={noPlanRaycast}
          renderOrder={batch.overlay ? 30 : 0}
        >
          <PlanMaterial color={batch.color} overlay={batch.overlay} />
        </mesh>
      ))}
    </group>
  );
}
