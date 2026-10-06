import { EditorActionButton } from "../editor-chrome/EditorActionButton";

export interface ConnectActionBarProps {
  view: "rooms" | "devices";
  onViewChange: (view: "rooms" | "devices") => void;
  refreshing: boolean;
  disconnected: boolean;
  hasUnmappedRooms: boolean;
  onRefresh: () => void;
}

export function ConnectActionBar({
  view, onViewChange, refreshing, disconnected, hasUnmappedRooms, onRefresh,
}: ConnectActionBarProps) {
  return (
    <div className="editor-action-bar connect-action-bar" role="group" aria-label="Connection actions"
      data-mode="connect" aria-busy={refreshing}>
      <EditorActionButton icon="rooms" label="Rooms" showLabel pressed={view === "rooms"}
        warning={hasUnmappedRooms ? "Some rooms are not mapped to Home Assistant areas." : undefined}
        onClick={() => onViewChange("rooms")} />
      <EditorActionButton icon="devices" label="Devices" showLabel pressed={view === "devices"}
        onClick={() => onViewChange("devices")} />
      <span className="editor-action-bar__separator" aria-hidden="true" />
      <EditorActionButton icon="refresh" label="Refresh from Home Assistant"
        disabled={disconnected || refreshing} onClick={onRefresh} />
    </div>
  );
}
