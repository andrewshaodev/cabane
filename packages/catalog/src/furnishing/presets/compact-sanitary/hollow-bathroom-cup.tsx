import { Vector2 } from "three";
import { ToonMaterial } from "@cabane/engine";
const profile = [
  [0.035, 0.1],
  [0.031, 0.1],
  [0.026, 0.008],
  [0, 0.008],
  [0, 0],
  [0.029, 0],
  [0.035, 0.1],
].map(([r, y]) => new Vector2(r, y));
/** Hollow tapered cup body, including the bottom and open lip. */
export function HollowBathroomCup({ color, height = 0.1 }: { color: string; height?: number }) {
  return (
    <mesh name="hollow-cup-body" scale={[1, height / 0.1, 1]}>
      <latheGeometry args={[profile, 32]} />
      <ToonMaterial color={color} side={2} />
    </mesh>
  );
}
