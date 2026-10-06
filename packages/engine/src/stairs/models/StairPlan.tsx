import type { ThreeElements } from "@react-three/fiber";
import type { StairFlight } from "../flight-geometry";
import { ToonMaterial } from "../../rendering";
import { StairPlanStrokes } from "./StairPlanStrokes";

/** A floor-level drawing, shared by both ends of a flight and both plan editors. */
export function StairPlan({ flight, upper = false, selected = false, invalid = false, handlers, onSelect }: {
  handlers?: Pick<ThreeElements["mesh"], "onPointerDown" | "onPointerMove" | "onPointerUp" | "onPointerCancel">; invalid?: boolean;
  flight: StairFlight; upper?: boolean; selected?: boolean; onSelect?: () => void;
}) {
  const width = flight.widthMeters;
  const run = flight.runMeters;
  const ink = invalid ? "#bc433a" : selected ? "#ff754d" : upper ? "#6b7881" : "#35434c";
  return <group name={`stair-plan-${flight.id}`} position={[flight.startWorld[0], .13, flight.startWorld[1]]} rotation={[0, flight.rotationYRadians, 0]}>
    <mesh name={`stair-plan-hit-${flight.id}`} position={[0, 0, run / 2]}
      onClick={onSelect ? event => event.stopPropagation() : undefined}
      onPointerDown={onSelect ? event => { event.stopPropagation(); onSelect(); } : undefined}
      {...(!onSelect && !handlers ? { raycast: () => undefined } : {})}
      {...handlers}>
      <boxGeometry args={[width, .004, run]} />
      <ToonMaterial color="#000000" emissive={invalid ? "#f5c8c4" : selected ? "#f5d1ba" : "#f3ede0"} emissiveIntensity={1} toneMapped={false} />
    </mesh>
    <StairPlanStrokes flight={flight} upper={upper} ink={ink} />
  </group>;
}
