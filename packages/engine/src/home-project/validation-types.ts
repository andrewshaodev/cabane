import type { HomeProject } from "./types";

export interface HomeProjectIssue {
  code: string;
  path: string;
  message: string;
  severity: "error" | "warning";
}

export type HomeProjectValidationResult =
  | { valid: true; project: HomeProject; issues: readonly HomeProjectIssue[] }
  | { valid: false; issues: readonly HomeProjectIssue[] };

export type HomeProjectSchemaResult =
  | { valid: true; project: HomeProject }
  | { valid: false; issues: readonly HomeProjectIssue[] };

export type JsonRecord = Record<string, unknown>;

export const isPlainRecord = (value: unknown): value is JsonRecord => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

export const addProjectIssue = (
  issues: HomeProjectIssue[],
  code: string,
  path: string,
  message: string,
) => issues.push({ code, path, message, severity: "error" });

export const sortProjectIssues = (issues: HomeProjectIssue[]) => issues.sort((left, right) =>
  left.path.localeCompare(right.path) || left.code.localeCompare(right.code) ||
  left.message.localeCompare(right.message)
);
