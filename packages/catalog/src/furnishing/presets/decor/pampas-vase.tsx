import { Outlines, ToonMaterial } from "@cabane/engine";

export function PampasVase() {
  return (
    <group name="vase-pampa-salon">
      <mesh castShadow position={[0, 0.13, 0]}>
        <cylinderGeometry args={[0.08, 0.065, 0.26, 14]} />
        <ToonMaterial color="#59705d" />
        <Outlines color="#35453a" thickness={0.006} screenspace={false} />
      </mesh>
      {[-0.2, -0.1, 0, 0.1, 0.2].map((tilt, index) => (
        <group key={tilt} rotation={[tilt * 0.14, 0, tilt]}>
          <mesh castShadow position={[tilt * 0.2, 0.49, 0]}>
            <cylinderGeometry args={[0.006, 0.008, 0.55, 6]} />
            <ToonMaterial color="#9a7b54" />
          </mesh>
          <mesh
            castShadow
            position={[tilt * 0.42, 0.77, 0]}
            rotation={[0, 0, tilt * 0.8]}
            scale={[0.48, 1.5, 0.48]}
          >
            <sphereGeometry args={[0.09, 10, 7]} />
            <ToonMaterial color={index % 2 === 0 ? "#d8bc91" : "#c9aa7c"} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
