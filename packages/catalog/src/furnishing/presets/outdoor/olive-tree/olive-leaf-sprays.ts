import { BufferGeometry, Color, Float32BufferAttribute, Vector3 } from "three";
import { OLIVE_CROWN_LOBES } from "./olive-tree-structure";

const palette = ["#829365", "#9daa7e", "#bbc49b"].map((hex) => new Color(hex));

/** Rounded olive leaves with a shallow curved surface and smooth shared normals. */
export function createOliveLeafSprays() {
  const positions: number[] = [], colors: number[] = [], indices: number[] = [];
  const vertex = (point: Vector3, color: Color) => {
    positions.push(point.x, point.y, point.z);
    colors.push(color.r, color.g, color.b);
  };
  OLIVE_CROWN_LOBES.forEach(({ center, radius }, lobe) => {
    const origin = new Vector3(...center);
    for (let shoot = 0; shoot < 22; shoot++) {
      const angle = shoot * 2.399963 + lobe * .71;
      const height = -.7 + 1.6 * (shoot + .5) / 22;
      const radial = Math.sqrt(1 - height * height);
      const axis = new Vector3(Math.cos(angle) * radial, height, Math.sin(angle) * radial);
      const stem = new Vector3(axis.x * radius[0], axis.y * radius[1], axis.z * radius[2]);
      const across = new Vector3(-axis.z, 0, axis.x).normalize();
      const normal = across.clone().cross(axis).normalize();
      for (let leaf = 0; leaf < 5; leaf++) {
        const side = leaf % 2 === 0 ? 1 : -1;
        const at = origin.clone().addScaledVector(stem, .45 + leaf * .105);
        const direction = axis.clone().multiplyScalar(.8).addScaledVector(across, leaf === 4 ? 0 : side * .65).normalize();
        const widthAxis = normal.clone().cross(direction).normalize();
        const length = .31 + .035 * Math.sin(shoot + lobe * 2 + leaf);
        const middle = at.clone().addScaledVector(direction, length * .5);
        const color = palette[(shoot + lobe) % palette.length];
        const base = positions.length / 3;
        // A softly domed oval replaces the sharp diamond and central crease.
        vertex(middle.clone().addScaledVector(normal, .008), color);
        const segments = 12;
        for (let edge = 0; edge < segments; edge++) {
          const angle = edge / segments * Math.PI * 2;
          vertex(middle.clone()
            .addScaledVector(direction, Math.cos(angle) * length * .5)
            .addScaledVector(widthAxis, Math.sin(angle) * length * .22), color);
          indices.push(base, base + 1 + edge, base + 1 + (edge + 1) % segments);
        }
      }
    }
  });
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
