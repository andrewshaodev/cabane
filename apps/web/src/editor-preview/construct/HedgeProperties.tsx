import { HedgeStyleGrid } from "./HedgeStyleGrid";
import { CommittedNumberInput } from "../../editor-chrome/CommittedNumberInput";
import type { ConstructEditorController } from "./construct-controller-contract";

export function HedgeProperties({ editor }: { editor: ConstructEditorController }) {
  const hedge = editor.selection?.kind === "hedge" ? editor.draft.hedges?.find((hedge) => editor.selection?.kind === "hedge" && hedge.id === editor.selection.id) : undefined;
  if (editor.tool !== "hedge" && !hedge) return null;
  const settings = hedge ?? editor.hedgeSettings;
  const update = (changes: Partial<typeof editor.hedgeSettings>) => {
    if (hedge) editor.dispatch({ type: "update-hedge", id: hedge.id, changes });
    else editor.setHedgeSettings({ ...settings, ...changes });
  };
  return <div className="construction-inspector__selection">
    <header><div><small>{hedge ? "Selected hedge" : "Hedge tool"}</small><strong>Hedgerow</strong></div></header>
    <p className="construction-inspector__tool-hint">Drag to draw a hedge. Continue from its endpoint for a connected row. Escape finishes drawing.</p>
    <HedgeStyleGrid value={settings.style} onChoose={(style) => update(hedge
      ? { style: style.id }
      : { style: style.id, heightMeters: style.heightMeters, widthMeters: style.widthMeters })} />
    <label>Height (m)<CommittedNumberInput label="Hedge height" value={settings.heightMeters} min={.2} step={.1} onCommit={(heightMeters) => update({ heightMeters: Math.min(5, Math.max(.2, heightMeters)) })} /></label>
    <label>Width (m)<CommittedNumberInput label="Hedge width" value={settings.widthMeters} min={.2} step={.1} onCommit={(widthMeters) => update({ widthMeters: Math.min(3, Math.max(.2, widthMeters)) })} /></label>
    {hedge && <button type="button" onClick={editor.deleteSelected}>Delete hedge</button>}
  </div>;
}
