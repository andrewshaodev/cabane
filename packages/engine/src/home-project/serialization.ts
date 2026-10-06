import type { HomeProject } from "./types";
import { parseHomeProjectSchema, type HomeProjectIssue } from "./validation";

export type HomeProjectParseResult =
  | { valid: true; project: HomeProject }
  | { valid: false; raw: string; issues: readonly HomeProjectIssue[] };

const sortJson = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(sortJson);
  if (value === null || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
      .map(([key, entry]) => [key, sortJson(entry)]),
  );
};

/** Serializes pure JSON with recursively sorted object keys and stable arrays. */
export const serializeCanonicalJson = (value: unknown): string =>
  `${JSON.stringify(sortJson(value), null, 2)}\n`;

export const serializeHomeProject = (project: HomeProject): string =>
  serializeCanonicalJson(project);

export const parseHomeProject = (raw: string): HomeProjectParseResult => {
  let input: unknown;
  try {
    input = JSON.parse(raw);
  } catch {
    return {
      valid: false,
      raw,
      issues: [
        {
          code: "project.json",
          path: "$",
          message: "The project is not valid JSON.",
          severity: "error",
        },
      ],
    };
  }

  const result = parseHomeProjectSchema(input);
  return result.valid
    ? { valid: true, project: result.project }
    : { valid: false, raw, issues: result.issues };
};
