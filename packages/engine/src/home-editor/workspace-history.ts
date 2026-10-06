import { serializeCanonicalJson, type HomeProject, type WorkspaceBindings } from "../home-project";
import { DEFAULT_HISTORY_LIMIT } from "./history";

export interface EditorWorkspaceSnapshot {
  project: HomeProject;
  bindings: WorkspaceBindings;
}

export interface EditorWorkspaceHistory<T extends EditorWorkspaceSnapshot = EditorWorkspaceSnapshot> {
  present: T;
  past: readonly T[];
  future: readonly T[];
}

export const createWorkspaceHistory = <T extends EditorWorkspaceSnapshot>(snapshot: T): EditorWorkspaceHistory<T> => ({
  present: structuredClone(snapshot), past: [], future: [],
});

export const commitWorkspaceSnapshot = <T extends EditorWorkspaceSnapshot>(
  history: EditorWorkspaceHistory<T>,
  next: T,
): EditorWorkspaceHistory<T> => {
  if (serializeCanonicalJson(history.present) === serializeCanonicalJson(next)) return history;
  return {
    present: structuredClone(next),
    past: [...history.past, structuredClone(history.present)].slice(-DEFAULT_HISTORY_LIMIT),
    future: [],
  };
};

export const undoWorkspaceHistory = <T extends EditorWorkspaceSnapshot>(history: EditorWorkspaceHistory<T>): EditorWorkspaceHistory<T> => {
  const previous = history.past.at(-1);
  return previous ? {
    present: structuredClone(previous),
    past: history.past.slice(0, -1),
    future: [structuredClone(history.present), ...history.future],
  } : history;
};

export const redoWorkspaceHistory = <T extends EditorWorkspaceSnapshot>(history: EditorWorkspaceHistory<T>): EditorWorkspaceHistory<T> => {
  const next = history.future[0];
  return next ? {
    present: structuredClone(next),
    past: [...history.past, structuredClone(history.present)].slice(-DEFAULT_HISTORY_LIMIT),
    future: history.future.slice(1),
  } : history;
};
