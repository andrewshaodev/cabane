import type { HomeProject } from "./types";

import { type HomeProjectIssue, type HomeProjectValidationResult } from "./validation";

import { type WorkspaceBindings } from "./workspace-bindings";

/** A revision/raw compare failed; retrying the stale record cannot be safe. */
export class WorkspaceConflictError extends Error {
  constructor() {
    super("The workspace changed in another tab.");
    this.name = "WorkspaceConflictError";
  }
}

export interface HomeProjectRecord {
  homeId: string;
  schemaVersion: 2;
  seedRevision: string;
  draft: HomeProject;
  published: HomeProject;
  draftUpdatedAt: number;
  publishedAt: number;
  revision: number;
  bindings: WorkspaceBindings;
}

export interface ProjectRecordStore {
  read(homeId: string): Promise<string | null>;
  write(homeId: string, serializedRecord: string): Promise<void>;
  /** Atomically compare exact raw content, write, and verify before committing. */
  compareAndSwap?(homeId: string, expected: string | null, next: string | null): Promise<boolean>;
  /** Optional rollback support for a failed first write. */
  delete?(homeId: string): Promise<void>;
}

export interface MemoryProjectRecordStore extends ProjectRecordStore {
  snapshot(homeId: string): string | null;
}

export type HomeProjectRecordParseResult =
  | { valid: true; record: HomeProjectRecord }
  | { valid: false; raw: string; issues: readonly HomeProjectIssue[] };

export type ProjectLoadResult =
  | {
      status: "ready";
      record: HomeProjectRecord;
      source: "indexeddb" | "seed" | "legacy";
    }
  | {
      status: "recovery";
      record: HomeProjectRecord;
      raw: string;
      reason: string;
      issues: readonly HomeProjectIssue[];
    };

export interface HomeProjectRepository {
  load(homeId: string): Promise<HomeProjectRecord | null>;
  loadOrCreate(seed: HomeProject, now?: number): Promise<ProjectLoadResult>;
  /** Production mutations must supply the revision of the record they edited. */
  replace(record: HomeProjectRecord, expectedRevision?: number): Promise<HomeProjectRecord>;
  /** Explicit recovery only: replace the exact rejected raw snapshot with seed. */
  recover(seed: HomeProject, expectedRaw: string, now?: number): Promise<HomeProjectRecord>;
  /** Explicit recovery only: delete scene items whose model is no longer registered. */
  recoverWithoutMissingSceneItems(homeId: string, expectedRaw: string): Promise<HomeProjectRecord>;
  readRaw(homeId: string): Promise<string | null>;
  validate(project: HomeProject): HomeProjectValidationResult;
}
