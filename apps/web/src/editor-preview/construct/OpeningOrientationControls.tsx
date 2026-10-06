import {
  resolveOpeningOrientation,
  type EditorOpening,
  type OpeningOrientationAction,
} from "@cabane/engine";
import { EditorActionButton } from "../../editor-chrome/EditorActionButton";

export function OpeningOrientationControls({
  opening,
  onChange,
  disabled,
  showLabel = false,
}: {
  opening: EditorOpening;
  onChange: (action: OpeningOrientationAction) => void;
  disabled?: boolean;
  showLabel?: boolean;
}) {
  if (opening.kind === "passage") return null;
  const orientation = resolveOpeningOrientation(opening);
  return (
    <>
      {orientation.canSwapHinge && (
        <EditorActionButton
          icon="swapHinge"
          label="Swap hinge side"
          showLabel={showLabel}
          disabled={disabled}
          onClick={() => onChange("hinge")}
        />
      )}
      {orientation.canReverseSlide && (
        <EditorActionButton
          icon="reverseSlide"
          label="Reverse slide direction"
          showLabel={showLabel}
          disabled={disabled}
          onClick={() => onChange("slide")}
        />
      )}
      {orientation.canSwitchSide && (
        <EditorActionButton
          icon="switchSide"
          label={opening.operation === "sliding" ? "Switch wall side" : "Reverse opening direction"}
          showLabel={showLabel}
          disabled={disabled}
          onClick={() => onChange("side")}
        />
      )}
    </>
  );
}
