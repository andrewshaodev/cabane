import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { ToonMaterial as LitMaterial, type FloorCoordinates } from "@cabane/engine";
import { useMemo, useRef } from "react";
import { DoubleSide, type Group, Vector3 } from "three";
import { ConstructionDistanceLabel } from "./ConstructionDistanceLabel";
import { constructPlanToWorld } from "./drag-geometry";
import { noPlanRaycast, PlanOverlayMaterial } from "./PlanDrawing";
import { constructPixelsPerMeter } from "./plan-screen-scale";
import type { WallAngleGuide } from "./wall-connection-measurements";

export function ConstructionAngleGuide({ angle, coordinates, planMode, labelKind = "Wall" }: {
  angle: WallAngleGuide;
  labelKind?: string;
  coordinates: FloorCoordinates;
  planMode: boolean;
}) {
  const ToonMaterial = planMode ? PlanOverlayMaterial : LitMaterial;
  const scaled = useRef<Group>(null);
  const labelElement = useRef<HTMLDivElement>(null);
  const projected = useMemo(() => new Vector3(), []);
  const [x, z] = constructPlanToWorld(angle.junction, coordinates);
  const mid = angle.startRadians + angle.sweepRadians / 2;
  const labelX = Math.cos(mid) * 56, labelZ = Math.sin(mid) * 56;
  useFrame(({ camera, size }) => {
    const scale = 1 / constructPixelsPerMeter(camera, size.height);
    scaled.current?.scale.setScalar(scale);
    const element = labelElement.current;
    if (!element) return;
    projected.set(x + labelX * scale, .24, z + labelZ * scale).project(camera);
    const screenX = (projected.x + 1) * size.width / 2;
    const screenY = (1 - projected.y) * size.height / 2;
    const halfW = element.offsetWidth / 2, halfH = element.offsetHeight / 2;
    const dx = Math.max(halfW + 8, Math.min(size.width - halfW - 8, screenX)) - screenX;
    const dy = Math.max(halfH + 8, Math.min(size.height - halfH - 8, screenY)) - screenY;
    element.style.transform = `translate(${dx}px, ${dy}px)`;
  });
  return <group name="construction-angle-guide" position={[x, .24, z]} userData={angle}>
    <group ref={scaled} name="construction-angle-screen-scale">
      <mesh rotation={[-Math.PI / 2, 0, 0]} raycast={noPlanRaycast} renderOrder={32}>
        <ringGeometry args={[31, 32.5, Math.max(8, Math.ceil(angle.degrees / 5)), 1,
          -angle.startRadians - angle.sweepRadians, angle.sweepRadians]} />
        <ToonMaterial color="#ff754d" side={DoubleSide} depthTest={false} depthWrite={false} />
      </mesh>
      {typeof document !== "undefined" && <Html position={[labelX, 0, labelZ]} center
        zIndexRange={[14, 0]} style={{ pointerEvents: "none" }}>
        <div ref={labelElement} style={{ pointerEvents: "none" }}>
          <ConstructionDistanceLabel label={angle.label} ariaLabel={`${labelKind} angle`} />
        </div>
      </Html>}
    </group>
  </group>;
}
