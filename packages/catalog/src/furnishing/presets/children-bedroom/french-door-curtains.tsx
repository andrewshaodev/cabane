import { Outlines, ToonMaterial } from "@cabane/engine";

export function ChildrenBedroomFrenchDoorCurtains() {
  return (
    <group name="rideaux-porte-fenetre-chambre-enfant">
      <mesh position={[0, 2.26, 0.015]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 1.76, 10]} />
        <ToonMaterial color="#d9d2c8" />
      </mesh>
      {[-0.76, 0.76].map((x) => (
        <group key={x} position={[x, 0, 0.035]}>
          <mesh position={[0, 1.12, 0]} castShadow>
            <boxGeometry args={[0.38, 2.08, 0.035]} />
            <ToonMaterial color="#d8d0c4" transparent opacity={0.9} />
            <Outlines color="#81776c" thickness={0.004} screenspace={false} />
          </mesh>
          {[-0.12, 0, 0.12].map((foldX) => (
            <mesh key={foldX} position={[foldX, 1.12, 0.022]}>
              <boxGeometry args={[0.018, 1.98, 0.018]} />
              <ToonMaterial color="#bfb5a8" />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
