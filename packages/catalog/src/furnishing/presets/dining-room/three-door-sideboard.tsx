import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const THREE_DOOR_SIDEBOARD_SIZE = [1.6, 0.82, 0.45] as const;

/** Low three-door dining storage with an overhanging oak top. */
export function ThreeDoorSideboard({ size = THREE_DOOR_SIDEBOARD_SIZE }: { size?: SceneItemSize }) {
  return (
    <group
      name="three-door-sideboard"
      scale={[size[0] / 1.6, size[1] / 0.82, size[2] / 0.45]}
      userData={{ walkCollider: true }}
    >
      {[-0.68, 0.68].flatMap((x) =>
        [-0.17, 0.17].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.07, z]} castShadow>
            <boxGeometry args={[0.055, 0.14, 0.055]} />
            <ToonMaterial color="#a67d50" />
          </mesh>
        )),
      )}
      <RoundedFurniturePanel
        size={[1.5, 0.62, 0.39]}
        position={[0, 0.45, -0.02]}
        color="#d0ac79"
        radius={0.012}
      />
      {[-0.5, 0, 0.5].map((x) => (
        <group key={x}>
          <RoundedFurniturePanel
            name="sideboard-door"
            size={[0.47, 0.54, 0.04]}
            position={[x, 0.46, 0.195]}
            color="#d9b987"
            radius={0.008}
          />
          <mesh name="sideboard-handle" position={[x + 0.14, 0.47, 0.22]}>
            <boxGeometry args={[0.025, 0.13, 0.01]} />
            <ToonMaterial color="#8c7560" />
          </mesh>
        </group>
      ))}
      <RoundedFurniturePanel
        size={[1.6, 0.05, 0.45]}
        position={[0, 0.795, 0]}
        color="#d8b47e"
        radius={0.009}
      />
    </group>
  );
}
