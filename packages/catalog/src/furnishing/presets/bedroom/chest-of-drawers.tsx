import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const CHEST_OF_DRAWERS_SIZE = [1, .9, .45] as const;

/** Four-drawer bedroom chest with recessed pulls and a low plinth. */
export function ChestOfDrawers({ size = CHEST_OF_DRAWERS_SIZE }: { size?: SceneItemSize }) {
  return <group name="chest-of-drawers" scale={[size[0], size[1] / .9, size[2] / .45]}
    userData={{ walkCollider: true }}>
    <mesh position={[0, .02, 0]} castShadow receiveShadow>
      <boxGeometry args={[1, .04, .41]} /><ToonMaterial color="#a98256" />
    </mesh>
    <RoundedFurniturePanel size={[1, .82, .42]} position={[0, .45, -.015]}
      color="#d2af7d" radius={.012} />
    {/* Case front .195, drawer front .213, pull front .225: distinct depth layers. */}
    {[.15, .34, .53, .72].map((y) => <group key={y}>
      <RoundedFurniturePanel name="dresser-drawer" size={[.91, .16, .018]}
        position={[0, y, .204]} color="#e6dfd2" radius={.008} />
      <mesh name="dresser-recessed-pull" position={[0, y + .012, .213]}>
        <boxGeometry args={[.22, .028, .024]} /><ToonMaterial color="#9c8366" />
      </mesh>
    </group>)}
    <RoundedFurniturePanel size={[1, .04, .45]} position={[0, .88, 0]}
      color="#cda672" radius={.008} />
  </group>;
}
