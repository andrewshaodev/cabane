import type { WorkspaceEntry, WorkspaceRepository } from "@cabane/engine";
import { ownerProjectRegistries } from "../project-runtime";
import { parseWorkspaceImport } from "./workspace-transfer";

/** Validate a private backup before one exact-ID IndexedDB transaction. */
export function restoreRemoteWorkspace(
  repository: WorkspaceRepository,
  document: string,
  expectedLocalRevision?: number,
  expectedHomeId?: string,
): Promise<WorkspaceEntry> {
  let envelope: unknown;
  try { envelope = JSON.parse(document); } catch { throw new Error("The HA workspace copy is not valid JSON."); }
  if (!envelope || typeof envelope !== "object" || !("format" in envelope) || envelope.format !== "cabane-workspace") {
    throw new Error("The HA workspace copy is not a private Cabane backup.");
  }
  const imported = parseWorkspaceImport(document, ownerProjectRegistries);
  if (expectedHomeId && imported.record.homeId !== expectedHomeId) {
    throw new Error("The HA workspace copy belongs to a different workspace.");
  }
  const metadata = {
    id: imported.record.homeId,
    name: imported.name,
    homeAssistantUrl: imported.homeAssistantUrl,
    hasPublished: imported.hasPublished,
    createdAt: Date.now(),
  };
  return repository.restoreExact(imported.record, metadata, expectedLocalRevision);
}
