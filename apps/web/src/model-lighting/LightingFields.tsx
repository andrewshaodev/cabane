import { useRef } from "react";
import { LengthInput } from "../editor-chrome/LengthInput";
import { EditorButton } from "../editor-chrome/EditorButton";
import { EditorIcon } from "../editor-chrome/EditorIcon";
import type {
  CustomModelLight,
  DeviceModelBounds,
  ModelLightingSurfaceOption,
  ModelVector,
} from "@cabane/engine";
import { fittedStrip, stripSamples } from "./lighting-layout";
export function LightingFields({
  light,
  onChange,
  bounds,
  selected,
  onSelect,
  picking,
  onPicking,
  surfaces,
}: {
  light: CustomModelLight;
  onChange: (light: CustomModelLight) => void;
  bounds: DeviceModelBounds;
  selected: number;
  onSelect: (index: number) => void;
  picking: "position" | "surface" | null;
  onPicking: (mode: "position" | "surface" | null) => void;
  surfaces: readonly ModelLightingSurfaceOption[];
}) {
  const pointLayout = useRef<Pick<CustomModelLight, "position" | "points"> | null>(null);
  const stripLayout = useRef<Pick<CustomModelLight, "position" | "strip"> | null>(null);
  const positions = light.strip
    ? [light.position, light.strip.end]
    : [light.position, ...(light.points ?? [])];
  const position = positions[Math.min(selected, positions.length - 1)];
  const setPosition = (next: ModelVector) => {
    if (light.strip) {
      const start = selected === 0 ? next : light.position;
      const end = selected === 1 ? next : light.strip.end;
      onChange({ ...light, position: start, strip: { end, samples: stripSamples(start, end) } });
    } else if (selected === 0) onChange({ ...light, position: next });
    else
      onChange({ ...light, points: light.points!.map((p, i) => (i === selected - 1 ? next : p)) });
  };
  return (
    <div className="lighting-fields">
      <fieldset>
        <legend>Light sources</legend>
        <label className="lighting-illuminate">
          <input
            type="checkbox"
            checked={light.illuminate !== false}
            onChange={(event) => onChange({ ...light, illuminate: event.target.checked })}
          />
          Illuminate surroundings
        </label>
        <div className="lighting-type" role="group" aria-label="Source type">
          <EditorButton
            aria-pressed={!light.strip}
            onClick={() => {
              if (!light.strip) return;
              stripLayout.current = { position: light.position, strip: light.strip };
              const { strip: _strip, ...rest } = light;
              onChange({ ...rest, ...(pointLayout.current ?? {}) });
              onSelect(0);
            }}
          >
            Point lights
          </EditorButton>
          <EditorButton
            aria-pressed={!!light.strip}
            onClick={() => {
              if (light.strip) return;
              pointLayout.current = {
                position: light.position,
                ...(light.points ? { points: light.points } : {}),
              };
              const { points: _points, ...rest } = light;
              onChange(
                stripLayout.current
                  ? { ...rest, ...stripLayout.current }
                  : fittedStrip(light, bounds),
              );
              onSelect(0);
            }}
          >
            LED strip
          </EditorButton>
        </div>
        <div className="lighting-source-list">
          {positions.map((_position, index) => (
            <div key={index} className="lighting-source-row">
              <EditorButton
                aria-pressed={selected === index && picking === "position"}
                onClick={() => {
                  onSelect(index);
                  onPicking(selected === index && picking === "position" ? null : "position");
                }}
              >
                <EditorIcon name="move" />
                <span>
                  {light.strip ? (index === 0 ? "Strip start" : "Strip end") : `Point ${index + 1}`}
                </span>
                {selected === index && picking === "position" && (
                  <small className="lighting-source-state">Editing</small>
                )}
              </EditorButton>
              {!light.strip && index > 0 && (
                <EditorButton
                  variant="text"
                  aria-label={`Remove point ${index + 1}`}
                  onClick={() => {
                    onChange({
                      ...light,
                      points: light.points!.filter((_p, i) => i !== index - 1),
                    });
                    onSelect(0);
                  }}
                >
                  Remove
                </EditorButton>
              )}
            </div>
          ))}
        </div>
        {light.strip ? (
          <EditorButton variant="text" onClick={() => onChange(fittedStrip(light, bounds))}>
            Fit along model
          </EditorButton>
        ) : (
          <EditorButton
            disabled={positions.length >= 8}
            onClick={() => {
              onChange({
                ...light,
                points: [
                  ...(light.points ?? []),
                  [
                    light.position[0] + Math.max(0.03, (bounds.max[0] - bounds.min[0]) * 0.1),
                    light.position[1],
                    light.position[2],
                  ],
                ],
              });
              onSelect(positions.length);
              onPicking("position");
            }}
          >
            Add light point
          </EditorButton>
        )}
        <p className="lighting-note">
          Select {light.strip ? "an endpoint" : "a point"} to edit its position in the preview.
          Select it again to finish.
        </p>
      </fieldset>
      <fieldset>
        <legend>Glowing surfaces</legend>
        <EditorButton
          aria-pressed={picking === "surface"}
          onClick={() => onPicking(picking === "surface" ? null : "surface")}
        >
          <EditorIcon name="select" />
          Choose in preview
        </EditorButton>
        {picking === "surface" && (
          <p className="lighting-note">
            Click surfaces to add or remove glow. Select again to finish.
          </p>
        )}
        {!surfaces.some((surface) => surface.supported) && (
          <p className="lighting-note">No surfaces available for glow.</p>
        )}
      </fieldset>
      <fieldset>
        <legend>Appearance</legend>
        <label>
          Default color
          <input
            aria-label="Default light color"
            type="color"
            value={light.color}
            onChange={(event) => onChange({ ...light, color: event.target.value })}
          />
        </label>
        <label>
          Total brightness
          <input
            aria-label="Total brightness"
            type="number"
            min={0}
            step={0.1}
            value={light.maxIntensity}
            onChange={(event) => onChange({ ...light, maxIntensity: Number(event.target.value) })}
          />
        </label>
        <label>
          Range
          <LengthInput
            label="Light range"
            min={0}
            value={light.distance}
            onCommit={(distance) => onChange({ ...light, distance })}
          />
        </label>
      </fieldset>
      <details>
        <summary>Precise position</summary>
        <div className="lighting-coordinates">
          {["X", "Y", "Z"].map((axis, index) => (
            <label key={axis}>
              {axis}
              <LengthInput
                label={`${light.strip ? (selected === 0 ? "Start" : "End") : `Point ${selected + 1}`} ${axis}`}
                value={position[index]}
                onCommit={(value) =>
                  setPosition(
                    position.map((n, i) => (i === index ? value : n)) as [number, number, number],
                  )
                }
              />
            </label>
          ))}
        </div>
      </details>
    </div>
  );
}
