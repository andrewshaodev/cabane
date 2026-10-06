import { useState } from "react";
import { WorkspaceDialog } from "./WorkspaceDialog";
export function WorkspaceNameDialog({ action, initialName, busy, error, onSave, onCancel }: {
  action: "create" | "rename" | "duplicate"; initialName: string; busy: boolean; error: string | null;
  onSave: (name: string) => void; onCancel: () => void;
}) {
  const [name, setName] = useState(initialName);
  const label = action === "create" ? "New workspace" : action === "rename" ? "Rename workspace" : "Duplicate workspace";
  return <WorkspaceDialog title={label} busy={busy} error={error} onCancel={onCancel}>
    <form onSubmit={event => { event.preventDefault(); if (name.trim()) onSave(name.trim()); }}>
      <label>Workspace name<input autoFocus required value={name} onChange={event => setName(event.target.value)} /></label>
      {action === "duplicate" && <p>The copy includes the saved design, connection, and mappings.</p>}
      <button className="workspace-primary" disabled={busy || !name.trim()}>{busy ? "Saving…" : action === "rename" ? "Save name" : action === "duplicate" ? "Duplicate" : "Create workspace"}</button>
    </form>
  </WorkspaceDialog>;
}
