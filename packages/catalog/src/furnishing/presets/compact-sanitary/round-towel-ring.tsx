import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
export const ROUND_TOWEL_RING_SIZE = [0.234, 0.257, 0.088] as const;
/** Circular towel ring with a wall plate and connected standoff. Back plane Z=0. */
export function RoundTowelRing({
  size = ROUND_TOWEL_RING_SIZE,
  variant = "default",
}: {
  size?: SceneItemSize;
  variant?: string;
}) {
  const color = variant === "silver" ? "#aeb6b9" : "#282c28";
  return (
    <group name="round-towel-ring" scale={[size[0] / 0.234, size[1] / 0.257, size[2] / 0.088]}>
      <mesh
        name="towel-ring-wall-plate"
        position={[0, 0.232, 0.008]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[0.025, 0.025, 0.016, 24]} />
        <ToonMaterial color={color} />
      </mesh>
      <mesh name="towel-ring-standoff" position={[0, 0.232, 0.046]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.06, 16]} />
        <ToonMaterial color={color} />
      </mesh>
      <mesh name="towel-ring-loop" position={[0, 0.117, 0.076]}>
        <torusGeometry args={[0.105, 0.012, 8, 48]} />
        <ToonMaterial color={color} />
      </mesh>
    </group>
  );
}
