import { useEffect, useId, useState, type MouseEvent, type FocusEvent } from "react";
import { createPortal } from "react-dom";
import { EditorIcon, type EditorIconName } from "./EditorIcon";

interface EditorActionButtonProps {
  icon: EditorIconName;
  label: string;
  shortcut?: string;
  keyShortcuts?: string;
  showLabel?: boolean;
  pressed?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  warning?: string;
  onClick: () => void;
}

/** Tooltips live outside the scrollable action bar, including on narrow screens. */
export function EditorActionButton({
  icon, label, shortcut, keyShortcuts, showLabel = false, pressed, disabled, disabledReason, warning, onClick,
}: EditorActionButtonProps) {
  const tooltipId = useId();
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const showTooltip = (event: MouseEvent<HTMLButtonElement> | FocusEvent<HTMLButtonElement>) => {
    if (disabled) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setPosition({
      left: Math.max(112, Math.min(window.innerWidth - 112, rect.left + rect.width / 2)),
      top: rect.bottom + 9,
    });
  };
  useEffect(() => {
    if (!position) return;
    const dismiss = () => setPosition(null);
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") dismiss(); };
    window.addEventListener("resize", dismiss);
    window.addEventListener("scroll", dismiss, true);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("resize", dismiss);
      window.removeEventListener("scroll", dismiss, true);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [position]);

  return (
    <>
      <button type="button" className="editor-action-button" aria-label={label}
        title={disabled ? disabledReason : undefined} aria-description={disabled ? disabledReason : warning}
        aria-pressed={pressed} aria-keyshortcuts={keyShortcuts} disabled={disabled}
        aria-describedby={position && !disabled ? tooltipId : undefined}
        onClick={onClick} onFocus={showTooltip} onBlur={() => setPosition(null)}
        onMouseEnter={showTooltip} onMouseLeave={(event) => {
          if (document.activeElement !== event.currentTarget) setPosition(null);
        }}>
        <EditorIcon name={icon} />
        {showLabel && <span>{label}</span>}
        {warning && <span className="editor-action-button__warning"><EditorIcon name="warning" /></span>}
      </button>
      {position && !disabled && createPortal(
        <div role="tooltip" id={tooltipId} className="editor-action-tooltip" style={position}>
          {warning ?? label}{shortcut && <kbd>{shortcut}</kbd>}
        </div>, document.body,
      )}
    </>
  );
}
