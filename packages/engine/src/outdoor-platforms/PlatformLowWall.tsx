import { Outlines, ToonMaterial } from "../rendering";

export function PlatformLowWall({ length, height, name }: { length: number; height: number; name?: string }) {
  return <mesh name={`${name}-wall`} position={[0, height / 2, 0]} castShadow receiveShadow>
    <boxGeometry args={[length, height, .15]} />
    <ToonMaterial color="#d4c6ae" />
    <Outlines color="#655e53" thickness={.6} />
  </mesh>;
}
