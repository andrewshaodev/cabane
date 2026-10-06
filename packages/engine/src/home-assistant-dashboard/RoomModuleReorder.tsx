import { useRef, useState } from "react";
import type { RoomModuleViewModel } from "./module-model";

export function ReorderIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M9 5h11M9 12h11M9 19h11M3 4v16m-2-2 2 2 2-2M1 6l2-2 2 2" />
    </svg>
  );
}

export function RoomModuleReorder({
  modules,
  onMove,
}: {
  modules: readonly RoomModuleViewModel[];
  onMove: (id: string, target: string) => void;
}) {
  const listRef = useRef<HTMLOListElement>(null);
  const [drag, setDrag] = useState<{ id: string; target: string } | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const move = (id: string, target: string) => {
    onMove(id, target);
    const label = modules.find((module) => module.id === id)?.label;
    setAnnouncement(
      `${label} moved to position ${modules.findIndex((module) => module.id === target) + 1} of ${modules.length}.`,
    );
  };
  return (
    <section className="room-module-reorder" aria-label="Reorder devices">
      <p>Drag a handle or use the arrows to change the order.</p>
      <ol ref={listRef}>
        {modules.map((module, index) => (
          <li
            key={module.id}
            data-reorder-id={module.id}
            data-dragging={drag?.id === module.id}
            data-drop-target={drag?.target === module.id && drag.id !== module.id}
          >
            <button
              type="button"
              className="room-module-reorder__handle"
              aria-label={`Drag ${module.label}`}
              onKeyDown={(event) => {
                if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
                event.preventDefault();
                const target = modules[index + (event.key === "ArrowUp" ? -1 : 1)];
                if (target) move(module.id, target.id);
              }}
              onPointerDown={(event) => {
                if (event.button !== 0) return;
                event.currentTarget.setPointerCapture(event.pointerId);
                setDrag({ id: module.id, target: module.id });
              }}
              onPointerMove={(event) => {
                if (!drag) return;
                const rows = listRef.current?.querySelectorAll<HTMLElement>("[data-reorder-id]");
                for (const row of rows ?? []) {
                  const rect = row.getBoundingClientRect();
                  if (event.clientY >= rect.top && event.clientY <= rect.bottom) {
                    setDrag({ ...drag, target: row.dataset.reorderId! });
                    break;
                  }
                }
                const scroll = listRef.current?.closest(".room-control-sheet__scroll");
                if (scroll) {
                  const rect = scroll.getBoundingClientRect();
                  if (event.clientY > rect.bottom - 40) scroll.scrollTop += 14;
                  if (event.clientY < rect.top + 40) scroll.scrollTop -= 14;
                }
              }}
              onPointerUp={() => {
                if (drag && drag.id !== drag.target) move(drag.id, drag.target);
                setDrag(null);
              }}
              onPointerCancel={() => setDrag(null)}
              onLostPointerCapture={() => setDrag(null)}
            >
              <svg
                width="18"
                height="24"
                viewBox="0 0 18 24"
                fill="currentColor"
                aria-hidden="true"
              >
                {[6, 12, 18].flatMap((y) =>
                  [6, 12].map((x) => <circle key={`${x}:${y}`} cx={x} cy={y} r="1.5" />),
                )}
              </svg>
            </button>
            <span>{module.label}</span>
            {([-1, 1] as const).map((direction) => (
              <button
                type="button"
                key={direction}
                aria-label={`Move ${module.label} ${direction === -1 ? "up" : "down"}`}
                disabled={!modules[index + direction]}
                onClick={() => move(module.id, modules[index + direction].id)}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d={direction === -1 ? "m6 14 6-6 6 6" : "m6 10 6 6 6-6"} />
                </svg>
              </button>
            ))}
          </li>
        ))}
      </ol>
      <span className="visually-hidden" role="status">
        {announcement}
      </span>
    </section>
  );
}
