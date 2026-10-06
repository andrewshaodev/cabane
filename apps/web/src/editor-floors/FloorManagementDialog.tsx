import { useCabaneDom } from "@cabane/engine";
import { useEffect, useRef, useState } from "react";
export function FloorManagementDialog({ action, name, itemCount, stairCount, height, onSave, onCancel }: {
  action: "rename" | "remove"; name: string; itemCount: number; stairCount: number; height: number;
  onSave: (name: string, height: number) => void; onCancel: () => void;
}) {
  const dom = useCabaneDom();
  const dialog = useRef<HTMLDialogElement>(null);
  const [value, setValue] = useState(name);
  const [floorHeight, setFloorHeight] = useState(String(height));
  useEffect(() => {
    const previous = dom.root.activeElement as HTMLElement | null;
    dialog.current?.showModal?.();
    return () => previous?.focus();
  }, []);
  return <dialog ref={dialog} className="floor-paint-confirmation" aria-labelledby="floor-management-title"
    onCancel={(event) => { event.preventDefault(); onCancel(); }}>
    <form onSubmit={(event) => { event.preventDefault(); onSave(value.trim(), Number(floorHeight)); }} style={{ display: "grid", gap: 12, padding: 20 }}>
      <h2 id="floor-management-title">{action === "remove" ? `Remove ${name}?` : "Floor settings"}</h2>
      {action === "remove" ? <p>This removes the top floor, its {itemCount} items and {stairCount} connecting stairs. You can undo this change.</p> : <>
        <label>Floor name<input autoFocus required value={value} onChange={(event) => setValue(event.target.value)} /></label>
        <label>Floor-to-floor height (m)<input type="number" required min="0.1" step="0.01" value={floorHeight} onChange={(event) => setFloorHeight(event.target.value)} /></label>
      </>}
      <button type="submit" disabled={action === "rename" && (!value.trim() || !Number.isFinite(Number(floorHeight)) || Number(floorHeight) <= 0)}>{action === "remove" ? "Remove top floor" : "Save floor"}</button>
      <button type="button" onClick={onCancel}>Cancel</button>
    </form>
  </dialog>;
}
