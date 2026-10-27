import { CUSTOM_MODEL_LIMITS, type CustomModelLight, type ModelVector } from "@cabane/engine";
import { LengthInput } from "../editor-chrome/LengthInput";
import { EditorButton } from "../editor-chrome/EditorButton";

function PositionFields({
  label,
  value,
  onChange,
}: {
  label: string;
  value: ModelVector;
  onChange: (value: ModelVector) => void;
}) {
  return (
    <div className="model-import-vectors">
      {["X", "Y", "Z"].map((axis, index) => (
        <label key={axis}>
          {label} {axis}
          <LengthInput
            label={`${label} ${axis}`}
            value={value[index]}
            onCommit={(next) =>
              onChange(value.map((n, i) => (i === index ? next : n)) as [number, number, number])
            }
          />
        </label>
      ))}
    </div>
  );
}

export function ModelLightFields({
  value,
  onChange,
  materialNames,
  disabled = false,
}: {
  value: CustomModelLight;
  onChange: (value: CustomModelLight) => void;
  materialNames: readonly string[];
  disabled?: boolean;
}) {
  const points = value.points ?? [];
  const names = value.emissiveMaterials ?? [];
  return (
    <fieldset disabled={disabled}>
      <legend>Light sources</legend>
      <p className="model-import-hint">
        All sources and selected materials follow the connected light. Positions are metres in the
        oriented, resized model. Up to 8 points per model and 32 imported points per floor.
      </p>
      <label>
        Source type
        <select
          aria-label="Source type"
          value={value.strip ? "strip" : "points"}
          onChange={(event) => {
            const { points: _points, strip: _strip, ...shared } = value;
            onChange(
              event.target.value === "strip"
                ? {
                    ...shared,
                    strip: {
                      end: [value.position[0] + 1, value.position[1], value.position[2]],
                      samples: 5,
                    },
                  }
                : shared,
            );
          }}
        >
          <option value="points">Point lights</option>
          <option value="strip">Strip / line</option>
        </select>
      </label>
      <PositionFields
        label={value.strip ? "Start" : "Light"}
        value={value.position}
        onChange={(position) => onChange({ ...value, position })}
      />
      {value.strip ? (
        <>
          <PositionFields
            label="End"
            value={value.strip.end}
            onChange={(end) => onChange({ ...value, strip: { ...value.strip!, end } })}
          />
          <label>
            Strip samples
            <input
              type="number"
              min={2}
              max={CUSTOM_MODEL_LIMITS.lightPoints}
              step={1}
              required
              value={value.strip.samples}
              onChange={(event) => {
                const samples = Number(event.target.value);
                if (
                  Number.isInteger(samples) &&
                  samples >= 2 &&
                  samples <= CUSTOM_MODEL_LIMITS.lightPoints
                )
                  onChange({ ...value, strip: { ...value.strip!, samples } });
              }}
            />
          </label>
        </>
      ) : (
        <>
          {points.map((point, index) => (
            <div key={index}>
              <PositionFields
                label={`Point ${index + 2}`}
                value={point}
                onChange={(position) =>
                  onChange({ ...value, points: points.map((p, i) => (i === index ? position : p)) })
                }
              />
              <EditorButton
                onClick={() => onChange({ ...value, points: points.filter((_, i) => i !== index) })}
              >
                Remove point {index + 2}
              </EditorButton>
            </div>
          ))}
          <EditorButton
            disabled={points.length + 1 >= CUSTOM_MODEL_LIMITS.lightPoints}
            onClick={() => onChange({ ...value, points: [...points, value.position] })}
          >
            Add light point
          </EditorButton>
        </>
      )}
      <div className="model-import-vectors">
        <label>
          Color
          <input
            type="color"
            value={value.color}
            onChange={(event) => onChange({ ...value, color: event.target.value })}
          />
        </label>
        <label>
          Total intensity
          <input
            type="number"
            min={0}
            step={0.1}
            required
            value={value.maxIntensity}
            onChange={(event) => onChange({ ...value, maxIntensity: Number(event.target.value) })}
          />
        </label>
        <label>
          Range
          <LengthInput
            label="Light range"
            min={0}
            value={value.distance}
            onCommit={(distance) => onChange({ ...value, distance })}
          />
        </label>
      </div>
      <fieldset>
        <legend>Glowing materials</legend>
        <p className="model-import-hint">
          Choose up to 16 named GLB materials. Their glow follows brightness and colour; their
          textures stay intact.
        </p>
        {materialNames.length ? (
          materialNames.map((name) => (
            <label className="model-light-material" key={name}>
              <input
                type="checkbox"
                checked={names.includes(name)}
                disabled={
                  !names.includes(name) && names.length >= CUSTOM_MODEL_LIMITS.emissiveMaterials
                }
                onChange={(event) =>
                  onChange({
                    ...value,
                    emissiveMaterials: event.target.checked
                      ? [...names, name]
                      : names.filter((n) => n !== name),
                  })
                }
              />
              {name}
            </label>
          ))
        ) : (
          <p>No named Standard or Physical materials in this model.</p>
        )}
      </fieldset>
    </fieldset>
  );
}
