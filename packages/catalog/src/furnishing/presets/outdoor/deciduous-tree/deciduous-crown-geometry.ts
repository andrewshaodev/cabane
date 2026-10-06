import { Color, Float32BufferAttribute, IcosahedronGeometry } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

// Broad, overlapping boughs leave scalloped edges and pockets of shade.
const boughs = [
  [-.61, 2.65, .12, .57, .57, .65],
  [.55, 2.76, .22, .63, .60, .62],
  [-.12, 2.77, -.55, .66, .61, .58],
  [.08, 2.55, .59, .59, .48, .52],
  [-.48, 3.25, -.18, .65, .62, .66],
  [.42, 3.31, -.23, .66, .61, .62],
  [-.20, 3.28, .48, .66, .61, .62],
  [.02, 3.75, -.01, .57, .45, .56],
] as const;
const palette = ["#568743", "#669747", "#487b45", "#598941", "#79a54d", "#83ab51", "#6e9b47", "#92b65c"];

export function createDeciduousCrownGeometry() {
  const parts = boughs.flatMap(([x, y, z, rx, ry, rz], index) => {
    // Smaller lobes break the silhouette without individual leaf draw calls.
    return Array.from({ length: 4 }, (_, lobe) => {
      const angle = index * 1.7 + lobe * 2.39996;
      const small = lobe > 0;
      const geometry = new IcosahedronGeometry(1, 2);
      const positions = geometry.getAttribute("position");
      for (let v = 0; v < positions.count; v++) {
        const px = positions.getX(v), py = positions.getY(v), pz = positions.getZ(v);
        const ripple = 1 + .075 * Math.sin(px * 7 + index) * Math.cos(pz * 6 - py * 5);
        const scale = small ? .48 : 1;
        positions.setXYZ(v,
          x + px * rx * ripple * scale + (small ? Math.cos(angle) * rx * .68 : 0),
          y + py * ry * ripple * scale + (small ? .12 * Math.sin(angle * 2) : 0),
          z + pz * rz * ripple * scale + (small ? Math.sin(angle) * rz * .68 : 0));
      }
      // Retain rounded normals: the engine's discrete light bands supply the facets.
      const color = new Color(palette[index]).multiplyScalar(small ? 1.025 : 1);
      geometry.setAttribute("color", new Float32BufferAttribute(
        Array.from({ length: positions.count }, () => [color.r, color.g, color.b]).flat(), 3));
      return geometry;
    });
  });
  const crown = mergeGeometries(parts)!;
  parts.forEach((part) => part.dispose());
  return crown;
}
