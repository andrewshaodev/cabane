import { StairApertureGuards } from "./StairApertureGuards";
import type { StairFlight } from "../flight-geometry";
import { StairTreads } from "./StairTreads";
import { StairGuards } from "./StairGuards";
export function StraightStairModel({ flight, plan = false, showUpperGuard = true }: { flight: StairFlight; plan?: boolean; showUpperGuard?: boolean }) {
  return <group name={`stair-${flight.id}`} position={[flight.startWorld[0], plan ? 0 : flight.baseElevationMeters, flight.startWorld[1]]}
    rotation={[0, flight.rotationYRadians, 0]} scale={[1, plan ? 0.001 : 1, 1]}>
    <StairTreads flight={flight} /><StairGuards flight={flight} />
    {!plan && showUpperGuard && <StairApertureGuards flight={flight} />}
  </group>;
}
