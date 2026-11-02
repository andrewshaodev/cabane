import { useMemo } from "react";
import { Shape } from "three";
import { ToonMaterial } from "../../rendering";
import type { StairFlight } from "../flight-geometry";

const SOFFIT_THICKNESS_METERS = 0.2;

/**
 * A straight flight filled to the floor under its first part: stepped top, vertical risers, solid down to the floor under the filled
 * run and a straight sloped underside beyond it.
 */
function FilledStairTreads({ flight, filledRun }: { flight: StairFlight; filledRun: number }) {
  const { riseMeters, runMeters, stepCount, widthMeters } = flight;
  const shape = useMemo(() => {
    const rise = riseMeters / stepCount;
    const run = runMeters / stepCount;
    // Profile in (run, elevation); extruded across the width below.
    const result = new Shape();
    result.moveTo(0, 0);
    for (let index = 0; index < stepCount; index++) {
      result.lineTo(run * index, rise * (index + 1));
      result.lineTo(run * (index + 1), rise * (index + 1));
    }
    const soffitAtEnd = riseMeters - SOFFIT_THICKNESS_METERS;
    if (filledRun >= runMeters) {
      result.lineTo(runMeters, 0);
    } else {
      result.lineTo(runMeters, soffitAtEnd);
      // The fill ends at the floor; the rest of the flight keeps the sloped underside.
      result.lineTo(filledRun, (soffitAtEnd / runMeters) * filledRun);
      result.lineTo(filledRun, 0);
    }
    result.closePath();
    return result;
  }, [filledRun, riseMeters, runMeters, stepCount]);
  const extrusionOptions = useMemo(
    () => ({ depth: widthMeters, bevelEnabled: false }),
    [widthMeters],
  );
  return (
    <mesh
      position={[widthMeters / 2, 0, 0]}
      rotation={[0, -Math.PI / 2, 0]}
      castShadow
      receiveShadow
    >
      <extrudeGeometry args={[shape, extrusionOptions]} />
      <ToonMaterial color="#cbb99a" />
    </mesh>
  );
}

export function StairTreads({ flight }: { flight: StairFlight }) {
  const filledRun =
    "solidBelowRunMeters" in flight.spec
      ? Math.min(flight.spec.solidBelowRunMeters ?? 0, flight.runMeters)
      : 0;
  if (filledRun > 0) return <FilledStairTreads flight={flight} filledRun={filledRun} />;
  const rise = flight.riseMeters / flight.stepCount;
  const run = flight.runMeters / flight.stepCount;
  return (
    <>
      {Array.from({ length: flight.stepCount }, (_, index) => (
        <mesh
          key={index}
          position={[0, rise * (index + 1) - 0.06, run * (index + 0.5)]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[flight.widthMeters, 0.12, run + 0.01]} />
          <ToonMaterial color="#cbb99a" />
        </mesh>
      ))}
    </>
  );
}
