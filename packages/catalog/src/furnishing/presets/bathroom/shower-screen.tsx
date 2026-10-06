import { Outlines, ToonMaterial } from "@cabane/engine";

export function ShowerScreen() {
  return (
    <group name="shower-screen">
      <mesh position={[0, 0.9, 0]} castShadow>
        <boxGeometry args={[1.05, 1.76, 0.012]} />
        <ToonMaterial color="#c7d9dc" transparent opacity={0.24} depthWrite={false} />
        <Outlines color="#8e9b9c" thickness={0.003} />
      </mesh>
      {[-0.525, 0.525].map((x) => (
        <mesh key={x} position={[x, 0.9, 0]} castShadow>
          <boxGeometry args={[0.018, 1.8, 0.025]} />
          <ToonMaterial color="#aeb5b2" />
        </mesh>
      ))}
      <mesh position={[0, 1.79, 0]} castShadow>
        <boxGeometry args={[1.07, 0.018, 0.025]} />
        <ToonMaterial color="#aeb5b2" />
      </mesh>
      <mesh position={[-0.36, 0.92, -0.035]}>
        <boxGeometry args={[0.018, 0.34, 0.035]} />
        <ToonMaterial color="#89918f" />
      </mesh>
    </group>
  );
}

export function ShowerTray() {
  return (
    <group name="shower-tray">
      <mesh position={[0, 0.018, 0]} receiveShadow>
        <boxGeometry args={[1.64, 0.035, 1.18]} />
        <ToonMaterial color="#c9c0b1" />
        <Outlines color="#857e73" thickness={0.004} />
      </mesh>
      <mesh position={[0.48, 0.038, 0.25]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.055, 0.055, 0.008, 16]} />
        <ToonMaterial color="#7d8583" />
      </mesh>
    </group>
  );
}
