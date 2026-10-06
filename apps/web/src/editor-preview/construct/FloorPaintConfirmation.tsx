import { useEffect, useRef } from "react";

export function FloorPaintConfirmation({
  roomName,
  onKeepZones,
  onReplaceEverything,
  onCancel,
}: {
  roomName: string;
  onKeepZones: () => void;
  onReplaceEverything: () => void;
  onCancel: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const firstActionRef = useRef<HTMLButtonElement>(null);
  const priorFocusRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    priorFocusRef.current = document.activeElement as HTMLElement | null;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    firstActionRef.current?.focus();
    return () => {
      if (dialog.open && typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
      priorFocusRef.current?.focus();
    };
  }, []);
  return <dialog
    ref={dialogRef}
    className="floor-paint-confirmation"
    aria-labelledby="floor-paint-confirmation-title"
    onCancel={(event) => {
      event.preventDefault();
      onCancel();
    }}
  >
    <div>
      <h2 id="floor-paint-confirmation-title">
        Paint all of {roomName}?
      </h2>
      <p>This room already contains custom floor areas.</p>
      <button
        ref={firstActionRef}
        type="button"
        onClick={onKeepZones}
      >
        Keep custom areas
      </button>
      <button type="button" onClick={onReplaceEverything}>
        Replace everything
      </button>
      <button type="button" onClick={onCancel}>Cancel</button>
    </div>
  </dialog>;
}
