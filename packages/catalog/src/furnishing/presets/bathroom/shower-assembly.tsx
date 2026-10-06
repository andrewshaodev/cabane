import type { SceneItemSize } from "@cabane/engine";
import { WideShowerTray } from "./wide-shower-tray";
import { FramelessShowerScreen } from "./frameless-shower-screen";
import { ShowerColumn } from "./shower-column";

export const SHOWER_ASSEMBLY_SIZE = [2.018, 2.3, .908] as const;

export function ShowerAssembly({
  size = SHOWER_ASSEMBLY_SIZE,
}: {
  size?: SceneItemSize;
}) {
  return (
    <group
      name="shower-assembly"
      scale={[
        size[0] / SHOWER_ASSEMBLY_SIZE[0],
        size[1] / SHOWER_ASSEMBLY_SIZE[1],
        size[2] / SHOWER_ASSEMBLY_SIZE[2],
      ]}
    >
      <WideShowerTray />
      <group position={[0, 0, .445]}><FramelessShowerScreen /></group>
      <group position={[.98, 0, -.035]}><ShowerColumn /></group>
    </group>
  );
}
