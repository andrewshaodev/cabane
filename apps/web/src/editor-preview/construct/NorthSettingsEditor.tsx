import { useRef, useState, type PointerEvent } from "react";
import { CommittedNumberInput } from "../../editor-chrome/CommittedNumberInput";
import { SidebarSectionSummary } from "../../editor-chrome/SidebarSectionSummary";
import "./NorthSettingsEditor.css";

const normalizeAngle = (angle: number) => ((angle % 360) + 360) % 360;

export function NorthSettingsEditor({
  value,
  onChange,
}: {
  value: number;
  onChange: (angle: number) => void;
}) {
  const [draft, setDraft] = useState<number | null>(null);
  const activePointer = useRef<number | null>(null);
  const angle = draft ?? value;
  const commit = (next: number) => {
    setDraft(null);
    const normalized = normalizeAngle(next);
    if (normalized !== value) onChange(normalized);
  };
  const pointerAngle = (event: PointerEvent<HTMLButtonElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - bounds.left - bounds.width / 2;
    const y = event.clientY - bounds.top - bounds.height / 2;
    if (Math.hypot(x, y) < bounds.width * 0.08) return null;
    return normalizeAngle(Math.round((Math.atan2(x, -y) * 180) / Math.PI));
  };
  const cancel = () => {
    activePointer.current = null;
    setDraft(null);
  };
  return (
    <details className="construction-inspector__floor-disclosure">
      <SidebarSectionSummary
        icon="spawn"
        title="North"
        description="Point the arrow toward north on your plan."
      />
      <section
        className="construction-inspector__floor-settings sidebar-section-content"
        aria-label="North orientation"
      >
        <button
          type="button"
          className="north-compass"
          aria-label="Set north direction"
          aria-describedby="north-direction-hint"
          onPointerDown={(event) => {
            if (event.button !== 0 || activePointer.current !== null) return;
            const next = pointerAngle(event);
            if (next === null) return;
            event.preventDefault();
            event.currentTarget.focus();
            event.currentTarget.setPointerCapture(event.pointerId);
            activePointer.current = event.pointerId;
            setDraft(next);
          }}
          onPointerMove={(event) => {
            if (activePointer.current !== event.pointerId) return;
            const next = pointerAngle(event);
            if (next !== null) setDraft(next);
          }}
          onPointerUp={(event) => {
            if (activePointer.current !== event.pointerId) return;
            activePointer.current = null;
            commit(pointerAngle(event) ?? angle);
          }}
          onPointerCancel={cancel}
          onLostPointerCapture={() => {
            if (activePointer.current !== null) cancel();
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              cancel();
            }
            const step = event.shiftKey ? 1 : 15;
            const turn = ["ArrowRight", "ArrowDown"].includes(event.key)
              ? step
              : ["ArrowLeft", "ArrowUp"].includes(event.key)
                ? -step
                : null;
            if (turn !== null) {
              event.preventDefault();
              commit(angle + turn);
            }
          }}
        >
          <svg
            viewBox="0 0 100 100"
            role="img"
            aria-label={`North points ${angle} degrees clockwise from plan up`}
          >
            <circle cx="50" cy="50" r="45" className="north-compass__ring" />
            <path d="M50 8 V92 M8 50 H92" className="north-compass__axes" />
            <path d="M33 37 H67 V66 H33 Z M33 37 L50 26 L67 37" className="north-compass__plan" />
            <g transform={`rotate(${angle} 50 50)`}>
              <path d="M50 22 L40 55 L50 50 L60 55 Z" className="north-compass__arrow" />
              <text
                x="50"
                y="17"
                textAnchor="middle"
                fontSize="12"
                transform={`rotate(${-angle} 50 17)`}
              >
                N
              </text>
            </g>
            <circle cx="50" cy="50" r="3" className="north-compass__arrow" />
          </svg>
        </button>
        <p id="north-direction-hint" className="sidebar-section-note">
          Click or drag the arrow to match geographic north on your plan. Use arrow keys to rotate;
          Shift for finer steps.
        </p>
        <label>
          North angle (°)
          <CommittedNumberInput
            label="North angle (degrees)"
            value={value}
            step={1}
            onCommit={commit}
          />
        </label>
      </section>
    </details>
  );
}
