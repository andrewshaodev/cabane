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
  { valid: true; project: HomeProject } | { valid: false; issues: readonly HomeProjectIssue[] };

export type JsonRecord = Record<string, unknown>;

export const isPlainRecord = (value: unknown): value is JsonRecord => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

export const addProjectIssue = (
  issues: HomeProjectIssue[],
  code: string,
  path: string,
  message: string,
) => issues.push({ code, path, message, severity: "error" });

export const addProjectWarning = (
  issues: HomeProjectIssue[],
  code: string,
  path: string,
  message: string,
) => issues.push({ code, path, message, severity: "warning" });

export const sortProjectIssues = (issues: HomeProjectIssue[]) =>
  issues.sort(
    (left, right) =>
      left.path.localeCompare(right.path) ||
      left.code.localeCompare(right.code) ||
      left.message.localeCompare(right.message),
  );

/**
 * Checks a stair's optional solidBelowRunMeters (the length of solid fill under a straight stair's first steps) and returns the
 * extra keys that stair may carry: it must be a positive number on a straight stair.
 */
export const fillRun = (
  stair: JsonRecord,
  shape: unknown,
  path: string,
  issues: HomeProjectIssue[],
): string[] => {
  const length = stair.solidBelowRunMeters;
  if (
    length !== undefined &&
    (shape !== "straight" || typeof length !== "number" || !Number.isFinite(length) || length <= 0)
  )
    addProjectIssue(
      issues,
      "stair.solid-below",
      `${path}.solidBelowRunMeters`,
      "Fill length must be a positive number on a straight stair.",
    );
  return shape === "straight" ? ["solidBelowRunMeters"] : [];
};
