import { EditorIcon } from "../editor-chrome/EditorIcon";
import { HomeAssistantIcon } from "./HomeAssistantIcon";
import { readCabaneFile } from "@cabane/engine";
import { useLocation, useNavigate } from "react-router";
import { useState, type ReactNode } from "react";
import { WorkspaceDialog } from "./WorkspaceDialog";
export function WorkspaceTransferDialog({
  mode,
  busy,
  error,
  onImport,
  onExport,
  onCancel,
  remoteImport,
}: {
  remoteImport?: ReactNode;
  mode: "import" | "export";
  busy: boolean;
  error: string | null;
  onImport: (json: string) => void;
  onExport: (privateBackup: boolean) => void;
  onCancel: () => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [source, setSource] = useState<"file" | "ha">(() =>
    new URLSearchParams(location.search).get("import") === "home-assistant" ? "ha" : "file",
  );
  const [json, setJson] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);
  return (
    <WorkspaceDialog
      title={mode === "import" ? "Import workspace" : "Export workspace"}
      titleIcon={mode === "import" ? <EditorIcon name="import" /> : undefined}
      busy={busy}
      error={fileError ?? error}
      onCancel={onCancel}
    >
      {mode === "import" && remoteImport && (
        <div className="workspace-import-sources" aria-label="Import source">
          <button
            aria-pressed={source === "file"}
            onClick={() => {
              void navigate("/workspaces", { replace: true });
              setSource("file");
            }}
          >
            <EditorIcon name="file" />
            From file
          </button>
          <button
            aria-pressed={source === "ha"}
            onClick={() => {
              void navigate("/workspaces?import=home-assistant", { replace: true });
              setSource("ha");
            }}
          >
            <HomeAssistantIcon />
            From Home Assistant
          </button>
        </div>
      )}
      {mode === "import" && source === "ha" ? (
        remoteImport
      ) : mode === "import" ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onImport(json);
          }}
        >
          <p>A project or backup creates a new workspace.</p>
          <label>
            Cabane archive or JSON file
            <input
              type="file"
              accept=".cabane,.json,application/zip,application/json"
              disabled={busy}
              onChange={(event) => {
                void (async () => {
                  const file = event.target.files?.[0];
                  setFileError(null);
                  setJson("");
                  if (file)
                    try {
                      setJson((await readCabaneFile(file)).json);
                    } catch (error) {
                      setFileError(
                        error instanceof Error
                          ? error.message
                          : "Could not read that file. Please choose it again.",
                      );
                    }
                })();
              }}
            />
          </label>
          <button className="workspace-primary" disabled={busy || !json}>
            <EditorIcon name="import" />
            {busy ? "Importing…" : "Import workspace"}
          </button>
        </form>
      ) : (
        <div className="workspace-export-options">
          <p>Export the latest saved version.</p>
          <button disabled={busy} onClick={() => onExport(false)}>
            Portable design<span>Design only, without connection or mappings.</span>
          </button>
          <button disabled={busy} onClick={() => onExport(true)}>
            Private backup<span>Design, drafts, connection, and mappings. No credentials.</span>
          </button>
        </div>
      )}
    </WorkspaceDialog>
  );
}
