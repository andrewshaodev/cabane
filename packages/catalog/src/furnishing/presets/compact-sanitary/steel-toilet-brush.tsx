import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
export const STEEL_TOILET_BRUSH_SIZE = [0.11, 0.464, 0.11] as const;
export function SteelToiletBrush({
  size = STEEL_TOILET_BRUSH_SIZE,
  variant = "default",
}: {
  size?: SceneItemSize;
  variant?: string;
}) {
  const black = variant === "black";
  return (
    <group
      name="steel-toilet-brush"
      scale={[size[0] / 0.11, size[1] / 0.464, size[2] / 0.11]}
      userData={{ walkCollider: true }}
    >
      <mesh name="brush-holder" position={[0, 0.11, 0]}>
        <cylinderGeometry args={[0.052, 0.055, 0.22, 24]} />
        <ToonMaterial color={black ? "#282c28" : "#a8b0ab"} />
      </mesh>
      <mesh name="brush-handle" position={[0, 0.315, 0]}>
        <cylinderGeometry args={[0.004, 0.004, 0.25, 12]} />
        <ToonMaterial color={black ? "#343a33" : "#c7cec7"} />
      </mesh>
      <mesh name="brush-handle-cap" position={[0, 0.452, 0]}>
        <sphereGeometry args={[0.012, 16, 8]} />
        <ToonMaterial color={black ? "#343a33" : "#b6beb8"} />
      </mesh>
    </group>
  );
}
