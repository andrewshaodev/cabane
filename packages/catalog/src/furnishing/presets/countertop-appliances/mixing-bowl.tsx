import { Vector2 } from "three";
import { ToonMaterial } from "@cabane/engine";
const profile = [
  [0.035, 0.035],
  [0.085, 0.075],
  [0.12, 0.16],
  [0.135, 0.255],
  [0.129, 0.255],
  [0.114, 0.16],
  [0.08, 0.079],
  [0.032, 0.045],
  [0, 0.045],
  [0, 0.035],
].map(([r, y]) => new Vector2(r, y));
/** Real open bowl with wall thickness and a solid bottom, no opaque top cap. */
export function MixingBowl() {
  return (
    <mesh name="open-mixing-bowl" position={[0, 0, 0.065]} castShadow>
      <latheGeometry args={[profile, 32]} />
      <ToonMaterial color="#a5acaa" side={2} />
    </mesh>
  );
}
