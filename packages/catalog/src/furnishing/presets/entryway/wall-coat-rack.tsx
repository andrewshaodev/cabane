import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const WALL_COAT_RACK_SIZE = [0.8, 0.32, 0.22] as const;

/** Wall panel with a shallow top shelf and five supported coat hooks. */
export function WallCoatRack({ size = WALL_COAT_RACK_SIZE }: { size?: SceneItemSize }) {
  return (
    <group name="wall-coat-rack" scale={[size[0] / 0.8, size[1] / 0.32, size[2] / 0.22]}>
      <RoundedFurniturePanel
        size={[0.8, 0.3, 0.035]}
        position={[0, 0.15, 0.0175]}
        color="#cfaa76"
        radius={0.008}
      />
      <RoundedFurniturePanel
        name="coat-rack-top-shelf"
        size={[0.78, 0.05, 0.22]}
        position={[0, 0.295, 0.11]}
        color="#d9b682"
        radius={0.007}
      />
      {[-0.3, -0.15, 0, 0.15, 0.3].map((x) => (
        <group key={x} position={[x, 0.14, 0.04]}>
          <mesh name="coat-hook-support" position={[0, 0, 0.035]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.018, 0.018, 0.07, 10]} />
            <ToonMaterial color="#707975" />
          </mesh>
          <mesh name="coat-hook-tip" position={[0, 0.038, 0.075]}>
            <cylinderGeometry args={[0.014, 0.014, 0.08, 10]} />
            <ToonMaterial color="#707975" />
          </mesh>
        </group>
      ))}
    </group>
  );
}
