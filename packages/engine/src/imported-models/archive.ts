import { zipSync, unzipSync, strToU8, strFromU8 } from "fflate";
import {
  CUSTOM_MODEL_LIMITS,
  modelAssetReferences,
  type CustomModel,
  type ModelAsset,
  type ModelAssetReference,
} from "./contracts";
import { stageModelAssets } from "./asset-storage";
import { isPlainRecord, type HomeProjectIssue } from "../home-project/validation-types";
import { validateCustomModels } from "./model-schema";

const DOCUMENT_LIMIT = 5 * 1024 * 1024;
const MODEL_PACK_FORMAT = "cabane-model-pack";
const MODEL_PACK_VERSION = 1;

export interface CabaneModelPack {
  models: CustomModel[];
  assets: ModelAsset[];
}

const modelValidationError = (models: unknown): Error | null => {
  const issues: HomeProjectIssue[] = [];
  validateCustomModels(models, issues, "models");
  const issue = issues.find((candidate) => candidate.severity === "error");
  return issue ? new Error(issue.message) : null;
};

const modelPackAssets = (models: readonly CustomModel[], assets: readonly ModelAsset[]) => {
  const references = modelAssetReferences([{ customModels: models }]);
  const supplied = new Map<string, ModelAsset>();
  for (const asset of assets) {
    if (supplied.has(asset.sha256)) throw new Error(`Duplicate GLB asset ${asset.sha256}.`);
    supplied.set(asset.sha256, asset);
  }
  const selected = references.map((reference) => {
    const asset = supplied.get(reference.sha256);
    if (!asset) throw new Error(`The model pack is missing GLB ${reference.sha256}.`);
    if (
      asset.byteLength !== reference.byteLength ||
      asset.bytes.byteLength !== reference.byteLength
    )
      throw new Error(`GLB size does not match its reference ${reference.sha256}.`);
    return asset;
  });
  if (supplied.size !== references.length)
    throw new Error("The model pack contains an unreferenced GLB asset.");
  if (selected.reduce((sum, asset) => sum + asset.byteLength, 0) > CUSTOM_MODEL_LIMITS.homeBytes)
    throw new Error("A model pack may contain at most 100 MiB of distinct GLB assets.");
  return selected;
};

/** GLB references are in projects, never in the private connection profiles. */
export function documentModelReferences(json: string): ModelAssetReference[] {
  const input = JSON.parse(json) as Record<string, unknown> | null;
  if (!input || typeof input !== "object") throw new Error("Invalid home document.");
  const record = (input.record ?? input) as Record<string, unknown>;
  const projects = record.draft && record.published ? [record.draft, record.published] : [record];
  const references = new Map<string, ModelAssetReference>();
  for (const project of projects) {
    if (!project || typeof project !== "object") throw new Error("Invalid project document.");
    const models = (project as { customModels?: unknown }).customModels ?? [];
    if (!Array.isArray(models)) throw new Error("Invalid custom model catalogue.");
    for (const model of models as unknown[]) {
      const asset =
        model && typeof model === "object" && "asset" in model
          ? (model.asset as ModelAssetReference | undefined)
          : undefined;
      if (
        !asset ||
        typeof asset.sha256 !== "string" ||
        !/^[a-f0-9]{64}$/.test(asset.sha256) ||
        !Number.isSafeInteger(asset.byteLength) ||
        asset.byteLength <= 0 ||
        asset.byteLength > CUSTOM_MODEL_LIMITS.fileBytes
      )
        throw new Error("Invalid GLB reference in the home document.");
      if (
        references.has(asset.sha256) &&
        references.get(asset.sha256)!.byteLength !== asset.byteLength
      )
        throw new Error("Inconsistent GLB asset sizes.");
      references.set(asset.sha256, { sha256: asset.sha256, byteLength: asset.byteLength });
    }
  }
  if (
    [...references.values()].reduce((sum, asset) => sum + asset.byteLength, 0) >
    CUSTOM_MODEL_LIMITS.homeBytes
  )
    throw new Error("The home exceeds 100 MiB of distinct GLB assets.");
  return [...references.values()];
}

export function createCabaneArchive(json: string, assets: readonly ModelAsset[]) {
  const document = strToU8(json);
  if (document.byteLength > DOCUMENT_LIMIT) throw new Error("The home document exceeds 5 MiB.");
  const files: Record<string, Uint8Array> = { "project.json": document };
  for (const asset of assets) files[`assets/${asset.sha256}.glb`] = asset.bytes;
  return zipSync(files, { level: 0 });
}

/** Create a portable model-only ZIP. The manifest preserves model IDs so scene items resolve on import. */
export function createCabaneModelPack(
  models: readonly CustomModel[],
  assets: readonly ModelAsset[],
) {
  const validationError = modelValidationError(models);
  if (validationError) throw validationError;
  const selected = modelPackAssets(models, assets);
  const manifest = strToU8(
    JSON.stringify({ format: MODEL_PACK_FORMAT, version: MODEL_PACK_VERSION, models }),
  );
  if (manifest.byteLength > DOCUMENT_LIMIT)
    throw new Error("The model pack manifest exceeds 5 MiB.");
  const files: Record<string, Uint8Array> = { "manifest.json": manifest };
  for (const asset of selected) files[`assets/${asset.sha256}.glb`] = asset.bytes;
  return zipSync(files, { level: 0 });
}

export async function readCabaneModelPack(bytes: Uint8Array): Promise<CabaneModelPack> {
  if (bytes.byteLength > CUSTOM_MODEL_LIMITS.homeBytes + DOCUMENT_LIMIT + 1024 * 1024)
    throw new Error("The model pack exceeds the house asset limit.");
  const paths = new Set<string>();
  let total = 0;
  const files = unzipSync(bytes, {
    filter: (file) => {
      if (
        paths.has(file.name) ||
        (file.name !== "manifest.json" && !/^assets\/[a-f0-9]{64}\.glb$/.test(file.name))
      )
        throw new Error("The model pack contains an unexpected or duplicate file.");
      paths.add(file.name);
      total += file.originalSize;
      if (
        file.originalSize >
          (file.name === "manifest.json" ? DOCUMENT_LIMIT : CUSTOM_MODEL_LIMITS.fileBytes) ||
        total > CUSTOM_MODEL_LIMITS.homeBytes + DOCUMENT_LIMIT
      )
        throw new Error("The model pack exceeds the model limits.");
      return true;
    },
  });
  const manifestBytes = files["manifest.json"];
  if (!manifestBytes) throw new Error("The model pack is missing manifest.json.");
  let manifest: unknown;
  try {
    manifest = JSON.parse(strFromU8(manifestBytes));
  } catch {
    throw new Error("The model pack manifest is not valid JSON.");
  }
  if (
    !isPlainRecord(manifest) ||
    manifest.format !== MODEL_PACK_FORMAT ||
    manifest.version !== MODEL_PACK_VERSION ||
    Object.keys(manifest).some((key) => !["format", "version", "models"].includes(key))
  )
    throw new Error("Unsupported model pack manifest.");
  const validationError = modelValidationError(manifest.models);
  if (validationError) throw validationError;
  const models = manifest.models as CustomModel[];
  const references = modelAssetReferences([{ customModels: models }]);
  const assets = references.map((reference) => {
    const assetBytes = files[`assets/${reference.sha256}.glb`];
    if (!assetBytes) throw new Error(`The model pack is missing GLB ${reference.sha256}.`);
    return { ...reference, bytes: assetBytes };
  });
  if (paths.size !== references.length + 1)
    throw new Error("The model pack contains an unreferenced GLB file.");
  await stageModelAssets(assets);
  return { models, assets };
}

export async function readCabaneArchive(
  bytes: Uint8Array,
): Promise<{ json: string; assets: ModelAsset[] }> {
  if (bytes.byteLength > CUSTOM_MODEL_LIMITS.homeBytes + DOCUMENT_LIMIT + 1024 * 1024)
    throw new Error("The archive exceeds the house asset limit.");
  let total = 0;
  const paths = new Set<string>();
  const files = unzipSync(bytes, {
    filter: (file) => {
      if (
        paths.has(file.name) ||
        (file.name !== "project.json" && !/^assets\/[a-f0-9]{64}\.glb$/.test(file.name))
      )
        throw new Error("The .cabane archive contains an unexpected or duplicate file.");
      paths.add(file.name);
      total += file.originalSize;
      if (
        file.originalSize >
          (file.name === "project.json" ? DOCUMENT_LIMIT : CUSTOM_MODEL_LIMITS.fileBytes) ||
        total > CUSTOM_MODEL_LIMITS.homeBytes + DOCUMENT_LIMIT
      )
        throw new Error("The .cabane archive exceeds the model limits.");
      return true;
    },
  });
  if (!files["project.json"]) throw new Error("The .cabane archive is missing project.json.");
  const json = strFromU8(files["project.json"]);
  const references = documentModelReferences(json);
  const assets = references.map((reference) => {
    const bytes = files[`assets/${reference.sha256}.glb`];
    if (!bytes) throw new Error(`The .cabane archive is missing GLB ${reference.sha256}.`);
    return { ...reference, bytes };
  });
  if (paths.size !== references.length + 1)
    throw new Error("The .cabane archive contains unreferenced GLB files.");
  await stageModelAssets(assets);
  return { json, assets };
}

export async function readCabaneFile(file: Blob) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) return readCabaneArchive(bytes);
  if (bytes.byteLength > DOCUMENT_LIMIT) throw new Error("The JSON document exceeds 5 MiB.");
  return {
    json: new TextDecoder("utf-8", { fatal: true }).decode(bytes),
    assets: [] as ModelAsset[],
  };
}

export function downloadCabaneBytes(
  bytes: Uint8Array,
  name: string,
  mime = "application/octet-stream",
) {
  const url = URL.createObjectURL(new Blob([new Uint8Array(bytes).buffer], { type: mime }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  globalThis.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
