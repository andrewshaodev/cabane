import { resolveOpeningOrientation, type EditorOpening } from "@cabane/engine";
import { SelectionDetailsPanel } from "../../editor-chrome/SelectionDetailsPanel";
import { OpeningOrientationControls } from "./OpeningOrientationControls";
import { OpeningProperties } from "./OpeningProperties";
import { openingPlanSymbol } from "./opening-plan-symbol";
import type { ConstructEditorController } from "./useConstructEditor";

export function OpeningDetails({ opening, editor, disabled, onClose }: {
  opening: EditorOpening;
  editor: ConstructEditorController;
  disabled: boolean;
  onClose: () => void;
}) {
  const width = opening.widthPlanUnits * editor.draft.coordinates.metersPerPlanUnit;
  const wall = editor.draft.walls.find((candidate) => candidate.id === opening.wallId);
  const thickness = wall?.thicknessMeters ?? editor.draft.interiorWallThicknessMeters;
  const strokes = openingPlanSymbol(opening, width, thickness);
  const points = strokes.flatMap((stroke) => [stroke.from, stroke.to]);
  const minX = Math.min(0, ...points.map((point) => point[0])) - .2;
  const maxX = Math.max(width, ...points.map((point) => point[0])) + .2;
  const extentZ = Math.max(.3, ...points.map((point) => Math.abs(point[1]))) + .12;
  const orientable = opening.kind !== "passage" && resolveOpeningOrientation(opening).canSwitchSide;
  const name = opening.kind === "door" ? "Door" : opening.kind === "window" ? "Window" : "Passage";
  return <SelectionDetailsPanel mode="construct" title={`${name} properties`} subtitle="Selected opening"
    label={`${name} properties`} onClose={onClose}>
    <div inert={disabled}>
      {orientable && <fieldset className="opening-direction">
        <legend>Opening direction</legend>
        <svg className="opening-direction__diagram" viewBox={`${minX} ${-extentZ} ${maxX - minX} ${extentZ * 2}`}
          role="img" aria-label={`${name} opening direction in plan view`}>
          <path d={`M${minX} 0H0M${width} 0H${maxX}`} stroke="#596057" strokeWidth={thickness} />
          {strokes.map((stroke, index) => <line key={index} x1={stroke.from[0]} y1={stroke.from[1]}
            x2={stroke.to[0]} y2={stroke.to[1]} stroke={stroke.color} strokeWidth={stroke.width ?? .025} />)}
        </svg>
        <OpeningOrientationControls opening={opening} showLabel disabled={disabled}
          onChange={(change) => editor.dispatch({ type: "reorient-opening", openingId: opening.id, change })} />
      </fieldset>}
      <OpeningProperties opening={opening} editor={editor} />
    </div>
  </SelectionDetailsPanel>;
}
