import { createContext, useContext, useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";

/** Receives only the rendered home canvas, never dashboard UI or camera media. */
export const ScenePreviewContext = createContext<((canvas: HTMLCanvasElement) => void) | null>(
  null,
);

export function ScenePreview({ enabled }: { enabled: boolean }) {
  const capture = useContext(ScenePreviewContext);
  const invalidate = useThree((state) => state.invalidate);
  const ready = useRef(false);
  useEffect(() => {
    ready.current = false;
    if (!enabled || !capture) return;
    const request = () => {
      ready.current = true;
      invalidate();
    };
    const first = window.setTimeout(request, 2500);
    const refresh = window.setInterval(request, 30000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(refresh);
      ready.current = false;
    };
  }, [enabled, capture, invalidate]);
  // StylizedScene renders at priority 1. Copy before the drawing buffer is cleared.
  useFrame(({ gl }) => {
    if (!enabled || !ready.current || !capture) return;
    ready.current = false;
    capture(gl.domElement);
  }, 2);
  return null;
}
