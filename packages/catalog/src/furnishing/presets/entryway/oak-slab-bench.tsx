import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";
export const OAK_SLAB_BENCH_SIZE = [1.4, 0.45, 0.32] as const;
export function OakSlabBench({ size = OAK_SLAB_BENCH_SIZE }: { size?: SceneItemSize }) {
  return (
    <group
      name="oak-slab-bench"
      scale={[size[0] / 1.4, size[1] / 0.45, size[2] / 0.32]}
      userData={{ walkCollider: true }}
    >
      <RoundedFurniturePanel
        name="bench-oak-seat"
        size={[1.4, 0.045, 0.32]}
        position={[0, 0.4275, 0]}
        color="#b89d78"
        radius={0.003}
        outline={false}
      />
      {[-0.52, 0.52].map((x) => (
        <group key={x} name="bench-steel-leg-frame">
          {[-0.13, 0.13].map((z) => (
            <mesh key={z} position={[x, 0.2025, z]}>
              <boxGeometry args={[0.025, 0.405, 0.025]} />
              <ToonMaterial color="#292b29" />
            </mesh>
          ))}
          <mesh position={[x, 0.018, 0]}>
            <boxGeometry args={[0.025, 0.036, 0.285]} />
            <ToonMaterial color="#292b29" />
          </mesh>
        </group>
      ))}
    </group>
  );
}
