import { useLayoutEffect, useRef } from "react";
import { InstancedMesh, Object3D } from "three";
import { ToonMaterial } from "../rendering";

export function RoundedHedge({
  length,
  height,
  width,
}: {
  length: number;
  height: number;
  width: number;
}) {
  const count = Math.min(160, Math.max(1, Math.ceil(length / (width * 0.45))));
  const mesh = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const transform = new Object3D();
    transform.scale.set(Math.min(width * 0.65, length / 2), height / 2, width / 2);
    for (let i = 0; i < count; i++) {
      transform.position.set(-length / 2 + ((i + 0.5) * length) / count, height / 2, 0);
      transform.updateMatrix();
      mesh.current!.setMatrixAt(i, transform.matrix);
    }
    mesh.current!.instanceMatrix.needsUpdate = true;
    mesh.current!.computeBoundingBox();
    mesh.current!.computeBoundingSphere();
  }, [count, length, height, width]);
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} castShadow receiveShadow>
      <sphereGeometry args={[1, 10, 8]} />
      <ToonMaterial color="#587d3e" />
    </instancedMesh>
  );
}
