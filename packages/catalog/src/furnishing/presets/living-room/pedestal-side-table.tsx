import { type SceneItemSize, ToonMaterial } from "@cabane/engine";

export const PEDESTAL_SIDE_TABLE_SIZE = [0.5, 0.55, 0.5] as const;

/** Round oak top and circular foot with a thick central pedestal. */
export function PedestalSideTable({ size = PEDESTAL_SIDE_TABLE_SIZE }: { size?: SceneItemSize } = {}) {
  return <group name="pedestal-side-table" scale={[size[0] / 0.5, size[1] / 0.55, size[2] / 0.5]}
    userData={{ walkCollider: true }}>
    <mesh position={[0, .525, 0]} castShadow receiveShadow><cylinderGeometry args={[.25, .25, .05, 32]} /><ToonMaterial color="#cba67c" /></mesh>
    <mesh position={[0, .265, 0]} castShadow><cylinderGeometry args={[.065, .085, .47, 20]} /><ToonMaterial color="#ae8058" /></mesh>
    <mesh position={[0, .015, 0]} castShadow><cylinderGeometry args={[.2, .2, .03, 32]} /><ToonMaterial color="#ae8058" /></mesh>
  </group>;
}
