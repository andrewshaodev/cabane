import { useLayoutEffect, useRef } from "react";
import { InstancedMesh, Object3D, Vector3 } from "three";
import { ToonMaterial } from "../../rendering";
export interface StairStroke {from:readonly [number,number,number];to:readonly [number,number,number];width:number}
/** Instanced rectangular strokes used by stair plans and guard rails. */
export function StairStrokeSegments({strokes,color,plan=false}: {strokes:readonly StairStroke[];color:string;plan?:boolean}) {
  const ref=useRef<InstancedMesh>(null);
  useLayoutEffect(()=>{
    const object=new Object3D(),direction=new Vector3(),axis=new Vector3(0,0,1);
    strokes.forEach(({from,to,width},i)=>{
      direction.set(to[0]-from[0],to[1]-from[1],to[2]-from[2]);
      const length=direction.length();
      object.position.set((from[0]+to[0])/2,(from[1]+to[1])/2,(from[2]+to[2])/2);
      object.quaternion.setFromUnitVectors(axis,direction.normalize());
      object.scale.set(width,plan ? .008 : width,length);
      object.updateMatrix();ref.current!.setMatrixAt(i,object.matrix);
    });
    ref.current!.instanceMatrix.needsUpdate=true;ref.current!.computeBoundingSphere();
  },[strokes,plan]);
  return <instancedMesh ref={ref} args={[undefined,undefined,strokes.length]} raycast={()=>undefined} castShadow={!plan}>
    <boxGeometry /><ToonMaterial color={plan?"#000000":color} emissive={plan?color:undefined} emissiveIntensity={plan?1:0} toneMapped={!plan} />
  </instancedMesh>;
}
