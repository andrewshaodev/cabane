import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { RoundedFurniturePanel } from "../construction";

export const KNOB_DOOR_WARDROBE_SIZE = [1, 2.4, 0.6] as const;

/** A plain cabinet with either two doors or one handed full-height door. */
export function KnobDoorWardrobe({
  size = KNOB_DOOR_WARDROBE_SIZE,
  variant = "default",
}: {
  size?: SceneItemSize;
  variant?: string;
}) {
  const single = variant === "single-left" || variant === "single-right";
  const doors = single ? [0] : [-0.25, 0.25];
  return (
    <group
      name="knob-door-wardrobe"
      scale={[size[0], size[1] / 2.4, size[2] / 0.6]}
      userData={{ walkCollider: true }}
    >
      <RoundedFurniturePanel size={[1, 2.4, 0.54]} position={[0, 1.2, -0.03]} color="#dcd9d1" />
      {doors.map((x, i) => (
        <group key={x}>
          <RoundedFurniturePanel
            name="wardrobe-door"
            size={[single ? 0.994 : 0.494, 2.34, 0.025]}
            position={[x, 1.23, 0.2525]}
            color="#e7e4dc"
            radius={0.003}
          />
          <mesh
            name="wardrobe-knob"
            position={[
              single ? (variant === "single-left" ? -0.445 : 0.445) : i === 0 ? -0.025 : 0.025,
              1.05,
              0.28,
            ]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.018, 0.018, 0.04, 16]} />
            <ToonMaterial color="#302e2a" />
          </mesh>
        </group>
      ))}
    </group>
  );
}
