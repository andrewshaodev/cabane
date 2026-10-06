import type { HomeProject } from "../home-project";

export type HomeEditorDomain = "construct" | "furnish" | "project";

export interface ProjectValuePatch {
  path: readonly (string | number)[];
  value: unknown;
}

export interface ProjectCommand {
  id: string;
  label: string;
  domain: HomeEditorDomain;
  before: readonly ProjectValuePatch[];
  after: readonly ProjectValuePatch[];
}

export interface ProjectHistory {
  present: HomeProject;
  undo: readonly ProjectCommand[];
  redo: readonly ProjectCommand[];
  limit: number;
}
