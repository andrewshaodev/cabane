import { LengthInput } from "../editor-chrome/LengthInput";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  createBrowserUuid,
  createModelAssetRepository,
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
  existingModel,
  onImport,
  onCancel,
  missingModelOptions,
}: {
  onImport: (model: CustomModel, asset: ModelAsset, replacementId: string | null) => Promise<void>;
  onCancel: () => void;
  missingModelOptions: readonly MissingModelOption[];
} & ({ file: File; existingModel?: never } | { file?: never; existingModel: CustomModel })) {
  const dom = useCabaneDom();
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef(dom.root.activeElement as HTMLElement | null);
  const titleId = useId();
  const [id] = useState(() => existingModel?.id ?? (`custom:${createBrowserUuid()}` as const));
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState(existingModel?.name ?? file?.name.replace(/\.glb$/i, "") ?? "");
  const [placement, setPlacement] = useState<CustomModelPlacement>(
    existingModel?.placement ?? "floor",
  );
  const [profile, setProfile] = useState<CustomModelProfile>(existingModel?.profile ?? "furniture");
  const [rotation, setRotation] = useState<ModelVector>(
    existingModel?.normalization.rotation ?? [0, 0, 0],
  );
  const [scale, setScale] = useState(existingModel?.normalization.scale ?? 1);
  const [lightPosition, setLightPosition] = useState<ModelVector>(
    existingModel?.light?.position ?? [0, 0, 0],
  );
  const [lightColor, setLightColor] = useState(existingModel?.light?.color ?? "#ffe3b4");
  const [intensity, setIntensity] = useState(existingModel?.light?.maxIntensity ?? 2);
  const [distance, setDistance] = useState(existingModel?.light?.distance ?? 5);
  const [replacementId, setReplacementId] = useState("");
  const replacementOptions = missingModelOptions.filter((option) =>
    profile === "furniture" ? option.kind === "furnishing" : option.kind === "device",
  );
  useEffect(() => {
    if (replacementId && !replacementOptions.some((option) => option.key === replacementId))
      setReplacementId("");
  }, [replacementId, replacementOptions]);
  useEffect(() => {
    const previous = opener.current;
    dialog.current?.showModal?.();
    return () => {
      if (previous?.isConnected) previous.focus();
    };
  }, [dom]);
  useEffect(() => {
    let active = true;
    let resource: Loaded | undefined;
    void (async () => {
      const bytes = existingModel
        ? (await createModelAssetRepository(window.indexedDB).verify([existingModel.asset]))[0]!
            .bytes
        : new Uint8Array(await file.arrayBuffer());
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
  }, [file, existingModel]);
  const normalization = useMemo(() => {
    if (!loaded) return null;
    if (
      existingModel &&
      placement === existingModel.placement &&
      scale === existingModel.normalization.scale &&
      rotation.every((n, axis) => n === existingModel.normalization.rotation[axis])
    )
      return existingModel.normalization;
    return normalizeGlb(loaded.root, placement, rotation, scale);
  }, [loaded, placement, rotation, scale, existingModel]);
  const light =
    profile === "light"
      ? { position: lightPosition, color: lightColor, maxIntensity: intensity, distance }
      : undefined;
  const valid =
    name.trim() &&
    loaded &&
    normalization &&
    Number.isFinite(scale) &&
    scale > 0 &&
    (!light ||
      (Number.isFinite(intensity) && intensity >= 0 && Number.isFinite(distance) && distance >= 0));
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
              asset: existingModel?.asset ?? asset,
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
          <h2 id={titleId}>{existingModel ? "Edit model" : "Import GLB"}</h2>
          <EditorButton
            aria-label={existingModel ? "Close model editor" : "Close import"}
            disabled={busy}
            onClick={onCancel}
          >
            <EditorIcon name="close" />
          </EditorButton>
        </header>
        {loaded && normalization ? (
          <ModelImportPreview root={loaded.root} normalization={normalization} light={light} />
        ) : (
          !error && <p role="status">Reading model…</p>
        )}
        {existingModel && (
          <p className="model-import-hint">
            Changes apply to every placed copy when you save. Copies keep their support and relative
            scale. Preferred placement sets the model origin and the support for new copies.
            Changing profile clears draft connections for this model; reconnect in Connect.
          </p>
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
                if (normalization && e.target.value === "light" && !existingModel?.light)
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
              <legend>Dimensions · uniform scale</legend>
              {["Width", "Height", "Depth"].map((label, i) => (
                <label key={label}>
                  {label}
                  <LengthInput
                    label={label}
                    min={0.001}
                    value={normalization.size[i]}
                    onCommit={(n) => setScale((scale * n) / normalization.size[i])}
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
            <legend>Light source · position</legend>
            {["Light X", "Light Y", "Light Z"].map((label, i) => (
              <label key={label}>
                {label}
                <LengthInput
                  label={label}
                  value={lightPosition[i]}
                  onCommit={(n) => setLightPosition(changeVector(lightPosition, i, n))}
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
              Range
              <LengthInput label="Light range" min={0} value={distance} onCommit={setDistance} />
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
            {busy ? "Saving…" : existingModel ? "Save changes" : "Add to My models"}
          </EditorButton>
        </footer>
      </form>
    </dialog>
  );
}
