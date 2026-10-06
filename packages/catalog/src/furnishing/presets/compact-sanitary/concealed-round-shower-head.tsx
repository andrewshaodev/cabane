import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
export const CONCEALED_ROUND_SHOWER_HEAD_SIZE = [0.25, 0.23, 0.45] as const;
/** Round overhead head with a real connected wall arm; no exposed mixer rail. */
export function ConcealedRoundShowerHead({
  size = CONCEALED_ROUND_SHOWER_HEAD_SIZE,
}: {
  size?: SceneItemSize;
}) {
  return (
    <group
      name="concealed-round-shower-head"
      scale={[size[0] / 0.25, size[1] / 0.23, size[2] / 0.45]}
    >
      <mesh name="shower-arm-wall-plate" position={[0, 0.2, 0.007]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.014, 24]} />
        <ToonMaterial color="#969f9c" />
      </mesh>
      <mesh name="horizontal-shower-arm" position={[0, 0.22, 0.135]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.27, 20]} />
        <ToonMaterial color="#969f9c" />
      </mesh>
      <mesh name="shower-arm-elbow" position={[0, 0.19, 0.27]} rotation={[0, -Math.PI / 2, 0]}>
        <torusGeometry args={[0.03, 0.01, 8, 12, Math.PI / 2]} />
        <ToonMaterial color="#969f9c" />
      </mesh>
      <mesh name="head-drop-stem" position={[0, 0.11, 0.3]}>
        <cylinderGeometry args={[0.01, 0.01, 0.16, 20]} />
        <ToonMaterial color="#969f9c" />
      </mesh>
      <mesh name="round-overhead-head" position={[0, 0.015, 0.325]}>
        <cylinderGeometry args={[0.125, 0.125, 0.03, 40]} />
        <ToonMaterial color="#8f9894" />
      </mesh>
    </group>
  );
}
