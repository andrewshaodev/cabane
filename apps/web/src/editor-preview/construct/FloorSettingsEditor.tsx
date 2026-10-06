import { CommittedNumberInput } from "../../editor-chrome/CommittedNumberInput";

import {
  useEffect,
  useState
} from "react";

import type { ConstructEditorController } from "./useConstructEditor";

export function FloorSettingsEditor({ editor }: { editor: ConstructEditorController }) {
  const [originX, setOriginX] = useState(editor.draft.coordinates.origin[0]);
  const [originY, setOriginY] = useState(editor.draft.coordinates.origin[1]);
  const [scale, setScale] = useState(editor.draft.coordinates.metersPerPlanUnit);
  const [scaleBasis, setScaleBasis] = useState(editor.draft.coordinates.scaleBasis);
  const [wallHeight, setWallHeight] = useState(editor.draft.defaultWallHeightMeters);
  const [ceilingHeight, setCeilingHeight] = useState(editor.draft.defaultCeilingHeightMeters);
  const [confirmingScale, setConfirmingScale] = useState(false);

  useEffect(() => {
    setOriginX(editor.draft.coordinates.origin[0]);
    setOriginY(editor.draft.coordinates.origin[1]);
    setScale(editor.draft.coordinates.metersPerPlanUnit);
    setScaleBasis(editor.draft.coordinates.scaleBasis);
    setWallHeight(editor.draft.defaultWallHeightMeters);
    setCeilingHeight(editor.draft.defaultCeilingHeightMeters);
    setConfirmingScale(false);
  }, [
    editor.draft.coordinates,
    editor.draft.defaultCeilingHeightMeters,
    editor.draft.defaultWallHeightMeters,
  ]);

  const scaleChanges = scale !== editor.draft.coordinates.metersPerPlanUnit;
  const changes = scaleChanges || originX !== editor.draft.coordinates.origin[0] ||
    originY !== editor.draft.coordinates.origin[1] ||
    scaleBasis !== editor.draft.coordinates.scaleBasis ||
    wallHeight !== editor.draft.defaultWallHeightMeters ||
    ceilingHeight !== editor.draft.defaultCeilingHeightMeters;
  const valid = [originX, originY, scale, wallHeight, ceilingHeight].every(Number.isFinite) &&
    scale > 0 && wallHeight > 0 && ceilingHeight > 0;
  const stage = (setter: (value: number) => void) => (value: number) => {
    setter(value);
    setConfirmingScale(false);
  };
  const apply = () => {
    if (!changes || !valid) return;
    if (scaleChanges && !confirmingScale) {
      setConfirmingScale(true);
      return;
    }
    editor.updateFloorSettings({
      coordinates: {
        origin: [originX, originY],
        metersPerPlanUnit: scale,
        scaleBasis,
      },
      defaultWallHeightMeters: wallHeight,
      defaultCeilingHeightMeters: ceilingHeight,
    });
  };

  return (
    <section className="construction-inspector__floor-settings" aria-label="Floor settings">
      <header>
        <div><small>Whole floor</small><strong>Scale & defaults</strong></div>
        <span>{editor.draft.coordinates.scaleBasis}</span>
      </header>
      <p>Scale changes resize the complete house while keeping its plan geometry intact.</p>
      <fieldset>
        <legend>Coordinate system</legend>
        <label>Scale<CommittedNumberInput label="Meters per plan unit" min={.001} step={.01} value={scale} onCommit={stage(setScale)} /></label>
        <label>Basis<select aria-label="Floor scale basis" value={scaleBasis} onChange={(event) => {
          setScaleBasis(event.target.value as typeof scaleBasis);
          setConfirmingScale(false);
        }}><option value="measured">Measured</option><option value="inferred">Estimated</option></select></label>
        <label>Origin X<CommittedNumberInput label="Floor origin X" step={.1} value={originX} onCommit={stage(setOriginX)} /></label>
        <label>Origin Y<CommittedNumberInput label="Floor origin Y" step={.1} value={originY} onCommit={stage(setOriginY)} /></label>
      </fieldset>
      <fieldset>
        <legend>Default heights</legend>
        <label>Wall<CommittedNumberInput label="Default wall height" min={.3} step={.05} value={wallHeight} onCommit={stage(setWallHeight)} /></label>
        <label>Ceiling<CommittedNumberInput label="Default ceiling height" min={.3} step={.05} value={ceilingHeight} onCommit={stage(setCeilingHeight)} /></label>
      </fieldset>
      {confirmingScale && (
        <p className="construction-inspector__scale-warning" role="alert">
          This will rescale the architecture and reposition plan-authored items. Click again to confirm.
        </p>
      )}
      <button type="button" disabled={!changes || !valid} onClick={apply}>
        {confirmingScale ? "Confirm whole-floor rescale" : "Apply floor settings"}
      </button>
    </section>
  );
}
