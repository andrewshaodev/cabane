import {
  createWorkspaceHistory as createHistory,
  serializeCanonicalJson,
  type EditorWorkspaceHistory,
  type EditorWorkspaceSnapshot,
} from "@cabane/engine";
import type { ReferencePlans } from "./reference-plan";
export interface ReferenceWorkspaceSnapshot extends EditorWorkspaceSnapshot {
  references?: ReferencePlans;
}
export type ReferenceWorkspaceHistory = EditorWorkspaceHistory<ReferenceWorkspaceSnapshot>;
export const createWorkspaceHistory = (snapshot: ReferenceWorkspaceSnapshot) =>
  createHistory(snapshot);
export {
  commitWorkspaceSnapshot,
  undoWorkspaceHistory,
  redoWorkspaceHistory,
} from "@cabane/engine";
export const architectureChanged = (a: ReferenceWorkspaceSnapshot, b: ReferenceWorkspaceSnapshot) =>
  serializeCanonicalJson({ project: a.project, bindings: a.bindings }) !==
  serializeCanonicalJson({ project: b.project, bindings: b.bindings });
