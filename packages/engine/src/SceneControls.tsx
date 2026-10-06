import { useCabaneDom } from "./CabaneDom";
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
  const dom = useCabaneDom();
  useEffect(() => {
    const move = (event: MouseEvent) => {
      if (dom.root.pointerLockElement) {
        lookDeltaRef.current.x += event.movementX;
        lookDeltaRef.current.y += event.movementY;
      }
    };
    dom.events.addEventListener("mousemove", move);
    return () => {
      dom.events.removeEventListener("mousemove", move);
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
