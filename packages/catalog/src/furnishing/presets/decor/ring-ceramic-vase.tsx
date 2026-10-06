import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";
export const RING_CERAMIC_VASE_SIZE = [0.18, 0.3, 0.06] as const;
export function RingCeramicVase({ size = RING_CERAMIC_VASE_SIZE }: { size?: SceneItemSize }) {
  return (
    <group name="ring-ceramic-vase" scale={[size[0] / 0.18, size[1] / 0.3, size[2] / 0.06]}>
      <RoundedFurniturePanel
        size={[0.12, 0.025, 0.06]}
        position={[0, 0.0125, 0]}
        color="#eeeee3"
        radius={0.008}
        outline={false}
      />
      <mesh position={[0, 0.11, 0]}>
        <torusGeometry args={[0.065, 0.025, 12, 32]} />
        <ToonMaterial color="#eeeee3" />
      </mesh>
      {[-0.018, 0, 0.018].map((x) => (
        <mesh key={x} position={[x, 0.25, 0]}>
          <cylinderGeometry args={[0.002, 0.002, 0.1, 6]} />
          <ToonMaterial color="#b7aa8b" />
        </mesh>
      ))}
    </group>
  );
}
