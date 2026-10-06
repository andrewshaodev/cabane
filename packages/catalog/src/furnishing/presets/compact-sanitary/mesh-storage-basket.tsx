import { useEffect, useMemo } from "react";
import {
  type BufferGeometry,
  CylinderGeometry,
  TorusGeometry,
  Matrix4,
  Vector2,
  Vector3,
  Quaternion,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { ToonMaterial, type SceneItemSize } from "@cabane/engine";
export const MESH_STORAGE_BASKET_SIZE = [0.29, 0.18, 0.25] as const;
const rim = [
  [0.145, 0.164],
  [0.145, 0.18],
  [0.135, 0.18],
  [0.135, 0.164],
  [0.145, 0.164],
].map(([r, y]) => new Vector2(r, y));
export function MeshStorageBasket({ size = MESH_STORAGE_BASKET_SIZE }: { size?: SceneItemSize }) {
  const wires = useMemo(() => {
    const parts: BufferGeometry[] = Array.from({ length: 32 }, (_, i) => {
      const a = (i * Math.PI) / 16,
        from = new Vector3(Math.cos(a) * 0.125, 0.01, Math.sin(a) * 0.125),
        to = new Vector3(Math.cos(a) * 0.138, 0.17, Math.sin(a) * 0.138),
        direction = to.clone().sub(from);
      return new CylinderGeometry(0.0008, 0.0008, direction.length(), 6).applyMatrix4(
        new Matrix4().compose(
          from.clone().add(to).multiplyScalar(0.5),
          new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction.normalize()),
          new Vector3(1, 1, 1),
        ),
      );
    });
    for (let i = 0; i < 6; i++) {
      const y = 0.015 + i * 0.03,
        radius = 0.125 + (0.013 * (y - 0.01)) / 0.16;
      parts.push(
        new TorusGeometry(radius, 0.0008, 6, 32).applyMatrix4(
          new Matrix4().makeRotationX(Math.PI / 2).setPosition(0, y, 0),
        ),
      );
    }
    const g = mergeGeometries(parts);
    parts.forEach((p) => p.dispose());
    return g;
  }, []);
  useEffect(() => () => wires.dispose(), [wires]);
  return (
    <group
      name="mesh-storage-basket"
      scale={[size[0] / 0.29, size[1] / 0.18, size[2] / 0.29]}
      userData={{ walkCollider: true }}
    >
      <mesh name="basket-wire-mesh" geometry={wires}>
        <ToonMaterial color="#a4aaa8" />
      </mesh>
      <mesh name="wood-basket-rim">
        <latheGeometry args={[rim, 32]} />
        <ToonMaterial color="#ccb18a" side={2} />
      </mesh>
      <mesh name="basket-base" position={[0, 0.005, 0]}>
        <cylinderGeometry args={[0.125, 0.125, 0.01, 24]} />
        <ToonMaterial color="#a4aaa8" />
      </mesh>
    </group>
  );
}
