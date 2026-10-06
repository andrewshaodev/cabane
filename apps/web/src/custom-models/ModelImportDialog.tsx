import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  createBrowserUuid,
  CUSTOM_MODEL_PROFILES,
  openGlbPreview,
  normalizeGlb,
  useCabaneDom,
  type CustomModel,
  type CustomModelProfile,
  type CustomModelPlacement,
  type ModelVector,
  type ModelAsset,
} from "@cabane/engine";
import { EditorButton } from "../editor-chrome/EditorButton";
import { EditorIcon } from "../editor-chrome/EditorIcon";
import { ModelImportPreview } from "./ModelImportPreview";
import "./custom-models.css";

type Loaded = Awaited<ReturnType<typeof openGlbPreview>>;
type MissingModelOption = { key: string; id: string; kind: "furnishing" | "device"; count: number };

export function ModelImportDialog({
  file,
  onImport,
  onCancel,
  missingModelOptions,
}: {
  file: File;
  onImport: (model: CustomModel, asset: ModelAsset, replacementId: string | null) => Promise<void>;
  onCancel: () => void;
  missingModelOptions: readonly MissingModelOption[];
}) {
  const dom = useCabaneDom();
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [id] = useState(() => `custom:${createBrowserUuid()}` as const);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState(file.name.replace(/\.glb$/i, ""));
  const [placement, setPlacement] = useState<CustomModelPlacement>("floor");
  const [profile, setProfile] = useState<CustomModelProfile>("furniture");
  const [rotation, setRotation] = useState<ModelVector>([0, 0, 0]);
  const [scale, setScale] = useState(1);
  const [lightPosition, setLightPosition] = useState<ModelVector>([0, 0, 0]);
  const [lightColor, setLightColor] = useState("#ffe3b4");
  const [intensity, setIntensity] = useState(2);
  const [distance, setDistance] = useState(5);
  const [replacementId, setReplacementId] = useState("");
  const replacementOptions = missingModelOptions.filter((option) =>
    profile === "furniture" ? option.kind === "furnishing" : option.kind === "device",
  );
  useEffect(() => {
    if (replacementId && !replacementOptions.some((option) => option.key === replacementId))
      setReplacementId("");
  }, [replacementId, replacementOptions]);
  useEffect(() => {
    const previous = dom.root.activeElement as HTMLElement | null;
    dialog.current?.showModal?.();
    return () => {
      if (previous?.isConnected) previous.focus();
    };
  }, [dom]);
  useEffect(() => {
    let active = true;
    let resource: Loaded | undefined;
    void (async () => {
      const bytes = new Uint8Array(await file.arrayBuffer());
      resource = await openGlbPreview(bytes);
      if (active) setLoaded(resource);
      else resource.release();
    })().catch((error: unknown) => {
      if (active)
        setError(
          error instanceof Error ? error.message : "Could not read this GLB. Choose another file.",
        );
    });
    return () => {
      active = false;
      if (resource) resource.release();
    };
  }, [file]);
  const normalization = useMemo(
    () => (loaded ? normalizeGlb(loaded.root, placement, rotation, scale) : null),
    [loaded, placement, rotation, scale],
  );
  const light =
    profile === "light"
      ? { position: lightPosition, color: lightColor, maxIntensity: intensity, distance }
      : undefined;
  const valid = name.trim() && loaded && normalization && scale > 0;
  const changeVector = (value: ModelVector, axis: number, next: number): ModelVector =>
    value.map((n, i) => (i === axis ? next : n)) as [number, number, number];
  return (
    <dialog
      ref={dialog}
      className="model-import-dialog"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!valid || !loaded || !normalization || busy) return;
          setBusy(true);
          setError(null);
          const { bytes, ...asset } = loaded.asset;
          void onImport(
            {
              id,
              name: name.trim(),
              placement,
              profile,
              asset,
              normalization,
              complexity: loaded.complexity,
              ...(light ? { light } : {}),
            },
            loaded.asset,
            replacementId || null,
          )
            .catch((error: unknown) =>
              setError(
                error instanceof Error ? error.message : "Could not save the model. Try again.",
              ),
            )
            .finally(() => setBusy(false));
        }}
      >
        <header>
          <h2 id={titleId}>Import GLB</h2>
          <EditorButton aria-label="Close import" disabled={busy} onClick={onCancel}>
            <EditorIcon name="close" />
          </EditorButton>
        </header>
        {loaded && normalization ? (
          <ModelImportPreview root={loaded.root} normalization={normalization} light={light} />
        ) : (
          !error && <p role="status">Reading model…</p>
        )}
        <fieldset disabled={busy} className="model-import-fields">
          <label>
            Name
            <input autoFocus required value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            Preferred placement
            <select
              aria-label="Preferred placement"
              value={placement}
              onChange={(e) => setPlacement(e.target.value as CustomModelPlacement)}
            >
              <option value="floor">Floor</option>
              <option value="wall">Wall</option>
              <option value="ceiling">Ceiling</option>
            </select>
          </label>
          <label>
            Profile
            <select
              aria-label="Profile"
              value={profile}
              onChange={(e) => {
                setProfile(e.target.value as CustomModelProfile);
                if (normalization)
                  setLightPosition([
                    0,
                    (normalization.bounds.min[1] + normalization.bounds.max[1]) / 2,
                    normalization.bounds.max[2],
                  ]);
              }}
            >
              {CUSTOM_MODEL_PROFILES.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </fieldset>
        {normalization && (
          <>
            <fieldset disabled={busy} className="model-import-vectors">
              <legend>Dimensions (m) · uniform scale</legend>
              {["Width", "Height", "Depth"].map((label, i) => (
                <label key={label}>
                  {label}
                  <input
                    type="number"
                    min="0.001"
                    step="any"
                    required
                    value={Number(normalization.size[i].toFixed(4))}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      if (n > 0 && Number.isFinite(n))
                        setScale((scale * n) / normalization.size[i]);
                    }}
                  />
                </label>
              ))}
            </fieldset>
            <fieldset disabled={busy} className="model-import-vectors">
              <legend>Orientation (degrees)</legend>
              {["X", "Y", "Z"].map((label, i) => (
                <label key={label}>
                  {label}
                  <input
                    type="number"
                    step="any"
                    value={Number(((rotation[i] * 180) / Math.PI).toFixed(2))}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      if (Number.isFinite(n))
                        setRotation(changeVector(rotation, i, (n * Math.PI) / 180));
                    }}
                  />
                </label>
              ))}
            </fieldset>
          </>
        )}
        {light && (
          <fieldset disabled={busy} className="model-import-vectors">
            <legend>Light source · position in metres</legend>
            {["Light X", "Light Y", "Light Z"].map((label, i) => (
              <label key={label}>
                {label}
                <input
                  type="number"
                  step="any"
                  value={lightPosition[i]}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    if (Number.isFinite(n)) setLightPosition(changeVector(lightPosition, i, n));
                  }}
                />
              </label>
            ))}
            <label>
              Color
              <input
                type="color"
                value={lightColor}
                onChange={(e) => setLightColor(e.target.value)}
              />
            </label>
            <label>
              Intensity
              <input
                type="number"
                min="0"
                step="0.1"
                required
                value={intensity}
                onChange={(e) => setIntensity(Number(e.target.value))}
              />
            </label>
            <label>
              Range (m)
              <input
                type="number"
                min="0"
                step="0.1"
                required
                value={distance}
                onChange={(e) => setDistance(Number(e.target.value))}
              />
            </label>
          </fieldset>
        )}
        {loaded && (
          <p className="model-import-hint">
            {loaded.complexity.triangles.toLocaleString("en")} triangles ·{" "}
            {loaded.complexity.visibleMeshes} meshes. Original materials and textures are preserved.
          </p>
        )}
        {loaded?.notices.map((notice) => (
          <p className="model-import-hint" key={notice}>
            {notice}
          </p>
        ))}
        {profile !== "furniture" && profile !== "light" && (
          <p className="model-import-hint">
            Geometry stays static. Connect uses the existing{" "}
            {CUSTOM_MODEL_PROFILES.find(([id]) => id === profile)?.[1]} controls.
          </p>
        )}
        {replacementOptions.length > 0 && (
          <fieldset disabled={busy} className="model-import-fields model-import-replacement">
            <label>
              Replace missing model (optional)
              <select
                aria-label="Replace missing model (optional)"
                value={replacementId}
                onChange={(event) => setReplacementId(event.target.value)}
              >
                <option value="">Add as a new model</option>
                {replacementOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.id} · {option.count} scene item{option.count === 1 ? "" : "s"}
                  </option>
                ))}
              </select>
            </label>
          </fieldset>
        )}
        {error && (
          <p role="alert" className="catalog-add-error">
            {error}
          </p>
        )}
        <footer>
          <EditorButton disabled={busy} onClick={onCancel}>
            Cancel
          </EditorButton>
          <EditorButton type="submit" variant="primary" disabled={!valid || busy}>
            {busy ? "Importing…" : "Add to My models"}
          </EditorButton>
        </footer>
      </form>
    </dialog>
  );
}
