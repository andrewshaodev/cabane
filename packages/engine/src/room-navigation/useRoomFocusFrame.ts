import { useLayoutEffect, useRef, useState } from "react";
import type { RoomFocusFrame } from "./room-camera-framing";

/** A CSS-sized empty region keeps camera fitting aligned with responsive controls. */
export function useRoomFocusFrame() {
  const ref = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState<RoomFocusFrame | null>(null);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => {
      const next = {
        left: element.offsetLeft,
        top: element.offsetTop,
        width: element.clientWidth,
        height: element.clientHeight,
      };
      setFrame((previous) =>
        previous &&
        Object.keys(next).every(
          (key) => previous[key as keyof RoomFocusFrame] === next[key as keyof RoomFocusFrame],
        )
          ? previous
          : next,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return { ref, frame };
}
