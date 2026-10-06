import { useFrame } from "@react-three/fiber";
import { ToonMaterial as LitMaterial } from "@cabane/engine";
import { useRef } from "react";
import type { Group } from "three";
import { noPlanRaycast, PlanOverlayMaterial } from "./PlanDrawing";
import { constructPixelsPerMeter } from "./plan-screen-scale";

/** Shared cream ring/coral dot; Measure retains its original world-space size. */
export function ConstructionPointMarker({
  name,
  position,
  planMode = false,
  radiusPixels,
}: {
  name?: string;
  position: [number, number, number];
  planMode?: boolean;
  radiusPixels?: number;
}) {
  const marker = useRef<Group>(null);
  const ToonMaterial = planMode ? PlanOverlayMaterial : LitMaterial;
  useFrame(({ camera, size }) => {
    if (marker.current && radiusPixels !== undefined) {
      marker.current.scale.setScalar(
        radiusPixels / (0.055 * constructPixelsPerMeter(camera, size.height)),
      );
    }
  });
  return (
    <group ref={marker} name={name} position={position}>
      <mesh renderOrder={30} raycast={noPlanRaycast}>
        <cylinderGeometry args={[0.055, 0.055, 0.025, 18]} />
        <ToonMaterial color="#fff7f1" depthTest={false} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.014, 0]} renderOrder={31} raycast={noPlanRaycast}>
        <cylinderGeometry args={[0.028, 0.028, 0.027, 18]} />
        <ToonMaterial color="#ff754d" depthTest={false} depthWrite={false} />
      </mesh>
    </group>
  );
}
