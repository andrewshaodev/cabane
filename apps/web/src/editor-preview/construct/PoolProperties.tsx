import { EditorButton } from "../../editor-chrome/EditorButton";
import { mapPoolOutline, polygonSignedArea, type PoolSpec } from "@cabane/engine";
import { CommittedNumberInput } from "../../editor-chrome/CommittedNumberInput";
import type { ConstructEditorController } from "./useConstructEditor";

export function PoolProperties({ pool, editor }: { pool: PoolSpec; editor: ConstructEditorController }) {
  const scale = editor.draft.coordinates.metersPerPlanUnit;
  const perimeter = pool.polygon.reduce((sum, point, index) => {
    const next = pool.polygon[(index + 1) % pool.polygon.length];
    return sum + Math.hypot(point[0] - next[0], point[1] - next[1]) * scale;
  }, 0);
  return <div className="construction-inspector__selection">
    <header><div><small>Selected pool</small><strong>Pool outline</strong></div></header>
    <dl className="construction-inspector__wall-facts construction-inspector__pool-facts">
      <div><dt>Area</dt><dd>{(Math.abs(polygonSignedArea(pool.polygon)) * scale ** 2).toFixed(1)} m²</dd></div>
      <div><dt>Perimeter</dt><dd>{perimeter.toFixed(2)} m</dd></div>
    </dl>
    <p>Drag the pool to move it, or drag a corner to reshape it.</p>
    {pool.polygon.map((point, index) => <fieldset key={index}>
      <legend>Corner {index + 1} · plan units</legend>
      {([0, 1] as const).map((axis) => <label key={axis}>{axis === 0 ? "X" : "Y"}<CommittedNumberInput
        label={`Pool corner ${index + 1} ${axis === 0 ? "X" : "Y"}`} step={.1} value={Number(point[axis].toPrecision(15))}
        onCommit={(value) => editor.updatePool(pool.id, mapPoolOutline(pool.polygon, (p, i) => i === index
          ? axis === 0 ? [value, p[1]] : [p[0], value] : p))} /></label>)}
    </fieldset>)}
    <EditorButton variant="text" type="button" onClick={editor.deleteSelected}>Delete pool</EditorButton>
  </div>;
}
