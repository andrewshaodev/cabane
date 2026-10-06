import { Path, Shape } from "three";

/** Rounded plan section for the bucket shell, rim and wringer tray. */
export function wringerBucketSection(width: number, depth: number, radius: number) {
  const path = new Shape(),
    x = width / 2,
    z = depth / 2;
  path.moveTo(-x + radius, -z);
  path.lineTo(x - radius, -z);
  path.quadraticCurveTo(x, -z, x, -z + radius);
  path.lineTo(x, z - radius);
  path.quadraticCurveTo(x, z, x - radius, z);
  path.lineTo(-x + radius, z);
  path.quadraticCurveTo(-x, z, -x, z - radius);
  path.lineTo(-x, -z + radius);
  path.quadraticCurveTo(-x, -z, -x + radius, -z);
  path.closePath();
  return path;
}

export function wringerBucketRing(
  width: number,
  depth: number,
  innerWidth: number,
  innerDepth: number,
) {
  const ring = wringerBucketSection(width, depth, 0.025);
  const inner = wringerBucketSection(innerWidth, innerDepth, 0.018);
  ring.holes.push(new Path(inner.getPoints(8).reverse()));
  return ring;
}
