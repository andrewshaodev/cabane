import { ToonMaterial } from "@cabane/engine";
import type { SceneModelProps } from "@cabane/engine";

/** Procedural motifs; no household photographs or image textures. */
export function ChildrenWallPoster({ size, variant }: SceneModelProps) {
  return (
    <group name="children-wall-poster" scale={[size[0] / 0.3, size[1] / 0.42, size[2] / 0.012]}>
      <mesh position={[0, 0.21, 0.001]}>
        <boxGeometry args={[0.3, 0.42, 0.002]} />
        <ToonMaterial color="#eee9da" />
      </mesh>
      {variant === "rainbow" ? (
        <group position={[0, 0.18, 0.004]}>
          {["#d5a8ad", "#e5cca2", "#d4d5aa", "#bdd5c8", "#b8cbd4"].map((color, i) => (
            <mesh key={color}>
              <torusGeometry args={[0.125 - i * 0.018, 0.008, 6, 32, Math.PI]} />
              <ToonMaterial color={color} />
            </mesh>
          ))}
        </group>
      ) : (
        <group>
          <mesh position={[0, 0.22, 0.004]}>
            <boxGeometry args={[0.24, 0.31, 0.002]} />
            <ToonMaterial color={variant === "blue" ? "#526c8c" : "#b56c5d"} />
          </mesh>
          <mesh position={[0, 0.25, 0.007]}>
            <boxGeometry args={[0.1, 0.11, 0.003]} />
            <ToonMaterial color="#e3e1d3" />
          </mesh>
          <mesh position={[0, 0.335, 0.012]}>
            <circleGeometry args={[0.03, 16]} />
            <ToonMaterial color="#ceb39a" />
          </mesh>
          <mesh position={[0, 0.14, 0.012]}>
            <circleGeometry args={[0.033, 12]} />
            <ToonMaterial color="#e9e5dc" />
          </mesh>
        </group>
      )}
    </group>
  );
}
