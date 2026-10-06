import {
  addProjectIssue,
  isPlainRecord,
  type HomeProjectIssue,
} from "./validation-types";

const FORBIDDEN_KEYS = new Set(["entity_id", "area_id", "access_token"]);
const ARRAY_INDEX = /^(0|[1-9]\d*)$/;

const scanObjectDescriptors = (
  value: object,
  path: string,
  issues: HomeProjectIssue[],
  ancestors: Set<object>,
) => {
  const array = Array.isArray(value);
  const expectedPrototype = array ? Array.prototype : Object.prototype;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== expectedPrototype && !(prototype === null && !array)) {
    addProjectIssue(
      issues,
      "project.non-json-object",
      path,
      "Projects may contain only plain JSON objects and arrays.",
    );
    return;
  }
  if (ancestors.has(value)) {
    addProjectIssue(issues, "project.circular", path, "Projects cannot contain circular references.");
    return;
  }
  ancestors.add(value);
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const symbolKeys = Object.getOwnPropertySymbols(value);
  if (symbolKeys.length > 0) {
    addProjectIssue(
      issues,
      "project.non-json-key",
      path,
      "Projects cannot contain symbol-keyed properties.",
    );
  }

  if (array) {
    const length = (value as unknown[]).length;
    for (const key of Object.keys(descriptors)) {
      if (key === "length") continue;
      const descriptor = descriptors[key];
      const index = ARRAY_INDEX.test(key) ? Number(key) : -1;
      const childPath = index >= 0 ? `${path}[${index}]` : `${path}.${key}`;
      if (index < 0 || index >= length) {
        addProjectIssue(
          issues,
          "project.non-json-key",
          childPath,
          "Arrays cannot contain non-index properties.",
        );
        continue;
      }
      if (!("value" in descriptor) || !descriptor.enumerable) {
        addProjectIssue(
          issues,
          "project.non-json-property",
          childPath,
          "Projects cannot contain accessors or hidden properties.",
        );
        continue;
      }
      scanPureJsonValue(descriptor.value, childPath, issues, ancestors);
    }
    for (let index = 0; index < length; index += 1) {
      if (!Object.hasOwn(descriptors, String(index))) {
        addProjectIssue(
          issues,
          "project.non-json-value",
          `${path}[${index}]`,
          "Projects cannot contain sparse array entries.",
        );
      }
    }
  } else {
    for (const key of Object.keys(descriptors)) {
      const descriptor = descriptors[key];
      const childPath = path === "$" ? key : `${path}.${key}`;
      if (FORBIDDEN_KEYS.has(key)) {
        addProjectIssue(
          issues,
          "project.forbidden-key",
          childPath,
          `Household Home Assistant key “${key}” cannot be persisted in a project.`,
        );
      }
      if (!("value" in descriptor) || !descriptor.enumerable) {
        addProjectIssue(
          issues,
          "project.non-json-property",
          childPath,
          "Projects cannot contain accessors or hidden properties.",
        );
        continue;
      }
      scanPureJsonValue(descriptor.value, childPath, issues, ancestors);
    }
  }
  ancestors.delete(value);
};

export const scanPureJsonValue = (
  value: unknown,
  path: string,
  issues: HomeProjectIssue[],
  ancestors: Set<object> = new Set(),
): void => {
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      addProjectIssue(issues, "project.number", path, "Project numbers must be finite.");
    }
    return;
  }
  if (typeof value !== "object") {
    addProjectIssue(
      issues,
      "project.non-json-value",
      path,
      "Projects may contain only JSON values.",
    );
    return;
  }
  if (!Array.isArray(value) && !isPlainRecord(value)) {
    addProjectIssue(
      issues,
      "project.non-json-object",
      path,
      "Projects may contain only plain JSON objects and arrays.",
    );
    return;
  }
  scanObjectDescriptors(value, path, issues, ancestors);
};
