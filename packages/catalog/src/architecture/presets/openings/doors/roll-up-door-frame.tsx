import { ToonMaterial } from "@cabane/engine";
export function RollUpDoorFrame({ width, height, depth, jambWidth, headerHeight }: {
  width: number; height: number; depth: number; jambWidth: number; headerHeight: number;
}) {
  return <group name="roll-up-door-frame">
    {[jambWidth / 2, width - jambWidth / 2].map((x) => <mesh key={x} position={[x, height / 2, 0]} castShadow receiveShadow>
      <boxGeometry args={[jambWidth, height, depth]} /><ToonMaterial color="#7d8581" />
    </mesh>)}
    <mesh position={[width / 2, height - headerHeight / 2, 0]} castShadow receiveShadow>
      <boxGeometry args={[width - jambWidth * 2, headerHeight, depth]} /><ToonMaterial color="#dddcd6" />
    </mesh>
  </group>;
}
