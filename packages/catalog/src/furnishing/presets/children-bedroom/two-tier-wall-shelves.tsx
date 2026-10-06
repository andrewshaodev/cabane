import { Outlines, ToonMaterial } from "@cabane/engine";

export function TwoTierWallShelves() {
  return (
    <group name="etagere-murale-bedroom-two-photo">
      {[{ y: 0, z: 0 }, { y: .34, z: .28 }].map((shelf, index) => (
        <group key={shelf.y} position={[0, shelf.y, shelf.z]}>
          <mesh castShadow>
            <boxGeometry args={[.3, .045, .58]} />
            <ToonMaterial color="#ba8050" />
            <Outlines color="#68462c" thickness={.005} screenspace={false} />
          </mesh>
          <mesh position={[.08, .11, index === 0 ? -.08 : .08]} castShadow>
            <sphereGeometry args={[.095, 12, 8]} />
            <ToonMaterial color={index === 0 ? "#eee1d5" : "#d3a89c"} />
            <Outlines color="#76645d" thickness={.004} screenspace={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
