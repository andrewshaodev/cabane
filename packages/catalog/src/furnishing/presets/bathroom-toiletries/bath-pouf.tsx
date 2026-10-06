import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
export const BATH_POUF_SIZE = [0.12, 0.14, 0.1] as const;
/** Soft simplified shower puff and connected hanging loop, without a texture or invented bracket. */
export function BathPouf({ size = BATH_POUF_SIZE }: { size?: SceneItemSize }) {
  const lobes = [
    [-0.036, 0.05, 0, 0.024],
    [0.036, 0.05, 0, 0.024],
    [0, 0.05, -0.026, 0.024],
    [0, 0.05, 0.026, 0.024],
    [-0.022, 0.03, -0.02, 0.022],
    [0.022, 0.07, 0.02, 0.022],
    [0, 0.024, 0, 0.024],
    [0, 0.074, 0, 0.026],
  ];
  return (
    <group name="bath-pouf" scale={[size[0] / 0.12, size[1] / 0.14, size[2] / 0.1]}>
      {lobes.map(([x, y, z, r], i) => (
        <mesh key={i} name="pouf-fold" position={[x, y, z]}>
          <sphereGeometry args={[r, 12, 8]} />
          <ToonMaterial color={i % 2 ? "#ddca78" : "#e5d591"} />
        </mesh>
      ))}
      <mesh name="pouf-hanging-loop" position={[0, 0.118, 0]}>
        <torusGeometry args={[0.019, 0.003, 6, 16]} />
        <ToonMaterial color="#e9dfb5" />
      </mesh>
    </group>
  );
}
