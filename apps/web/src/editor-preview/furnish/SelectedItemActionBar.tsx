import { SelectionActionBar } from "../../editor-chrome/SelectionActionBar";
import { forwardRef } from "react";
import { EditorActionButton } from "../../editor-chrome/EditorActionButton";

export interface SelectedItemActions {
  onDuplicate: () => void;
  onDelete: () => void;
  /** Supplied by the Connect workspace once its device deep link is available. */
  onMap?: (() => void) | undefined;
}

export const SelectedItemActionBar = forwardRef<
  HTMLDivElement,
  SelectedItemActions & {
    isDevice: boolean;
    disabled?: boolean;
  }
>(function SelectedItemActionBar({ isDevice, disabled, onDuplicate, onDelete, onMap }, ref) {
  return (
    <SelectionActionBar ref={ref} label="Selected item actions">
      <EditorActionButton
        icon="duplicate"
        label="Duplicate"
        disabled={disabled}
        onClick={onDuplicate}
      />
      {isDevice && onMap && (
        <EditorActionButton
          icon="connect"
          label="Connect device"
          disabled={disabled}
          onClick={() => onMap?.()}
        />
      )}
      <span className="selected-item-actions__separator" aria-hidden="true" />
      <EditorActionButton icon="delete" label="Delete" disabled={disabled} onClick={onDelete} />
    </SelectionActionBar>
  );
});
