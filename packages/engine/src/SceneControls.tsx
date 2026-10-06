import {
  useEffect,
  type MutableRefObject
} from "react";

import {
  type StickVector
} from "./navigation";

export function DesktopLookSurface({
  lookDeltaRef,
}: {
  lookDeltaRef: MutableRefObject<StickVector>;
}) {
  useEffect(() => {
    const move = (event: MouseEvent) => {
      if (document.pointerLockElement) {
        lookDeltaRef.current.x += event.movementX;
        lookDeltaRef.current.y += event.movementY;
      }
    };
    document.addEventListener("mousemove", move);
    return () => {
      document.removeEventListener("mousemove", move);
      lookDeltaRef.current = { x: 0, y: 0 };
    };
  }, [lookDeltaRef]);
  return null;
}
export { useDesktopWalkInput } from "./desktop-walk-input";
export { cameraZoomForViewport, OrbitCamera } from "./OrbitCamera";
export { useCoarsePointer, useDocumentVisible, useReducedMotion } from "./scene-input-preferences";
export { VirtualJoystick } from "./VirtualJoystick";
export { WalkCameraController } from "./WalkCameraController";
