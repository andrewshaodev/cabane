import { BufferGeometry, Float32BufferAttribute } from "three";
const profile = [
  [0.455, 0.242, 0.19],
  [0.445, 0.2, 0.215],
  [0.435, 0.08, 0.225],
  [0.44, -0.08, 0.225],
  [0.47, -0.18, 0.225],
  [0.6, -0.21, 0.215],
  [0.74, -0.25, 0.205],
  [0.8185, -0.2762, 0.18],
];
function shellGeometry() {
  const p: number[] = [],
    indices: number[] = [];
  const columns = 12,
    rows = profile.length,
    layerSize = rows * (columns + 1);
  for (const side of [-1, 1])
    for (let row = 0; row < rows; row++) {
      const [y, z, width] = profile[row]!;
      const prev = profile[Math.max(0, row - 1)]!,
        next = profile[Math.min(rows - 1, row + 1)]!;
      const dy = next[0]! - prev[0]!,
        dz = next[1]! - prev[1]!,
        length = Math.hypot(dy, dz);
      for (let col = 0; col <= columns; col++) {
        const t = (2 * col) / columns - 1;
        p.push(
          width! * t,
          y! + 0.02 * t * t - (side * 0.004 * dz) / length,
          z! + (row >= 4 ? 0.04 * t * t : 0) + (side * 0.004 * dy) / length,
        );
      }
    }
  for (let layer = 0; layer < 2; layer++)
    for (let row = 0; row < rows - 1; row++)
      for (let col = 0; col < columns; col++) {
        const a = layer * layerSize + row * (columns + 1) + col,
          b = a + 1,
          c = a + columns + 1,
          d = c + 1;
        indices.push(...(layer === 0 ? [a, c, b, b, c, d] : [a, b, c, b, d, c]));
      }
  const edge: number[] = [];
  for (let c = 0; c <= columns; c++) edge.push(c);
  for (let r = 1; r < rows; r++) edge.push(r * (columns + 1) + columns);
  for (let c = columns - 1; c >= 0; c--) edge.push((rows - 1) * (columns + 1) + c);
  for (let r = rows - 2; r > 0; r--) edge.push(r * (columns + 1));
  for (let i = 0; i < edge.length; i++) {
    const a = edge[i]!,
      b = edge[(i + 1) % edge.length]!;
    indices.push(a, b, a + layerSize, b, b + layerSize, a + layerSize);
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(p, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}
export const whiteChairShell = shellGeometry();
