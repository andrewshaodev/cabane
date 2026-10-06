import { EditorButton } from "../../editor-chrome/EditorButton";
import { DebouncedColorInput } from "./DebouncedColorInput";
import { useWallFinishPreview } from "./WallFinishPreview";
import type { WallFinishSide } from "./wall-finish-sides";

export function WallColorField({
  label,
  inputLabel = `${label} color`,
  value,
  overridden,
  onCommit,
  onReset,
  floorId,
  wallId,
  sides,
}: {
  label: string;
  inputLabel?: string;
  value: string;
  overridden: boolean;
  onCommit: (color: string) => void;
  onReset: () => void;
  floorId: string;
  wallId: string;
  sides: readonly WallFinishSide[];
}) {
  const { setHighlight } = useWallFinishPreview();
  return (
    <div
      onPointerEnter={() => setHighlight({ floorId, wallId, sides })}
      onPointerLeave={(event) => {
        if (!event.currentTarget.contains(event.currentTarget.ownerDocument.activeElement))
          setHighlight(null);
      }}
      onFocus={() => setHighlight({ floorId, wallId, sides })}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setHighlight(null);
      }}
    >
      <label>
        {label}
        <DebouncedColorInput label={inputLabel} value={value} onCommit={onCommit} />
      </label>
      {overridden && (
        <EditorButton
          type="button"
          variant="text"
          aria-label={`Reset ${label.toLowerCase()} color`}
          onClick={onReset}
        >
          Reset
        </EditorButton>
      )}
    </div>
  );
}
