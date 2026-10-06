import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
export const SLIM_RECTANGULAR_MIRROR_SIZE = [0.6, 0.8, 0.018] as const;
/** Silver rectangular frame; back plane Z=0, face points toward +Z. */
export function SlimRectangularMirror({
  size = SLIM_RECTANGULAR_MIRROR_SIZE,
}: {
  size?: SceneItemSize;
}) {
  return (
    <group name="slim-rectangular-mirror" scale={[size[0] / 0.6, size[1] / 0.8, size[2] / 0.018]}>
      <mesh name="mirror-back" position={[0, 0.4, 0.003]}>
        <boxGeometry args={[0.6, 0.8, 0.006]} />
        <ToonMaterial color="#9fa6a1" />
      </mesh>
      <mesh name="mirror-glass" position={[0, 0.4, 0.009]}>
        <boxGeometry args={[0.588, 0.788, 0.006]} />
        <ToonMaterial color="#aabbb7" />
      </mesh>
      {[-0.297, 0.297].map((x) => (
        <mesh key={x} name="mirror-frame" position={[x, 0.4, 0.012]}>
          <boxGeometry args={[0.006, 0.8, 0.012]} />
          <ToonMaterial color="#c7cbc6" />
        </mesh>
      ))}
      {[0.003, 0.797].map((y) => (
        <mesh key={y} name="mirror-frame" position={[0, y, 0.012]}>
          <boxGeometry args={[0.588, 0.006, 0.012]} />
          <ToonMaterial color="#c7cbc6" />
        </mesh>
      ))}
    </group>
  );
}
