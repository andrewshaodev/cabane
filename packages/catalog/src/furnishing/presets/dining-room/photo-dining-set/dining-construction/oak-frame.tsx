import { BufferGeometry, CatmullRomCurve3, CylinderGeometry, Float32BufferAttribute, Quaternion, TubeGeometry, Vector3 } from "three";
import { Outlines, ToonMaterial } from "@cabane/engine";

export type Point = readonly [number, number, number];

/** Turned timber between joinery points, with horizontal end cuts for feet. */
export function timber(from: Point, to: Point, bottom: number, top = bottom) {
  const a = new Vector3(...from), b = new Vector3(...to);
  const geometry = new CylinderGeometry(top, bottom, a.distanceTo(b), 10);
  geometry.applyQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), b.clone().sub(a).normalize()));
  geometry.translate(...a.clone().add(b).multiplyScalar(.5).toArray());
  if (from[1] === 0) {
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) if (positions.getY(i) < bottom * 2) positions.setY(i, 0);
    geometry.computeVertexNormals();
  }
  return geometry;
}

export function cord(points: Point[], radius: number, segments = 16) {
  return new TubeGeometry(new CatmullRomCurve3(points.map(p => new Vector3(...p))), segments, radius, 5, false);
}

/** A broad bentwood ribbon, not a round pipe: the rear rises into the backrest. */
export function bentwood() {
  const curve = new CatmullRomCurve3([
    new Vector3(-.232, .675, .135), new Vector3(-.257, .716, -.04),
    new Vector3(-.206, .765, -.17), new Vector3(0, .781, -.205),
    new Vector3(.206, .765, -.17), new Vector3(.257, .716, -.04),
    new Vector3(.232, .675, .135),
  ]);
  const positions: number[] = [], indices: number[] = [];
  for (let i = 0; i <= 40; i++) {
    const p = curve.getPoint(i / 40), t = curve.getTangent(i / 40);
    const normal = new Vector3(-t.z, 0, t.x).normalize();
    for (const [across, up] of [[-1,-1],[1,-1],[1,1],[-1,1]]) {
      positions.push(p.x + normal.x * across * .0192, p.y + up * .024, p.z + normal.z * across * .0192);
    }
    if (i < 40) for (let j = 0; j < 4; j++) {
      const a = i * 4 + j, b = i * 4 + (j + 1) % 4;
      indices.push(a,b,b+4,a,b+4,a+4);
    }
  }
  indices.push(0,2,1,0,3,2,160,161,162,160,162,163);
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions,3));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}

export function DiningOakMesh({ geometry, color = "#bd905b", outline = true, name }: {
  geometry: BufferGeometry; color?: string; outline?: boolean; name: string;
}) {
  return <mesh name={name} geometry={geometry} castShadow receiveShadow>
    <ToonMaterial color={color} />
    {outline && <Outlines color="#6f5033" thickness={.0015} screenspace={false} />}
  </mesh>;
}
