import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const HALLWAY_CONSOLE_TABLE_SIZE = [1.1, .8, .35] as const;

/** Narrow hallway console with two shallow drawers. */
export function HallwayConsoleTable({ size = HALLWAY_CONSOLE_TABLE_SIZE }: { size?: SceneItemSize }) {
  return <group name="hallway-console-table"
    scale={[size[0] / 1.1, size[1] / .8, size[2] / .35]}
    userData={{ walkCollider: true }}>
    {[-.45, .45].flatMap((x) => [-.12, .12].map((z) => <mesh
      key={`${x}-${z}`} position={[x, .345, z]} castShadow>
      <boxGeometry args={[.05, .69, .05]} /><ToonMaterial color="#b58b59" />
    </mesh>))}
    <RoundedFurniturePanel size={[1.1, .045, .35]} position={[0, .7775, 0]}
      color="#d5b27d" radius={.008} />
    <RoundedFurniturePanel size={[1.02, .15, .31]} position={[0, .68, 0]}
      color="#cda873" radius={.008} />
    {[-.25, .25].map((x) => <group key={x}>
      <RoundedFurniturePanel name="console-drawer" size={[.46, .12, .018]}
        position={[x, .69, .158]} color="#ddc092" radius={.006} />
      <mesh name="console-drawer-knob" position={[x, .69, .167]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[.018, .018, .016, 12]} /><ToonMaterial color="#7e7568" />
      </mesh>
    </group>)}
  </group>;
}
