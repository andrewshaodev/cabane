import type { WorkspaceEntry, WorkspaceRepository } from "@cabane/engine";
import { ownerProjectRegistries } from "../project-runtime";
import { parseWorkspaceImport } from "./workspace-transfer";

/** Validate a private backup before one exact-ID IndexedDB transaction. */
export function restoreRemoteWorkspace(
  repository: WorkspaceRepository,
  document: string,
  expectedLocalRevision?: number,
): Promise<WorkspaceEntry> {
  const imported = parseWorkspaceImport(document, ownerProjectRegistries);
  const metadata = {
    id: imported.record.homeId,
    name: imported.name,
    homeAssistantUrl: imported.homeAssistantUrl,
    hasPublished: imported.hasPublished,
    createdAt: Date.now(),
  };
  return repository.restoreExact(imported.record, metadata, expectedLocalRevision);
}
