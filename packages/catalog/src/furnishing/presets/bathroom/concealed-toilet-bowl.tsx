import { Vector2 } from "three";
import { ToonMaterial } from "@cabane/engine";

// Closed ceramic cross-section: rounded underside, lip, hollow basin, drain well.
const BOWL_PROFILE = [
  [0, 0.19],
  [0.075, 0.19],
  [0.13, 0.22],
  [0.178, 0.29],
  [0.2, 0.375],
  [0.2, 0.413],
  [0.192, 0.423],
  [0.169, 0.423],
  [0.16, 0.407],
  [0.143, 0.34],
  [0.09, 0.285],
  [0.045, 0.265],
  [0, 0.265],
].map(([radius, height]) => new Vector2(radius, height));

// An actual seat ring, with its opening above the basin rather than a solid cap.
const SEAT_PROFILE = [
  [0.166, 0.426],
  [0.193, 0.426],
  [0.2, 0.433],
  [0.2, 0.444],
  [0.193, 0.451],
  [0.158, 0.451],
  [0.152, 0.444],
  [0.152, 0.433],
  [0.166, 0.426],
].map(([radius, height]) => new Vector2(radius, height));

export function ConcealedToiletBowl() {
  return (
    <group position={[0.438, 0, 0]} scale={[1.4, 1, 1]}>
      <mesh name="hollow-ceramic-bowl" castShadow receiveShadow>
        <latheGeometry args={[BOWL_PROFILE, 32]} />
        <ToonMaterial color="#e9e7e0" />
      </mesh>
      <mesh name="open-toilet-seat" castShadow receiveShadow>
        <latheGeometry args={[SEAT_PROFILE, 32]} />
        <ToonMaterial color="#faf9f4" />
      </mesh>
      {[-0.11, 0.11].map((z) => (
        <mesh key={z} name="seat-support" position={[-0.145, 0.425, z]}>
          <boxGeometry args={[0.025, 0.012, 0.025]} />
          <ToonMaterial color="#d8d6cf" />
        </mesh>
      ))}
    </group>
  );
}
