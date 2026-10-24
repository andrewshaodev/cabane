import { useEffect, useMemo } from "react";
import { BufferGeometry, Float32BufferAttribute } from "three";
import { ToonMaterial } from "@cabane/engine";

/** Closed, softly rippled cloth, with real thickness and side/foot drapes. */
export function CozyBedCover({
  name,
  back,
  front,
  lift,
  thickness,
  color,
  plush = false,
  soft = false,
}: {
  name: string;
  back: number;
  front: number;
  lift: number;
  thickness: number;
  color: string;
  plush?: boolean;
  soft?: boolean;
}) {
  const geometry = useMemo(() => {
    const columns = 32;
    const rows = 24;
    const layerVertices = (columns + 1) * (rows + 1);
    const positions: number[] = [];
    const indices: number[] = [];
    for (let layer = 0; layer < 2; layer++) {
      for (let row = 0; row <= rows; row++) {
        const v = row / rows;
        const z = back + (front - back) * v;
        for (let column = 0; column <= columns; column++) {
          const u = (column / columns) * 2 - 1;
          const x = u * 0.838;
          const side = Math.max(0, (Math.abs(x) - (soft ? 0.62 : 0.75)) / (soft ? 0.218 : 0.088));
          const foot = Math.max(0, (z - 0.93) / 0.13);
          const folds = soft
            ? 0.003 * Math.sin(u * 10 + z * 5)
            : 0.007 * Math.sin(u * 19 + z * 5) + 0.004 * Math.cos(z * 24 - u * 7);
          const pile = plush ? 0.004 * Math.sin(u * 67 + z * 39) ** 2 : 0;
          // All layers use the same drape field; lift separates their exposed faces.
          const crown = soft ? 0.11 * (1 - u * u) : 0;
          const y = 0.605 + lift + crown - 0.19 * side ** 1.5 - 0.19 * foot ** 1.5 + folds + pile;
          positions.push(x, y - layer * thickness, z);
        }
      }
    }
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        const a = row * (columns + 1) + column;
        const b = a + 1;
        const c = a + columns + 1;
        const d = c + 1;
        indices.push(a, c, b, b, c, d);
        const o = layerVertices;
        indices.push(a + o, b + o, c + o, b + o, d + o, c + o);
      }
    }
    const rim = [
      ...Array.from({ length: columns + 1 }, (_, i) => i),
      ...Array.from({ length: rows }, (_, i) => (i + 1) * (columns + 1) + columns),
      ...Array.from({ length: columns }, (_, i) => rows * (columns + 1) + columns - i - 1),
      ...Array.from({ length: rows - 1 }, (_, i) => (rows - i - 1) * (columns + 1)),
    ];
    rim.forEach((a, index) => {
      const b = rim[(index + 1) % rim.length];
      indices.push(a, b, a + layerVertices, b, b + layerVertices, a + layerVertices);
    });
    const result = new BufferGeometry();
    result.setAttribute("position", new Float32BufferAttribute(positions, 3));
    result.setIndex(indices);
    result.computeVertexNormals();
    return result;
  }, [back, front, lift, thickness, plush, soft]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh name={name} geometry={geometry} dispose={null} castShadow receiveShadow>
      <ToonMaterial color={color} />
    </mesh>
  );
}
