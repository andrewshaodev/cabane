import { LayeredSurface, ToonMaterial, type SceneItemSize } from "@cabane/engine";
export const ABSTRACT_RELIEF_WALL_ART_SIZE = [0.45, 0.65, 0.035] as const;
/** Independently placeable shallow geometric relief in black, ivory or rose. */
export function AbstractReliefWallArt({
  size = ABSTRACT_RELIEF_WALL_ART_SIZE,
  variant = "black",
}: {
  size?: SceneItemSize;
  variant?: string;
}) {
  const rose = variant === "rose",
    ivory = variant === "ivory";
  const canvas = rose ? "#986f75" : ivory ? "#bbbcb9" : "#d9d6cd",
    relief = rose ? "#a78087" : ivory ? "#deded9" : "#242425";
  const block = (
    name: string,
    w: number,
    h: number,
    x: number,
    y: number,
    rotation = 0,
    depth = 0.014,
  ) => (
    <mesh key={name} name={name} position={[x, y, 0.028]} rotation={[0, 0, rotation]} castShadow>
      <boxGeometry args={[w, h, depth]} />
      <ToonMaterial color={relief} />
    </mesh>
  );
  return (
    <group
      name="abstract-relief-wall-art"
      scale={[size[0] / 0.45, size[1] / 0.65, size[2] / 0.035]}
    >
      <mesh position={[0, 0.325, 0.01]}>
        <boxGeometry args={[0.45, 0.65, 0.02]} />
        <ToonMaterial color="#242628" />
      </mesh>
      <mesh position={[0, 0.325, 0.021]}>
        <boxGeometry args={[0.425, 0.625, 0.002]} />
        <ToonMaterial color={canvas} />
      </mesh>
      {ivory ? (
        <>
          {block("relief-vertical", 0.08, 0.3, -0.025, 0.36)}
          <group position={[0, 0.41, 0.028]}>
            <LayeredSurface layer={0} color={relief}>
              <ringGeometry args={[0.065, 0.13, 36, 1, 0, Math.PI]} />
            </LayeredSurface>
          </group>
          <group position={[0.012, 0.25, 0.028]} rotation={[0, 0, Math.PI]}>
            <LayeredSurface layer={0} color={relief}>
              <ringGeometry args={[0.065, 0.13, 36, 1, 0, Math.PI]} />
            </LayeredSurface>
          </group>
          {block("relief-eye", 0.062, 0.012, 0.045, 0.408)}
        </>
      ) : rose ? (
        <>
          {block("relief-rose-upper", 0.15, 0.19, -0.05, 0.47, 0.04, 0.012)}
          {block("relief-rose-middle", 0.28, 0.17, 0, 0.31, 0.12)}
          {block("relief-rose-lower", 0.17, 0.14, 0.07, 0.14, -0.05)}
          <group position={[-0.073, 0.44, 0.035]}>
            <LayeredSurface layer={1} color="#4d363d">
              <ringGeometry args={[0.045, 0.049, 32]} />
            </LayeredSurface>
          </group>
        </>
      ) : (
        <>
          {block("relief-black-upper", 0.34, 0.22, 0, 0.48)}
          {block("relief-black-lower", 0.34, 0.27, 0, 0.205)}
          {block("relief-black-crossbar", 0.395, 0.042, 0, 0.36)}
          {block("relief-black-stem", 0.018, 0.52, 0.01, 0.315)}
        </>
      )}
    </group>
  );
}
