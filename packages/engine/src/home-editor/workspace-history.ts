import { serializeCanonicalJson, type HomeProject, type WorkspaceBindings } from "../home-project";
import { DEFAULT_HISTORY_LIMIT } from "./history";

export interface EditorWorkspaceSnapshot {
  project: HomeProject;
  bindings: WorkspaceBindings;
}

export interface EditorWorkspaceHistory {
  present: EditorWorkspaceSnapshot;
  past: readonly EditorWorkspaceSnapshot[];
  future: readonly EditorWorkspaceSnapshot[];
}

export const createWorkspaceHistory = (snapshot: EditorWorkspaceSnapshot): EditorWorkspaceHistory => ({
  present: structuredClone(snapshot), past: [], future: [],
});

export const commitWorkspaceSnapshot = (
  history: EditorWorkspaceHistory,
  next: EditorWorkspaceSnapshot,
): EditorWorkspaceHistory => {
  if (serializeCanonicalJson(history.present) === serializeCanonicalJson(next)) return history;
  return {
    present: structuredClone(next),
    past: [...history.past, structuredClone(history.present)].slice(-DEFAULT_HISTORY_LIMIT),
    future: [],
  };
};

export const undoWorkspaceHistory = (history: EditorWorkspaceHistory): EditorWorkspaceHistory => {
  const previous = history.past.at(-1);
  return previous ? {
    present: structuredClone(previous),
    past: history.past.slice(0, -1),
    future: [structuredClone(history.present), ...history.future],
  } : history;
};

export const redoWorkspaceHistory = (history: EditorWorkspaceHistory): EditorWorkspaceHistory => {
  const next = history.future[0];
  return next ? {
    present: structuredClone(next),
    past: [...history.past, structuredClone(history.present)].slice(-DEFAULT_HISTORY_LIMIT),
    future: history.future.slice(1),
  } : history;
};
