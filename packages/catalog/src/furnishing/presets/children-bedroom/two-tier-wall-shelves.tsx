import { Outlines, ToonMaterial } from "@cabane/engine";

export function TwoTierWallShelves() {
  return (
    <group name="etagere-murale-bedroom-two-photo">
      {[
        { y: 0, z: 0 },
        { y: 0.34, z: 0.28 },
      ].map((shelf, index) => (
        <group key={shelf.y} position={[0, shelf.y, shelf.z]}>
          <mesh castShadow>
            <boxGeometry args={[0.3, 0.045, 0.58]} />
            <ToonMaterial color="#ba8050" />
            <Outlines color="#68462c" thickness={0.005} screenspace={false} />
          </mesh>
          <mesh position={[0.08, 0.11, index === 0 ? -0.08 : 0.08]} castShadow>
            <sphereGeometry args={[0.095, 12, 8]} />
            <ToonMaterial color={index === 0 ? "#eee1d5" : "#d3a89c"} />
            <Outlines color="#76645d" thickness={0.004} screenspace={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
