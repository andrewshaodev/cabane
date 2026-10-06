import { useRef, useState } from "react";
import {
  CUSTOM_MODEL_LIMITS,
  stageModelAssets,
  type CustomModel,
  type ModelAsset,
} from "@cabane/engine";
import { EditorButton } from "../editor-chrome/EditorButton";
import { ModelImportDialog } from "./ModelImportDialog";
import { useEditorWorkspace } from "../editor-preview/useEditorWorkspace";
import { EditorIcon } from "../editor-chrome/EditorIcon";
import { ModelGenerationGuide } from "./ModelGenerationGuide";
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
  const [generationGuide, setGenerationGuide] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
          <EditorIcon name="import" />
          Import model (.glb file)
        </EditorButton>
        <EditorButton disabled={disabled} onClick={() => setGenerationGuide(true)}>
          <EditorIcon name="cube" />
          Generate a custom model
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
      {error && (
        <p role="alert" className="catalog-add-error">
          {error}
        </p>
      )}
      {file && (
        <ModelImportDialog file={file} onCancel={() => setFile(null)} onImport={importModel} />
      )}
      {generationGuide && (
        <ModelGenerationGuide
          onClose={() => setGenerationGuide(false)}
          onImport={() => {
            setGenerationGuide(false);
            picker.current?.click();
          }}
        />
      )}
    </div>
  );
}
