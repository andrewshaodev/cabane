import { useEffect, useState } from "react";
import { readSyncCursor, type SyncCursor } from "./workspace-sync-state";
import { EditorIcon } from "../editor-chrome/EditorIcon";
import { readWorkspacePreview } from "./workspace-presentation";
import type { WorkspaceEntry } from "@cabane/engine";
export type WorkspaceLibraryEntry = WorkspaceEntry;
export type WorkspaceCardAction = "settings" | "rename" | "duplicate" | "export" | "delete";
export function WorkspaceCard({ entry, busy, onOpen, onAction, onRecover, onExportRaw }: {
  entry: WorkspaceLibraryEntry; busy: boolean; onOpen: () => void; onAction: (action: WorkspaceCardAction) => void;
  onRecover: () => void; onExportRaw: () => void;
}) {
  const { metadata, record, error } = entry;
  const [sync, setSync] = useState<SyncCursor | null>(null);
  useEffect(() => {
    let active = true;
    setSync(null);
    const refresh = () => {
      if (metadata.homeAssistantUrl) void readSyncCursor(window.indexedDB, metadata.homeAssistantUrl, metadata.id)
        .then(cursor => { if (active) setSync(cursor); }).catch(() => undefined);
    };
    refresh(); window.addEventListener("focus", refresh);
    return () => { active = false; window.removeEventListener("focus", refresh); };
  }, [metadata.id, metadata.homeAssistantUrl]);
  const preview = readWorkspacePreview(metadata.id);
  const dirty = record && JSON.stringify(record.draft) !== JSON.stringify(record.published);
  return <article className={`workspace-card${error ? " workspace-card--recovery" : ""}`}>
    {!error && <button className="workspace-card-target" disabled={busy} onClick={onOpen} aria-label={`Open ${metadata.name}`} />}
    <details><summary aria-label={`Actions for ${metadata.name}`}>•••</summary><div className="workspace-menu">
        {(["settings", "rename", "duplicate", "export", "delete"] as const).map(action => <button key={action} disabled={busy || Boolean(error && action !== "delete")}
          onClick={event => { const menu = event.currentTarget.closest("details"); menu?.removeAttribute("open"); menu?.querySelector("summary")?.focus(); onAction(action); }}>{action === "settings" ? "Home Assistant" : action[0].toUpperCase() + action.slice(1)}</button>)}
      </div></details>
    {preview && <img className="workspace-preview" src={preview} alt={`Preview of ${metadata.name}`} loading="lazy" />}
    <h2>{metadata.name}</h2>
    {sync && <span className="workspace-sync" title={sync.enabled ? "Automatic sync is enabled for this workspace" : "A copy of this workspace is saved on Home Assistant"}><EditorIcon name={sync.enabled ? "refresh" : "save"} />{sync.enabled ? "Auto-sync on" : "Saved on HA"}</span>}
    {(error || !metadata.hasPublished || dirty) && <p className="workspace-status">{error ? "Needs recovery" : !metadata.hasPublished ? "Draft" : "Unapplied changes"}</p>}
    <div className="workspace-card-footer"><p className="workspace-server" title={metadata.homeAssistantUrl ?? undefined}>{metadata.homeAssistantUrl && <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="m3 11 9-8 9 8v10H3Z" /><path d="M12 20v-8m0 4-4-4m4 2 4-4" /><circle cx="8" cy="11" r="1" /><circle cx="16" cy="9" r="1" /></svg>}<span>{metadata.homeAssistantUrl ? new URL(metadata.homeAssistantUrl).host : "No connection yet"}</span></p>
      {!error && <span className="workspace-card-arrow" aria-hidden="true">→</span>}
    </div>
    {error ? <><p className="workspace-error">{error}</p><div className="workspace-card-recovery">
      <button disabled={busy} onClick={onRecover}>Recover workspace</button><button disabled={busy} onClick={onExportRaw}>Export raw data</button>
    </div></> : null}
  </article>;
}
