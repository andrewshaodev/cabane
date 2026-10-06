import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useLayoutEffect, useRef } from "react";
import { Mesh, type Group } from "three";
import { noPlanRaycast, PlanOverlayMaterial } from "./PlanDrawing";
import { constructPixelsPerMeter } from "./plan-screen-scale";
type Pointer = ThreeEvent<PointerEvent>;
const raycastHandle: Mesh["raycast"] = function (this: Mesh, raycaster, intersections) {
  this.updateWorldMatrix(true, false);
  Mesh.prototype.raycast.call(this, raycaster, intersections);
};

export function ConstructionOutlineHandle({ at, name, handlers }: { at: [number, number, number]; name: string; handlers: {
  onPointerDown: (event: Pointer) => void; onPointerMove: (event: Pointer) => void;
  onPointerUp: (event: Pointer) => void; onPointerCancel: (event: Pointer) => void;
} }) {
  const ref = useRef<Group>(null);
  const { camera, size } = useThree();
  const syncTarget = () => {
    if (!ref.current) return;
    ref.current.scale.setScalar(1 / constructPixelsPerMeter(camera, size.height));
    // Demand rendering can receive another pointer event before the next frame.
    // Keep the transparent hit target aligned after selection, history, and resize.
    ref.current.updateWorldMatrix(true, true);
  };
  useLayoutEffect(syncTarget);
  useFrame(syncTarget);
  return <group ref={ref} position={at}>
    <mesh name={name} userData={{ constructionEditHandle: true }} raycast={raycastHandle} {...handlers}>
      <sphereGeometry args={[22, 12, 8]} /><PlanOverlayMaterial visible={false} transparent opacity={0} depthWrite={false} />
    </mesh>
    <mesh raycast={noPlanRaycast} renderOrder={32}>
      <sphereGeometry args={[6, 12, 8]} /><PlanOverlayMaterial color="#fff7f1" depthTest={false} />
    </mesh>
  </group>;
}

