import { StairShapeSelect } from "./StairShapeSelect";
import { convertStairShape } from "./stair-placement-geometry";
import { canDraftStair, validateStairCandidate } from "./stair-candidate-validation";
import { useEffect, useState } from "react";
import { type HomeProject, type StairSpec } from "@cabane/engine";
import { SelectionDetailsPanel } from "../editor-chrome/SelectionDetailsPanel";
import { CommittedNumberInput } from "../editor-chrome/CommittedNumberInput";

export function StairDetails({ project, stair, onSave, onCancel }: {
  project: HomeProject; stair: StairSpec; onSave: (stair: StairSpec) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(stair);
  useEffect(() => setDraft(stair), [stair]);
  const issues = validateStairCandidate(project, draft);
  const update = (next: StairSpec) => {
    setDraft(next);
    if (canDraftStair(project, next)) onSave(next);
  };
  const number = (label: string, value: number, onCommit: (value: number) => void, min?: number) =>
    <label className="construction-inspector__single-control">{label}<CommittedNumberInput label={label} value={Number(value.toFixed(2))} min={min} onCommit={onCommit} /></label>;
  return <SelectionDetailsPanel mode="construct" title="Stairs" subtitle={`To ${project.floors.find(f => f.id === draft.upperFloorId)?.name}`}
    label="Stair properties" onClose={onCancel}>
    <StairShapeSelect value={draft.shape??"straight"} onChange={shape=>update(convertStairShape(project,draft,shape))} />
    {draft.shape === "spiral" ? <>
      {number("Diameter (m)",draft.diameterMeters,diameterMeters=>update({...draft,diameterMeters}),.21)}
      {number("Total turn (degrees)",draft.totalTurnDegrees,totalTurnDegrees=>update({...draft,totalTurnDegrees}),1)}
      <label className="construction-inspector__single-control stair-direction-control">Direction<select aria-label="Spiral direction" value={draft.direction}
        onChange={event=>update({...draft,direction:event.target.value as "clockwise"|"counterclockwise"})}>
        <option value="clockwise">Clockwise</option><option value="counterclockwise">Counterclockwise</option>
      </select></label>
    </> : <>
      {number("Width (m)",draft.widthMeters,widthMeters=>update({...draft,widthMeters}),.1)}
      {draft.shape === "l-shaped" ? <>
        {number("Lower flight length (m)",draft.lowerRunMeters,lowerRunMeters=>update({...draft,lowerRunMeters}),.1)}
        {number("Upper flight length (m)",draft.upperRunMeters,upperRunMeters=>update({...draft,upperRunMeters}),.1)}
        <label className="construction-inspector__single-control">Turn<select aria-label="Stair turn" value={draft.turn}
          onChange={event=>update({...draft,turn:event.target.value as "left"|"right"})}>
          <option value="right">Right</option><option value="left">Left</option>
        </select></label>
      </> : number("Length (m)",draft.runMeters,runMeters=>update({...draft,runMeters}),.1)}
    </>}
    <details className="selection-details-advanced"><summary>Advanced</summary>
      {number("Rotation (degrees)", draft.rotationYRadians * 180 / Math.PI, value => update({ ...draft, rotationYRadians: value * Math.PI / 180 }))}
      {number(draft.shape === "spiral" ? "Center X (plan units)" : "Start X (plan units)", draft.at[0], value => update({ ...draft, at: [value, draft.at[1]] }))}
      {number(draft.shape === "spiral" ? "Center Y (plan units)" : "Start Y (plan units)", draft.at[1], value => update({ ...draft, at: [draft.at[0], value] }))}
    </details>
    {issues.map(issue => <p role="alert" key={issue.code}>{issue.message}</p>)}
  </SelectionDetailsPanel>;
}
