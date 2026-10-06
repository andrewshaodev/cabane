import { Outlines, ToonMaterial } from "@cabane/engine";

export function StorageTopGiraffe() {
  return (
    <group name="peluche-girafe-rangement-bedroom-two" position={[0.25, 0.82, 0]}>
      <mesh position={[0, 0.13, 0]} castShadow>
        <capsuleGeometry args={[0.04, 0.16, 5, 10]} />
        <ToonMaterial color="#c7834f" />
      </mesh>
      <mesh position={[0, 0.27, 0]} castShadow>
        <sphereGeometry args={[0.07, 14, 9]} />
        <ToonMaterial color="#d9a267" />
        <Outlines color="#765139" thickness={0.004} screenspace={false} />
      </mesh>
      {[-0.032, 0.032].map((x) => (
        <mesh key={x} position={[x, 0.35, 0]}>
          <capsuleGeometry args={[0.009, 0.045, 4, 8]} />
          <ToonMaterial color="#8d5b3e" />
        </mesh>
      ))}
    </group>
  );
}
