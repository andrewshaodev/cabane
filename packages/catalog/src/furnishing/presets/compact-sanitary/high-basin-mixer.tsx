import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
export const HIGH_BASIN_MIXER_SIZE = [0.055, 0.32, 0.21] as const;
/** Generic tall single-lever mixer for a countertop bowl; static water fixture. */
export function HighBasinMixer({
  size = HIGH_BASIN_MIXER_SIZE,
  variant = "default",
}: {
  size?: SceneItemSize;
  variant?: string;
}) {
  const color = variant === "inox" ? "#969f9c" : "#292c2a";
  return (
    <group name="high-basin-mixer" scale={[size[0] / 0.055, size[1] / 0.32, size[2] / 0.21]}>
      <mesh name="mixer-base" position={[0, 0.004, 0]}>
        <cylinderGeometry args={[0.0275, 0.0275, 0.008, 24]} />
        <ToonMaterial color={color} />
      </mesh>
      <mesh name="mixer-body" position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.023, 0.023, 0.292, 24]} />
        <ToonMaterial color={color} />
      </mesh>
      <mesh name="mixer-spout" position={[0, 0.237, 0.091]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.183, 16]} />
        <ToonMaterial color={color} />
      </mesh>
      <mesh name="mixer-lever" position={[0, 0.308, -0.001]}>
        <boxGeometry args={[0.014, 0.024, 0.047]} />
        <ToonMaterial color={color} />
      </mesh>
    </group>
  );
}
