import { useCabaneDom } from "@cabane/engine";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { EditorButton } from "../../editor-chrome/EditorButton";
import "./NorthOrientationOverlay.css";

const normalize = (angle: number) => ((angle % 360) + 360) % 360;
const pointOnDial = (degrees: number, radius: number) => {
  const radians = (degrees * Math.PI) / 180;
  return { x: 200 + Math.sin(radians) * radius, y: 200 - Math.cos(radians) * radius };
};

export function NorthOrientationOverlay({
  angle,
  onRotate,
  onConfirm,
  onCancel,
}: {
  angle: number;
  onRotate: (angle: number) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const dom = useCabaneDom();
  const area = useRef<HTMLDivElement>(null);
  const dial = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const drag = useRef<{ pointerId: number; bearing: number; angle: number } | null>(null);
  const [diameter, setDiameter] = useState(0);
  useEffect(() => {
    const element = area.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setDiameter(Math.max(0, Math.min(entry.contentRect.width, entry.contentRect.height))),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const previousFocus =
      dom.root.activeElement instanceof HTMLElement ? dom.root.activeElement : null;
    dial.current?.focus();
    return () => {
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [dom]);
  const bearing = (event: PointerEvent<HTMLButtonElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - bounds.left - bounds.width / 2;
    const y = event.clientY - bounds.top - bounds.height / 2;
    return Math.hypot(x, y) < 12 ? null : (Math.atan2(x, -y) * 180) / Math.PI;
  };
  const move = (event: PointerEvent<HTMLButtonElement>) => {
    const current = drag.current;
    const next = bearing(event);
    if (!current || current.pointerId !== event.pointerId || next === null) return;
    const delta =
      (Math.atan2(
        Math.sin(((next - current.bearing) * Math.PI) / 180),
        Math.cos(((next - current.bearing) * Math.PI) / 180),
      ) *
        180) /
      Math.PI;
    onRotate(normalize(Math.round(current.angle + delta)));
  };
  return (
    <dialog
      open
      ref={dialog}
      className="north-orientation"
      aria-modal="true"
      aria-labelledby="north-orientation-title"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onCancel();
        }
        if (event.key === "Tab") {
          const buttons = Array.from(
            dialog.current?.querySelectorAll<HTMLButtonElement>("button") ?? [],
          );
          const first = buttons[0],
            last = buttons.at(-1);
          if (event.shiftKey && dom.root.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && dom.root.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }
      }}
    >
      <header className="north-orientation__heading">
        <strong id="north-orientation-title">Orient your home</strong>
        <span id="north-orientation-hint">
          Rotate the compass so N points toward geographic north on your plan.
        </span>
      </header>
      <div ref={area} className="north-orientation__area">
        <button
          ref={dial}
          type="button"
          role="slider"
          className="north-orientation__dial"
          aria-label="Rotate compass"
          aria-valuemin={0}
          aria-valuemax={359}
          aria-valuenow={angle}
          aria-valuetext={`${angle} degrees clockwise from plan up`}
          aria-describedby="north-orientation-hint"
          style={{ width: diameter, height: diameter }}
          onPointerDown={(event) => {
            if (event.button !== 0 || drag.current) return;
            const next = bearing(event);
            if (next === null) return;
            event.preventDefault();
            event.currentTarget.focus();
            event.currentTarget.setPointerCapture(event.pointerId);
            drag.current = { pointerId: event.pointerId, bearing: next, angle };
          }}
          onPointerMove={move}
          onPointerUp={(event) => {
            move(event);
            drag.current = null;
          }}
          onPointerCancel={() => {
            if (drag.current) onRotate(drag.current.angle);
            drag.current = null;
          }}
          onLostPointerCapture={() => {
            if (drag.current) onRotate(drag.current.angle);
            drag.current = null;
          }}
          onKeyDown={(event) => {
            const step = event.shiftKey ? 1 : 5;
            const turn = ["ArrowRight", "ArrowDown"].includes(event.key)
              ? step
              : ["ArrowLeft", "ArrowUp"].includes(event.key)
                ? -step
                : null;
            if (turn !== null) {
              event.preventDefault();
              onRotate(normalize(angle + turn));
            }
            if (event.key === "Home") {
              event.preventDefault();
              onRotate(0);
            }
          }}
        >
          <svg viewBox="0 0 400 400" aria-hidden="true">
            <circle cx="200" cy="200" r="177" className="north-orientation__ring" />
            {Array.from({ length: 72 }, (_, index) => {
              const degrees = angle + index * 5;
              const outer = pointOnDial(degrees, 177);
              const inner = pointOnDial(
                degrees,
                index % 18 === 0 ? 157 : index % 3 === 0 ? 163 : 170,
              );
              return (
                <line
                  key={index}
                  x1={inner.x}
                  y1={inner.y}
                  x2={outer.x}
                  y2={outer.y}
                  className={
                    index % 18 === 0 ? "north-orientation__major" : "north-orientation__tick"
                  }
                />
              );
            })}
            {(["N", "E", "S", "W"] as const).map((label, index) => {
              const point = pointOnDial(angle + index * 90, 193);
              return (
                <text
                  key={label}
                  x={point.x}
                  y={point.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className={
                    label === "N" ? "north-orientation__north" : "north-orientation__cardinal"
                  }
                >
                  {label}
                </text>
              );
            })}
          </svg>
        </button>
      </div>
      <footer className="north-orientation__actions">
        <span className="north-orientation__angle" aria-live="polite">
          {angle}°
        </span>
        <EditorButton onClick={onCancel}>Cancel</EditorButton>
        <EditorButton variant="primary" onClick={onConfirm}>
          Confirm direction
        </EditorButton>
      </footer>
    </dialog>
  );
}
