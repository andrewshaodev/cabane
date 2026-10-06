import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { FloorCoordinates, PlanPoint } from "@cabane/engine";
import { useMemo, useRef } from "react";
import { Vector3 } from "three";
import { ConstructionDistanceLabel } from "./ConstructionDistanceLabel";
import { ConstructionPointMarker } from "./ConstructionPointMarker";
import {
  constructMeasurementIsVisible,
  formatConstructDistance,
  measureConstructPoints,
} from "./measure-geometry";
import { constructPixelsPerMeter } from "./plan-screen-scale";
import { constructPlanToWorld } from "./drag-geometry";

export function ConstructionWallGuide({
  name = "construction-wall-guide",
  wallId,
  from,
  to,
  coordinates,
  planMode,
  showMarkers = false,
  wallThicknessMeters = 0.12,
  labelKind = "Wall",
  labelAvoidPoint,
}: {
  name?: string;
  wallId?: string | undefined;
  from: PlanPoint;
  to: PlanPoint;
  coordinates: FloorCoordinates;
  planMode: boolean;
  showMarkers?: boolean;
  wallThicknessMeters?: number;
  labelKind?: string;
  labelAvoidPoint?: PlanPoint | undefined;
}) {
  const measurement = useMemo(
    () => measureConstructPoints(from, to, coordinates),
    [from, to, coordinates],
  );
  const visible = constructMeasurementIsVisible(measurement);
  const label = `${formatConstructDistance(measurement.distanceMeters)} m`;
  const labelElement = useRef<HTMLDivElement>(null);
  const projected = useMemo(() => [new Vector3(), new Vector3(), new Vector3()] as const, []);
  useFrame(({ camera, size }) => {
    const element = labelElement.current;
    if (!element) return;
    const a = projected[0]
      .set(measurement.world.from[0], 0.25, measurement.world.from[1])
      .project(camera);
    const b = projected[1]
      .set(measurement.world.to[0], 0.25, measurement.world.to[1])
      .project(camera);
    const dx = (b.x - a.x) * size.width;
    const dy = (a.y - b.y) * size.height;
    const length = Math.hypot(dx, dy);
    if (length <= 1e-6) return;
    // Put the label on the upper/left side, perpendicular to the screen-space
    // wall. Its own dimensions keep vertical and diagonal labels off the band.
    const side = dx < 0 ? -1 : 1;
    let nx = (dy / length) * side;
    let ny = (-dx / length) * side;
    if (labelAvoidPoint) {
      const [x, z] = constructPlanToWorld(labelAvoidPoint, coordinates);
      const c = projected[2].set(x, 0.25, z).project(camera);
      if (
        nx * (c.x - (a.x + b.x) / 2) * size.width - ny * (c.y - (a.y + b.y) / 2) * size.height >
        0
      ) {
        nx = -nx;
        ny = -ny;
      }
    }
    const halfWidth = element.offsetWidth / 2;
    const halfHeight = element.offsetHeight / 2;
    const clearance =
      Math.abs(nx) * halfWidth +
      Math.abs(ny) * halfHeight +
      12 +
      (wallThicknessMeters * constructPixelsPerMeter(camera, size.height)) / 2;
    const centerX = ((a.x + b.x) / 4 + 0.5) * size.width;
    const centerY = (0.5 - (a.y + b.y) / 4) * size.height;
    const clamp = (value: number, half: number, span: number) =>
      Math.max(half + 8, Math.min(span - half - 8, value));
    const x = clamp(centerX + nx * clearance, halfWidth, size.width) - centerX;
    const y = clamp(centerY + ny * clearance, halfHeight, size.height) - centerY;
    element.style.transform = `translate(${x}px, ${y}px)`;
  });

  return (
    <group
      name={name}
      userData={{
        wallId,
        from,
        to,
        label,
        lengthMeters: measurement.distanceMeters,
        labelVisible: visible,
      }}
    >
      {showMarkers && (
        <>
          <ConstructionPointMarker
            name="construction-wall-start-marker"
            planMode={planMode}
            position={[measurement.world.from[0], 0.18, measurement.world.from[1]]}
            radiusPixels={4}
          />
          {visible && (
            <ConstructionPointMarker
              name="construction-wall-tip-marker"
              planMode={planMode}
              position={[measurement.world.to[0], 0.18, measurement.world.to[1]]}
              radiusPixels={7}
            />
          )}
        </>
      )}
      {visible && typeof document !== "undefined" && (
        <Html
          position={[measurement.world.center[0], 0.25, measurement.world.center[1]]}
          // Non-transform Html needs the style on its centered container too:
          // the offset label otherwise leaves an invisible hit target on the wall.
          center
          zIndexRange={[12, 0]}
          style={{ pointerEvents: "none" }}
        >
          <div ref={labelElement} style={{ transform: "translateY(-28px)", pointerEvents: "none" }}>
            <ConstructionDistanceLabel label={label} ariaLabel={`${labelKind} length`} />
          </div>
        </Html>
      )}
    </group>
  );
}
