import {
  useCabaneDom,
  type SceneItemSpec,
  type SceneItemSize,
  type SceneModelEditorDescriptor,
} from "@cabane/engine";
import { useEffect, useLayoutEffect, useRef, useState, type Ref } from "react";
import { EditorActionButton } from "../../editor-chrome/EditorActionButton";

interface ResizeSession {
  pointerId: number;
  target: HTMLDivElement;
  startY: number;
  size: SceneItemSize;
}

/** Resize around the item's existing anchor, keeping the gesture in one history transaction. */
export function SelectedItemResizeButton({
  ref,
  item,
  definition,
  busy,
  onResize,
  onBegin,
  onCommit,
  onCancel,
}: {
  ref: Ref<HTMLDivElement>;
  item: SceneItemSpec;
  definition: SceneModelEditorDescriptor;
  busy: boolean;
  onResize: (id: string, size: SceneItemSize, definition: SceneModelEditorDescriptor) => void;
  onBegin: () => void;
  onCommit: () => void;
  onCancel: () => void;
}) {
  const dom = useCabaneDom();
  const session = useRef<ResizeSession | null>(null);
  const [resizing, setResizing] = useState(false);
  const callbacks = useRef({ onCommit, onCancel });
  useLayoutEffect(() => {
    callbacks.current = { onCommit, onCancel };
  });
  const finish = (cancel: boolean) => {
    const active = session.current;
    if (!active) return;
    session.current = null;
    setResizing(false);
    if (cancel) callbacks.current.onCancel();
    else callbacks.current.onCommit();
    if (active.target.hasPointerCapture(active.pointerId))
      active.target.releasePointerCapture(active.pointerId);
  };
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !session.current) return;
      event.preventDefault();
      event.stopPropagation();
      finish(true);
    };
    const blur = () => finish(true);
    dom.events.addEventListener("keydown", escape, true);
    window.addEventListener("blur", blur);
    return () => {
      dom.events.removeEventListener("keydown", escape, true);
      window.removeEventListener("blur", blur);
      if (session.current) {
        session.current = null;
        callbacks.current.onCancel();
      }
    };
  }, [dom]);

  if (definition.resizePolicy.kind === "fixed") return null;
  return (
    <div
      ref={ref}
      className="selected-item-rotation-button selected-item-resize-button"
      onPointerDown={(event) => {
        if (event.button !== 0 || busy || session.current) return;
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.setPointerCapture(event.pointerId);
        session.current = {
          pointerId: event.pointerId,
          target: event.currentTarget,
          startY: event.clientY,
          size: item.size,
        };
        setResizing(true);
        onBegin();
      }}
      onPointerMove={(event) => {
        const active = session.current;
        if (!active || active.pointerId !== event.pointerId) return;
        event.stopPropagation();
        // Exponential scaling is reversible and keeps dimensions positive.
        // A shared lower bound avoids distorting proportions at the minimum size.
        const factor = Math.max(
          0.01 / Math.min(...active.size),
          Math.exp((active.startY - event.clientY) / 160),
        );
        onResize(
          item.id,
          [active.size[0] * factor, active.size[1] * factor, active.size[2] * factor],
          definition,
        );
      }}
      onPointerUp={(event) => {
        event.stopPropagation();
        if (event.pointerId === session.current?.pointerId) finish(false);
      }}
      onPointerCancel={() => finish(true)}
      onLostPointerCapture={() => finish(true)}
    >
      <EditorActionButton
        icon="resize"
        label="Drag to resize proportionally"
        disabled={busy && !resizing}
        onClick={() => {}}
      />
    </div>
  );
}
