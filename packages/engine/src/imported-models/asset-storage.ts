import { MODEL_ASSET_STORE, projectTransaction } from "../home-project/project-database";
import {
  CUSTOM_MODEL_LIMITS,
  modelAssetHash,
  modelAssetReferences,
  type ModelAsset,
  type ModelAssetReference,
  type ModelAssetSource,
} from "./contracts";
import type { HomeProjectRecord } from "../home-project/project-record-contract";
import { inspectGlb } from "./glb-validation";

// Pending immutable bytes never enter JSON snapshots. A project CAS publishes
// both the referenced files and the document in the same IndexedDB transaction.
const staged = new Map<string, Uint8Array>();

export async function stageModelAssets(assets: readonly ModelAsset[]) {
  for (const asset of assets) {
    inspectGlb(asset.bytes);
    if (
      asset.byteLength !== asset.bytes.byteLength ||
      (await modelAssetHash(asset.bytes)) !== asset.sha256
    )
      throw new Error(`GLB integrity check failed for ${asset.sha256}.`);
  }
  for (const asset of assets) staged.set(asset.sha256, new Uint8Array(asset.bytes));
}

export function referencedRecordAssets(record: Pick<HomeProjectRecord, "draft" | "published">) {
  const references = modelAssetReferences([record.draft, record.published]);
  if (references.reduce((sum, asset) => sum + asset.byteLength, 0) > CUSTOM_MODEL_LIMITS.homeBytes)
    throw new Error("Draft and saved home exceed 100 MiB of distinct GLB assets.");
  return references;
}

export function publishModelAssetReferences(
  tx: IDBTransaction,
  request: <R>(pending: IDBRequest<R>, onSuccess: (value: R) => void) => void,
  references: readonly ModelAssetReference[],
  complete: () => void,
) {
  if (!references.length) {
    complete();
    return;
  }
  tx.addEventListener("complete", () => {
    for (const reference of references) staged.delete(reference.sha256);
  });
  const store = tx.objectStore(MODEL_ASSET_STORE);
  let remaining = references.length;
  const next = () => {
    if (--remaining === 0) complete();
  };
  for (const reference of references) {
    const bytes = staged.get(reference.sha256);
    if (bytes) {
      if (bytes.byteLength !== reference.byteLength)
        throw new Error("GLB size does not match its reference.");
      // A verified complete import also repairs damaged bytes at the same hash.
      // The immutable content is unchanged; model identity is never replaced.
      request(store.put(bytes, reference.sha256), next);
    } else
      request(store.get(reference.sha256), (existing) => {
        if (!(existing instanceof Uint8Array) || existing.byteLength !== reference.byteLength)
          throw new Error(
            `Missing GLB asset ${reference.sha256}. Import a complete .cabane backup.`,
          );
        next();
      });
  }
}

export function createModelAssetRepository(factory: IDBFactory): ModelAssetSource & {
  restore(assets: readonly ModelAsset[]): Promise<void>;
  verify(references: readonly ModelAssetReference[]): Promise<ModelAsset[]>;
} {
  const read = async (sha256: string): Promise<Uint8Array | null> => {
    if (!/^[a-f0-9]{64}$/.test(sha256)) throw new Error("Invalid GLB asset hash.");
    const pending = staged.get(sha256);
    if (pending) return new Uint8Array(pending);
    return projectTransaction(factory, "readonly", MODEL_ASSET_STORE, (tx, request, done) =>
      request(tx.objectStore(MODEL_ASSET_STORE).get(sha256), (value) => {
        if (value === undefined) done(null);
        else if (value instanceof Uint8Array && value.byteLength <= CUSTOM_MODEL_LIMITS.fileBytes)
          done(value);
        else throw new Error("Stored GLB is damaged. Import a complete backup.");
      }),
    );
  };
  return {
    read,
    restore: async (assets) => {
      await stageModelAssets(assets);
      await projectTransaction<void>(factory, "readwrite", MODEL_ASSET_STORE, (tx, request, done) =>
        publishModelAssetReferences(tx, request, assets, () => done()),
      );
      for (const asset of assets) staged.delete(asset.sha256);
    },
    verify: async (references) =>
      Promise.all(
        references.map(async (reference) => {
          const bytes = await read(reference.sha256);
          if (
            !bytes ||
            bytes.byteLength !== reference.byteLength ||
            (await modelAssetHash(bytes)) !== reference.sha256
          )
            throw new Error(
              `Missing or damaged GLB asset ${reference.sha256}. Import a complete .cabane backup.`,
            );
          inspectGlb(bytes);
          return { ...reference, bytes };
        }),
      ),
  };
}
