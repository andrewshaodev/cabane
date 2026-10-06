import { canDraftStair, validateStairCandidate } from "./stair-candidate-validation";
import { useEffect, useState } from "react";
import { type HomeProject, type StraightStairSpec } from "@cabane/engine";
import { SelectionDetailsPanel } from "../editor-chrome/SelectionDetailsPanel";
import { CommittedNumberInput } from "../editor-chrome/CommittedNumberInput";

export function StairDetails({ project, stair, onSave, onCancel }: {
  project: HomeProject; stair: StraightStairSpec; onSave: (stair: StraightStairSpec) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(stair);
  useEffect(() => setDraft(stair), [stair]);
  const issues = validateStairCandidate(project, draft);
  const update = (next: StraightStairSpec) => {
    setDraft(next);
    if (canDraftStair(project, next)) onSave(next);
  };
  const number = (label: string, value: number, onCommit: (value: number) => void, min?: number) =>
    <label className="construction-inspector__single-control">{label}<CommittedNumberInput label={label} value={Number(value.toFixed(2))} min={min} onCommit={onCommit} /></label>;
  return <SelectionDetailsPanel mode="construct" title="Stairs" subtitle={`To ${project.floors.find(f => f.id === draft.upperFloorId)?.name}`}
    label="Stair properties" onClose={onCancel}>
    {number("Width (m)", draft.widthMeters, widthMeters => update({ ...draft, widthMeters }), .1)}
    {number("Length (m)", draft.runMeters, runMeters => update({ ...draft, runMeters }), .1)}
    <details className="selection-details-advanced"><summary>Advanced</summary>
      {number("Rotation (degrees)", draft.rotationYRadians * 180 / Math.PI, value => update({ ...draft, rotationYRadians: value * Math.PI / 180 }))}
      {number("Start X (plan units)", draft.at[0], value => update({ ...draft, at: [value, draft.at[1]] }))}
      {number("Start Y (plan units)", draft.at[1], value => update({ ...draft, at: [draft.at[0], value] }))}
    </details>
    {issues.map(issue => <p role="alert" key={issue.code}>{issue.message}</p>)}
  </SelectionDetailsPanel>;
}
