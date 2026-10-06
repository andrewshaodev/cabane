import { EditorButton } from "../editor-chrome/EditorButton";
import { EditorIcon } from "../editor-chrome/EditorIcon";
import "./construct-floor-controls.css";

/** Persistent floor context, separate from the active construction tool. */
export function ConstructFloorControls({ floors, selectedId, disabled, onSelect, onAdd, onSettings }: {
  floors: readonly { id: string; name: string }[];
  selectedId: string;
  disabled: boolean;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onSettings: () => void;
}) {
  return <div className="construct-floor-controls" role="group" aria-label="Floor controls">
    <select aria-label="Current floor" value={selectedId} disabled={disabled}
      onChange={event => {
        const id = event.currentTarget.value;
        if (id) onSelect(id);
        else {
          event.currentTarget.value = selectedId;
          onAdd();
        }
      }}>
      {[...floors].reverse().map(floor => <option key={floor.id} value={floor.id}>{floor.name}</option>)}
      <option value="">Add floor above…</option>
    </select>
    <EditorButton aria-label="Floor settings" title="Floor settings" disabled={disabled} onClick={onSettings}>
      <EditorIcon name="settings" />
    </EditorButton>
  </div>;
}
