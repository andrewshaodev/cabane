import type { SyncCursor } from "./workspace-sync-state";
import type { SyncStatus } from "./workspace-sync-coordinator";
import type { EditorIconName } from "../editor-chrome/EditorIcon";

export function workspaceStorageStatus(cursor: SyncCursor | null, changed = false, live?: SyncStatus): { label: string; icon: EditorIconName } {
  if (!cursor) return { label: "Local only", icon: "monitor" };
  if (!cursor.enabled) return { label: "Saved to HA · sync off", icon: "save" };
  if (live?.kind === "conflict") return { label: "Sync needs attention", icon: "warning" };
  if (live?.kind === "disconnected" || live?.kind === "unavailable") return { label: "Sync interrupted", icon: "warning" };
  if (changed || live?.kind === "pending") return { label: "Changes pending", icon: "refresh" };
  if (live?.kind === "synced") return { label: "Synced with HA", icon: "refresh" };
  return { label: "Sync enabled", icon: "refresh" };
}
