import { ToonMaterial } from "@cabane/engine";
import { RoundedStoragePanel } from ".././rounded-storage-panel";

export function WovenInset({
  width,
  height,
  y,
  z,
}: {
  readonly width: number;
  readonly height: number;
  readonly y: number;
  readonly z: number;
}) {
  const verticals = 7;
  const horizontals = Math.max(4, Math.round(height / 0.12));
  return (
    <group position={[0, y, z]}>
      <RoundedStoragePanel
        size={[width, height, 0.018]}
        position={[0, 0, 0]}
        color="#c6a47d"
        outline="#8c6e53"
      />
      {Array.from({ length: verticals }, (_, index) => {
        const x = -width / 2 + ((index + 1) * width) / (verticals + 1);
        return (
          <mesh key={`vertical-${index}`} position={[x, 0, 0.012]}>
            <boxGeometry args={[0.014, height * 0.88, 0.008]} />
            <ToonMaterial color="#e0c8a8" />
          </mesh>
        );
      })}
      {Array.from({ length: horizontals }, (_, index) => {
        const lineY = -height / 2 + ((index + 1) * height) / (horizontals + 1);
        return (
          <mesh key={`horizontal-${index}`} position={[0, lineY, 0.014]}>
            <boxGeometry args={[width * 0.9, 0.012, 0.008]} />
            <ToonMaterial color="#9d7a59" />
          </mesh>
        );
      })}
    </group>
  );
}
