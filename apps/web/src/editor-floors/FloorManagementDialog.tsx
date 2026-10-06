import { useEffect, useId, useRef, useState } from "react";
import { EditorButton } from "../editor-chrome/EditorButton";
import { EditorIcon } from "../editor-chrome/EditorIcon";
import "./floor-management-dialog.css";

export function FloorManagementDialog({ action, name, itemCount, stairCount, height, onSave, onCancel }: {
  action: "rename" | "remove"; name: string; itemCount: number; stairCount: number; height: number;
  onSave: (name: string, height: number) => void; onCancel: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const heightHintId = useId();
  const [value, setValue] = useState(name);
  const [floorHeight, setFloorHeight] = useState(String(height));
  const invalid = action === "rename" && (!value.trim() || !Number.isFinite(Number(floorHeight)) || Number(floorHeight) <= 0);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.showModal?.();
    return () => { if (previous?.isConnected) previous.focus(); };
  }, []);
  return <dialog ref={dialog} className="floor-management-dialog" aria-labelledby={titleId}
    onCancel={event => { event.preventDefault(); onCancel(); }}>
    <form onSubmit={event => { event.preventDefault(); if (!invalid) onSave(value.trim(), Number(floorHeight)); }}>
      <header>
        <h2 id={titleId}>{action === "remove" ? `Remove ${name}?` : "Floor settings"}</h2>
        <EditorButton aria-label="Close floor settings" onClick={onCancel}><EditorIcon name="close" /></EditorButton>
      </header>
      {action === "remove" ? <p>This removes the top floor, its {itemCount} items and {stairCount} connecting stairs. You can undo this change.</p> : <div className="floor-management-dialog__fields">
        <label>Floor name<input autoFocus required value={value} onChange={event => setValue(event.target.value)} /></label>
        <label>Floor-to-floor height (m)<input type="number" required min="0.1" step="0.01" aria-describedby={heightHintId}
          value={floorHeight} onChange={event => setFloorHeight(event.target.value)} /></label>
        <p id={heightHintId} className="floor-management-dialog__hint">Distance from this floor to the floor above.</p>
      </div>}
      <footer>
        <EditorButton onClick={onCancel}>Cancel</EditorButton>
        <EditorButton type="submit" variant="primary" disabled={invalid}
          className={action === "remove" ? "floor-management-dialog__remove" : undefined}>
          {action === "remove" ? "Remove top floor" : "Save floor"}
        </EditorButton>
      </footer>
    </form>
  </dialog>;
}
