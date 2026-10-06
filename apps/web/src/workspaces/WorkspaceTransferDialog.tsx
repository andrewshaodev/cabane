import { useState } from "react";
import { WorkspaceDialog } from "./WorkspaceDialog";
export function WorkspaceTransferDialog({ mode, busy, error, onImport, onExport, onCancel }: {
  mode: "import" | "export"; busy: boolean; error: string | null;
  onImport: (json: string) => void; onExport: (privateBackup: boolean) => void; onCancel: () => void;
}) {
  const [json, setJson] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);
  return <WorkspaceDialog title={mode === "import" ? "Import a workspace" : "Export workspace"} busy={busy} error={fileError ?? error} onCancel={onCancel}>
    {mode === "import" ? <form onSubmit={event => { event.preventDefault(); onImport(json); }}>
      <p>A project or backup creates a new workspace.</p>
      <label>Cabane JSON file<input type="file" accept=".json,application/json" disabled={busy} onChange={async event => {
        const file = event.target.files?.[0]; setFileError(null); setJson("");
        if (file) try { setJson(await file.text()); } catch { setFileError("Could not read that file. Please choose it again."); }
      }} /></label>
      <button className="workspace-primary" disabled={busy || !json}>{busy ? "Importing…" : "Import workspace"}</button>
    </form> : <div className="workspace-export-options">
      <p>Export the latest saved version.</p>
      <button disabled={busy} onClick={() => onExport(false)}>Portable design<span>Design only, without connection or mappings.</span></button>
      <button disabled={busy} onClick={() => onExport(true)}>Private backup<span>Design, drafts, connection, and mappings. No credentials.</span></button>
    </div>}
  </WorkspaceDialog>;
}
