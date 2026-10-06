import {
  addProjectIssue,
  isPlainRecord,
  type HomeProjectIssue,
  type JsonRecord,
} from "./validation-types";
export const keys = (
  value: JsonRecord,
  allowed: readonly string[],
  path: string,
  issues: HomeProjectIssue[],
) => {
  const accepted = new Set(allowed);
  for (const key of Object.keys(value)) {
    if (!accepted.has(key)) {
      addProjectIssue(
        issues,
        "project.unknown-key",
        path === "$" ? key : `${path}.${key}`,
        `Property “${key}” is not part of the HomeProject schema.`,
      );
    }
  }
};

export const record = (value: unknown, path: string, issues: HomeProjectIssue[]) => {
  if (isPlainRecord(value)) return value;
  addProjectIssue(issues, "project.object", path, "Expected a plain JSON object.");
  return null;
};

export const array = (value: unknown, path: string, issues: HomeProjectIssue[]) => {
  if (Array.isArray(value)) return value as unknown[];
  addProjectIssue(issues, "project.array", path, "Expected an array.");
  return null;
};

export const string = (value: unknown, path: string, issues: HomeProjectIssue[]) => {
  if (typeof value === "string" && value.trim().length > 0) return;
  addProjectIssue(issues, "project.string", path, "Expected a non-empty string.");
};
