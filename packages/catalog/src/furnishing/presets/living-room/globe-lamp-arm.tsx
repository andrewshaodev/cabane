import { Quaternion, Vector3 } from "three";
import { ToonMaterial } from "@cabane/engine";

/** Brass spoke connects the hub directly to one globe. */
export function GlobeLampArm({ end }: { end: [number, number, number] }) {
  const start = new Vector3(0, 0.18, 0),
    target = new Vector3(...end);
  const direction = target.clone().sub(start),
    middle = target.clone().add(start).multiplyScalar(0.5);
  const rotation = new Quaternion().setFromUnitVectors(
    new Vector3(0, 1, 0),
    direction.clone().normalize(),
  );
  return (
    <mesh
      name="ceiling-lamp-arm"
      position={[middle.x, middle.y, middle.z]}
      quaternion={[rotation.x, rotation.y, rotation.z, rotation.w]}
    >
      <cylinderGeometry args={[0.006, 0.006, direction.length(), 12]} />
      <ToonMaterial color="#a79165" />
    </mesh>
  );
}
