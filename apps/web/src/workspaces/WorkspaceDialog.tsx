import { useCabaneDom } from "@cabane/engine";
import { useEffect, useRef, type ReactNode } from "react";
export function WorkspaceDialog({
  title,
  busy,
  error,
  onCancel,
  children,
}: {
  title: string;
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  children: ReactNode;
}) {
  const dom = useCabaneDom();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = dom.root.activeElement as HTMLElement | null;
    ref.current?.showModal?.();
    return () => previous?.focus();
  }, []);
  return (
    <dialog
      ref={ref}
      className="workspace-dialog"
      aria-labelledby="workspace-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
    >
      <h2 id="workspace-dialog-title">{title}</h2>
      {children}
      {error && (
        <p role="alert" className="workspace-error">
          {error}
        </p>
      )}
      <button type="button" disabled={busy} onClick={onCancel}>
        Cancel
      </button>
    </dialog>
  );
}
