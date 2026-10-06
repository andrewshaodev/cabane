import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";
export const TWO_SLOT_TOASTER_SIZE = [0.28, 0.19, 0.18] as const;
/** Brushed-metal silhouette; two dark slot mouths are code-native solids. */
export function TwoSlotToaster({ size = TWO_SLOT_TOASTER_SIZE }: { size?: SceneItemSize }) {
  return (
    <group
      userData={{ walkCollider: true }}
      name="two-slot-toaster"
      scale={[size[0] / 0.28, size[1] / 0.19, size[2] / 0.18]}
    >
      <RoundedFurniturePanel
        name="toaster-body"
        size={[0.28, 0.175, 0.18]}
        position={[0, 0.0975, 0]}
        color="#a9afad"
        radius={0.023}
      />
      <RoundedFurniturePanel
        name="base"
        size={[0.25, 0.014, 0.15]}
        position={[0, 0.007, 0]}
        color="#383e3e"
        radius={0.006}
        outline={false}
      />
      {[-0.04, 0.04].map((z) => (
        <RoundedFurniturePanel
          key={z}
          name="toast-slot"
          size={[0.21, 0.003, 0.023]}
          position={[0, 0.1885, z]}
          color="#222a2b"
          radius={0.01}
          outline={false}
        />
      ))}
      <RoundedFurniturePanel
        name="lever-guide"
        size={[0.003, 0.08, 0.015]}
        position={[0.1385, 0.103, 0]}
        color="#515958"
        radius={0.001}
        outline={false}
      />
      <mesh position={[0.127, 0.07, 0.055]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.016, 0.016, 0.025, 16]} />
        <ToonMaterial color="#485351" />
      </mesh>
    </group>
  );
}
