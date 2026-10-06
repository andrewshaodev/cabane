import type { WorkspaceDestination } from "./workspace-open-link";
import { WorkspaceDialog } from "./WorkspaceDialog";
import { useState, type ReactNode } from "react";
import { WorkspaceCard, type WorkspaceCardAction, type WorkspaceLibraryEntry } from "./WorkspaceCard";
import { WorkspaceNameDialog } from "./WorkspaceNameDialog";
import { WorkspaceDeleteDialog } from "./WorkspaceDeleteDialog";
import { WorkspaceTransferDialog } from "./WorkspaceTransferDialog";
import "./workspaces.css";
export type { WorkspaceLibraryEntry } from "./WorkspaceCard";
type Dialog = { action: WorkspaceCardAction | "create" | "import" | "open-ha"; entry?: WorkspaceLibraryEntry };
export interface WorkspaceLibraryProps {
  entries: WorkspaceLibraryEntry[];
  onOpen: (id: string) => Promise<void>;
  onCreate: (name: string) => Promise<void>;
  onRename: (id: string, name: string) => Promise<void>;
  onDuplicate: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onImport: (json: string) => Promise<void>;
  onExport: (id: string, privateBackup: boolean) => Promise<void>;
  onRecover: (id: string) => Promise<void>;
  onExportRaw: (id: string) => Promise<void>;
  remoteImport?: ReactNode;
  onSettings?: (id: string, intent?: WorkspaceDestination) => Promise<void>;
}
export function WorkspaceLibrary(props: WorkspaceLibraryProps) {
  const [dialog, setDialog] = useState<Dialog | null>(() => new URLSearchParams(window.location.search).get("import") === "home-assistant" ? { action: "open-ha" } : null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const openDialog = (next: Dialog) => { setError(null); setDialog(next); };
  const run = async (action: () => Promise<void>) => {
    setBusy(true); setError(null);
    try { await action(); setDialog(null); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not complete this action. Please try again."); }
    finally { setBusy(false); }
  };
  const cancel = () => { setDialog(null); setError(null); window.history.replaceState(window.history.state, "", "/workspaces"); };
  return <main className="workspace-library">
    <header className="workspace-library-header"><div><p className="workspace-brand"><img src="/cabane-icon.png" alt="" width="28" height="33" />Cabane</p><h1>Your workspaces</h1></div>
      <div className="workspace-library-actions">{props.remoteImport && <button className="workspace-open-ha" disabled={busy} onClick={() => { window.history.replaceState(window.history.state, "", "/workspaces?import=home-assistant"); openDialog({ action: "open-ha" }); }}>Open from Home Assistant</button>}<button disabled={busy} onClick={() => openDialog({ action: "import" })}>Import</button>
        <button className="workspace-primary" disabled={busy} onClick={() => openDialog({ action: "create" })}>New workspace</button></div></header>
    {!dialog && error && <p role="alert" className="workspace-error">{error}</p>}
    {!props.entries.length ? <section className="workspace-empty"><h2>A place for your next home</h2><p>Create a workspace from scratch, or import a saved Cabane project.</p></section> :
      <section className="workspace-grid" aria-label="Homes">{props.entries.map(entry => <WorkspaceCard key={entry.metadata.id} entry={entry} busy={busy}
        onOpen={() => void run(() => props.onOpen(entry.metadata.id))} onAction={action => ["settings", "sync", "dashboard", "device"].includes(action) ? void run(() => props.onSettings?.(entry.metadata.id, action === "settings" ? undefined : action as WorkspaceDestination) ?? Promise.resolve()) : openDialog({ action, entry })}
        onRecover={() => void run(() => props.onRecover(entry.metadata.id))} onExportRaw={() => void run(() => props.onExportRaw(entry.metadata.id))} />)}</section>}
    {dialog?.action === "open-ha" && <WorkspaceDialog title="Open from Home Assistant" busy={busy} error={error} onCancel={cancel}>{props.remoteImport}</WorkspaceDialog>}
    {dialog && (dialog.action === "create" || dialog.action === "rename" || dialog.action === "duplicate") &&
      <WorkspaceNameDialog action={dialog.action} initialName={dialog.action === "create" ? "" : `${dialog.entry!.metadata.name}${dialog.action === "duplicate" ? " copy" : ""}`}
        busy={busy} error={error} onCancel={cancel} onSave={name => void run(() => dialog.action === "create" ? props.onCreate(name) :
          dialog.action === "rename" ? props.onRename(dialog.entry!.metadata.id, name) : props.onDuplicate(dialog.entry!.metadata.id, name))} />}
    {dialog?.action === "delete" && <WorkspaceDeleteDialog name={dialog.entry!.metadata.name} busy={busy} error={error} onCancel={cancel}
      onDelete={() => void run(() => props.onDelete(dialog.entry!.metadata.id))} />}
    {(dialog?.action === "import" || dialog?.action === "export") && <WorkspaceTransferDialog mode={dialog.action} busy={busy} error={error} onCancel={cancel}
      remoteImport={props.remoteImport} onImport={json => void run(() => props.onImport(json))} onExport={privateBackup => void run(() => props.onExport(dialog.entry!.metadata.id, privateBackup))} />}
  </main>;
}
