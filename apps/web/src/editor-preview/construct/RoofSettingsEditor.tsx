import { DEFAULT_ROOF_SETTINGS, type RoofSettings } from "@cabane/engine";
import { DebouncedColorInput } from "./DebouncedColorInput";

export function RoofSettingsEditor({
  value = DEFAULT_ROOF_SETTINGS,
  onChange,
}: {
  value?: RoofSettings;
  onChange: (settings: RoofSettings) => void;
}) {
  return (
    <section
      className="construction-inspector__floor-settings sidebar-section-content"
      aria-label="Roof settings"
    >
      <fieldset aria-label="Roof appearance">
        <label>
          Ridge direction
          <select
            aria-label="Roof ridge direction"
            value={value.direction}
            onChange={(event) =>
              onChange({ ...value, direction: event.target.value as RoofSettings["direction"] })
            }
          >
            <option value="left-right">Left–right ↔</option>
            <option value="front-back">Front–back ↕</option>
            <option value="flat">Flat</option>
          </select>
        </label>
        <label>
          Roof color
          <DebouncedColorInput
            label="Roof color"
            value={value.color}
            onCommit={(color) => onChange({ ...value, color })}
          />
        </label>
        <label>
          Trim color
          <DebouncedColorInput
            label="Roof trim color"
            value={value.edgeColor}
            onCommit={(edgeColor) => onChange({ ...value, edgeColor })}
          />
        </label>
      </fieldset>
      <p className="sidebar-section-note">To view it, save and turn on Show roof in Home.</p>
    </section>
  );
}
