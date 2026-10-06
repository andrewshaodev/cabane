import {
  BoxGeometry,
  BufferGeometry,
  CatmullRomCurve3,
  IcosahedronGeometry,
  SphereGeometry,
  TubeGeometry,
  Vector3,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

/** Deterministic, batched ironwork and climbing wisteria; all dimensions in metres. */
export function createPergolaGeometry() {
  const iron: BufferGeometry[] = [],
    wood: BufferGeometry[] = [];
  const leaves: BufferGeometry[][] = [[], [], []],
    flowers: BufferGeometry[] = [];
  const cable: BufferGeometry[] = [],
    bulbs: BufferGeometry[] = [],
    sockets: BufferGeometry[] = [];
  const box = (x: number, y: number, z: number, w: number, h: number, d: number) =>
    new BoxGeometry(w, h, d).translate(x, y, z);
  const tube = (points: Vector3[], radius: number, segments = 32) =>
    new TubeGeometry(new CatmullRomCurve3(points), segments, radius, 5, false);
  for (const z of [-1.46, 1.46]) iron.push(box(0, 2.65, z, 4, 0.1, 0.08));
  for (const x of [-1.96, 1.96]) iron.push(box(x, 2.65, 0, 0.08, 0.1, 3));
  for (let i = 0; i < 9; i++) iron.push(box(-1.8 + i * 0.45, 2.61, 0, 0.024, 0.035, 2.9));
  for (const z of [-0.8, 0, 0.8]) iron.push(box(0, 2.63, z, 3.9, 0.022, 0.022));
  for (const x of [-1.88, 1.88])
    for (const z of [-1.38, 1.38]) {
      // Flared collars and curled knee braces meet each post and overhead rail.
      iron.push(box(x, 0.12, z, 0.11, 0.06, 0.11), box(x, 2.48, z, 0.105, 0.065, 0.105));
      for (const axis of [0, 2]) {
        const sign = (axis === 0 ? x : z) > 0 ? -1 : 1;
        const points = Array.from({ length: 25 }, (_, i) => {
          const t = i / 24,
            p = new Vector3(x, 2.03 + 0.55 * Math.sin((t * Math.PI) / 2), z);
          p.setComponent(
            axis,
            p.getComponent(axis) + sign * 0.56 * (1 - Math.cos((t * Math.PI) / 2)),
          );
          return p;
        });
        iron.push(tube(points, 0.016));
        const curl = Array.from({ length: 33 }, (_, i) => {
          const t = i / 32,
            angle = t * Math.PI * 2.2,
            r = 0.14 * (1 - t * 0.78);
          const p = new Vector3(x, 2.35 + Math.sin(angle) * r, z);
          p.setComponent(axis, p.getComponent(axis) + sign * (0.24 + Math.cos(angle) * r));
          return p;
        });
        iron.push(tube(curl, 0.011));
      }
      const stem = Array.from({ length: 49 }, (_, i) => {
        const t = i / 48;
        return new Vector3(
          x + Math.sin(t * 19) * 0.065,
          0.02 + t * 2.53,
          z + Math.cos(t * 19) * 0.065,
        );
      });
      wood.push(tube(stem, 0.018, 48));
      for (let i = 9; i < 47; i += 2) {
        const p = stem[i];
        leaves[i % 3].push(
          new IcosahedronGeometry(1, 0)
            .scale(0.045, 0.025, 0.055)
            .rotateY(i * 2.4)
            .rotateZ(i * 0.7)
            .translate(p.x, p.y, p.z),
        );
      }
    }
  // Asymmetric leafy runners leave the central roof open to the sky.
  for (let row = 0; row < 6; row++) {
    const z = -0.98 + row * 0.39;
    const points = Array.from({ length: 49 }, (_, i) => {
      const x = -1.86 + (i / 48) * 3.72;
      return new Vector3(
        x,
        2.54 + Math.sin(i * 0.37 + row) * 0.035,
        z + Math.sin(i * 0.28 + row) * 0.12,
      );
    });
    wood.push(tube(points, 0.012, 48));
    points.forEach((p, i) => {
      if ((i + row * 3) % 7 < 2) return;
      for (const side of [-1, 1])
        leaves[(i + row) % 3].push(
          new IcosahedronGeometry(1, 0)
            .scale(0.105, 0.024, 0.058)
            .rotateY(side * 0.65 + i * 0.4)
            .translate(p.x, p.y + 0.035, p.z + side * 0.07),
        );
      if (i % 9 === row % 9) {
        for (let j = 0; j < 7; j++)
          flowers.push(
            new IcosahedronGeometry(1, 0)
              .scale(0.04 * (1 - j * 0.09), 0.038, 0.04 * (1 - j * 0.09))
              .translate(p.x + Math.sin(j * 2) * 0.017, p.y - 0.04 - j * 0.042, p.z),
          );
      }
    });
  }
  for (let row = 0; row < 3; row++) {
    const z = -0.98 + row * 0.98;
    const point = (t: number) =>
      new Vector3(-1.88 + t * 3.76, 2.52 - 0.28 * Math.sin(t * Math.PI), z);
    cable.push(
      tube(
        Array.from({ length: 33 }, (_, i) => point(i / 32)),
        0.006,
      ),
    );
    for (let i = 1; i < 10; i++) {
      const p = point(i / 10);
      sockets.push(box(p.x, p.y - 0.025, p.z, 0.025, 0.05, 0.025));
      bulbs.push(
        new SphereGeometry(0.034, 8, 6).scale(1, 1.25, 1).translate(p.x, p.y - 0.083, p.z),
      );
    }
  }
  const merge = (parts: BufferGeometry[]) => {
    const geometry = mergeGeometries(parts)!;
    parts.forEach((part) => part.dispose());
    return geometry;
  };
  return {
    iron: merge(iron),
    wood: merge(wood),
    leaves: leaves.map(merge),
    flowers: merge(flowers),
    cable: merge(cable),
    bulbs: merge(bulbs),
    sockets: merge(sockets),
  };
}
