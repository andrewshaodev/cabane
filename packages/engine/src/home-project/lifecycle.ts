import type { HomeProject } from "./types";
import { createEmptyRuntimeBindingProfile } from "../runtime-binding-profile";
import { composeHomeBindingManifest } from "./runtime";
import { serializeCanonicalJson } from "./serialization";
import { validateWorkspaceBindings, type WorkspaceBindings } from "./workspace-bindings";
import { parseHomeProjectSchema, type HomeProjectIssue } from "./validation";
import {
  createSeedProjectRecord,
  type HomeProjectRecord,
  type HomeProjectRepository,
  type ProjectLoadResult,
} from "./repository";

export type AutosaveResult =
  | { status: "saved"; record: HomeProjectRecord }
  | { status: "invalid-draft"; record: HomeProjectRecord; issues: readonly HomeProjectIssue[] }
  | { status: "storage-error"; record: HomeProjectRecord; error: Error };

export type PublishResult =
  | {
      status: "blocked";
      errors: readonly HomeProjectIssue[];
      warnings: readonly HomeProjectIssue[];
    }
  | {
      status: "confirmation-required";
      errors: readonly [];
      warnings: readonly HomeProjectIssue[];
    }
  | { status: "published"; record: HomeProjectRecord }
  | {
      status: "storage-error";
      errors: readonly [];
      warnings: readonly HomeProjectIssue[];
      error: Error;
    };

export interface PublishOptions {
  confirmWarnings?: boolean;
  now?: number;
  bindingIssues?: readonly HomeProjectIssue[];
}

export interface HomeProjectLifecycle {
  load(): Promise<ProjectLoadResult>;
  autosave(record: HomeProjectRecord, draft: HomeProject, now?: number, bindings?: WorkspaceBindings): Promise<AutosaveResult>;
  publish(record: HomeProjectRecord, options?: PublishOptions): Promise<PublishResult>;
  resetDraftToPublished(record: HomeProjectRecord, now?: number): Promise<AutosaveResult>;
  resetToSeed(record: HomeProjectRecord, now?: number): Promise<AutosaveResult>;
  /** Use only after a recovery load, with that load's exact rejected raw data. */
  recoverToSeed(record: HomeProjectRecord, expectedRaw: string, now?: number): Promise<AutosaveResult>;
  /** Preserve the project while removing furnishing/device items with unavailable models. */
  recoverWithoutMissingSceneItems(record: HomeProjectRecord, expectedRaw: string): Promise<AutosaveResult>;
  /** Portable project-only V1 envelope, without private binding profiles. */
  exportRecord(record: HomeProjectRecord): string;
  /** Explicitly private browser recovery artifact, including binding profiles. */
  exportStoredRaw(): Promise<string | null>;
}

const clone = <T>(value: T): T => structuredClone(value);
const asError = (value: unknown): Error =>
  value instanceof Error ? value : new Error("Project storage failed.");

export const autosaveHomeProjectDraft = async (
  repository: HomeProjectRepository,
  record: HomeProjectRecord,
  draft: HomeProject,
  now = Date.now(),
  bindings: WorkspaceBindings = record.bindings,
): Promise<AutosaveResult> => {
  const schema = parseHomeProjectSchema(draft);
  if (!schema.valid) {
    return { status: "invalid-draft", record, issues: schema.issues };
  }

  const candidate: HomeProjectRecord = {
    ...record,
    seedRevision: schema.project.seedRevision,
    draft: clone(schema.project),
    draftUpdatedAt: now,
    // History snapshots may predate a Publish or omit a newly introduced
    // origin. Only draft state may move back in time; published state may not.
    bindings: Object.fromEntries([...new Set([
      ...Object.keys(record.bindings), ...Object.keys(bindings),
    ])].map((origin) => [origin, {
      draft: clone(bindings[origin]?.draft ?? createEmptyRuntimeBindingProfile(record.homeId)),
      published: clone(record.bindings[origin]?.published ?? createEmptyRuntimeBindingProfile(record.homeId)),
      manualRoomIds: clone(bindings[origin]?.manualRoomIds ?? []),
      manualSlotIds: clone(bindings[origin]?.manualSlotIds ?? []),
    }])),
  };
  try {
    return { status: "saved", record: await repository.replace(candidate, record.revision) };
  } catch (error) {
    return { status: "storage-error", record, error: asError(error) };
  }
};

export const resetHomeProjectDraftToPublished = (
  repository: HomeProjectRepository,
  record: HomeProjectRecord,
  now = Date.now(),
): Promise<AutosaveResult> => autosaveHomeProjectDraft(
  repository,
  record,
  clone(record.published),
  now,
  Object.fromEntries(Object.entries(record.bindings).map(([origin, state]) => [origin, {
    draft: clone(state.published),
    published: clone(state.published),
    manualRoomIds: [],
    manualSlotIds: [],
  }])),
);

export const resetHomeProjectToSeed = async (
  repository: HomeProjectRepository,
  record: HomeProjectRecord,
  seed: HomeProject,
  now = Date.now(),
): Promise<AutosaveResult> => {
  const candidate = createSeedProjectRecord(seed, now);
  try {
    return { status: "saved", record: await repository.replace(candidate, record.revision) };
  } catch (error) {
    return { status: "storage-error", record, error: asError(error) };
  }
};

export const publishHomeProject = async (
  repository: HomeProjectRepository,
  record: HomeProjectRecord,
  options: PublishOptions = {},
): Promise<PublishResult> => {
  let issues: readonly HomeProjectIssue[];
  try {
    const validation = repository.validate(record.draft);
    const extensions = { furnishingModels: {}, deviceModels: {}, openingModels: {} };
    issues = [
      ...validation.issues,
      ...validateWorkspaceBindings(
        record.bindings,
        composeHomeBindingManifest(record.draft, extensions),
        composeHomeBindingManifest(record.published, extensions),
      ),
      ...(options.bindingIssues ?? []),
    ];
  } catch {
    issues = [{
      code: "project.publish-validation",
      path: "$",
      message: "The draft could not be validated for publishing.",
      severity: "error",
    }];
  }

  const errors = issues.filter((entry) => entry.severity === "error");
  const warnings = issues.filter((entry) => entry.severity === "warning");
  if (errors.length > 0) return { status: "blocked", errors, warnings };
  if (warnings.length > 0 && !options.confirmWarnings) {
    return { status: "confirmation-required", errors: [], warnings };
  }

  const candidate: HomeProjectRecord = {
    ...record,
    published: clone(record.draft),
    publishedAt: options.now ?? Date.now(),
    bindings: Object.fromEntries(Object.entries(record.bindings).map(([origin, state]) => [origin, {
      ...clone(state),
      published: clone(state.draft),
    }])),
  };
  try {
    return { status: "published", record: await repository.replace(candidate, record.revision) };
  } catch (error) {
    return {
      status: "storage-error",
      errors: [],
      warnings,
      error: asError(error),
    };
  }
};

export const createHomeProjectLifecycle = (
  repository: HomeProjectRepository,
  seed: HomeProject,
  clock: () => number = Date.now,
): HomeProjectLifecycle => ({
  load: () => repository.loadOrCreate(seed, clock()),
  autosave: (record, draft, now = clock(), bindings = record.bindings) =>
    autosaveHomeProjectDraft(repository, record, draft, now, bindings),
  publish: (record, options = {}) =>
    publishHomeProject(repository, record, { ...options, now: options.now ?? clock() }),
  resetDraftToPublished: (record, now = clock()) =>
    resetHomeProjectDraftToPublished(repository, record, now),
  resetToSeed: (record, now = clock()) =>
    resetHomeProjectToSeed(repository, record, seed, now),
  recoverToSeed: async (record, expectedRaw, now = clock()) => {
    try {
      return { status: "saved", record: await repository.recover(seed, expectedRaw, now) };
    } catch (error) {
      return { status: "storage-error", record, error: asError(error) };
    }
  },
  recoverWithoutMissingSceneItems: async (record, expectedRaw) => {
    try {
      return {
        status: "saved",
        record: await repository.recoverWithoutMissingSceneItems(record.homeId, expectedRaw),
      };
    } catch (error) {
      return { status: "storage-error", record, error: asError(error) };
    }
  },
  exportRecord: ({ revision: _revision, bindings: _bindings, ...record }) => serializeCanonicalJson(record),
  exportStoredRaw: () => repository.readRaw(seed.home.id),
});
