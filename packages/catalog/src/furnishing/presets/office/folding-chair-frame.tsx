import { ToonMaterial } from "@cabane/engine";
import { Quaternion, Vector3 } from "three";

/** Crossing tubular supports join floor pads to the seat and back. */
export function FoldingChairFrame() {
  return (
    <group>
      {[-0.205, 0.205].map((x) => (
        <group key={x}>
          {[-0.25, 0.25].map((z) => (
            <mesh name="folding-chair-foot" key={z} position={[x, 0.01, z]}>
              <boxGeometry args={[0.026, 0.02, 0.02]} />
              <ToonMaterial color="#8c9391" />
            </mesh>
          ))}
          {[
            [0.25, 0.78, -0.175],
            [-0.25, 0.44, 0.15],
          ].map(([footZ, topY, topZ]) => {
            const from = new Vector3(x, 0.01, footZ);
            const to = new Vector3(x, topY, topZ);
            const direction = to.clone().sub(from);
            const middle = from.clone().add(to).multiplyScalar(0.5);
            const rotation = new Quaternion().setFromUnitVectors(
              new Vector3(0, 1, 0),
              direction.clone().normalize(),
            );
            return (
              <mesh
                key={footZ}
                name="folding-chair-support"
                position={[middle.x, middle.y, middle.z]}
                quaternion={[rotation.x, rotation.y, rotation.z, rotation.w]}
              >
                <cylinderGeometry args={[0.01, 0.01, direction.length(), 12]} />
                <ToonMaterial color="#a6aaa7" />
              </mesh>
            );
          })}
        </group>
      ))}
    </group>
  );
}
