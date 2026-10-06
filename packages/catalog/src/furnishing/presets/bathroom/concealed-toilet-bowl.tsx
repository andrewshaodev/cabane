import { Vector2 } from "three";
import { ToonMaterial } from "@cabane/engine";

// Closed ceramic cross-section: rounded underside, lip, hollow basin, drain well.
const BOWL_PROFILE = [
  [0, .19], [.075, .19], [.13, .22], [.178, .29], [.2, .375],
  [.2, .413], [.192, .423], [.169, .423], [.16, .407],
  [.143, .34], [.09, .285], [.045, .265], [0, .265],
].map(([radius, height]) => new Vector2(radius, height));

// An actual seat ring, with its opening above the basin rather than a solid cap.
const SEAT_PROFILE = [
  [.166, .426], [.193, .426], [.2, .433], [.2, .444],
  [.193, .451], [.158, .451], [.152, .444], [.152, .433], [.166, .426],
].map(([radius, height]) => new Vector2(radius, height));

export function ConcealedToiletBowl() {
  return (
    <group position={[.438, 0, 0]} scale={[1.4, 1, 1]}>
      <mesh name="hollow-ceramic-bowl" castShadow receiveShadow>
        <latheGeometry args={[BOWL_PROFILE, 32]} />
        <ToonMaterial color="#e9e7e0" />
      </mesh>
      <mesh name="open-toilet-seat" castShadow receiveShadow>
        <latheGeometry args={[SEAT_PROFILE, 32]} />
        <ToonMaterial color="#faf9f4" />
      </mesh>
      {[-.11, .11].map((z) => (
        <mesh key={z} name="seat-support" position={[-.145, .425, z]}>
          <boxGeometry args={[.025, .012, .025]} />
          <ToonMaterial color="#d8d6cf" />
        </mesh>
      ))}
    </group>
  );
}
