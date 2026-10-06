import { Html } from "@react-three/drei";
import { floorEditorSelectionTargets, planPointToWorld, polygonCentroid } from "@cabane/engine";
import { EditorActionButton } from "../../editor-chrome/EditorActionButton";
import { SelectionActionBar } from "../../editor-chrome/SelectionActionBar";
import type { ConstructEditorController } from "./construct-controller-contract";

export function SelectedRoomControls({ editor, disabled }: { editor: ConstructEditorController; disabled: boolean }) {
  const selected = floorEditorSelectionTargets(editor.selection).filter(target => target.kind === "room");
  const rooms = editor.previewFloor.rooms.filter(room => selected.some(target => target.id === room.id));
  if (!rooms.length) return null;
  const points = rooms.flatMap(room => room.polygon);
  const [x, z] = planPointToWorld(polygonCentroid(rooms[0].polygon), editor.draft.coordinates);
  const [, top] = planPointToWorld([points[0][0], Math.min(...points.map(point => point[1]))], editor.draft.coordinates);
  const blocked = !editor.deletionTargets.some(target => target.kind === "room");
  return <Html center position={[x, .85, (z + top) / 2]} zIndexRange={[6, 6]}>
    <div className="selected-room-controls"><SelectionActionBar mode="construct" label="Selected room actions">
      <EditorActionButton icon="delete" showLabel label={editor.selection?.kind === "multiple" ? "Delete selection" : "Delete room"}
        disabled={disabled || blocked} disabledReason={blocked ? "All enclosing walls are shared. Edit the walls to remove this room." : undefined}
        onClick={editor.deleteSelected} />
    </SelectionActionBar></div>
  </Html>;
}
