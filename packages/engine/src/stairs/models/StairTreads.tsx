import { ToonMaterial } from "../../rendering";
import type { StairFlight } from "../flight-geometry";
export function StairTreads({ flight }: { flight: StairFlight }) {
  const rise = flight.riseMeters / flight.stepCount;
  const run = flight.runMeters / flight.stepCount;
  return <>{Array.from({ length: flight.stepCount }, (_, index) => <mesh key={index}
    position={[0, rise * (index + 1) - 0.06, run * (index + 0.5)]} castShadow receiveShadow>
    <boxGeometry args={[flight.widthMeters, 0.12, run + 0.01]} />
    <ToonMaterial color="#cbb99a" />
  </mesh>)}</>;
}
