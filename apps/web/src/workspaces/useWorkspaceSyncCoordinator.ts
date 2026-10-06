import { useMemo } from "react";
import { useHomeAssistantRuntime, type WorkspaceRepository } from "@cabane/engine";
import { createHaWorkspaceClient } from "./ha-workspace-client";
import { createWorkspaceSyncCoordinator } from "./workspace-sync-coordinator";
import {
  fingerprintWorkspace,
  readSyncCursor,
  writeSyncCursor,
  deleteSyncCursor,
} from "./workspace-sync-state";
import { exportWorkspaceBackup } from "./workspace-transfer";
import { restoreRemoteWorkspace } from "./workspace-remote-transfer";

export function useWorkspaceSyncCoordinator(
  repository: WorkspaceRepository,
  origin?: string | null,
) {
  const runtime = useHomeAssistantRuntime();
  const client = useMemo(
    () => createHaWorkspaceClient(runtime.sendStorageMessage),
    [runtime.sendStorageMessage],
  );
  const coordinator = useMemo(
    () =>
      createWorkspaceSyncCoordinator({
        repository,
        client,
        cursors: {
          read: (origin, homeId) => readSyncCursor(window.indexedDB, origin, homeId),
          write: (cursor) => writeSyncCursor(window.indexedDB, cursor),
          remove: (origin, homeId) => deleteSyncCursor(window.indexedDB, origin, homeId),
        },
        fingerprint: (entry) => fingerprintWorkspace(entry.metadata, entry.record!),
        serialize: (entry) => exportWorkspaceBackup(entry.metadata, entry.record!),
        restore: (document, revision, homeId) =>
          restoreRemoteWorkspace(
            repository,
            document,
            revision,
            homeId,
            origin ?? runtime.origin ?? undefined,
          ),
      }),
    [client, repository, origin, runtime.origin],
  );
  return { runtime, client, coordinator };
}
