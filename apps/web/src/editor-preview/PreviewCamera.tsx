import { type OrthographicCamera as ThreeOrthographicCamera, Vector3 } from "three";
import { MapControls, OrthographicCamera } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import {
  worldBoundsForFloorScene,
  worldBoundsForPolygon,
  type FloorSpec,
  type PlanPoint,
} from "@cabane/engine";
import { useCallback, useEffect, useRef, useState, type ComponentRef, type RefObject } from "react";
import type { EditorCameraState } from "../editor-connect/connect-navigation";

import { navigatePlanWheel } from "./construct/plan-wheel-navigation";

interface PreviewCameraProps {
  planWheelNavigation?: boolean;
  view: EditorCameraState["view"];
  resetKey: number;
  floor: FloorSpec;
  controlsEnabled: boolean;
  focusPoint: PlanPoint | null;
  focusRoomId?: (string | null) | undefined;
  onTargetChange: (point: PlanPoint, isVisible: (position: readonly number[]) => boolean) => void;
  savedCamera: RefObject<EditorCameraState | null>;
}

export function PreviewCamera(props: PreviewCameraProps) {
  const { view, resetKey, savedCamera, floor } = props;
  const previousFloorId = useRef(floor.id);
  const initialCamera = useRef(savedCamera.current);
  const initialReset = useRef(resetKey);
  if (previousFloorId.current !== floor.id) {
    previousFloorId.current = floor.id;
    initialCamera.current = savedCamera.current;
    initialReset.current = resetKey;
  }
  const restored =
    initialReset.current === resetKey && initialCamera.current?.view === view
      ? initialCamera.current
      : null;
  return <PreviewCameraRig key={`${view}-${resetKey}`} {...props} restored={restored} />;
}

function PreviewCameraRig({
  view,
  floor,
  controlsEnabled,
  focusPoint,
  focusRoomId,
  onTargetChange,
  savedCamera,
  restored,
  planWheelNavigation,
}: PreviewCameraProps & { restored: EditorCameraState | null }) {
  const { width, height } = useThree((state) => state.size);
  const canvas = useThree((state) => state.gl.domElement);
  const invalidate = useThree((state) => state.invalidate);
  const controls = useRef<ComponentRef<typeof MapControls>>(null);
  const {
    origin: [originX, originZ],
    metersPerPlanUnit,
  } = floor.coordinates;
  // Drei reconnects controls when onChange changes. Keep it stable during edits
  // so a render cannot remove the document's pointer-up listener mid-gesture.
  const handleChange = useCallback(() => {
    const target = controls.current?.target;
    const camera = controls.current?.object;
    if (target && camera)
      savedCamera.current = {
        view,
        position: camera.position.toArray(),
        target: target.toArray(),
        zoom: camera.zoom,
      };
    if (target && camera)
      onTargetChange(
        [target.x / metersPerPlanUnit + originX, target.z / metersPerPlanUnit + originZ],
        (position) => {
          const projected = new Vector3(position[0], position[1], position[2]).project(camera);
          return (
            Math.abs(projected.x) < 0.9 &&
            Math.abs(projected.y) < 0.9 &&
            projected.z >= -1 &&
            projected.z <= 1
          );
        },
      );
  }, [metersPerPlanUnit, onTargetChange, originX, originZ, savedCamera, view]);
  useEffect(() => {
    if (!planWheelNavigation || view !== "top") return;
    const onWheel = (event: WheelEvent) => {
      const active = controls.current;
      const camera = active?.object as ThreeOrthographicCamera | undefined;
      if (!active || !camera?.isOrthographicCamera) return;
      event.preventDefault();
      // Capture before MapControls consumes wheel as zoom. This remains available
      // while pointer controls are disabled by a construction gesture.
      event.stopImmediatePropagation();
      navigatePlanWheel(
        event,
        camera,
        active.target,
        canvas.getBoundingClientRect(),
        active.minZoom,
        active.maxZoom,
      );
      active.update();
      handleChange();
      invalidate();
    };
    canvas.addEventListener("wheel", onWheel, { capture: true, passive: false });
    return () => canvas.removeEventListener("wheel", onWheel, true);
  }, [canvas, handleChange, invalidate, planWheelNavigation, view]);
  // Fit once per explicit view/focus request. Topology edits (including closing
  // a room, deleting walls, and undo/redo) must never overwrite the user's pose.
  // Resizing still updates the orthographic frustum, without resetting pan/zoom.
  const [framing] = useState(() => {
    if (restored) return restored;
    const focusRoom = floor.rooms.find((room) => room.id === focusRoomId);
    const bounds = focusRoom
      ? worldBoundsForPolygon(focusRoom.polygon, floor.coordinates)
      : worldBoundsForFloorScene(floor);
    const span = Math.max(bounds.width, bounds.depth, 2);
    const zoom = Math.max(
      8,
      Math.min(110, width / (bounds.width * 1.48), height / (bounds.depth * 1.58)),
    );
    const focusX = focusPoint
      ? (focusPoint[0] - floor.coordinates.origin[0]) * floor.coordinates.metersPerPlanUnit
      : bounds.centerX;
    const focusZ = focusPoint
      ? (focusPoint[1] - floor.coordinates.origin[1]) * floor.coordinates.metersPerPlanUnit
      : bounds.centerZ;
    return {
      position:
        view === "top"
          ? ([focusX, span * 2.2 + 4, focusZ + 0.001] as const)
          : ([focusX + span * 0.42, span * 0.72 + 2.8, focusZ + span * 0.48] as const),
      target: [focusX, 0.2, focusZ] as const,
      zoom:
        focusRoom && view === "3d"
          ? zoom * 0.7
          : focusPoint && !focusRoom
            ? Math.min(180, zoom * 2.25)
            : zoom,
    };
  });
  return (
    <group>
      <OrthographicCamera
        makeDefault
        position={framing.position}
        zoom={framing.zoom}
        near={0.1}
        far={150}
      />
      <MapControls
        ref={controls}
        makeDefault
        enabled={controlsEnabled}
        target={framing.target}
        onChange={handleChange}
        enablePan
        enableRotate={view === "3d"}
        enableZoom
        minPolarAngle={0}
        maxPolarAngle={view === "top" ? 0.01 : 1.28}
        minZoom={8}
        maxZoom={180}
        zoomToCursor
      />
    </group>
  );
}
