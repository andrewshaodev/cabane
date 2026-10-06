import { Path, Shape } from "three";
import { ToonMaterial } from "@cabane/engine";

/** Two linear perforation groups and a circular group cut through the plinth. */
export function LaundryPlatformFront({
  width,
  height,
  depth,
}: {
  width: number;
  height: number;
  depth: number;
}) {
  const front = new Shape();
  front.moveTo(-width / 2, 0);
  front.lineTo(width / 2, 0);
  front.lineTo(width / 2, height);
  front.lineTo(-width / 2, height);
  front.closePath();
  const holes: number[][] = [];
  for (const side of [-1, 1])
    for (let column = 0; column < 10; column++)
      holes.push([side * 0.38 * width + (column - 4.5) * 0.016, height / 2, 0.003]);
  for (let index = 0; index < 8; index++) {
    const angle = (index * Math.PI) / 4;
    holes.push([Math.cos(angle) * 0.025, height / 2 + Math.sin(angle) * 0.025, 0.0035]);
  }
  for (const [x, y, radius] of holes) {
    const hole = new Path();
    hole.absarc(x, y, radius, 0, Math.PI * 2, true);
    front.holes.push(hole);
  }
  return (
    <mesh name="laundry-platform-front" position={[0, 0, depth - 0.018]} castShadow receiveShadow>
      <extrudeGeometry args={[front, { depth: 0.018, bevelEnabled: false, curveSegments: 4 }]} />
      <ToonMaterial color="#eae8df" />
    </mesh>
  );
}
