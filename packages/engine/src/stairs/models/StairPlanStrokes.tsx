import { useLayoutEffect, useMemo, useRef } from "react";
import { InstancedMesh, Object3D } from "three";
import { ToonMaterial } from "../../rendering";
import type { StairFlight } from "../flight-geometry";

/** Rails, treads and arrow share one unit box and one draw call. */
export function StairPlanStrokes({
  flight,
  upper,
  ink,
}: {
  flight: StairFlight;
  upper: boolean;
  ink: string;
}) {
  const ref = useRef<InstancedMesh>(null);
  const { widthMeters: width, runMeters: run, stepCount } = flight;
  const strokes = useMemo(() => {
    const direction = upper ? -1 : 1;
    const tip = run * (upper ? 0.2 : 0.8);
    return [
      [-width / 2, 0.002, run / 2, 0.025, run, 0],
      [width / 2, 0.002, run / 2, 0.025, run, 0],
      ...Array.from({ length: stepCount + 1 }, (_, index) => [
        0,
        0.002,
        (run * index) / stepCount,
        width,
        0.018,
        0,
      ]),
      [0, 0.017, run / 2, 0.035, run * 0.6, 0],
      [-0.09, 0.017, tip - direction * 0.09, 0.025, 0.25, (direction * Math.PI) / 4],
      [0.09, 0.017, tip - direction * 0.09, 0.025, 0.25, (-direction * Math.PI) / 4],
    ];
  }, [width, run, stepCount, upper]);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const transform = new Object3D();
    strokes.forEach(([x, y, z, width, depth, angle], index) => {
      transform.position.set(x, y, z);
      transform.rotation.set(0, angle, 0);
      transform.scale.set(width, 0.008, depth);
      transform.updateMatrix();
      ref.current!.setMatrixAt(index, transform.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
    ref.current.computeBoundingSphere();
  }, [strokes]);
  return (
    <instancedMesh
      name="stair-plan-strokes"
      ref={ref}
      args={[undefined, undefined, strokes.length]}
      raycast={() => undefined}
    >
      <boxGeometry />
      <ToonMaterial color="#000000" emissive={ink} emissiveIntensity={1} toneMapped={false} />
    </instancedMesh>
  );
}
