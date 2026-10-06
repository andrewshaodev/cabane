import { CatmullRomCurve3, Vector2, Vector3 } from "three";
import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
export const TALL_GROOMING_DEVICE_SIZE = [0.08, 0.27, 0.08] as const;
const body = [
  [0, 0],
  [0.03, 0],
  [0.035, 0.03],
  [0.04, 0.12],
  [0.035, 0.17],
  [0.025, 0.185],
  [0.02, 0.19],
  [0, 0.19],
].map(([r, y]) => new Vector2(r, y));
const neck = new CatmullRomCurve3([
  new Vector3(0, 0.18, 0),
  new Vector3(0, 0.24, 0),
  new Vector3(0, 0.26, 0.015),
  new Vector3(0, 0.266, 0.03),
]);
/** Appearance-only black handheld grooming device with a connected slim curved nozzle; identity is unspecified. */
export function TallGroomingDevice({ size = TALL_GROOMING_DEVICE_SIZE }: { size?: SceneItemSize }) {
  return (
    <group name="tall-grooming-device" scale={[size[0] / 0.08, size[1] / 0.27, size[2] / 0.08]}>
      <mesh name="grooming-body" castShadow>
        <latheGeometry args={[body, 24]} />
        <ToonMaterial color="#242c28" />
      </mesh>
      <mesh name="grooming-curved-neck">
        <tubeGeometry args={[neck, 24, 0.004, 8, false]} />
        <ToonMaterial color="#242c28" />
      </mesh>
    </group>
  );
}
