import type { ReactNode } from "react";
import { SceneActionSlotFace } from "../SceneActionSlotFace";

/** The illustrated action used by both dock buttons and grouped submenu choices. */
export function SceneActionButton({
  icon,
  label,
  accessibleLabel = label,
  shortcut,
  active = false,
  busy = false,
  disabled = false,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  accessibleLabel?: string;
  shortcut?: { aria: string; label: string } | undefined;
  active?: boolean;
  busy?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`scene-action-slot is-filled ${active ? "is-active" : ""} ${busy ? "is-busy" : ""}`}
      aria-label={accessibleLabel}
      aria-keyshortcuts={shortcut?.aria}
      aria-pressed={active}
      aria-busy={busy}
      title={shortcut ? `${accessibleLabel} (${shortcut.label})` : accessibleLabel}
      disabled={disabled || busy}
      onClick={onClick}
    >
      <SceneActionSlotFace icon={icon} label={label} shortcut={shortcut?.label} />
      {busy && <i className="scene-action-spinner" aria-hidden="true" />}
    </button>
  );
}
