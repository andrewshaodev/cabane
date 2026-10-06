import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const THREE_DOOR_SIDEBOARD_SIZE = [1.6, .82, .45] as const;

/** Low three-door dining storage with an overhanging oak top. */
export function ThreeDoorSideboard({ size = THREE_DOOR_SIDEBOARD_SIZE }: { size?: SceneItemSize }) {
  return <group name="three-door-sideboard"
    scale={[size[0] / 1.6, size[1] / .82, size[2] / .45]}
    userData={{ walkCollider: true }}>
    {[-.68, .68].flatMap((x) => [-.17, .17].map((z) => <mesh
      key={`${x}-${z}`} position={[x, .07, z]} castShadow>
      <boxGeometry args={[.055, .14, .055]} /><ToonMaterial color="#a67d50" />
    </mesh>))}
    <RoundedFurniturePanel size={[1.5, .62, .39]} position={[0, .45, -.02]}
      color="#d0ac79" radius={.012} />
    {[-.50, 0, .50].map((x) => <group key={x}>
      <RoundedFurniturePanel name="sideboard-door" size={[.47, .54, .04]}
        position={[x, .46, .195]} color="#d9b987" radius={.008} />
      <mesh name="sideboard-handle" position={[x + .14, .47, .22]}>
        <boxGeometry args={[.025, .13, .01]} /><ToonMaterial color="#8c7560" />
      </mesh>
    </group>)}
    <RoundedFurniturePanel size={[1.6, .05, .45]} position={[0, .795, 0]}
      color="#d8b47e" radius={.009} />
  </group>;
}
