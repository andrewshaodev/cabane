import { WorkspaceConflictError } from "@cabane/engine";
import { downloadConnectData } from "../editor-connect/profile-transfer";
import { exportWorkspaceBackup } from "../workspaces/workspace-transfer";
import { EditorButton } from "../editor-chrome/EditorButton";
import type { useEditorWorkspace } from "../editor-preview/useEditorWorkspace";
import "./editor-draft-status.css";

type Workspace = Pick<
  ReturnType<typeof useEditorWorkspace>,
  "error" | "saving" | "snapshot" | "getRecord" | "flush"
>;

export function EditorDraftStatus({
  workspace,
  homeAssistantUrl,
}: {
  workspace: Workspace;
  homeAssistantUrl: string | null;
}) {
  const error = workspace.error;
  if (!error && !workspace.saving) return null;
  if (!error)
    return (
      <div className="direction-status is-saving" role="status">
        <span aria-hidden="true" />
        Saving draft…
      </div>
    );
  const conflict = error instanceof WorkspaceConflictError;
  const download = () => {
    const stored = workspace.getRecord();
    const record = {
      ...stored,
      draft: workspace.snapshot.project,
      bindings: workspace.snapshot.bindings,
      draftUpdatedAt: Date.now(),
    };
    downloadConnectData(
      exportWorkspaceBackup(
        { name: record.draft.home.name, homeAssistantUrl, hasPublished: record.publishedAt !== 0 },
        record,
      ),
      `${record.homeId}-draft-recovery.json`,
    );
  };
  return (
    <div className="direction-status is-error editor-draft-error" role="alert">
      <div>
        <strong>
          {conflict ? "This workspace changed in another tab." : "Could not save this draft."}
        </strong>
        <p>
          {conflict
            ? "Navigation is paused to keep your current draft. Download a backup before reopening the saved workspace."
            : `${error.message} Your changes are kept in this tab.`}
        </p>
        <div className="editor-draft-error__actions">
          <EditorButton onClick={download}>Download draft backup</EditorButton>
          {!conflict && (
            <EditorButton
              onClick={() => {
                void workspace.flush();
              }}
            >
              Retry saving
            </EditorButton>
          )}
        </div>
      </div>
    </div>
  );
}
