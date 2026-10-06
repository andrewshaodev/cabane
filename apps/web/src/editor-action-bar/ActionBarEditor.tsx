import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  ActionBarBuiltInIcon, RoomShortcutIcon, SceneActionSlotFace, actionBarBuiltInLabels,
  createBrowserUuid, defaultActionBarItems, isActionBarDeviceNavigable, resolveActionBarItems, resolvedRoomIdForItem,
  type ActionBarBuiltIn, type ActionBarItem, type DeviceModelRegistry, type HomeProject,
} from "@cabane/engine";
import { EditorIcon } from "../editor-chrome/EditorIcon";
import { ShortcutDeviceIcon } from "./ShortcutDeviceIcon";
import { moveActionBarItem, removeActionBarItem, replaceActionBarItem } from "./action-bar-edits";
import "./action-bar-editor.css";

const builtIns: ActionBarBuiltIn[] = ["build", "walk", "night", "view", "all-lights"];
type Category = "built-in" | "room" | "device";
type Picker = { kind: Category; replacingId: string | null } | null;

export function ActionBarEditor({ project, deviceModels, roomPictures, roomNames = {}, deviceNames = {}, disabled, canUndo, canRedo, onUndo, onRedo, onChange }: {
  project: HomeProject; deviceModels: DeviceModelRegistry;
  roomPictures: Readonly<Record<string, string | null>>;
  roomNames?: Readonly<Record<string, string>>;
  deviceNames?: Readonly<Record<string, string>>;
  disabled: boolean; canUndo: boolean; canRedo: boolean; onUndo: () => void; onRedo: () => void;
  onChange: (items: readonly ActionBarItem[]) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [picker, setPicker] = useState<Picker>(null);
  const [query, setQuery] = useState("");
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [capacity, setCapacity] = useState<number | null>(null);
  const bar = useRef<HTMLDivElement>(null);
  const tray = useRef<HTMLDivElement>(null);
  const items = resolveActionBarItems(project.actionBar);
  const rooms = project.floors.flatMap(floor => floor.rooms);
  const devices = project.sceneItems.filter(item => item.kind === "device" && isActionBarDeviceNavigable(project, item.id));
  const selected = items.find(item => item.id === selectedId);
  const missingCount = items.filter(item => {
    const target = item.target;
    return target.kind === "room" ? !rooms.some(room => room.id === target.roomId)
      : target.kind === "device" && !devices.some(device => device.id === target.deviceId);
  }).length;
  useEffect(() => {
    const measure = () => {
      if (!bar.current) return;
      if (bar.current.clientWidth <= 0) { setCapacity(null); return; }
      const size = Number.parseFloat(window.getComputedStyle(bar.current).getPropertyValue("--scene-action-size")) || 64;
      setCapacity(Math.max(2, Math.floor((bar.current.clientWidth - 10 + 6) / (size + 6))));
    };
    measure();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    if (bar.current) observer?.observe(bar.current);
    window.addEventListener("resize", measure);
    return () => { observer?.disconnect(); window.removeEventListener("resize", measure); };
  }, []);
  useEffect(() => {
    const dismiss = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || (!picker && selectedId === null && !overflowOpen)) return;
      event.preventDefault();
      if (picker) setPicker(null);
      else if (overflowOpen) setOverflowOpen(false);
      else setSelectedId(null);
    };
    window.addEventListener("keydown", dismiss);
    return () => window.removeEventListener("keydown", dismiss);
  }, [picker, selectedId, overflowOpen]);
  const hasOverflow = capacity !== null && items.length + 1 > capacity;
  const visible = hasOverflow ? items.slice(0, Math.max(0, capacity - 2)) : items;
  const overflow = hasOverflow ? items.slice(visible.length) : [];
  const label = (item: ActionBarItem): string => {
    const target = item.target;
    if (target.kind === "built-in") return actionBarBuiltInLabels[target.action];
    if (target.kind === "room") return roomNames[target.roomId] ?? rooms.find(room => room.id === target.roomId)?.name ?? "Missing room";
    const device = devices.find(device => device.id === target.deviceId);
    return device ? deviceNames[device.id] ?? deviceModels[device.modelId]?.label ?? device.modelId.replaceAll("-", " ") : "Missing device";
  };
  const icon = (item: ActionBarItem) => {
    const target = item.target;
    if (target.kind === "built-in") return <ActionBarBuiltInIcon action={target.action} />;
    if (target.kind === "room") return <RoomShortcutIcon name={label(item)} pictureUrl={roomPictures[target.roomId]} />;
    const device = devices.find(device => device.id === target.deviceId);
    return device ? <ShortcutDeviceIcon modelId={device.modelId} models={deviceModels} /> : <EditorIcon name="devices" />;
  };
  const slot = (item: ActionBarItem) => <button key={item.id} type="button" className="scene-action-slot is-filled"
    aria-label={`Edit ${label(item)} shortcut`} aria-pressed={selectedId === item.id}
    disabled={disabled}
    onClick={() => { setSelectedId(item.id); setPicker(null); }}
    onKeyDown={event => { if (event.key === "ArrowUp") { event.preventDefault(); setSelectedId(item.id); requestAnimationFrame(() => tray.current?.querySelector<HTMLButtonElement>("button")?.focus()); } }}>
    <SceneActionSlotFace icon={icon(item)} label={label(item)} shortcut={item.target.kind === "built-in"
      ? { build: "B", walk: "W", night: "N", view: "V", "all-lights": "L" }[item.target.action] : undefined}
      chevron={item.target.kind === "built-in" && (item.target.action === "build" || item.target.action === "view")} />
  </button>;
  const choose = (target: ActionBarItem["target"]) => {
    if (!picker) return;
    onChange(replaceActionBarItem(items, picker.replacingId, target, createBrowserUuid));
    setSelectedId(null); setPicker(null); setQuery(""); setOverflowOpen(false);
  };
  const openPicker = (kind: Category) => { setPicker({ kind, replacingId: selected?.id ?? null }); setQuery(""); };
  const matching = (name: string) => name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
  const duplicate = (target: ActionBarItem["target"]) => items.some(item => item.id !== picker?.replacingId
    && JSON.stringify(item.target) === JSON.stringify(target));
  return <section className="shortcuts-workspace" aria-label="Customize shortcuts">
    <div className="shortcuts-workspace__intro">
      <h2>Home action bar</h2>
      <div className="shortcuts-workspace__history" role="group" aria-label="Shortcut history">
        <button type="button" disabled={disabled || !canUndo} onClick={onUndo}><EditorIcon name="undo" />Undo</button>
        <button type="button" disabled={disabled || !canRedo} onClick={onRedo}><EditorIcon name="redo" />Redo</button>
        <button type="button" aria-label="Restore defaults" disabled={disabled} onClick={() => { onChange(defaultActionBarItems.map(item => ({ ...item, target: { ...item.target } }))); setSelectedId(null); setPicker(null); }}>Restore defaults</button>
      </div>
    </div>
    {missingCount > 0 && <p className="shortcuts-workspace__warning" role="alert">{missingCount} shortcut target{missingCount === 1 ? " is" : "s are"} missing. Replace or remove before Save.</p>}
    <div className="shortcuts-workspace__canvas">
      {picker ? <div className="shortcuts-picker">
        <div className="shortcuts-picker__heading"><div><h2>{picker.kind === "built-in" ? "Choose an action" : picker.kind === "room" ? "Choose a room" : "Choose a device"}</h2>
          <p>{picker.replacingId ? "Replace the selected shortcut" : "Add a shortcut to the bar"}</p></div>
          <button type="button" onClick={() => setPicker(null)} aria-label="Close choices"><EditorIcon name="close" /></button></div>
        <label className="shortcuts-picker__search"><EditorIcon name="search" /><input type="search" value={query} placeholder="Search…"
          aria-label="Search shortcut choices" onChange={event => setQuery(event.target.value)} /></label>
        <div className="shortcuts-picker__grid">
          {picker.kind === "built-in" && builtIns.filter(action => matching(actionBarBuiltInLabels[action])).map(action => {
            const target = { kind: "built-in" as const, action };
            return <button key={action} type="button" aria-label={actionBarBuiltInLabels[action]} disabled={disabled || duplicate(target)} onClick={() => choose(target)}>
              <span className="shortcuts-picker__icon"><ActionBarBuiltInIcon action={action} /></span><strong>{actionBarBuiltInLabels[action]}</strong></button>;
          })}
          {picker.kind === "room" && rooms.filter(room => matching(roomNames[room.id] ?? room.name)).map(room => {
            const target = { kind: "room" as const, roomId: room.id };
            return <button key={room.id} type="button" aria-label={roomNames[room.id] ?? room.name} disabled={disabled || duplicate(target)} onClick={() => choose(target)}>
              <span className="shortcuts-picker__icon"><RoomShortcutIcon name={roomNames[room.id] ?? room.name} pictureUrl={roomPictures[room.id]} /></span><strong>{roomNames[room.id] ?? room.name}</strong></button>;
          })}
          {picker.kind === "device" && rooms.map(room => {
            const roomName = roomNames[room.id] ?? room.name;
            const choices = devices.filter(device => resolvedRoomIdForItem(device, project) === room.id)
              .filter(device => matching(roomName) || matching(deviceNames[device.id] ?? deviceModels[device.modelId]?.label ?? device.modelId));
            if (!choices.length) return null;
            return <section className="shortcuts-picker__room" key={room.id} aria-label={roomName}>
              <h3>{roomName}</h3><div className="shortcuts-picker__room-grid">{choices.map(device => {
                const target = { kind: "device" as const, deviceId: device.id };
                const name = deviceNames[device.id] ?? deviceModels[device.modelId]?.label ?? device.modelId.replaceAll("-", " ");
                return <button key={device.id} type="button" aria-label={`${name} · ${roomName}`} disabled={disabled || duplicate(target)} onClick={() => choose(target)}>
                  <span className="shortcuts-picker__icon"><ShortcutDeviceIcon modelId={device.modelId} models={deviceModels} /></span>
                  <strong>{name}</strong></button>;
              })}</div>
            </section>;
          })}
          {picker.kind === "device" && devices.length === 0 && <p>No room devices are available. Add one in Arrange first.</p>}
        </div>
      </div> : <div className="shortcuts-workspace__prompt">
        <h2>Choose a shortcut</h2><p>Select a shortcut below to edit it, or select Add to create one.</p>
      </div>}
    </div>
    <div className="shortcuts-workspace__bar-zone">
      <div className="shortcuts-workspace__bar-measure" ref={bar}>
        <nav className="scene-action-dock" aria-label="Draft action bar">
          <div className="scene-action-bar" style={{ "--scene-action-count": visible.length + (hasOverflow ? 1 : 0) + 1 } as CSSProperties}>
            {visible.map(slot)}
            {hasOverflow && <div className="scene-action-overflow">
              <button type="button" className="scene-action-slot is-filled" aria-label="More shortcuts" aria-expanded={overflowOpen}
                onClick={() => setOverflowOpen(!overflowOpen)}><SceneActionSlotFace icon="•••" label="More" /></button>
              {overflowOpen && <div className="scene-action-overflow__tray" role="group" aria-label="More shortcuts">{overflow.map(slot)}</div>}
            </div>}
            <button type="button" className="scene-action-slot shortcuts-workspace__empty" aria-label="Add shortcut" aria-pressed={selectedId === ""}
              disabled={disabled}
              onClick={() => { setSelectedId(""); setPicker(null); }}
              onKeyDown={event => { if (event.key === "ArrowUp") { event.preventDefault(); setSelectedId(""); requestAnimationFrame(() => tray.current?.querySelector<HTMLButtonElement>("button")?.focus()); } }}>
              <SceneActionSlotFace icon={<EditorIcon name="plus" />} label="Add" />
            </button>
          </div>
        </nav>
      </div>
      {selectedId !== null && !picker && <div className="shortcuts-workspace__tray" ref={tray} role="group" aria-label={selected ? `Edit ${label(selected)}` : "Add shortcut"}>
        <button type="button" disabled={disabled} onClick={() => openPicker("built-in")}><EditorIcon name="grid" />{selected ? "Replace with action" : "Add action"}</button>
        <button type="button" disabled={disabled} onClick={() => openPicker("room")}><EditorIcon name="rooms" />{selected ? "Replace with room" : "Add room"}</button>
        <button type="button" disabled={disabled} onClick={() => openPicker("device")}><EditorIcon name="devices" />{selected ? "Replace with device" : "Add device"}</button>
        {selected && <><span className="shortcuts-workspace__tray-separator" />
          <button type="button" aria-label="Move left" disabled={disabled || items[0]?.id === selected.id} onClick={() => onChange(moveActionBarItem(items, selected.id, -1))}><EditorIcon name="chevronLeft" /></button>
          <button type="button" aria-label="Move right" disabled={disabled || items.at(-1)?.id === selected.id} onClick={() => onChange(moveActionBarItem(items, selected.id, 1))}><EditorIcon name="chevron" /></button>
          <button type="button" aria-label="Remove shortcut" disabled={disabled} onClick={() => { onChange(removeActionBarItem(items, selected.id)); setSelectedId(null); }}><EditorIcon name="delete" /></button>
        </>}
      </div>}
    </div>
  </section>;
}
