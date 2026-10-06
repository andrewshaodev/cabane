import { isEmptyPublishedHome } from "./empty-project";
import { repairDraftFloorIds } from "./repair-draft-floor-ids";
import type { HomeExtensionRegistry, ProjectModelRegistries } from "../types";

import { composeHomeBindingManifest } from "./runtime";

import { serializeCanonicalJson } from "./serialization";

import type { HomeProject } from "./types";

import {
  parseHomeProjectSchema,
  validateHomeProject,
  type HomeProjectIssue,
  type HomeProjectValidationResult,
} from "./validation";

import { HomeProjectRecord, HomeProjectRecordParseResult } from "./project-record-contract";
import {
  validateWorkspaceBindings,
  type WorkspaceBindings,
} from "./workspace-bindings";

const bindingManifestExtensions: HomeExtensionRegistry = {
  furnishingModels: {},
  deviceModels: {},
  openingModels: {},
};

const issue = (code: string, path: string, message: string): HomeProjectIssue => ({
  code,
  path,
  message,
  severity: "error",
});

export const clone = <T>(value: T): T => structuredClone(value);

const recordIssue = (
  issues: HomeProjectIssue[],
  condition: boolean,
  code: string,
  path: string,
  message: string,
) => {
  if (!condition) issues.push(issue(code, path, message));
};

export const parseHomeProjectRecord = (
  raw: string,
  registries: ProjectModelRegistries,
): HomeProjectRecordParseResult => {
  let input: unknown;
  try {
    input = JSON.parse(raw);
  } catch {
    return {
      valid: false,
      raw,
      issues: [issue("project-record.json", "$", "The project record is not valid JSON.")],
    };
  }

  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return {
      valid: false,
      raw,
      issues: [issue("project-record.object", "$", "Expected a project record object.")],
    };
  }

  const candidate = input as Record<string, unknown>;
  const issues: HomeProjectIssue[] = [];
  const v1Keys = new Set([
    "homeId", "schemaVersion", "seedRevision", "draft", "published",
    "draftUpdatedAt", "publishedAt",
  ]);
  const v2Keys = new Set([...v1Keys, "revision", "bindings"]);
  const isV1 = !("revision" in candidate) && !("bindings" in candidate);
  for (const key of Object.keys(candidate)) {
    if (!(isV1 ? v1Keys : v2Keys).has(key)) {
      issues.push(issue(
        "project-record.unknown-key",
        key,
        `Property “${key}” is not part of the HomeProjectRecord ${isV1 ? "V1" : "V2"} schema.`,
      ));
    }
  }

  recordIssue(issues, (candidate.schemaVersion === 1 || candidate.schemaVersion === 2), "project-record.schema-version", "schemaVersion", "Supported record versions are 1 and 2.");
  recordIssue(issues, typeof candidate.homeId === "string" && candidate.homeId.trim().length > 0, "project-record.home-id", "homeId", "Expected a non-empty home ID.");
  recordIssue(issues, typeof candidate.seedRevision === "string" && candidate.seedRevision.trim().length > 0, "project-record.seed-revision", "seedRevision", "Expected a non-empty seed revision.");
  recordIssue(issues, typeof candidate.draftUpdatedAt === "number" && Number.isFinite(candidate.draftUpdatedAt), "project-record.timestamp", "draftUpdatedAt", "Expected a finite draft timestamp.");
  recordIssue(issues, typeof candidate.publishedAt === "number" && Number.isFinite(candidate.publishedAt), "project-record.timestamp", "publishedAt", "Expected a finite published timestamp.");
  if (!isV1) {
    recordIssue(issues, Number.isSafeInteger(candidate.revision) && (candidate.revision as number) >= 0, "project-record.revision", "revision", "V2 requires a non-negative integer revision.");
    recordIssue(issues, "bindings" in candidate, "project-record.bindings", "bindings", "V2 requires private workspace bindings.");
  }

  const draft = parseHomeProjectSchema(candidate.draft);
  if (draft.valid) draft.project = repairDraftFloorIds(draft.project);
  if (!draft.valid) {
    issues.push(...draft.issues.map((entry) => ({ ...entry, path: `draft.${entry.path}` })));
  }

  const publishedSchema = parseHomeProjectSchema(candidate.published);
  let published: HomeProjectValidationResult;
  try {
    published = validateHomeProject(candidate.published, registries);
  } catch {
    published = {
      valid: false,
      issues: [issue("project-record.published-validation", "published", "The published project could not be validated.")],
    };
  }
  if (!publishedSchema.valid) {
    issues.push(...publishedSchema.issues.map((entry) => ({ ...entry, path: `published.${entry.path}` })));
  } else if (!(candidate.publishedAt === 0 && isEmptyPublishedHome(publishedSchema.project))
    && !published.valid && published.issues.some((entry) => entry.severity === "error")) {
    issues.push(...published.issues.map((entry) => ({ ...entry, path: `published.${entry.path}` })));
  }

  if (draft.valid && publishedSchema.valid) {
    recordIssue(issues, candidate.homeId === draft.project.home.id, "project-record.home-id-mismatch", "draft.home.id", "Draft home ID must match the record home ID.");
    recordIssue(issues, candidate.homeId === publishedSchema.project.home.id, "project-record.home-id-mismatch", "published.home.id", "Published home ID must match the record home ID.");
    recordIssue(issues, candidate.seedRevision === draft.project.seedRevision, "project-record.seed-revision-mismatch", "draft.seedRevision", "Draft seed revision must match the record seed revision.");
    recordIssue(issues, candidate.seedRevision === publishedSchema.project.seedRevision, "project-record.seed-revision-mismatch", "published.seedRevision", "Published seed revision must match the record seed revision.");
  }

  let bindings: WorkspaceBindings = {};
  if (!isV1 && draft.valid && publishedSchema.valid) {
    bindings = candidate.bindings as WorkspaceBindings;
    issues.push(...validateWorkspaceBindings(
      bindings,
      composeHomeBindingManifest(draft.project, bindingManifestExtensions),
      composeHomeBindingManifest(publishedSchema.project, bindingManifestExtensions),
    ));
  }

  if (issues.length > 0 || !draft.valid || !publishedSchema.valid) {
    return {
      valid: false,
      raw,
      issues: issues.sort((left, right) => left.path.localeCompare(right.path) || left.code.localeCompare(right.code)),
    };
  }

  return {
    valid: true,
    record: {
      homeId: candidate.homeId as string,
      schemaVersion: 2,
      seedRevision: candidate.seedRevision as string,
      draft: draft.project,
      published: publishedSchema.project,
      draftUpdatedAt: candidate.draftUpdatedAt as number,
      publishedAt: candidate.publishedAt as number,
      revision: isV1 ? 0 : candidate.revision as number,
      bindings: isV1 ? {} : clone(bindings),
    },
  };
};

export const serializeHomeProjectRecord = (record: HomeProjectRecord): string =>
  serializeCanonicalJson(record);

export const createSeedProjectRecord = (
  seed: HomeProject,
  now = Date.now(),
): HomeProjectRecord => ({
  homeId: seed.home.id,
  schemaVersion: 2,
  seedRevision: seed.seedRevision,
  draft: clone(seed),
  published: clone(seed),
  draftUpdatedAt: now,
  publishedAt: now,
  revision: 0,
  bindings: {},
});
