import {
  CUSTOM_MODEL_LIMITS,
  documentModelReferences,
  modelAssetHash,
  stageModelAssets,
  type ModelAsset,
  type ModelAssetReference,
} from "@cabane/engine";
import { createHaWorkspaceClient, type StorageSender } from "./ha-workspace-client";

export class HaAssetUpgradeRequiredError extends Error {
  constructor() {
    super("Update the Cabane Home Assistant integration to sync houses with GLB models.");
    this.name = "HaAssetUpgradeRequiredError";
  }
}
const encode = (bytes: Uint8Array) => {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 8192)
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(binary);
};
const decode = (data: string) => Uint8Array.from(atob(data), (c) => c.charCodeAt(0));

export function createHaModelAssetClient(send: StorageSender) {
  const capability = async () => {
    try {
      const value = await send<{ version: number; chunk_bytes: number }>({
        type: "cabane/assets/capabilities",
      });
      if (value.version !== 1 || value.chunk_bytes !== CUSTOM_MODEL_LIMITS.chunkBytes)
        throw new HaAssetUpgradeRequiredError();
    } catch (error) {
      if (
        error instanceof HaAssetUpgradeRequiredError ||
        (error && typeof error === "object" && "code" in error && error.code === "unknown_command")
      )
        throw new HaAssetUpgradeRequiredError();
      throw error;
    }
  };
  return {
    upload: async (assets: readonly ModelAsset[]) => {
      if (!assets.length) return;
      await capability();
      const missing = new Set<string>();
      for (let start = 0; start < assets.length; start += 1024) {
        const presence = await send<{ missing: string[] }>({
          type: "cabane/assets/has",
          hashes: assets.slice(start, start + 1024).map((asset) => asset.sha256),
        });
        for (const hash of presence.missing) missing.add(hash);
      }
      for (const asset of assets) {
        if (!missing.has(asset.sha256)) continue;
        const { upload_id } = await send<{ upload_id: string }>({
          type: "cabane/assets/begin",
          sha256: asset.sha256,
          byte_length: asset.byteLength,
        });
        for (let offset = 0; offset < asset.byteLength; offset += CUSTOM_MODEL_LIMITS.chunkBytes) {
          const bytes = asset.bytes.subarray(offset, offset + CUSTOM_MODEL_LIMITS.chunkBytes);
          const response = await send<{ offset: number }>({
            type: "cabane/assets/upload",
            upload_id,
            offset,
            data: encode(bytes),
          });
          if (response.offset !== offset + bytes.byteLength)
            throw new Error("The GLB upload was interrupted. Retry synchronization.");
        }
        await send({ type: "cabane/assets/finish", upload_id });
      }
    },
    download: async (
      references: readonly ModelAssetReference[],
      read: (hash: string) => Promise<Uint8Array | null>,
    ) => {
      if (!references.length) return;
      await capability();
      const assets: ModelAsset[] = [];
      for (const reference of references) {
        let local: Uint8Array | null = null;
        try {
          local = await read(reference.sha256);
        } catch {
          // A complete remote copy can repair an unreadable local asset entry.
        }
        if (
          local &&
          local.byteLength === reference.byteLength &&
          (await modelAssetHash(local)) === reference.sha256
        )
          continue;
        const bytes = new Uint8Array(reference.byteLength);
        for (let offset = 0; offset < reference.byteLength;) {
          const block = await send<{ data: string; byte_length: number; offset: number }>({
            type: "cabane/assets/get",
            sha256: reference.sha256,
            offset,
          });
          const decoded = decode(block.data);
          if (
            block.byte_length !== reference.byteLength ||
            block.offset !== offset ||
            !decoded.length ||
            decoded.length > CUSTOM_MODEL_LIMITS.chunkBytes ||
            offset + decoded.length > bytes.length
          )
            throw new Error("The GLB download is incomplete. Retry synchronization.");
          bytes.set(decoded, offset);
          offset += decoded.length;
        }
        if ((await modelAssetHash(bytes)) !== reference.sha256)
          throw new Error("GLB integrity check failed. The previous home is unchanged.");
        assets.push({ ...reference, bytes });
      }
      await stageModelAssets(assets);
    },
  };
}

/** Asset prerequisites run inside the existing revision/conflict coordinator. */
export function createAssetAwareHaWorkspaceClient(
  send: StorageSender,
  source: {
    read(hash: string): Promise<Uint8Array | null>;
    verify(references: readonly ModelAssetReference[]): Promise<ModelAsset[]>;
  },
) {
  const client = createHaWorkspaceClient(send),
    assets = createHaModelAssetClient(send);
  return {
    ...client,
    get: async (homeId: string) => {
      const copy = await client.get(homeId);
      if (copy?.document && !copy.corrupt)
        await assets.download(documentModelReferences(copy.document), (hash) => source.read(hash));
      return copy;
    },
    put: async (homeId: string, document: string, expectedVersion: number | null) => {
      await assets.upload(await source.verify(documentModelReferences(document)));
      return client.put(homeId, document, expectedVersion);
    },
  };
}
