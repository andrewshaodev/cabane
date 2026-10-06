import { ToonMaterial } from "@cabane/engine";
import { Quaternion, Vector3 } from "three";

/** Crossing tubular supports join floor pads to the seat and back. */
export function FoldingChairFrame() {
  return <group>
    {[-.205,.205].map(x => <group key={x}>
      {[-.25,.25].map(z => <mesh name="folding-chair-foot" key={z} position={[x,.01,z]}>
        <boxGeometry args={[.026,.02,.02]} /><ToonMaterial color="#8c9391" />
      </mesh>)}
      {[[.25,.78,-.175],[-.25,.44,.15]].map(([footZ, topY, topZ]) => {
        const from = new Vector3(x,.01,footZ);
        const to = new Vector3(x,topY,topZ);
        const direction = to.clone().sub(from);
        const middle = from.clone().add(to).multiplyScalar(.5);
        const rotation = new Quaternion().setFromUnitVectors(new Vector3(0,1,0), direction.clone().normalize());
        return <mesh key={footZ} name="folding-chair-support" position={[middle.x,middle.y,middle.z]} quaternion={[rotation.x,rotation.y,rotation.z,rotation.w]}>
          <cylinderGeometry args={[.01,.01,direction.length(),12]} /><ToonMaterial color="#a6aaa7" />
        </mesh>;
      })}
    </group>)}
  </group>;
}
