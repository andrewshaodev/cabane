import { useCabaneDom } from "./../CabaneDom";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { adjacentFloorId, floorShortcutDirection } from "./floor-selection";

export interface FloorPickerProps {
  floors: readonly { id: string; name: string }[];
  selectedId: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
  unavailable?: Readonly<Record<string, string>>;
  onAdd?: () => void;
  onAddBelow?: () => void;
  onRename?: () => void;
  onRemove?: () => void;
}

export function FloorPicker({ floors, selectedId, onSelect, disabled, unavailable = {}, onAdd, onAddBelow, onRename, onRemove }: FloorPickerProps) {
  const dom = useCabaneDom();
  const [expanded, setExpanded] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const hovered = useRef(false);
  const touchOpening = useRef(false);
  const touchPointer = useRef(false);
  const order = floors.map(floor => floor.id);
  const close = () => { setExpanded(false); setActionsOpen(false); };
  const choose = (id: string) => {
    if (!disabled && !unavailable[id]) onSelect(id);
  };
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (disabled || dom.root.querySelector("dialog[open]")) return;
      const direction = floorShortcutDirection(event);
      const id = direction && adjacentFloorId(order, selectedId, direction);
      if (id && !unavailable[id]) { event.preventDefault(); choose(id); }
    };
    dom.events.addEventListener("keydown", keydown);
    return () => dom.events.removeEventListener("keydown", keydown);
  });
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) close();
    };
    dom.events.addEventListener("pointerdown", outside);
    return () => dom.events.removeEventListener("pointerdown", outside);
  }, []);
  const runAction = (action: () => void) => {
    if (disabled) return;
    close();
    action();
  };
  return <div ref={root} className="floor-picker" data-expanded={expanded}
    style={{ "--floor-count": floors.length } as CSSProperties}
    onPointerEnter={event => {
      if (event.pointerType !== "touch") { hovered.current = true; setExpanded(true); }
    }}
    onPointerLeave={event => {
      if (event.pointerType === "touch") return;
      hovered.current = false;
      if (!root.current?.contains(dom.root.activeElement)) close();
    }}
    onPointerDownCapture={event => {
      touchPointer.current = event.pointerType === "touch";
      touchOpening.current = touchPointer.current && !expanded;
      if (touchOpening.current) setExpanded(true);
    }}
    onFocus={() => { if (!touchPointer.current) setExpanded(true); }}
    onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget) && !hovered.current) close(); }}
    onKeyDown={event => {
      touchPointer.current = false;
      if (event.key === "Escape") { event.stopPropagation(); close(); }
      else if (event.key === "Tab") setExpanded(true);
    }}>
    {expanded && <div className="floor-picker__secondary">
      {(onAdd || onAddBelow || onRename || onRemove) && <button type="button" disabled={disabled}
        aria-expanded={actionsOpen} onClick={() => setActionsOpen(!actionsOpen)}>Manage floors</button>}
      {actionsOpen && <div className="floor-picker__actions">
        {onAdd && <button type="button" disabled={disabled} onClick={() => runAction(onAdd)}>Add floor above</button>}
        {onAddBelow && <button type="button" disabled={disabled} onClick={() => runAction(onAddBelow)}>Add floor below</button>}
        {onRename && <button type="button" disabled={disabled} onClick={() => runAction(onRename)}>Rename floor</button>}
        {onRemove && <button type="button" disabled={disabled} onClick={() => runAction(onRemove)}>Remove floor</button>}
      </div>}
    </div>}
    <div className="floor-picker__levels" role="group" aria-label="Floors">
      {[...floors].reverse().map((floor, index) => <button key={floor.id} type="button"
        className="floor-picker__level" style={{ zIndex: floors.length - index }}
        aria-label={floor.name} aria-pressed={floor.id === selectedId}
        disabled={disabled || Boolean(unavailable[floor.id])}
        title={unavailable[floor.id] ? `${floor.name}: ${unavailable[floor.id]}` : floor.name}
        onClick={event => {
          if (touchOpening.current) { touchOpening.current = false; return; }
          choose(floor.id);
          if (touchPointer.current) close();
          if (event.detail > 0) event.currentTarget.blur();
        }}>
        <span className="floor-picker__label">{floor.name}
          {unavailable[floor.id] && <small>{unavailable[floor.id]}</small>}
        </span>
        <svg viewBox="0 0 72 38" aria-hidden="true"><polygon points="5,19 36,3 67,19 36,35" /></svg>
      </button>)}
    </div>
  </div>;
}
