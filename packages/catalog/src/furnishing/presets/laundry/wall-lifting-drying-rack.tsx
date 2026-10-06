import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { LiftingRackTray } from "./lifting-rack-tray";
import { LiftingRackChain } from "./lifting-rack-chain";

export const WALL_LIFTING_DRYING_RACK_SIZE = [1.2, 1.6, 0.55] as const;

/** Static two-tray lifting rack: back support at Z=0, front toward +Z. */
export function WallLiftingDryingRack({
  size = WALL_LIFTING_DRYING_RACK_SIZE,
}: {
  size?: SceneItemSize;
}) {
  return (
    <group name="wall-lifting-drying-rack" scale={[size[0] / 1.2, size[1] / 1.6, size[2] / 0.55]}>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          name={`lifting-rack-guide-${side}`}
          position={[side * 0.54, 0.7925, 0.02]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[0.024, 1.585, 0.04]} />
          <ToonMaterial color="#b5bab5" />
        </mesh>
      ))}
      <mesh name="lifting-rack-top-bar" position={[0, 1.585, 0.0175]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.03, 0.035]} />
        <ToonMaterial color="#9da5a3" />
      </mesh>
      <mesh
        name="lifting-rack-pulley"
        position={[-0.55, 1.52, 0.05]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[0.04, 0.04, 0.03, 16]} />
        <ToonMaterial color="#aaaead" />
      </mesh>
      <LiftingRackChain />
      <LiftingRackTray name="lifting-rack-lower-tray" height={0.32} />
      <LiftingRackTray name="lifting-rack-upper-tray" height={1.2} />
    </group>
  );
}
