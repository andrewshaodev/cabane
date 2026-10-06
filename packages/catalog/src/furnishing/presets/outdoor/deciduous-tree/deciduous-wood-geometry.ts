import { CatmullRomCurve3, CylinderGeometry, Quaternion, Vector3 } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

type Point = [number, number, number];

export function createDeciduousWoodGeometry() {
  const parts: CylinderGeometry[] = [];
  const branch = (points: Point[], base: number, tip: number, steps = 9) => {
    const curve = new CatmullRomCurve3(points.map((point) => new Vector3(...point)));
    for (let step = 0; step < steps; step++) {
      const a = curve.getPoint(step / steps), b = curve.getPoint((step + 1) / steps);
      const direction = b.clone().sub(a);
      const radius = (t: number) => tip + (base - tip) * Math.pow(1 - t, 1.15);
      const segment = new CylinderGeometry(radius((step + 1) / steps), radius(step / steps), direction.length() + .012, 9);
      segment.applyQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction.normalize()));
      segment.translate(...a.add(b).multiplyScalar(.5).toArray());
      parts.push(segment);
    }
  };
  branch([[0, .08, 0], [-.07, .65, .03], [.03, 1.3, 0], [-.1, 1.95, -.04], [.04, 2.8, -.12], [.02, 3.65, 0]], .24, .025, 18);
  branch([[-.02, 1.25, 0], [-.30, 1.8, .02], [-.61, 2.14, .12], [-.82, 2.75, .16]], .14, .018);
  branch([[-.08, 1.72, -.02], [.23, 2.07, .06], [.59, 2.37, .20], [.78, 2.94, .22]], .125, .018);
  branch([[0, 1.43, 0], [.12, 1.95, .28], [.03, 2.3, .54], [.10, 2.8, .72]], .115, .015);
  branch([[-.08, 1.9, -.04], [-.18, 2.21, -.32], [-.22, 2.68, -.62], [-.35, 3.14, -.71]], .10, .015);
  for (let root = 0; root < 5; root++) {
    const angle = root * Math.PI * 2 / 5 + .3;
    branch([[0, .34, 0], [Math.cos(angle) * .23, .12, Math.sin(angle) * .23],
      [Math.cos(angle + .15) * .46, .025, Math.sin(angle + .15) * .46]], .105, .008, 5);
  }
  const wood = mergeGeometries(parts)!;
  parts.forEach((part) => part.dispose());
  return wood;
}
