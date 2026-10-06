import { ToonMaterial } from "../../rendering";
import type { StairFlight } from "../flight-geometry";
export function StairGuards({ flight }: { flight: StairFlight }) {
  const length = Math.hypot(flight.riseMeters, flight.runMeters);
  const count = Math.ceil(flight.runMeters / 0.8);
  return <>{[-1, 1].map(side => <group key={side} position={[side * flight.widthMeters / 2, 0, 0]}>
    <mesh position={[0, flight.riseMeters / 2 + 0.95, flight.runMeters / 2]}
      rotation={[-Math.atan2(flight.riseMeters, flight.runMeters), 0, 0]} castShadow>
      <boxGeometry args={[0.055, 0.055, length]} /><ToonMaterial color="#736c61" />
    </mesh>
    {Array.from({ length: count + 1 }, (_, i) => <mesh key={i}
      position={[0, flight.riseMeters * i / count + 0.475, flight.runMeters * i / count]} castShadow>
      <boxGeometry args={[0.035, 0.95, 0.035]} /><ToonMaterial color="#736c61" />
    </mesh>)}
  </group>)}</>;
}
