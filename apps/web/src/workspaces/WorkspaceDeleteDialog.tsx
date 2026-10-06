import { WorkspaceDialog } from "./WorkspaceDialog";
export function WorkspaceDeleteDialog({
  name,
  busy,
  error,
  onDelete,
  onCancel,
}: {
  name: string;
  busy: boolean;
  error: string | null;
  onDelete: () => void;
  onCancel: () => void;
}) {
  return (
    <WorkspaceDialog title={`Delete ${name}?`} busy={busy} error={error} onCancel={onCancel}>
      <p>
        This permanently removes this workspace, its saved design, and mappings from this browser.
        Export a backup first if you want to keep it.
      </p>
      <button className="workspace-danger" disabled={busy} onClick={onDelete}>
        {busy ? "Deleting…" : "Delete workspace"}
      </button>
    </WorkspaceDialog>
  );
}
