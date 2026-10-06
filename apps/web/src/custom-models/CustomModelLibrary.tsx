import { useRef, useState } from "react";
import {
  CUSTOM_MODEL_LIMITS,
  createModelAssetRepository,
  downloadCabaneBytes,
  stageModelAssets,
  type CustomModel,
  type ModelAsset,
} from "@cabane/engine";
import { EditorButton } from "../editor-chrome/EditorButton";
import { ModelImportDialog } from "./ModelImportDialog";
import { useEditorWorkspace } from "../editor-preview/useEditorWorkspace";
import { downloadModelSkill } from "./ai-skill-download";
import "./custom-models.css";

export function CustomModelLibrary({
  workspace,
  disabled,
  onBrowse,
}: {
  workspace: ReturnType<typeof useEditorWorkspace>;
  disabled: boolean;
  onBrowse: () => void;
}) {
  const picker = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rename, setRename] = useState<{ id: string; name: string } | null>(null);
  const models = workspace.snapshot.project.customModels ?? [];
  const setModels = (customModels: readonly CustomModel[]) =>
    workspace.commit({
      ...workspace.snapshot,
      project: { ...workspace.snapshot.project, customModels },
    });
  const importModel = async (model: CustomModel, asset: ModelAsset) => {
    const assets = new Map(
      workspace.modelAssetReferences.map((asset) => [asset.sha256, asset.byteLength]),
    );
    assets.set(asset.sha256, asset.byteLength);
    if ([...assets.values()].reduce((sum, size) => sum + size, 0) > CUSTOM_MODEL_LIMITS.homeBytes)
      throw new Error(
        "This house and its active history exceed 100 MiB of distinct assets. Save and reopen the editor before importing more.",
      );
    await stageModelAssets([asset]);
    setModels([...models.filter((entry) => entry.id !== model.id), model]);
    const saved = await workspace.flush();
    if (saved.status !== "saved")
      throw new Error("Could not save the model. Your draft is kept in memory. Try again.");
    setFile(null);
    onBrowse();
  };
  return (
    <div className="custom-model-library">
      <div className="custom-model-actions">
        <EditorButton disabled={disabled} onClick={() => picker.current?.click()}>
          Import GLB
        </EditorButton>
        <EditorButton
          disabled={disabled}
          onClick={() => {
            void downloadModelSkill().catch(() =>
              setError("Could not download the skill. Try again."),
            );
          }}
        >
          Download AI skill
        </EditorButton>
      </div>
      <input
        ref={picker}
        type="file"
        accept=".glb,model/gltf-binary"
        hidden
        onChange={(event) => {
          const next = event.target.files?.[0];
          event.target.value = "";
          setError(null);
          if (next && next.size > CUSTOM_MODEL_LIMITS.fileBytes)
            setError("GLB files must be at most 10 MiB.");
          else if (next) setFile(next);
        }}
      />
      <details className="custom-model-management">
        <summary>Manage My models ({models.length})</summary>
        {!models.length && <p>Generate a GLB with your own AI, then import it here.</p>}
        {models.map((model) => (
          <div className="custom-model-row" key={model.id}>
            {rename?.id === model.id ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (rename.name.trim()) {
                    setModels(
                      models.map((m) =>
                        m.id === model.id ? { ...m, name: rename.name.trim() } : m,
                      ),
                    );
                    setRename(null);
                  }
                }}
              >
                <input
                  aria-label="Model name"
                  required
                  autoFocus
                  value={rename.name}
                  onChange={(e) => setRename({ ...rename, name: e.target.value })}
                />
                <EditorButton type="submit">Rename</EditorButton>
                <EditorButton onClick={() => setRename(null)}>Cancel</EditorButton>
              </form>
            ) : (
              <>
                <strong>{model.name}</strong>
                <div>
                  <EditorButton
                    variant="text"
                    disabled={disabled}
                    onClick={() => setRename({ id: model.id, name: model.name })}
                  >
                    Rename
                  </EditorButton>
                  <EditorButton
                    variant="text"
                    disabled={disabled}
                    onClick={() => {
                      void createModelAssetRepository(window.indexedDB)
                        .verify([model.asset])
                        .then(([asset]) =>
                          downloadCabaneBytes(
                            asset!.bytes,
                            `${model.name.replace(/[^a-z0-9-]/gi, "_")}.glb`,
                            "model/gltf-binary",
                          ),
                        )
                        .catch((e: unknown) =>
                          setError(
                            e instanceof Error ? e.message : "Could not download this model.",
                          ),
                        );
                    }}
                  >
                    Download GLB
                  </EditorButton>
                  <EditorButton
                    variant="text"
                    disabled={
                      disabled ||
                      workspace.snapshot.project.sceneItems.some(
                        (item) => item.modelId === model.id,
                      )
                    }
                    title={
                      workspace.snapshot.project.sceneItems.some(
                        (item) => item.modelId === model.id,
                      )
                        ? "Remove this model's instances first."
                        : "Remove unused model"
                    }
                    onClick={() => setModels(models.filter((m) => m.id !== model.id))}
                  >
                    Delete
                  </EditorButton>
                </div>
              </>
            )}
          </div>
        ))}
      </details>
      {error && (
        <p role="alert" className="catalog-add-error">
          {error}
        </p>
      )}
      {file && (
        <ModelImportDialog file={file} onCancel={() => setFile(null)} onImport={importModel} />
      )}
    </div>
  );
}
