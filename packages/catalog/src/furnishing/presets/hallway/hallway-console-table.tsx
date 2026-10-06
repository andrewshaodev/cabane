import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const HALLWAY_CONSOLE_TABLE_SIZE = [1.1, 0.8, 0.35] as const;

/** Narrow hallway console with two shallow drawers. */
export function HallwayConsoleTable({
  size = HALLWAY_CONSOLE_TABLE_SIZE,
}: {
  size?: SceneItemSize;
}) {
  return (
    <group
      name="hallway-console-table"
      scale={[size[0] / 1.1, size[1] / 0.8, size[2] / 0.35]}
      userData={{ walkCollider: true }}
    >
      {[-0.45, 0.45].flatMap((x) =>
        [-0.12, 0.12].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.345, z]} castShadow>
            <boxGeometry args={[0.05, 0.69, 0.05]} />
            <ToonMaterial color="#b58b59" />
          </mesh>
        )),
      )}
      <RoundedFurniturePanel
        size={[1.1, 0.045, 0.35]}
        position={[0, 0.7775, 0]}
        color="#d5b27d"
        radius={0.008}
      />
      <RoundedFurniturePanel
        size={[1.02, 0.15, 0.31]}
        position={[0, 0.68, 0]}
        color="#cda873"
        radius={0.008}
      />
      {[-0.25, 0.25].map((x) => (
        <group key={x}>
          <RoundedFurniturePanel
            name="console-drawer"
            size={[0.46, 0.12, 0.018]}
            position={[x, 0.69, 0.158]}
            color="#ddc092"
            radius={0.006}
          />
          <mesh
            name="console-drawer-knob"
            position={[x, 0.69, 0.167]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.018, 0.018, 0.016, 12]} />
            <ToonMaterial color="#7e7568" />
          </mesh>
        </group>
      ))}
    </group>
  );
}
