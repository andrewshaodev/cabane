import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";
export const OAK_TWO_DRAWER_VANITY_SIZE = [0.62, 0.64, 0.49] as const;
/** Wall-hung drawer cabinet and white worktop; no basin or mixer baked in. */
export function OakTwoDrawerVanity({
  size = OAK_TWO_DRAWER_VANITY_SIZE,
}: {
  size?: SceneItemSize;
}) {
  return (
    <group
      name="oak-two-drawer-vanity"
      scale={[size[0] / 0.62, size[1] / 0.64, size[2] / 0.49]}
      userData={{ walkCollider: true }}
    >
      <mesh name="drawer-case-back" position={[0, 0.309, -0.237]}>
        <boxGeometry args={[0.584, 0.618, 0.016]} />
        <ToonMaterial color="#a3845e" />
      </mesh>
      {[-0.301, 0.301].map((x) => (
        <RoundedFurniturePanel
          key={x}
          name="drawer-case-side"
          size={[0.018, 0.62, 0.452]}
          position={[x, 0.31, -0.003]}
          color="#a3845e"
          radius={0.002}
          outline={false}
        />
      ))}
      <mesh name="drawer-case-bottom" position={[0, 0.009, -0.011]}>
        <boxGeometry args={[0.584, 0.018, 0.434]} />
        <ToonMaterial color="#a3845e" />
      </mesh>
      {[0.151, 0.459].map((y) => (
        <RoundedFurniturePanel
          key={y}
          name="oak-drawer-front"
          size={[0.58, 0.294, 0.018]}
          position={[0, y, 0.232]}
          color="#b49870"
          radius={0.002}
          outline={false}
        />
      ))}
      <RoundedFurniturePanel
        name="white-worktop"
        size={[0.62, 0.02, 0.49]}
        position={[0, 0.63, 0]}
        color="#f1efe8"
        radius={0.002}
        outline={false}
      />
    </group>
  );
}
