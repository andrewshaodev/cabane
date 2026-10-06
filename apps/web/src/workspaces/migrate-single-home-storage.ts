import { homeAssistantAuthStorageKey, loadStoredAuthData, normalizeHomeAssistantUrl, runtimeBindingProfileStorageKey, legacyRuntimeBindingProfileStorageKey,
  type WorkspaceRepository } from "@cabane/engine";
import { migrateBrowserOriginProfile } from "../project-runtime";

// Delete this module after the owner's existing browser has completed conversion.
// No normal workspace read depends on these old keys.
const URL_KEY = "cabane:ha-url:v1";
const AUTH_KEY = "cabane:ha-auth:v1";

export function singleHomeUrl(storage: Storage): string | null {
  return normalizeHomeAssistantUrl(storage.getItem(URL_KEY));
}

export async function migrateSingleHomeStorage(repository: WorkspaceRepository, ownerId: string, storage: Storage) {
  if (await repository.migrationDone()) return;
  let entry = await repository.read(ownerId);
  if (entry?.error) return; // Preserve rejected data; other workspaces remain usable.
  const origin = singleHomeUrl(storage);
  if (entry?.record && origin && !entry.metadata.homeAssistantUrl) {
    entry = await repository.setConnection(ownerId, entry.record.revision, origin);
  }
  if (entry?.record && origin) {
    await migrateBrowserOriginProfile(entry.record, origin);
  }
  const rawAuth = storage.getItem(AUTH_KEY);
  if (rawAuth) {
    const value = JSON.parse(rawAuth) as { hassUrl?: string; clientId?: string };
    const authOrigin = normalizeHomeAssistantUrl(value.hassUrl);
    if (!authOrigin || !value.clientId) throw new Error("The saved Home Assistant sign-in needs recovery.");
    const key = homeAssistantAuthStorageKey(authOrigin, value.clientId);
    if (storage.getItem(key) === null) storage.setItem(key, rawAuth);
    if (!loadStoredAuthData(storage, authOrigin, value.clientId)) throw new Error("Could not preserve the saved Home Assistant sign-in.");
  }
  storage.removeItem(AUTH_KEY);
  storage.removeItem(URL_KEY);
  if (entry?.record && origin) {
    storage.removeItem(runtimeBindingProfileStorageKey(origin, ownerId));
    storage.removeItem(legacyRuntimeBindingProfileStorageKey(origin, ownerId));
  }
  await repository.finishMigration();
}
