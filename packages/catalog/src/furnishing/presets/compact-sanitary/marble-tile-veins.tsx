import { useEffect, useMemo } from "react";
import { Shape, ShapeGeometry, type BufferGeometry } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { ToonMaterial } from "@cabane/engine";
/** Quiet representative mineral veins, made of geometry rather than image textures. */
export function MarbleTileVeins({
  width,
  height,
  depth,
  cols,
  rows,
}: {
  width: number;
  height: number;
  depth: number;
  cols: number;
  rows: number;
}) {
  const geometry = useMemo(() => {
    const parts: BufferGeometry[] = [];
    const cw = width / cols,
      ch = height / rows;
    const paths = [
      [
        [0.06, 0.06],
        [0.25, 0.28],
        [0.42, 0.35],
        [0.63, 0.66],
        [0.94, 0.93],
      ],
      [
        [0.25, 0.28],
        [0.56, 0.18],
        [0.85, 0.23],
      ],
    ];
    for (let c = 0; c < cols; c++)
      for (let r = 0; r < rows; r++)
        for (const path of paths)
          for (let i = 1; i < path.length; i++) {
            const flip = (c + r) % 2 ? -1 : 1;
            const x = (u: number) => -width / 2 + (c + 0.5 + flip * (u - 0.5)) * cw;
            const y = (v: number) => (r + v) * ch;
            const a = [x(path[i - 1][0]), y(path[i - 1][1])],
              b = [x(path[i][0]), y(path[i][1])];
            const dx = b[0] - a[0],
              dy = b[1] - a[1],
              length = Math.hypot(dx, dy),
              t = Math.min(0.0015, cw * 0.006);
            const nx = (-dy / length) * t,
              ny = (dx / length) * t;
            const shape = new Shape();
            shape.moveTo(a[0] + nx, a[1] + ny);
            shape.lineTo(b[0] + nx, b[1] + ny);
            shape.lineTo(b[0] - nx, b[1] - ny);
            shape.lineTo(a[0] - nx, a[1] - ny);
            shape.closePath();
            parts.push(new ShapeGeometry(shape).translate(0, 0, depth));
          }
    const result = mergeGeometries(parts);
    parts.forEach((g) => g.dispose());
    return result;
  }, [width, height, depth, cols, rows]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh name="marble-veins" geometry={geometry}>
      <ToonMaterial color="#bbb9b0" side={2} />
    </mesh>
  );
}
