import { BufferGeometry, CatmullRomCurve3, Color, Float32BufferAttribute, Vector3 } from "three";

export type OliveBranchPoint = readonly [number, number, number, number];

/** Tapered, twisting flutes give old olive wood its sculptural silhouette. */
export function createOliveBranchGeometry(
  points: readonly OliveBranchPoint[],
  rings = 12,
  sides = 12,
  fluting = 0.13,
) {
  const curve = new CatmullRomCurve3(points.map(([x, y, z]) => new Vector3(x, y, z)));
  const frames = curve.computeFrenetFrames(rings, false);
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const shadow = new Color("#665847");
  const ridge = new Color("#a99677");
  for (let ring = 0; ring <= rings; ring++) {
    const t = ring / rings;
    const center = curve.getPoint(t);
    const interval = Math.min(points.length - 2, Math.floor(t * (points.length - 1)));
    const blend = t * (points.length - 1) - interval;
    const radius = points[interval][3] * (1 - blend) + points[interval + 1][3] * blend;
    for (let side = 0; side < sides; side++) {
      const angle = (side / sides) * Math.PI * 2;
      const flute = Math.cos(angle * 5 + t * 5.5);
      const distance = radius * (1 + flute * fluting);
      const vertex = center
        .clone()
        .addScaledVector(frames.normals[ring], Math.cos(angle) * distance)
        .addScaledVector(frames.binormals[ring], Math.sin(angle) * distance);
      // The root flare is cut at soil level, without a soil disk or planter.
      positions.push(vertex.x, Math.max(0, vertex.y), vertex.z);
      const color = shadow.clone().lerp(ridge, 0.35 + 0.3 * flute + 0.12 * Math.sin(angle));
      colors.push(color.r, color.g, color.b);
      if (ring < rings) {
        const a = ring * sides + side;
        const b = ring * sides + ((side + 1) % sides);
        indices.push(a, b, a + sides, b, b + sides, a + sides);
      }
    }
  }
  for (let side = 1; side < sides - 1; side++) {
    indices.push(0, side + 1, side);
    const end = rings * sides;
    indices.push(end, end + side, end + side + 1);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
