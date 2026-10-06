import { CatmullRomCurve3, CylinderGeometry, Quaternion, Vector3 } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

type Point = [number, number, number];

export function createDeciduousWoodGeometry() {
  const parts: CylinderGeometry[] = [];
  const branch = (points: Point[], base: number, tip: number, steps = 9) => {
    const curve = new CatmullRomCurve3(points.map((point) => new Vector3(...point)));
    for (let step = 0; step < steps; step++) {
      const a = curve.getPoint(step / steps),
        b = curve.getPoint((step + 1) / steps);
      const direction = b.clone().sub(a);
      const radius = (t: number) => tip + (base - tip) * Math.pow(1 - t, 1.15);
      const segment = new CylinderGeometry(
        radius((step + 1) / steps),
        radius(step / steps),
        direction.length() + 0.012,
        9,
      );
      segment.applyQuaternion(
        new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction.normalize()),
      );
      segment.translate(...a.add(b).multiplyScalar(0.5).toArray());
      parts.push(segment);
    }
  };
  branch(
    [
      [0, 0.08, 0],
      [-0.07, 0.65, 0.03],
      [0.03, 1.3, 0],
      [-0.1, 1.95, -0.04],
      [0.04, 2.8, -0.12],
      [0.02, 3.65, 0],
    ],
    0.24,
    0.025,
    18,
  );
  branch(
    [
      [-0.02, 1.25, 0],
      [-0.3, 1.8, 0.02],
      [-0.61, 2.14, 0.12],
      [-0.82, 2.75, 0.16],
    ],
    0.14,
    0.018,
  );
  branch(
    [
      [-0.08, 1.72, -0.02],
      [0.23, 2.07, 0.06],
      [0.59, 2.37, 0.2],
      [0.78, 2.94, 0.22],
    ],
    0.125,
    0.018,
  );
  branch(
    [
      [0, 1.43, 0],
      [0.12, 1.95, 0.28],
      [0.03, 2.3, 0.54],
      [0.1, 2.8, 0.72],
    ],
    0.115,
    0.015,
  );
  branch(
    [
      [-0.08, 1.9, -0.04],
      [-0.18, 2.21, -0.32],
      [-0.22, 2.68, -0.62],
      [-0.35, 3.14, -0.71],
    ],
    0.1,
    0.015,
  );
  for (let root = 0; root < 5; root++) {
    const angle = (root * Math.PI * 2) / 5 + 0.3;
    branch(
      [
        [0, 0.34, 0],
        [Math.cos(angle) * 0.23, 0.12, Math.sin(angle) * 0.23],
        [Math.cos(angle + 0.15) * 0.46, 0.025, Math.sin(angle + 0.15) * 0.46],
      ],
      0.105,
      0.008,
      5,
    );
  }
  const wood = mergeGeometries(parts);
  parts.forEach((part) => part.dispose());
  return wood;
}
