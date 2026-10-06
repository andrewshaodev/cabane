import {
  createEmptyHomeProject, createSeedProjectRecord, normalizeWorkspaceBindingOrigin, parseHomeProject,
  parseHomeProjectRecord, validateHomeProject,
  type HomeProjectRecord, type ProjectModelRegistries,
} from "@cabane/engine";


export interface WorkspaceTransferMetadata {
  name: string;
  homeAssistantUrl: string | null;
  hasPublished: boolean;
}
export interface WorkspaceImport extends WorkspaceTransferMetadata { record: HomeProjectRecord }
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);

/** File formats share engine validation; identity allocation belongs to the repository. */
export function parseWorkspaceImport(json: string, registries: ProjectModelRegistries): WorkspaceImport {
  let input: unknown;
  try { input = JSON.parse(json); } catch { throw new Error("Choose a valid Cabane JSON project or backup."); }
  if (!object(input)) throw new Error("Expected a Cabane project or backup object.");
  if (input.format === "cabane-workspace") {
    if (input.version !== 1 || Object.keys(input).some(key => !["format", "version", "workspace", "record"].includes(key))) throw new Error("Unsupported workspace backup format.");
    const metadata = input.workspace;
    if (!object(metadata) || Object.keys(metadata).some(key => !["name", "homeAssistantUrl", "hasPublished"].includes(key)) ||
      typeof metadata.name !== "string" || !metadata.name.trim() || typeof metadata.hasPublished !== "boolean" ||
      !(metadata.homeAssistantUrl === null || typeof metadata.homeAssistantUrl === "string")) throw new Error("The workspace backup metadata is invalid.");
    const parsed = parseHomeProjectRecord(JSON.stringify(input.record), registries);
    if (!parsed.valid) throw new Error(parsed.issues[0]?.message ?? "Invalid workspace backup.");
    if (metadata.hasPublished !== (parsed.record.publishedAt !== 0)) throw new Error("Backup applied status does not match its record.");
    return { record: parsed.record, name: metadata.name.trim(), hasPublished: metadata.hasPublished,
      homeAssistantUrl: metadata.homeAssistantUrl === null ? null : normalizeWorkspaceBindingOrigin(metadata.homeAssistantUrl) };
  }
  if ("draft" in input || "published" in input) {
    const parsed = parseHomeProjectRecord(json, registries);
    if (!parsed.valid) throw new Error(parsed.issues[0]?.message ?? "Invalid workspace backup.");
    if (!("bindings" in input) && !("revision" in input)) {
      const record = parsed.record;
      record.published = createEmptyHomeProject(record.homeId, record.draft.home.name);
      record.published.seedRevision = record.seedRevision;
      record.publishedAt = 0;
      return { record, name: record.draft.home.name, homeAssistantUrl: null, hasPublished: false };
    }
    const origins = Object.keys(parsed.record.bindings);
    return { record: parsed.record, name: parsed.record.draft.home.name, hasPublished: parsed.record.publishedAt !== 0,
      homeAssistantUrl: origins.length === 1 ? origins[0] : null };
  }
  const parsed = parseHomeProject(json);
  if (!parsed.valid) throw new Error(parsed.issues[0]?.message ?? "Invalid home project.");
  const validation = validateHomeProject(parsed.project, registries);
  const errors = validation.issues.filter(issue => issue.severity === "error" && issue.code !== "project.floor-empty");
  if (errors.length) throw new Error(errors[0].message);
  const record = createSeedProjectRecord(parsed.project);
  record.published = createEmptyHomeProject(parsed.project.home.id, parsed.project.home.name);
  record.published.seedRevision = record.seedRevision;
  record.publishedAt = 0;
  return { record, name: parsed.project.home.name, homeAssistantUrl: null, hasPublished: false };
}

/** Explicit allowlist shared by editor and library exports. */
export function exportPrivateWorkspaceRecord(record: HomeProjectRecord): string {
  return JSON.stringify({ schemaVersion: record.schemaVersion, homeId: record.homeId,
    seedRevision: record.seedRevision, revision: record.revision, draft: record.draft,
    published: record.published, bindings: record.bindings,
    draftUpdatedAt: record.draftUpdatedAt, publishedAt: record.publishedAt }, null, 2);
}

export function exportWorkspaceBackup(metadata: WorkspaceTransferMetadata, record: HomeProjectRecord): string {
  return JSON.stringify({ format: "cabane-workspace", version: 1, workspace: {
    name: metadata.name, homeAssistantUrl: metadata.homeAssistantUrl, hasPublished: metadata.hasPublished,
  }, record: JSON.parse(exportPrivateWorkspaceRecord(record)) }, null, 2);
}
