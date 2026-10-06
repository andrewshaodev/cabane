import { DOOR_PRESETS } from "@cabane/catalog/architecture";
import {
  doorFromConfiguration,
  type DoorConfiguration,
  type FloorSpec,
  type WallSpec,
} from "@cabane/engine";
import { useRef } from "react";
import { architecturalOpeningPreview } from "../openings/opening-preview-entry";
import { ModelThumbnail, ModelThumbnailRenderer } from "../furnish/catalog/ModelThumbnailRenderer";
import "../furnish/catalog/arrange-catalog.css";
import "./door-preset-palette.css";

const floor: FloorSpec = {
  id: "door-preview",
  name: "Door preview",
  floorToFloorHeightMeters: 3,
  coordinates: { origin: [0, 0], metersPerPlanUnit: 1, scaleBasis: "inferred" },
  defaultWallHeightMeters: 3,
  defaultCeilingHeightMeters: 3,
  footprint: [],
  walls: [],
  rooms: [],
  openings: [],
  wallJunctions: [],
};
const entries = DOOR_PRESETS.map((preset) => {
  const opening = doorFromConfiguration(preset.configuration, 1, {
    id: preset.id,
    wallId: "preview-wall",
    offsetFromWallStartPlanUnits: 0,
  });
  const wall: WallSpec = {
    id: "preview-wall",
    from: [0, 0],
    to: [preset.configuration.widthMeters, 0],
    classification: "interior",
    thicknessMeters: 0.16,
  };
  return { preset, entry: architecturalOpeningPreview(opening, floor, wall) };
});
const matches = (a: DoorConfiguration, b: DoorConfiguration) =>
  a.operation === b.operation &&
  a.variant === b.variant &&
  (a.openingSide ?? "right") === (b.openingSide ?? "right") &&
  (a.hingeSide ?? "start") === (b.hingeSide ?? "start") &&
  (a.slideDirection ?? "start") === (b.slideDirection ?? "start") &&
  a.finish === b.finish &&
  a.leafCount === b.leafCount &&
  Math.abs(a.widthMeters - b.widthMeters) < 1e-6 &&
  Math.abs(a.heightMeters - b.heightMeters) < 1e-6;
export function DoorPresetPalette({
  value,
  onChange,
}: {
  value: DoorConfiguration;
  onChange: (value: DoorConfiguration) => void;
}) {
  const scrollRoot = useRef<HTMLDivElement>(null);
  const selected = entries.find(({ preset }) => matches(value, preset.configuration))?.preset.id;
  return (
    <section className="door-preset-palette" aria-label="Door type">
      <ModelThumbnailRenderer scrollRoot={scrollRoot} enabled>
        <div
          className="floor-finish-palette__grid door-preset-palette__grid"
          ref={scrollRoot}
          role="group"
          aria-label="Door presets"
        >
          {entries.map(({ preset, entry }) => (
            <button
              type="button"
              key={preset.id}
              aria-label={preset.label}
              aria-pressed={selected === preset.id}
              onClick={() => onChange({ ...preset.configuration })}
            >
              <ModelThumbnail
                entry={entry}
                showAdd={false}
                fallback={<span>Preview unavailable</span>}
              />
              <small>{preset.label}</small>
            </button>
          ))}
        </div>
      </ModelThumbnailRenderer>
      {!selected && <p className="construction-inspector__tool-hint">Custom</p>}
    </section>
  );
}
