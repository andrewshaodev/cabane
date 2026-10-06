import { modelVariants, resolveModelVariant } from "@cabane/engine";
import { SelectionDetailsPanel } from "../../editor-chrome/SelectionDetailsPanel";
import type {
  FloorSpec,
  ItemPlacement,
  SceneItemSpec,
  SceneItemSize,
  SceneModelEditorDescriptor,
} from "@cabane/engine";
import { windowPlacements } from "./placement/window-placement";
const AXES = ["width", "height", "depth"] as const;
const NumericField = ({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}) => (
  <label>
    <span>{label}</span>
    <input
      type="number"
      step="0.01"
      value={Number(value.toFixed(4))}
      disabled={disabled}
      onChange={(event) => {
        const next = event.currentTarget.valueAsNumber;
        if (Number.isFinite(next)) onChange(next);
      }}
    />
  </label>
);

const rotationFor = (placement: ItemPlacement) =>
  placement.kind === "wall" ? placement.rotationOffsetRadians : placement.rotationYRadians;

export function FurnishingProperties({
  selected,
  definition,
  onPlacementChange,
  onSizeChange,
  onLightStateChange,
  onVariantChange,
  onClose,
  floor,
  onWindowFit,
}: {
  floor?: FloorSpec;
  onWindowFit?: (
    id: string,
    placement: ItemPlacement,
    size: SceneItemSize,
    definition: SceneModelEditorDescriptor,
  ) => void;
  selected: SceneItemSpec;
  definition: SceneModelEditorDescriptor;
  onPlacementChange: (id: string, placement: ItemPlacement) => void;
  onSizeChange: (id: string, size: SceneItemSize, definition: SceneModelEditorDescriptor) => void;
  onVariantChange?: (id: string, variant: string, definition: SceneModelEditorDescriptor) => void;
  onLightStateChange?: (
    id: string,
    lightState: "always-off" | "always-on" | "night-only" | "connected",
  ) => void;
  onClose: () => void;
}) {
  const updatePlacement = (patch: Partial<ItemPlacement>) =>
    onPlacementChange(selected.id, { ...selected.placement, ...patch } as ItemPlacement);
  const updateSize = (axis: number, value: number) => {
    const size = [...selected.size] as [number, number, number];
    size[axis] = value;
    onSizeChange(selected.id, size, definition);
  };
  const windows =
    floor && definition.windowFit
      ? windowPlacements(definition, floor, floor.coordinates.origin)
      : [];
  return (
    <SelectionDetailsPanel
      label={selected.kind === "device" ? "Selected device" : "Selected furnishing"}
      title={definition.label}
      subtitle={definition.category}
      onClose={onClose}
    >
      {modelVariants(definition).length > 1 && onVariantChange && (
        <fieldset>
          <legend>Appearance</legend>
          <label>
            <span>Variant</span>
            <select
              value={resolveModelVariant(definition, selected.variant).id}
              onChange={(event) =>
                onVariantChange(selected.id, event.currentTarget.value, definition)
              }
            >
              {modelVariants(definition).map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {variant.label}
                </option>
              ))}
            </select>
          </label>
        </fieldset>
      )}
      {definition.windowFit && onWindowFit && (
        <fieldset>
          <legend>Window</legend>
          <label>
            <span>Fit to window</span>
            <select
              value=""
              disabled={windows.length === 0}
              onChange={(event) => {
                const candidate = windows[Number(event.currentTarget.value)];
                if (candidate)
                  onWindowFit(selected.id, candidate.placement, candidate.size, definition);
              }}
            >
              <option value="">{windows.length ? "Choose a window…" : "No suitable window"}</option>
              {windows.map((candidate, index) => (
                <option key={`${candidate.openingId}-${index}`} value={index}>
                  {candidate.roomName} · {candidate.openingId}
                </option>
              ))}
            </select>
          </label>
        </fieldset>
      )}
      {selected.placement.kind === "absolute" && (
        <fieldset>
          <legend>Position</legend>
          <NumericField
            label="X"
            value={selected.placement.at[0]}
            onChange={(value) =>
              updatePlacement({
                at: [value, selected.placement.kind === "absolute" ? selected.placement.at[1] : 0],
              })
            }
          />
          <NumericField
            label="Z"
            value={selected.placement.at[1]}
            onChange={(value) =>
              updatePlacement({
                at: [selected.placement.kind === "absolute" ? selected.placement.at[0] : 0, value],
              })
            }
          />
          <NumericField
            label="Elevation"
            value={selected.placement.elevationMeters}
            onChange={(elevationMeters) => updatePlacement({ elevationMeters })}
          />
        </fieldset>
      )}
      {selected.placement.kind === "wall" && (
        <fieldset>
          <legend>
            Wall support · {selected.placement.wallId} · {selected.placement.face}
          </legend>
          <NumericField
            label="Offset"
            value={selected.placement.offsetFromWallStartPlanUnits}
            onChange={(offsetFromWallStartPlanUnits) =>
              updatePlacement({ offsetFromWallStartPlanUnits })
            }
          />
          <NumericField
            label="Elevation"
            value={selected.placement.elevationMeters}
            onChange={(elevationMeters) => updatePlacement({ elevationMeters })}
          />
          <NumericField
            label="Depth offset"
            value={selected.placement.depthOffsetMeters}
            onChange={(depthOffsetMeters) => updatePlacement({ depthOffsetMeters })}
          />
        </fieldset>
      )}
      {selected.placement.kind === "ceiling" && (
        <fieldset>
          <legend>Ceiling support · {selected.placement.roomId}</legend>
          <NumericField
            label="X"
            value={selected.placement.at[0]}
            onChange={(value) =>
              updatePlacement({
                at: [value, selected.placement.kind === "ceiling" ? selected.placement.at[1] : 0],
              })
            }
          />
          <NumericField
            label="Z"
            value={selected.placement.at[1]}
            onChange={(value) =>
              updatePlacement({
                at: [selected.placement.kind === "ceiling" ? selected.placement.at[0] : 0, value],
              })
            }
          />
          <NumericField
            label="Drop"
            value={selected.placement.dropMeters}
            onChange={(dropMeters) => updatePlacement({ dropMeters })}
          />
        </fieldset>
      )}

      {selected.kind === "device" &&
        resolveModelVariant(definition, selected.variant).sceneLight !== false &&
        selected.entitySlots.some(
          (slot) => slot.deviceRole === "primary" && slot.compatibleDomains.includes("light"),
        ) &&
        onLightStateChange && (
          <fieldset>
            <legend>Light</legend>
            <label>
              <span>State</span>
              <select
                value={selected.lightState ?? "connected"}
                onChange={(event) =>
                  onLightStateChange(
                    selected.id,
                    event.currentTarget.value as
                      "always-off" | "always-on" | "night-only" | "connected",
                  )
                }
              >
                <option value="always-off">Always off</option>
                <option value="always-on">Always on</option>
                <option value="night-only">Night only</option>
                <option value="connected">Connected</option>
              </select>
            </label>
          </fieldset>
        )}
      <fieldset>
        <legend>Rotation</legend>
        <NumericField
          label="Degrees"
          value={(rotationFor(selected.placement) * 180) / Math.PI}
          onChange={(degrees) => {
            const radians = (degrees * Math.PI) / 180;
            updatePlacement(
              selected.placement.kind === "wall"
                ? { rotationOffsetRadians: radians }
                : { rotationYRadians: radians },
            );
          }}
        />
      </fieldset>

      <fieldset>
        <legend>Size · {definition.resizePolicy.kind}</legend>
        {definition.resizePolicy.kind === "uniform" ? (
          <NumericField
            label="Scale"
            value={selected.size[0] / definition.defaultSize[0]}
            onChange={(scale) =>
              onSizeChange(
                selected.id,
                definition.defaultSize.map((value) => value * scale) as unknown as SceneItemSize,
                definition,
              )
            }
          />
        ) : (
          AXES.map((axis, index) => {
            const editable =
              definition.resizePolicy.kind === "planar"
                ? axis !== "height"
                : definition.resizePolicy.kind === "axes"
                  ? definition.resizePolicy.axes.includes(axis)
                  : definition.resizePolicy.kind === "custom";
            return (
              <NumericField
                key={axis}
                label={axis}
                value={selected.size[index]}
                disabled={!editable}
                onChange={(value) => updateSize(index, value)}
              />
            );
          })
        )}
      </fieldset>
    </SelectionDetailsPanel>
  );
}
