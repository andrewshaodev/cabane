import { ToonMaterial } from "../../rendering";
import type { StairFlight } from "../flight-geometry";
export function StairApertureGuards({ flight }: { flight: StairFlight }) {
  const count = Math.ceil(flight.runMeters / .8);
  return <group position={[0, flight.riseMeters, 0]}>
    {[-1, 1].map(side => <group key={side} position={[side * flight.widthMeters / 2, 0, 0]}>
      <mesh position={[0, .95, flight.runMeters / 2]} castShadow>
        <boxGeometry args={[.055, .055, flight.runMeters]} /><ToonMaterial color="#736c61" />
      </mesh>
      {Array.from({ length: count + 1 }, (_, i) => <mesh key={i} position={[0, .475, flight.runMeters * i / count]} castShadow>
        <boxGeometry args={[.035, .95, .035]} /><ToonMaterial color="#736c61" />
      </mesh>)}
    </group>)}
    <mesh position={[0, .95, 0]} castShadow><boxGeometry args={[flight.widthMeters, .055, .055]} /><ToonMaterial color="#736c61" /></mesh>
  </group>;
}
