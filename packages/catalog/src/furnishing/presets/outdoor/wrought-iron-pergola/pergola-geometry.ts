import { BoxGeometry, BufferGeometry, CatmullRomCurve3, IcosahedronGeometry, SphereGeometry, TubeGeometry, Vector3 } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

/** Deterministic, batched ironwork and climbing wisteria; all dimensions in metres. */
export function createPergolaGeometry() {
  const iron: BufferGeometry[] = [], wood: BufferGeometry[] = [];
  const leaves: BufferGeometry[][] = [[], [], []], flowers: BufferGeometry[] = [];
  const cable: BufferGeometry[] = [], bulbs: BufferGeometry[] = [], sockets: BufferGeometry[] = [];
  const box = (x: number, y: number, z: number, w: number, h: number, d: number) =>
    new BoxGeometry(w, h, d).translate(x, y, z);
  const tube = (points: Vector3[], radius: number, segments = 32) =>
    new TubeGeometry(new CatmullRomCurve3(points), segments, radius, 5, false);
  for (const z of [-1.46, 1.46]) iron.push(box(0, 2.65, z, 4, .1, .08));
  for (const x of [-1.96, 1.96]) iron.push(box(x, 2.65, 0, .08, .1, 3));
  for (let i = 0; i < 9; i++) iron.push(box(-1.8 + i * .45, 2.61, 0, .024, .035, 2.9));
  for (const z of [-.8, 0, .8]) iron.push(box(0, 2.63, z, 3.9, .022, .022));
  for (const x of [-1.88, 1.88]) for (const z of [-1.38, 1.38]) {
    // Flared collars and curled knee braces meet each post and overhead rail.
    iron.push(box(x, .12, z, .11, .06, .11), box(x, 2.48, z, .105, .065, .105));
    for (const axis of [0, 2]) {
      const sign = (axis === 0 ? x : z) > 0 ? -1 : 1;
      const points = Array.from({ length: 25 }, (_, i) => {
        const t = i / 24, p = new Vector3(x, 2.03 + .55 * Math.sin(t * Math.PI / 2), z);
        p.setComponent(axis, p.getComponent(axis) + sign * .56 * (1 - Math.cos(t * Math.PI / 2)));
        return p;
      });
      iron.push(tube(points, .016));
      const curl = Array.from({ length: 33 }, (_, i) => {
        const t = i / 32, angle = t * Math.PI * 2.2, r = .14 * (1 - t * .78);
        const p = new Vector3(x, 2.35 + Math.sin(angle) * r, z);
        p.setComponent(axis, p.getComponent(axis) + sign * (.24 + Math.cos(angle) * r));
        return p;
      });
      iron.push(tube(curl, .011));
    }
    const stem = Array.from({ length: 49 }, (_, i) => {
      const t = i / 48;
      return new Vector3(x + Math.sin(t * 19) * .065, .02 + t * 2.53, z + Math.cos(t * 19) * .065);
    });
    wood.push(tube(stem, .018, 48));
    for (let i = 9; i < 47; i += 2) {
      const p = stem[i];
      leaves[i % 3].push(new IcosahedronGeometry(1, 0).scale(.045, .025, .055)
        .rotateY(i * 2.4).rotateZ(i * .7).translate(p.x, p.y, p.z));
    }
  }
  // Asymmetric leafy runners leave the central roof open to the sky.
  for (let row = 0; row < 6; row++) {
    const z = -.98 + row * .39;
    const points = Array.from({ length: 49 }, (_, i) => {
      const x = -1.86 + i / 48 * 3.72;
      return new Vector3(x, 2.54 + Math.sin(i * .37 + row) * .035, z + Math.sin(i * .28 + row) * .12);
    });
    wood.push(tube(points, .012, 48));
    points.forEach((p, i) => {
      if ((i + row * 3) % 7 < 2) return;
      for (const side of [-1, 1]) leaves[(i + row) % 3].push(new IcosahedronGeometry(1, 0)
        .scale(.105, .024, .058).rotateY(side * .65 + i * .4)
        .translate(p.x, p.y + .035, p.z + side * .07));
      if (i % 9 === row % 9) {
        for (let j = 0; j < 7; j++) flowers.push(new IcosahedronGeometry(1, 0)
          .scale(.04 * (1 - j * .09), .038, .04 * (1 - j * .09))
          .translate(p.x + Math.sin(j * 2) * .017, p.y - .04 - j * .042, p.z));
      }
    });
  }
  for (let row = 0; row < 3; row++) {
    const z = -.98 + row * .98;
    const point = (t: number) => new Vector3(-1.88 + t * 3.76, 2.52 - .28 * Math.sin(t * Math.PI), z);
    cable.push(tube(Array.from({ length: 33 }, (_, i) => point(i / 32)), .006));
    for (let i = 1; i < 10; i++) {
      const p = point(i / 10);
      sockets.push(box(p.x, p.y - .025, p.z, .025, .05, .025));
      bulbs.push(new SphereGeometry(.034, 8, 6).scale(1, 1.25, 1).translate(p.x, p.y - .083, p.z));
    }
  }
  const merge = (parts: BufferGeometry[]) => {
    const geometry = mergeGeometries(parts)!;
    parts.forEach(part => part.dispose());
    return geometry;
  };
  return { iron: merge(iron), wood: merge(wood), leaves: leaves.map(merge), flowers: merge(flowers),
    cable: merge(cable), bulbs: merge(bulbs), sockets: merge(sockets) };
}
