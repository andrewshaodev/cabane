import {
  FLOOR_FINISH_PRESETS,
  paintFloorPattern,
  type FloorFinishSpec,
} from "@cabane/engine";
import { useEffect, useRef } from "react";

export type FloorPaintTarget = "room" | "custom-area";

export interface FloorPaintingInspector {
  finish: FloorFinishSpec;
  target: FloorPaintTarget;
  drawingActive: boolean;
  drawingError: string | null;
  onFinishChange: (finish: FloorFinishSpec) => void;
  onTargetChange: (target: FloorPaintTarget) => void;
  onCancelDrawing: () => void;
}

const finishKey = (finish: FloorFinishSpec) =>
  finish.kind === "solid" ? "solid" : finish.preset;

function PresetSwatch({
  preset,
}: {
  preset: (typeof FLOOR_FINISH_PRESETS)[number];
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let context: CanvasRenderingContext2D | null | undefined;
    try {
      context = canvas.current?.getContext("2d");
    } catch {
      context = null;
    }
    if (context) paintFloorPattern(context, preset.id, "plan");
  }, [preset]);
  return <canvas
    ref={canvas}
    width={64}
    height={64}
    aria-hidden="true"
  />;
}

export function FloorFinishPalette({
  value,
  onChange,
  target,
  onTargetChange,
  showTarget = true,
}: {
  value: FloorFinishSpec;
  onChange: (finish: FloorFinishSpec) => void;
  target: FloorPaintTarget;
  onTargetChange: (target: FloorPaintTarget) => void;
  showTarget?: boolean;
}) {
  const selected = finishKey(value);
  const solidColor = value.kind === "solid" ? value.color : "#d3cec5";
  return <section className="floor-finish-palette" aria-label="Floor finish">
    {showTarget && <div
      className="floor-finish-palette__targets"
      role="group"
      aria-label="Paint target"
    >
      <button
        type="button"
        aria-label="Whole room"
        aria-pressed={target === "room"}
        onClick={() => onTargetChange("room")}
      >
        Whole room
      </button>
      <button
        type="button"
        aria-label="Custom area"
        aria-pressed={target === "custom-area"}
        onClick={() => onTargetChange("custom-area")}
      >
        Custom area
      </button>
    </div>}
    <div className="floor-finish-palette__grid">
      <button
        type="button"
        aria-label="Solid color"
        aria-pressed={selected === "solid"}
        onClick={() => onChange({ kind: "solid", color: solidColor })}
      >
        <span style={{ background: solidColor }} aria-hidden="true" />
        <small>Solid</small>
      </button>
      {FLOOR_FINISH_PRESETS.map((preset) => (
        <button
          key={preset.id}
          type="button"
          aria-label={preset.label}
          aria-pressed={selected === preset.id}
          onClick={() => onChange({ kind: "preset", preset: preset.id })}
        >
          <PresetSwatch preset={preset} />
          <small>{preset.label}</small>
        </button>
      ))}
    </div>
    {selected === "solid" && <label>
      Solid color
      <input
        type="color"
        aria-label="Solid floor color"
        value={solidColor}
        onChange={(event) => onChange({
          kind: "solid",
          color: event.target.value,
        })}
      />
    </label>}
  </section>;
}
