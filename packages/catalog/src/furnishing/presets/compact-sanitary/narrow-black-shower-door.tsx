import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
export const NARROW_BLACK_SHOWER_DOOR_SIZE = [0.65, 2, 0.075] as const;
/** Closed shower leaf; glass, jambs, two hinges and paired pull handles. */
export function NarrowBlackShowerDoor({
  size = NARROW_BLACK_SHOWER_DOOR_SIZE,
  variant = "default",
}: {
  size?: SceneItemSize;
  variant?: string;
}) {
  const color = variant.startsWith("inox") ? "#969f9c" : "#292c2a";
  return (
    <group
      name="narrow-black-shower-door"
      scale={[size[0] / 0.65, size[1] / 2, size[2] / 0.075]}
      userData={{ walkCollider: true }}
    >
      <group scale={[variant.endsWith("right-hinge") ? -1 : 1, 1, 1]}>
        <mesh name="shower-door-glass" position={[0, 1, 0]}>
          <boxGeometry args={[0.614, 1.97, 0.008]} />
          <ToonMaterial color="#c7d8d5" transparent opacity={0.15} depthWrite={false} />
        </mesh>
        {[-0.316, 0.316].map((x) => (
          <mesh key={x} name="shower-door-jamb" position={[x, 1, 0]}>
            <boxGeometry args={[0.018, 2, 0.028]} />
            <ToonMaterial color={color} />
          </mesh>
        ))}
        {[0.38, 1.62].map((y) => (
          <mesh key={y} name="shower-door-hinge" position={[-0.2975, y, 0]}>
            <boxGeometry args={[0.04, 0.07, 0.024]} />
            <ToonMaterial color={color} />
          </mesh>
        ))}
        {[-1, 1].map((side) => (
          <group key={side}>
            <mesh name="shower-door-pull" position={[0.252, 1, side * 0.0285]}>
              <cylinderGeometry args={[0.009, 0.009, 0.32, 16]} />
              <ToonMaterial color={color} />
            </mesh>
            {[0.89, 1.11].map((y) => (
              <mesh
                key={y}
                name="shower-door-pull-mount"
                position={[0.252, y, side * 0.017]}
                rotation={[Math.PI / 2, 0, 0]}
              >
                <cylinderGeometry args={[0.007, 0.007, 0.026, 12]} />
                <ToonMaterial color={color} />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    </group>
  );
}
