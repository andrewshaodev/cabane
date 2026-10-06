import { useRef, type ReactNode } from "react";
import { ActionBarBuiltInIcon, SceneActionSlotFace } from "../SceneActionSlotFace";

/** Shared dock tray behavior for Build, View, and Weather. */
export function SceneActionGroup({
  name,
  open,
  onOpen,
  children,
}: {
  name: "Build" | "View" | "Weather";
  open: boolean;
  onOpen: (open: boolean) => void;
  children: ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);
  const pointerType = useRef("mouse");
  const shortcut = name === "Build" ? "B" : name === "View" ? "V" : undefined;
  return (
    <div
      ref={root}
      className="scene-action-group"
      data-open={open}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") onOpen(true);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") onOpen(false);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) onOpen(false);
      }}
    >
      <button
        type="button"
        className="scene-action-slot is-filled"
        data-group={name}
        aria-label={name}
        aria-expanded={open}
        aria-controls={`scene-group-${name}`}
        aria-keyshortcuts={shortcut}
        onKeyDown={(event) => {
          if (event.key === "ArrowUp") {
            event.preventDefault();
            onOpen(true);
            requestAnimationFrame(() =>
              root.current
                ?.querySelector<HTMLButtonElement>(
                  ".scene-action-group__tray button:not(:disabled)",
                )
                ?.focus(),
            );
          }
        }}
        onPointerDown={(event) => {
          pointerType.current = event.pointerType;
        }}
        onClick={(event) =>
          onOpen(
            event.detail > 0 &&
              pointerType.current === "mouse" &&
              window.matchMedia?.("(hover: hover)").matches
              ? true
              : !open,
          )
        }
      >
        <SceneActionSlotFace
          icon={
            <ActionBarBuiltInIcon
              action={name === "Build" ? "build" : name === "View" ? "view" : "weather"}
            />
          }
          label={name}
          shortcut={shortcut}
          chevron
        />
      </button>
      <div
        id={`scene-group-${name}`}
        className="scene-action-group__tray"
        role="group"
        aria-label={`${name} actions`}
        hidden={!open}
        onKeyDown={(event) => {
          if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
          const buttons = Array.from(
            event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"),
          );
          const index = buttons.indexOf(event.target as HTMLButtonElement);
          if (!buttons.length) return;
          event.preventDefault();
          const next =
            event.key === "Home"
              ? 0
              : event.key === "End"
                ? buttons.length - 1
                : (index + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length;
          buttons[next]?.focus();
        }}
      >
        {children}
      </div>
    </div>
  );
}
