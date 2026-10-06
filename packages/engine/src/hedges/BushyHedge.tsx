import { useLayoutEffect, useRef } from "react";
import { InstancedMesh, Object3D } from "three";
import { ToonMaterial } from "../rendering";

const foliageColors = ["#76934a", "#4f773e", "#628443"];

/** Batch only within this hedge; retain each original solid and its material. */
export function BushyHedge({ length, height, width }: { length: number; height: number; width: number }) {
  const count = Math.min(180, Math.max(2, Math.ceil(length / (width * .3))));
  const trunks = useRef<InstancedMesh>(null);
  const foliage = useRef<(InstancedMesh | null)[]>([]);
  useLayoutEffect(() => {
    const transform = new Object3D();
    for (let i = 0; i < count; i++) {
      const x = -length / 2 + (i + .5) * length / count;
      transform.position.set(x, height * .22, 0);
      transform.rotation.set(0, 0, 0); transform.scale.set(1, 1, 1);
      transform.updateMatrix(); trunks.current!.setMatrixAt(i, transform.matrix);
      transform.position.set(x, height * .52, Math.sin(i * 2.4) * width * .08);
      transform.rotation.set(0, i * 1.7, 0);
      transform.scale.set(Math.min(width * .6, length / 2), height * .48 * (.86 + Math.sin(i * 7.31) * .12), width * .42);
      transform.updateMatrix(); foliage.current[i % 3]!.setMatrixAt(Math.floor(i / 3), transform.matrix);
    }
    for (const mesh of [trunks.current, ...foliage.current]) {
      if (!mesh) continue;
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingBox(); mesh.computeBoundingSphere();
    }
  }, [count, length, height, width]);
  return <group>
    <instancedMesh ref={trunks} args={[undefined, undefined, count]} castShadow>
      <cylinderGeometry args={[.025, .045, height * .44, 5]} /><ToonMaterial color="#6c5940" />
    </instancedMesh>
    {foliageColors.map((color, index) => <instancedMesh key={color}
      ref={mesh => { foliage.current[index] = mesh; }}
      args={[undefined, undefined, Math.max(0, Math.ceil((count - index) / 3))]} castShadow receiveShadow>
      <icosahedronGeometry args={[1, 1]} /><ToonMaterial color={color} />
    </instancedMesh>)}
  </group>;
}
