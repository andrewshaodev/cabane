import { useEffect, useId, useRef, useState } from "react";
import { EditorButton } from "../editor-chrome/EditorButton";
import { EditorIcon } from "../editor-chrome/EditorIcon";
import "./construct-floor-controls.css";

/** Persistent floor context, separate from the active construction tool. */
export function ConstructFloorControls({ floors, selectedId, disabled, onSelect, onAdd, onAddBelow, onSettings }: {
  floors: readonly { id: string; name: string }[];
  selectedId: string;
  disabled: boolean;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onAddBelow?: () => void;
  onSettings: () => void;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const expanded = open && !disabled;
  const close = (restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) trigger.current?.focus();
  };
  useEffect(() => {
    if (!expanded) return;
    menu.current?.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus();
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [expanded]);
  useEffect(() => { setOpen(false); }, [selectedId, disabled]);
  return <div ref={root} className="construct-floor-controls" role="group" aria-label="Floor controls"
    onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) close(); }}>
    <button ref={trigger} type="button" className="construct-floor-controls__trigger"
      aria-label="Current floor" aria-description={floors.find(floor => floor.id === selectedId)?.name}
      title={floors.find(floor => floor.id === selectedId)?.name} data-floor-id={selectedId} aria-haspopup="menu"
      aria-expanded={expanded} aria-controls={expanded ? menuId : undefined} disabled={disabled}
      onClick={() => setOpen(!expanded)} onKeyDown={event => {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); setOpen(true); }
      }}>
      <span>{floors.find(floor => floor.id === selectedId)?.name}</span><EditorIcon name="chevron" />
    </button>
    <EditorButton aria-label="Floor settings" title="Floor settings" disabled={disabled}
      onClick={() => { close(); onSettings(); }}><EditorIcon name="settings" /></EditorButton>
    {expanded && <div ref={menu} id={menuId} className="construct-floor-controls__menu" role="menu" aria-label="Floors"
      onKeyDown={event => {
        if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(true); return; }
        const buttons = Array.from(menu.current?.querySelectorAll<HTMLButtonElement>('button') ?? []);
        const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
        const next = event.key === "ArrowDown" ? (index + 1) % buttons.length
          : event.key === "ArrowUp" ? (index + buttons.length - 1) % buttons.length
          : event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : null;
        if (next !== null) { event.preventDefault(); event.stopPropagation(); buttons[next]?.focus(); }
      }}>
      {[...floors].reverse().map(floor => <button key={floor.id} type="button" role="menuitemradio"
        aria-checked={floor.id === selectedId} tabIndex={-1}
        onClick={() => { close(true); onSelect(floor.id); }}>
        <span>{floor.name}</span>{floor.id === selectedId && <EditorIcon name="check" />}
      </button>)}
      <div role="separator" />
      <button type="button" role="menuitem" tabIndex={-1} onClick={() => { close(true); onAdd(); }}>
        <EditorIcon name="plus" /><span>Add floor above</span>
      </button>
      {onAddBelow && <button type="button" role="menuitem" tabIndex={-1} onClick={() => { close(true); onAddBelow(); }}>
        <EditorIcon name="plus" /><span>Add floor below</span>
      </button>}
    </div>}
  </div>;
}
