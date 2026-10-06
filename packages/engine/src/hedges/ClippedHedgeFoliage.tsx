import { useLayoutEffect, useRef } from "react";
import { InstancedMesh, Object3D } from "three";
import { ToonMaterial } from "../rendering";

/** Small flattened foliage clusters retain the straight clipping envelope. */
export function ClippedHedgeFoliage({
  length,
  height,
  width,
}: {
  length: number;
  height: number;
  width: number;
}) {
  const mesh = useRef<InstancedMesh>(null);
  const columns = Math.min(90, Math.max(1, Math.ceil(length / 0.22)));
  const rows = Math.min(12, Math.max(1, Math.ceil(height / 0.24)));
  const count = columns * (rows * 2 + 1);
  useLayoutEffect(() => {
    if (!mesh.current) return;
    const transform = new Object3D();
    let index = 0;
    for (let column = 0; column < columns; column++) {
      const x = -length / 2 + ((column + 0.5) * length) / columns;
      for (let row = 0; row < rows; row++) {
        for (const side of [-1, 1]) {
          transform.position.set(
            x + ((Math.sin(column * 17.3 + row * 4.1) * length) / columns) * 0.26,
            ((row + 0.5 + Math.sin(column * 6.7 + row * 2.3) * 0.28) * height) / rows,
            (side * width) / 2,
          );
          transform.rotation.set(0, 0, Math.sin(column * 3.7 + row * 8.3));
          transform.scale.set(
            Math.min(0.12, (length / columns) * 0.4) * (0.7 + Math.cos(column + row) * 0.25),
            (height / rows) * 0.28,
            0.006,
          );
          transform.updateMatrix();
          mesh.current.setMatrixAt(index++, transform.matrix);
        }
      }
      transform.position.set(x, height + 0.002, Math.sin(column * 7.3) * width * 0.25);
      transform.rotation.set(0, column, 0);
      transform.scale.set(Math.min(0.12, (length / columns) * 0.4), 0.012, width * 0.14);
      transform.updateMatrix();
      mesh.current.setMatrixAt(index++, transform.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.computeBoundingSphere();
  }, [length, height, width, columns, rows]);
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} receiveShadow>
      <icosahedronGeometry args={[1, 0]} />
      <ToonMaterial color="#4a713a" />
    </instancedMesh>
  );
}
