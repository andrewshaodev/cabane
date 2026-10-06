import { EditorButton } from "../../editor-chrome/EditorButton";
import {
  mapPoolOutline,
  polygonSignedArea,
  type OutdoorPlatformSpec,
  type OutdoorPlatformEdgeConfiguration,
  type PlanPoint,
} from "@cabane/engine";
import { CommittedNumberInput } from "../../editor-chrome/CommittedNumberInput";
import { FloorFinishPalette } from "./FloorFinishPalette";
import { PlatformEdgeFields } from "./PlatformEdgeFields";
import type { ConstructEditorController } from "./useConstructEditor";
import "./floor-tool-properties.css";

export function PlatformProperties({ platform, editor }: {
  platform: OutdoorPlatformSpec;
  editor: ConstructEditorController;
}) {
  const edge = platform.edges.find(candidate => candidate.id === editor.selectedPlatformEdgeId);
  const area = Math.abs(polygonSignedArea(platform.polygon)) * editor.draft.coordinates.metersPerPlanUnit ** 2;
  const updateOutline = (points: readonly PlanPoint[]) => {
    if (points.length < 3) return;
    const [first, second, third, ...rest] = points;
    editor.updatePlatform(platform.id, { polygon: [first, second, third, ...rest] });
  };
  const updateEdge = (configuration: OutdoorPlatformEdgeConfiguration) => {
    if (edge) {
      editor.updatePlatform(platform.id, {
        edges: platform.edges.map(candidate => candidate.id === edge.id ? { ...candidate, configuration } : candidate),
      });
    } else {
      editor.updatePlatform(platform.id, { defaultEdge: configuration });
    }
  };
  const resetEdge = () => editor.updatePlatform(platform.id, {
    edges: platform.edges.map(candidate => candidate.id === edge?.id ? { id: candidate.id } : candidate),
  });
  const addCorner = () => {
    if (!edge) return;
    const index = platform.edges.indexOf(edge);
    const from = platform.polygon[index];
    const to = platform.polygon[(index + 1) % platform.polygon.length];
    updateOutline([...platform.polygon.slice(0, index + 1),
      [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2], ...platform.polygon.slice(index + 1)]);
  };

  return <div className="construction-inspector__selection">
    <header><div><small>Selected outdoor platform</small><strong>Outdoor platform · {area.toFixed(1)} m²</strong></div></header>
    <p className="construction-inspector__tool-hint">Drag the platform to move it, or a corner to reshape it. Select an edge to change its style.</p>
    <fieldset>
      <legend>Edges</legend>
      <label>Apply to<select aria-label="Platform edge" value={edge?.id ?? ""}
        onChange={event => event.target.value
          ? editor.selectPlatformEdge(platform.id, event.target.value)
          : editor.selectPlatform(platform.id)}>
        <option value="">Default style</option>
        {platform.edges.map((candidate, index) => <option key={candidate.id} value={candidate.id}>Edge {index + 1}</option>)}
      </select></label>
      <PlatformEdgeFields value={edge?.configuration ?? platform.defaultEdge} onChange={updateEdge} />
    </fieldset>
    {edge?.configuration && <EditorButton variant="secondary" type="button" onClick={resetEdge}>Use default edge style</EditorButton>}
    {edge && <EditorButton variant="secondary" type="button" onClick={addCorner}>Add corner on edge</EditorButton>}
    <fieldset>
      <legend>Floor finish</legend>
      <FloorFinishPalette value={platform.finish} onChange={finish => editor.updatePlatform(platform.id, { finish })} />
    </fieldset>
    {platform.polygon.map((point, index) => <fieldset key={index}>
      <legend>Corner {index + 1} · plan units</legend>
      {([0, 1] as const).map(axis => <label key={axis}>
        {axis === 0 ? "X" : "Y"}
        <CommittedNumberInput label={`Platform corner ${index + 1} ${axis === 0 ? "X" : "Y"}`}
          value={point[axis]} step={.1} onCommit={value => editor.updatePlatform(platform.id, {
            polygon: mapPoolOutline(platform.polygon, (candidate, cornerIndex) => cornerIndex === index
              ? axis === 0 ? [value, candidate[1]] : [candidate[0], value]
              : candidate),
          })} />
      </label>)}
      {platform.polygon.length > 3 && <EditorButton variant="text" type="button"
        onClick={() => updateOutline(platform.polygon.filter((_, cornerIndex) => cornerIndex !== index))}>
        Remove corner {index + 1}
      </EditorButton>}
    </fieldset>)}
    <EditorButton variant="text" type="button" onClick={editor.deleteSelected}>Delete platform</EditorButton>
  </div>;
}
