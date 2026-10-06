import { useEffect, useMemo } from "react";
import { BoxGeometry, Matrix4 } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
import { MarbleTileVeins } from "./marble-tile-veins";
export const VERTICAL_WHITE_TILE_PANEL_SIZE = [0.6, 1.2, 0.01] as const;
/** Physical 75 x 150 mm vertical tile cladding including its bedding, with bounded merged geometry. */
export function VerticalWhiteTilePanel({
  size = VERTICAL_WHITE_TILE_PANEL_SIZE,
  variant = "default",
}: {
  size?: SceneItemSize;
  variant?: string;
}) {
  const [w, h, d] = size;
  const marble = variant === "marble";
  const stone = variant === "stone";
  const concrete = variant === "concrete";
  const greyMosaic = variant === "grey-mosaic";
  const nominalW = stone ? 0.6 : concrete ? 0.615 : greyMosaic ? 0.05 : null;
  const nominalH = stone ? 0.6 : concrete ? 0.308 : greyMosaic ? 0.025 : null;
  const horizontal = variant === "horizontal";
  const mosaic = variant === "mosaic";
  const cols = Math.min(
    marble || stone || concrete ? 8 : horizontal ? 16 : 32,
    Math.ceil(
      w /
        (stone
          ? 0.6
          : concrete
            ? 0.615
            : marble
              ? 0.3
              : mosaic || greyMosaic
                ? 0.05
                : horizontal
                  ? 0.15
                  : 0.075),
    ),
  );
  const rows = Math.min(
    marble || stone || concrete
      ? 16
      : mosaic || greyMosaic
        ? Math.floor(512 / cols)
        : horizontal
          ? 32
          : 16,
    Math.ceil(
      h /
        (marble || stone
          ? 0.6
          : concrete
            ? 0.308
            : greyMosaic
              ? 0.025
              : mosaic
                ? 0.05
                : horizontal
                  ? 0.075
                  : 0.15),
    ),
  );
  const tiles = useMemo(() => {
    const cw = nominalW !== null && cols >= Math.ceil(w / nominalW) ? nominalW : w / cols;
    const ch = nominalH !== null && rows >= Math.ceil(h / nominalH) ? nominalH : h / rows;
    const parts: BoxGeometry[] = [];
    for (let c = 0; c < cols; c++)
      for (let row = 0; row < rows; row++) {
        const tw = Math.min(cw, w - c * cw),
          th = Math.min(ch, h - row * ch);
        if (tw <= 0.0001 || th <= 0.0001) continue;
        const gap = Math.min(0.003, tw * 0.15, th * 0.15);
        parts.push(
          new BoxGeometry(tw - gap, th - gap, d * (marble ? 0.425 : 0.625)).applyMatrix4(
            new Matrix4().makeTranslation(
              -w / 2 + c * cw + tw / 2,
              row * ch + th / 2,
              d * (marble ? 0.5875 : 0.6875),
            ),
          ),
        );
      }
    const geometry = mergeGeometries(parts);
    parts.forEach((p) => p.dispose());
    return geometry;
  }, [w, h, d, cols, rows, marble, nominalW, nominalH]);
  useEffect(() => () => tiles.dispose(), [tiles]);
  return (
    <group name="vertical-white-tile-panel">
      <mesh name="tile-grout-backing" position={[0, h / 2, d * 0.1875]}>
        <boxGeometry args={[w, h, d * 0.375]} />
        <ToonMaterial color={concrete || greyMosaic ? "#686e65" : stone ? "#cbc9c1" : "#cfcbbf"} />
      </mesh>
      {marble && <MarbleTileVeins width={w} height={h} depth={d} cols={cols} rows={rows} />}
      <mesh name="white-vertical-tiles" geometry={tiles} castShadow receiveShadow>
        <ToonMaterial
          color={greyMosaic ? "#7c8077" : concrete ? "#84887e" : stone ? "#bcbab1" : "#efede6"}
        />
      </mesh>
    </group>
  );
}
