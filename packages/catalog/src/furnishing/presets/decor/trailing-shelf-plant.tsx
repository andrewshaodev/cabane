import { Quaternion, Vector3 } from "three";
import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
export const TRAILING_SHELF_PLANT_SIZE = [0.26, 0.57, 0.18] as const;
/** Pot base is the shelf origin; trailing foliage extends 35 cm below it. */
export function TrailingShelfPlant({ size = TRAILING_SHELF_PLANT_SIZE }: { size?: SceneItemSize }) {
  const leaves: [number, number, number][] = [
    [-0.1, 0.185, 0],
    [0.1, 0.185, 0],
    [-0.025, 0.06, 0.08],
    [0.025, -0.015, 0.09],
    [-0.025, -0.09, 0.098],
    [0.025, -0.165, 0.098],
    [-0.025, -0.24, 0.098],
    [0.025, -0.315, 0.098],
  ];
  return (
    <group name="trailing-shelf-plant" scale={[size[0] / 0.26, size[1] / 0.57, size[2] / 0.18]}>
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.065, 0.05, 0.12, 20]} />
        <ToonMaterial color="#dfdfd4" />
      </mesh>
      {leaves.map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} scale={[0.03, 0.035, 0.017]}>
          <sphereGeometry args={[1, 12, 8]} />
          <ToonMaterial color={i % 2 ? "#668567" : "#476849"} />
        </mesh>
      ))}
      {leaves.map((end, i) => {
        const start = new Vector3(0, 0.1, 0),
          target = new Vector3(...end),
          direction = target.clone().sub(start),
          middle = target.clone().add(start).multiplyScalar(0.5);
        const q = new Quaternion().setFromUnitVectors(
          new Vector3(0, 1, 0),
          direction.clone().normalize(),
        );
        return (
          <mesh key={i} position={[middle.x, middle.y, middle.z]} quaternion={[q.x, q.y, q.z, q.w]}>
            <cylinderGeometry args={[0.002, 0.002, direction.length(), 8]} />
            <ToonMaterial color="#526e45" />
          </mesh>
        );
      })}
    </group>
  );
}
