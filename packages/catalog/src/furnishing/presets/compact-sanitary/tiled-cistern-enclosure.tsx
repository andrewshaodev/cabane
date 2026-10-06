import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { VerticalWhiteTilePanel } from "./vertical-white-tile-panel";
export const TILED_CISTERN_ENCLOSURE_SIZE = [0.9, 1.2, 0.2] as const;
/** Physical low enclosure hiding a toilet cistern, with a 10 mm tiled front. */
export function TiledCisternEnclosure({
  size = TILED_CISTERN_ENCLOSURE_SIZE,
  variant = "default",
}: {
  size?: SceneItemSize;
  variant?: string;
}) {
  const [w, h, d] = size,
    tile = Math.min(0.01, d / 4),
    body = d - tile;
  return (
    <group name="tiled-cistern-enclosure" userData={{ walkCollider: true }}>
      <mesh name="cistern-enclosure-body" position={[0, h / 2, body / 2]}>
        <boxGeometry args={[w, h, body]} />
        <ToonMaterial color={variant === "vertical" ? "#efede6" : "#bcbab1"} />
      </mesh>
      <group position={[0, 0, body]}>
        <VerticalWhiteTilePanel
          size={[w, h, tile]}
          variant={variant === "vertical" ? "default" : "stone"}
        />
      </group>
    </group>
  );
}
