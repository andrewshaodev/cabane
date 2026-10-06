import { ToonMaterial } from "@cabane/engine";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { AdditiveBlending, BufferAttribute, BufferGeometry, Mesh, Vector3 } from "three";

/** Camera-facing jagged ribbons: no solid tube to read as a stick during movement. */
export function ElectricArc({ start, end, duration }: { start: Vector3; end: Vector3; duration: number }) {
  const mesh = useRef<Mesh>(null);
  const age = useRef(0);
  const geometry = useMemo(() => {
    const result = new BufferGeometry();
    result.setAttribute("position", new BufferAttribute(new Float32Array(32 * 6 * 3), 3));
    result.setAttribute("normal", new BufferAttribute(new Float32Array(32 * 6 * 3), 3));
    return result;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const scratch = useMemo(() => ({ direction: new Vector3(), side: new Vector3(), up: new Vector3(), view: new Vector3(), a: new Vector3(), b: new Vector3() }), []);
  useFrame(({ camera }, delta) => {
    age.current += delta;
    if (!mesh.current) return;
    mesh.current.visible = age.current < duration;
    if (!mesh.current.visible) return;
    const { direction, side, up, view, a, b } = scratch;
    direction.subVectors(end, start).normalize();
    view.subVectors(camera.position, start).normalize();
    side.crossVectors(direction, view);
    if (side.lengthSq() < .001) side.set(1, 0, 0).applyQuaternion(camera.quaternion);
    side.normalize(); up.crossVectors(direction, side).normalize();
    const positions = geometry.attributes.position;
    const tick = Math.floor(age.current * 30);
    const jitter = (i: number) => Math.sin(i * 127.1 + tick * 39.7) * Math.cos(i * 71.3 + tick * 11.9);
    const point = (i: number, target: Vector3) => target.copy(start).lerp(end, i / 24)
      .addScaledVector(side, jitter(i) * .095 * Math.sin(Math.PI * i / 24))
      .addScaledVector(up, jitter(i + 30) * .065 * Math.sin(Math.PI * i / 24));
    const width = .009 + .005 * (1 - age.current / duration);
    for (let i = 0; i < 32; i++) {
      if (i < 24) { point(i, a); point(i + 1, b); }
      else {
        const anchor = 3 + (i - 24) * 2;
        point(anchor, a);
        b.copy(a).addScaledVector(side, jitter(i + 80) * .24).addScaledVector(up, jitter(i + 90) * .2).addScaledVector(direction, .13);
      }
      [ [a, -1], [a, 1], [b, -1], [b, -1], [a, 1], [b, 1] ].forEach(([p, sign], vertex) => {
        const v = p as Vector3, offset = (sign as number) * width;
        positions.setXYZ(i * 6 + vertex, v.x + side.x * offset, v.y + side.y * offset, v.z + side.z * offset);
      });
    }
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
  });
  return <mesh ref={mesh} geometry={geometry} frustumCulled={false} raycast={() => undefined}>
    <ToonMaterial color="#9beaff" emissive="#219bff" emissiveIntensity={5} toneMapped={false} transparent opacity={.9} blending={AdditiveBlending} depthWrite={false} side={2} />
  </mesh>;
}
