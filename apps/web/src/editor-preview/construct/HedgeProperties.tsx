import { EditorButton } from "../../editor-chrome/EditorButton";
import { HedgeStyleGrid } from "./HedgeStyleGrid";
import { CommittedNumberInput } from "../../editor-chrome/CommittedNumberInput";
import type { ConstructEditorController } from "./construct-controller-contract";

export function HedgeProperties({
  editor,
  editingSelection = true,
}: {
  editor: ConstructEditorController;
  editingSelection?: boolean;
}) {
  const hedge =
    editingSelection && editor.selection?.kind === "hedge"
      ? editor.draft.hedges?.find(
          (hedge) => editor.selection?.kind === "hedge" && hedge.id === editor.selection.id,
        )
      : undefined;
  if (editor.tool !== "hedge" && !hedge) return null;
  const settings = hedge ?? editor.hedgeSettings;
  const update = (changes: Partial<typeof editor.hedgeSettings>) => {
    if (hedge) editor.dispatch({ type: "update-hedge", id: hedge.id, changes });
    else editor.setHedgeSettings({ ...settings, ...changes });
  };
  return (
    <div className="construction-inspector__selection">
      <header>
        <div>
          <small>{hedge ? "Selected boundary" : "Boundary tool"}</small>
          <strong>Boundary</strong>
        </div>
      </header>
      {!hedge && (
        <p className="construction-inspector__tool-hint">
          Drag to draw a boundary. Continue from its endpoint for a connected row. Escape finishes
          drawing.
        </p>
      )}
      <p className="construction-inspector__tool-hint">
        All styles block walking across the full width, including open rails. Leave gaps for
        entrances.
      </p>
      <HedgeStyleGrid
        value={settings.style}
        onChoose={(style) =>
          update(
            hedge
              ? { style: style.id }
              : {
                  style: style.id,
                  heightMeters: style.heightMeters,
                  widthMeters: style.widthMeters,
                },
          )
        }
      />
      <label>
        Height (m)
        <CommittedNumberInput
          label="Boundary height"
          value={settings.heightMeters}
          min={0.2}
          step={0.1}
          onCommit={(heightMeters) =>
            update({ heightMeters: Math.min(5, Math.max(0.2, heightMeters)) })
          }
        />
      </label>
      <label>
        Width (m)
        <CommittedNumberInput
          label="Boundary width"
          value={settings.widthMeters}
          min={0.2}
          step={0.1}
          onCommit={(widthMeters) =>
            update({ widthMeters: Math.min(3, Math.max(0.2, widthMeters)) })
          }
        />
      </label>
      {hedge && (
        <EditorButton variant="text" type="button" onClick={editor.deleteSelected}>
          Delete boundary
        </EditorButton>
      )}
    </div>
  );
}
