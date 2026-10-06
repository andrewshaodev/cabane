import { useEffect, useLayoutEffect, useRef, useState } from "react";
import "./room-name-control.css";

export function RoomNameControl({
  roomId,
  name,
  disabled,
  focusRequest,
  onFocusRequestHandled,
  onCommit,
}: {
  roomId: string;
  name: string;
  disabled: boolean;
  focusRequest?: ({ roomId: string; serial: number } | null) | undefined;
  onFocusRequestHandled?: (() => void) | undefined;
  onCommit: (name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const cancelled = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => {
    if (focusRequest?.roomId === roomId && !disabled) {
      cancelled.current = false;
      setDraft(name);
      setEditing(true);
      onFocusRequestHandled?.();
    }
  }, [disabled, focusRequest, name, onFocusRequestHandled, roomId]);
  useLayoutEffect(() => {
    if (editing) {
      input.current?.focus({ preventScroll: true });
      input.current?.select();
    }
  }, [editing]);
  useEffect(() => {
    if (disabled) {
      cancelled.current = true;
      setEditing(false);
    }
  }, [disabled]);
  const finish = () => {
    if (!cancelled.current && !disabled && draft.trim() && draft.trim() !== name)
      onCommit(draft.trim());
    cancelled.current = false;
    setEditing(false);
  };
  return (
    <span
      className="construction-room-name"
      style={{ pointerEvents: disabled ? "none" : "auto" }}
      onPointerDown={(event) => event.stopPropagation()}
      onPointerUp={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      {editing ? (
        <input
          ref={input}
          aria-label="Room name on plan"
          maxLength={80}
          value={draft}
          placeholder="e.g. Living room"
          onChange={(event) => setDraft(event.target.value)}
          onBlur={finish}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === "Escape") {
              event.preventDefault();
              cancelled.current = event.key === "Escape";
              event.currentTarget.blur();
              requestAnimationFrame(() => button.current?.focus({ preventScroll: true }));
            }
          }}
        />
      ) : (
        <button
          ref={button}
          type="button"
          disabled={disabled}
          aria-label={name ? `Rename ${name}` : "Name room"}
          onClick={() => {
            cancelled.current = false;
            setDraft(name);
            setEditing(true);
          }}
        >
          {name || "Name room"}
          <span aria-hidden="true"> ✎</span>
        </button>
      )}
    </span>
  );
}
