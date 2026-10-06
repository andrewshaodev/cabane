import { LayeredSurface, ToonMaterial, type SceneModelProps } from "@cabane/engine";

/** Procedural printed motifs; no household photographs or image textures. */
export function ChildrenWallPoster({ size, variant }: SceneModelProps) {
  return (
    <group name="children-wall-poster" scale={[size[0] / 0.3, size[1] / 0.42, size[2] / 0.012]}>
      <mesh position={[0, 0.21, 0.001]}>
        <boxGeometry args={[0.3, 0.42, 0.002]} />
        <ToonMaterial color="#eee9da" />
      </mesh>
      <group position-z={0.0021}>
        {variant === "rainbow" ? (
          <group position-y={0.18}>
            {["#d5a8ad", "#e5cca2", "#d4d5aa", "#bdd5c8", "#b8cbd4"].map((color, i) => (
              <LayeredSurface key={color} layer={1} color={color}>
                <ringGeometry args={[0.117 - i * 0.018, 0.133 - i * 0.018, 32, 1, 0, Math.PI]} />
              </LayeredSurface>
            ))}
          </group>
        ) : (
          <>
            <group position-y={0.22}>
              <LayeredSurface layer={0} color={variant === "blue" ? "#526c8c" : "#b56c5d"}>
                <planeGeometry args={[0.24, 0.31]} />
              </LayeredSurface>
            </group>
            <group position-y={0.25}>
              <LayeredSurface layer={1} color="#e3e1d3">
                <planeGeometry args={[0.1, 0.11]} />
              </LayeredSurface>
            </group>
            <group position-y={0.335}>
              <LayeredSurface layer={1} color="#ceb39a">
                <circleGeometry args={[0.03, 16]} />
              </LayeredSurface>
            </group>
            <group position-y={0.14}>
              <LayeredSurface layer={1} color="#e9e5dc">
                <circleGeometry args={[0.033, 12]} />
              </LayeredSurface>
            </group>
          </>
        )}
      </group>
    </group>
  );
}
