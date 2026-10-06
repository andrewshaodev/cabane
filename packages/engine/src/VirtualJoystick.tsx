import {
  useCallback,
  useEffect,
  useRef,
  type MutableRefObject,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { normalizeStickInput, type StickVector } from "./navigation";

export function VirtualJoystick({
  label,
  side,
  inputRef,
}: {
  label: string;
  side: "left" | "right";
  inputRef: MutableRefObject<StickVector>;
}) {
  const zoneRef = useRef<HTMLDivElement>(null);
  const baseRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const pointerId = useRef<number | null>(null);
  const origin = useRef({ x: 0, y: 0 });
  const reset = useCallback(() => {
    pointerId.current = null;
    inputRef.current = { x: 0, y: 0 };
    baseRef.current?.classList.remove("is-active");
    if (knobRef.current) knobRef.current.style.transform = "translate3d(0,0,0)";
  }, [inputRef]);
  const start = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerId.current !== null) return;
    event.preventDefault();
    pointerId.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    origin.current = { x: event.clientX, y: event.clientY };
    const bounds = event.currentTarget.getBoundingClientRect();
    if (baseRef.current) {
      baseRef.current.style.transform = `translate3d(${event.clientX - bounds.left - 56}px,${event.clientY - bounds.top - 56}px,0)`;
      baseRef.current.classList.add("is-active");
    }
  };
  const move = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerId.current !== event.pointerId) return;
    const dx = event.clientX - origin.current.x;
    const dy = event.clientY - origin.current.y;
    const travel = 32;
    const distance = Math.hypot(dx, dy);
    const visualScale = Math.min(1, travel / Math.max(travel, distance));
    inputRef.current = normalizeStickInput(dx, dy, travel);
    if (knobRef.current) {
      knobRef.current.style.transform = `translate3d(${dx * visualScale}px,${dy * visualScale}px,0)`;
    }
  };
  useEffect(() => {
    window.addEventListener("blur", reset);
    return () => window.removeEventListener("blur", reset);
  }, [reset]);
  return (
    <div
      ref={zoneRef}
      className={`walk-joystick-zone walk-joystick-zone--${side}`}
      role="group"
      aria-label={label}
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={reset}
      onPointerCancel={reset}
      onContextMenu={(event) => event.preventDefault()}
    >
      <div ref={baseRef} className="walk-joystick" aria-hidden="true">
        <div ref={knobRef} className="walk-joystick__knob" />
      </div>
    </div>
  );
}
