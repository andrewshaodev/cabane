import { deriveFloorLevels } from "./building/floor-levels";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { MapControls, OrthographicCamera } from "@react-three/drei";

import { useThree } from "@react-three/fiber";

import { type OrthographicCamera as ThreeOrthographicCamera } from "three";

import { useCallback, useEffect, useRef, useState, type Ref } from "react";

import { worldBoundsForPolygon } from "./geometry";

import { worldBoundsForFloorScene } from "./pools/pool-footprint";

import type { FloorSpec, RoomSpec } from "./types";
import { ROOF_MAX_RISE_METERS, ROOF_THICKNESS_METERS } from "./roof/roof-settings";

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

const ORBIT_DOUBLE_TAP_DELAY_MS = 320;

const ORBIT_DOUBLE_TAP_DISTANCE_PX = 24;

const ORBIT_TAP_MOVEMENT_PX = 12;

const ORBIT_DOUBLE_TAP_ZOOM_FACTOR = 1.5;

const ORBIT_MAX_ZOOM = 190;

function OrbitDoubleTapZoom() {
  const { camera, gl, invalidate } = useThree();
  const gesture = useRef<{
    active: Map<number, { x: number; y: number }>;
    hadMultiplePointers: boolean;
    lastTap: { time: number; x: number; y: number } | null;
  }>({
    active: new Map(),
    hadMultiplePointers: false,
    lastTap: null,
  });

  useEffect(() => {
    const element = gl.domElement;

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== "touch") return;
      const current = gesture.current;
      current.active.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (current.active.size > 1) current.hadMultiplePointers = true;
    };

    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerType !== "touch") return;
      const current = gesture.current;
      const start = current.active.get(event.pointerId);
      current.active.delete(event.pointerId);

      if (!start || current.hadMultiplePointers) {
        if (current.active.size === 0) current.hadMultiplePointers = false;
        current.lastTap = null;
        return;
      }

      const movement = Math.hypot(event.clientX - start.x, event.clientY - start.y);
      if (movement > ORBIT_TAP_MOVEMENT_PX) {
        current.lastTap = null;
        return;
      }

      const previous = current.lastTap;
      const isDoubleTap =
        previous !== null &&
        event.timeStamp - previous.time <= ORBIT_DOUBLE_TAP_DELAY_MS &&
        Math.hypot(event.clientX - previous.x, event.clientY - previous.y) <=
          ORBIT_DOUBLE_TAP_DISTANCE_PX;

      if (!isDoubleTap) {
        current.lastTap = { time: event.timeStamp, x: event.clientX, y: event.clientY };
        return;
      }

      current.lastTap = null;
      event.preventDefault();
      const orbitCamera = camera as ThreeOrthographicCamera;
      if (!orbitCamera.isOrthographicCamera) return;
      orbitCamera.zoom = Math.min(ORBIT_MAX_ZOOM, orbitCamera.zoom * ORBIT_DOUBLE_TAP_ZOOM_FACTOR);
      orbitCamera.updateProjectionMatrix();
      invalidate();
    };

    const onPointerCancel = (event: PointerEvent) => {
      const current = gesture.current;
      current.active.delete(event.pointerId);
      if (current.active.size === 0) current.hadMultiplePointers = false;
      current.lastTap = null;
    };

    element.addEventListener("pointerdown", onPointerDown);
    element.addEventListener("pointerup", onPointerUp);
    element.addEventListener("pointercancel", onPointerCancel);
    return () => {
      element.removeEventListener("pointerdown", onPointerDown);
      element.removeEventListener("pointerup", onPointerUp);
      element.removeEventListener("pointercancel", onPointerCancel);
    };
  }, [camera, gl, invalidate]);

  return null;
}

export const cameraZoomForViewport = (
  viewportWidth: number,
  viewportHeight: number,
  bounds: { width: number; depth: number },
  focused: boolean,
) => {
  const widthFit = viewportWidth / Math.max(1, bounds.width * (focused ? 1.28 : 1.6));
  const depthFit = viewportHeight / Math.max(1, bounds.depth * (focused ? 1.15 : 1.55));
  return clamp(Math.min(widthFit, depthFit), focused ? 46 : 8, focused ? 160 : 115);
};

interface OrbitCameraProps {
  controlsRef?: Ref<OrbitControlsImpl>;
  floor: FloorSpec;
  showRoof?: boolean;
  elevation?: number;
  buildingFloors?: readonly (FloorSpec & { elevationMeters?: number })[];
  room?: RoomSpec;
  resetKey: number;
}

export function OrbitCamera(props: OrbitCameraProps) {
  return <OrbitCameraRig key={`${props.resetKey}-${props.room?.id ?? "overview"}`} {...props} />;
}

function OrbitCameraRig({
  showRoof = false,
  controlsRef,
  elevation = 0,
  buildingFloors,
  floor,
  room,
}: OrbitCameraProps) {
  const { width, height } = useThree((state) => state.size);
  // Fit on entry or an explicit reset; scene visibility must preserve the live pose.
  const [framing] = useState(() => {
    const polygon = room?.polygon ?? floor.footprint;
    const bounds = room
      ? worldBoundsForPolygon(polygon, floor.coordinates)
      : worldBoundsForFloorScene(floor);
    if (!room && buildingFloors?.length) {
      for (const level of buildingFloors) {
        const other = worldBoundsForFloorScene(level);
        bounds.minX = Math.min(bounds.minX, other.minX);
        bounds.maxX = Math.max(bounds.maxX, other.maxX);
        bounds.minZ = Math.min(bounds.minZ, other.minZ);
        bounds.maxZ = Math.max(bounds.maxZ, other.maxZ);
      }
      bounds.width = bounds.maxX - bounds.minX;
      bounds.depth = bounds.maxZ - bounds.minZ;
      bounds.centerX = (bounds.minX + bounds.maxX) / 2;
      bounds.centerZ = (bounds.minZ + bounds.maxZ) / 2;
    }
    const levels = deriveFloorLevels(buildingFloors ?? []);
    const buildingBase = levels[0]?.elevationMeters ?? 0;
    const buildingHeight =
      (levels.length
        ? levels.at(-1)!.elevationMeters +
          buildingFloors!.at(-1)!.floorToFloorHeightMeters -
          buildingBase
        : 0) + (showRoof ? ROOF_MAX_RISE_METERS + ROOF_THICKNESS_METERS + 0.16 : 0);
    const span = Math.max(bounds.width, bounds.depth, buildingHeight, 2);
    const stacked = !room && (showRoof || (buildingFloors?.length ?? 0) > 1);
    const targetHeight = stacked
      ? buildingBase + buildingHeight / 2
      : (room ? 0.55 : 0.2) + elevation;
    const zoom = cameraZoomForViewport(
      width,
      height,
      stacked ? { width: bounds.width, depth: bounds.depth + buildingHeight * 0.75 } : bounds,
      Boolean(room),
    );
    return {
      position: [
        bounds.centerX + span * 0.82,
        span * 1.16 + 2.8 + targetHeight,
        bounds.centerZ + span * 0.92,
      ] as const,
      target: [bounds.centerX, targetHeight, bounds.centerZ] as const,
      zoom,
    };
  });
  const aimInitialCamera = useCallback(
    (camera: ThreeOrthographicCamera | null) => {
      camera?.lookAt(...framing.target);
    },
    [framing],
  );
  return (
    <group>
      <OrthographicCamera
        ref={aimInitialCamera}
        makeDefault
        position={framing.position}
        zoom={framing.zoom}
        near={0.1}
        far={150}
      />
      <OrbitDoubleTapZoom />
      <MapControls
        ref={controlsRef}
        makeDefault
        target={framing.target}
        enablePan
        enableRotate
        enableZoom
        enableDamping
        dampingFactor={0.24}
        panSpeed={1.2}
        rotateSpeed={0.95}
        zoomSpeed={1.1}
        minPolarAngle={0}
        maxPolarAngle={1.28}
        minZoom={room ? 20 : 8}
        maxZoom={ORBIT_MAX_ZOOM}
        zoomToCursor
      />
    </group>
  );
}
