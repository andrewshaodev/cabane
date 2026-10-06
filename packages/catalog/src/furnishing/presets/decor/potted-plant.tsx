import { Outlines, ToonMaterial } from "@cabane/engine";

export function PottedPlant({
  potColor = "#c6785e",
  potOutlineColor = "#75493c",
}: {
  potColor?: string;
  potOutlineColor?: string;
}) {
  const leaves: readonly [number, number, number][] = [
    [-0.12, 0.54, 0],
    [0.12, 0.62, 0.03],
    [0, 0.78, -0.06],
  ];

  return (
    <group name="potted-plant">
      <mesh position={[0, 0.18, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.22, 0.16, 0.36, 14]} />
        <ToonMaterial color={potColor} />
        <Outlines color={potOutlineColor} thickness={0.006} />
      </mesh>
      {leaves.map((position, index) => (
        <mesh key={index} position={position} scale={[0.75, 1.3, 0.55]} castShadow>
          <sphereGeometry args={[0.25, 12, 8]} />
          <ToonMaterial color={index === 1 ? "#789767" : "#66885c"} />
        </mesh>
      ))}
    </group>
  );
}
