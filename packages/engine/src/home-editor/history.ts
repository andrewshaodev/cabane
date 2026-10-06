import type { HomeProject } from "../home-project";
import type {
  ProjectCommand,
  ProjectHistory,
  ProjectValuePatch,
} from "./types";

export const DEFAULT_HISTORY_LIMIT = 100;
const UNSAFE_PATH_PARTS = new Set(["__proto__", "constructor", "prototype"]);

type ProjectContainer = Record<string, unknown> | unknown[];

const isContainer = (value: unknown): value is ProjectContainer =>
  Array.isArray(value) || (typeof value === "object" && value !== null);

const isSafePathPart = (part: string | number): boolean =>
  typeof part === "number"
    ? Number.isSafeInteger(part) && part >= 0
    : part.length > 0 && !UNSAFE_PATH_PARTS.has(part);

const pathKey = (path: readonly (string | number)[]): string =>
  JSON.stringify(path);

const pathsOverlap = (
  left: readonly (string | number)[],
  right: readonly (string | number)[],
): boolean => {
  const sharedLength = Math.min(left.length, right.length);
  for (let index = 0; index < sharedLength; index += 1) {
    if (left[index] !== right[index]) return false;
  }
  return true;
};

const jsonValueEqual = (left: unknown, right: unknown): boolean => {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left)
      && Array.isArray(right)
      && left.length === right.length
      && left.every((entry, index) => jsonValueEqual(entry, right[index]));
  }
  if (!isContainer(left) || !isContainer(right)) return false;

  const leftRecord = left as Record<string, unknown>;
  const rightRecord = right as Record<string, unknown>;
  const leftKeys = Object.keys(leftRecord);
  const rightKeys = Object.keys(rightRecord);
  return leftKeys.length === rightKeys.length
    && leftKeys.every((key) =>
      Object.prototype.hasOwnProperty.call(rightRecord, key)
      && jsonValueEqual(leftRecord[key], rightRecord[key])
    );
};

const assertPatchPaths = (
  patches: readonly ProjectValuePatch[],
  side: "before" | "after",
): void => {
  const seen = new Set<string>();
  for (const patch of patches) {
    if (patch.path.length === 0) {
      throw new Error(`Project command ${side} paths must not be empty.`);
    }
    if (!patch.path.every(isSafePathPart)) {
      throw new Error(`Project command ${side} contains an invalid path.`);
    }
    const key = pathKey(patch.path);
    if (seen.has(key)) {
      throw new Error(`Project command ${side} contains duplicate path ${key}.`);
    }
    seen.add(key);
  }

  for (let leftIndex = 0; leftIndex < patches.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < patches.length; rightIndex += 1) {
      if (pathsOverlap(patches[leftIndex].path, patches[rightIndex].path)) {
        throw new Error(
          `Project command ${side} contains overlapping paths ${pathKey(patches[leftIndex].path)} and ${pathKey(patches[rightIndex].path)}.`,
        );
      }
    }
  }
};

const assertCommand = (command: ProjectCommand): void => {
  if (!command.id.trim()) throw new Error("Project command id must not be empty.");
  if (!command.label.trim()) throw new Error("Project command label must not be empty.");
  if (!(["construct", "furnish", "project"] as const).includes(command.domain)) {
    throw new Error(`Unsupported project command domain “${String(command.domain)}”.`);
  }
  if (command.before.length === 0 || command.after.length === 0) {
    throw new Error("Project commands require at least one reversible patch.");
  }
  assertPatchPaths(command.before, "before");
  assertPatchPaths(command.after, "after");

  const beforePaths = new Set(command.before.map((patch) => pathKey(patch.path)));
  const afterPaths = new Set(command.after.map((patch) => pathKey(patch.path)));
  if (
    beforePaths.size !== afterPaths.size
    || [...beforePaths].some((path) => !afterPaths.has(path))
  ) {
    throw new Error("Project command before and after patches must target the same paths.");
  }
};

const valueAtPath = (
  project: HomeProject,
  path: readonly (string | number)[],
): unknown => {
  let value: unknown = project;
  for (const part of path) {
    if (!isContainer(value)) {
      throw new Error(`Project command path ${pathKey(path)} does not resolve to a project value.`);
    }
    if (Array.isArray(value)) {
      if (typeof part !== "number" || part >= value.length) {
        throw new Error(`Project command path ${pathKey(path)} contains an invalid array index.`);
      }
      value = value[part];
    } else {
      value = value[part];
    }
  }
  return value;
};

const setAtPath = (
  value: unknown,
  path: readonly (string | number)[],
  depth: number,
  replacement: unknown,
): unknown => {
  if (!isContainer(value)) {
    throw new Error(`Project command path ${pathKey(path)} does not resolve to a project container.`);
  }

  const part = path[depth];
  const isLeaf = depth === path.length - 1;
  if (Array.isArray(value)) {
    if (typeof part !== "number" || part >= value.length) {
      throw new Error(`Project command path ${pathKey(path)} contains an invalid array index.`);
    }
    const next = value.slice();
    next[part] = isLeaf
      ? replacement
      : setAtPath(value[part], path, depth + 1, replacement);
    return next;
  }

  if (typeof part !== "string") {
    throw new Error(`Project command path ${pathKey(path)} uses a numeric key on an object.`);
  }
  const next = { ...value };
  if (isLeaf) {
    if (replacement === undefined) delete next[part];
    else next[part] = replacement;
  } else {
    next[part] = setAtPath(value[part], path, depth + 1, replacement);
  }
  return next;
};

const assertExpectedValues = (
  project: HomeProject,
  patches: readonly ProjectValuePatch[],
  action: string,
): void => {
  for (const patch of patches) {
    if (!jsonValueEqual(valueAtPath(project, patch.path), patch.value)) {
      throw new Error(
        `Cannot ${action}: project value at ${pathKey(patch.path)} does not match the command.`,
      );
    }
  }
};

export const applyProjectValuePatches = (
  project: HomeProject,
  patches: readonly ProjectValuePatch[],
): HomeProject => {
  assertPatchPaths(patches, "after");
  return patches.reduce<HomeProject>(
    (next, patch) => setAtPath(next, patch.path, 0, patch.value) as HomeProject,
    project,
  );
};

export const createProjectHistory = (
  project: HomeProject,
  limit = DEFAULT_HISTORY_LIMIT,
): ProjectHistory => {
  if (!Number.isSafeInteger(limit) || limit < 1) {
    throw new Error("Project history limit must be a positive integer.");
  }
  return { present: project, undo: [], redo: [], limit };
};

export const commitProjectCommand = (
  history: ProjectHistory,
  command: ProjectCommand,
): ProjectHistory => {
  assertCommand(command);
  assertExpectedValues(history.present, command.before, "commit project command");

  const beforeByPath = new Map(
    command.before.map((patch) => [pathKey(patch.path), patch.value]),
  );
  const isNoop = command.after.every((patch) =>
    jsonValueEqual(beforeByPath.get(pathKey(patch.path)), patch.value)
  );
  if (isNoop) return history;

  const present = applyProjectValuePatches(history.present, command.after);
  return {
    present,
    undo: [...history.undo, command].slice(-history.limit),
    redo: [],
    limit: history.limit,
  };
};

export const undoProjectHistory = (history: ProjectHistory): ProjectHistory => {
  const command = history.undo.at(-1);
  if (!command) return history;
  assertCommand(command);
  assertExpectedValues(history.present, command.after, "undo project command");

  return {
    present: applyProjectValuePatches(history.present, command.before),
    undo: history.undo.slice(0, -1),
    redo: [command, ...history.redo],
    limit: history.limit,
  };
};

export const redoProjectHistory = (history: ProjectHistory): ProjectHistory => {
  const command = history.redo[0];
  if (!command) return history;
  assertCommand(command);
  assertExpectedValues(history.present, command.before, "redo project command");

  return {
    present: applyProjectValuePatches(history.present, command.after),
    undo: [...history.undo, command].slice(-history.limit),
    redo: history.redo.slice(1),
    limit: history.limit,
  };
};
