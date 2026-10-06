import { ToonMaterial } from "@cabane/engine";
import { Quaternion, Vector3 } from "three";

/** Crossed beams connect floor skids to the underside of the keyboard. */
export function KeyboardCrossStand() {
  return (
    <group name="keyboard-cross-stand">
      {[-0.07, 0.07].flatMap((z) =>
        [-1, 1].map((side) => {
          const from = new Vector3(-0.43 * side, 0.035, z),
            to = new Vector3(0.43 * side, 0.735, z);
          const direction = to.clone().sub(from);
          return (
            <mesh
              key={`${z}-${side}`}
              position={from.clone().add(to).multiplyScalar(0.5).toArray()}
              quaternion={new Quaternion()
                .setFromUnitVectors(new Vector3(0, 1, 0), direction.clone().normalize())
                .toArray()}
              castShadow
            >
              <boxGeometry args={[0.035, direction.length(), 0.035]} />
              <ToonMaterial color="#24282b" />
            </mesh>
          );
        }),
      )}
      {[-0.43, 0.43].map((x) => (
        <mesh key={x} position={[x, 0.0175, 0]} castShadow>
          <boxGeometry args={[0.08, 0.035, 0.34]} />
          <ToonMaterial color="#24282b" />
        </mesh>
      ))}
    </group>
  );
}
