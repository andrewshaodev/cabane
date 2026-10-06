import { validateStairs } from "./stairs/stair-validation";
import type { HomeManifest, LegacyHomeManifest, ManifestValidationResult } from "./types";
import { migrateLegacyManifest } from "./building/manifest-migration";
import {
  createValidationContext,
  isObject,
  issue,
  type HomeManifestValidationOptions,
} from "./validation/core";
import { validateManifestRules } from "./validation/manifest-rules";

export type { HomeManifestValidationOptions } from "./validation/core";

export const defineHomeManifest = (manifest: HomeManifest | LegacyHomeManifest): HomeManifest =>
  manifest.schemaVersion === 1 ? migrateLegacyManifest(manifest) : manifest;

export const validateHomeManifest = (
  input: unknown,
  options: HomeManifestValidationOptions = {},
): ManifestValidationResult => {
  if (!isObject(input)) {
    return {
      issues: [issue("manifest.type", "$", "The home manifest must be an object.")],
      canRender: false,
    };
  }

  const context = createValidationContext(input, options);
  const issues = [...validateManifestRules(input, context)].sort(
    (left, right) => left.path.localeCompare(right.path) || left.code.localeCompare(right.code),
  );
  if (input.schemaVersion === 2 && !issues.some((candidate) => candidate.severity === "fatal")) {
    try {
      issues.push(...validateStairs(input as unknown as HomeManifest, options));
    } catch {
      issues.push(
        issue(
          "building.stairs",
          "stairs",
          "Stairs must define valid adjacent floors, a start point, width, run, and rotation.",
        ),
      );
    }
  }
  issues.sort(
    (left, right) => left.path.localeCompare(right.path) || left.code.localeCompare(right.code),
  );
  const canRender = !issues.some((candidate) => candidate.severity === "fatal");
  return {
    manifest: canRender
      ? input.schemaVersion === 1
        ? migrateLegacyManifest(input as unknown as LegacyHomeManifest)
        : (input as unknown as HomeManifest)
      : undefined,
    issues,
    canRender,
  };
};

export const assertValidHomeManifest = (
  input: unknown,
  options: HomeManifestValidationOptions = {},
): HomeManifest => {
  const result = validateHomeManifest(input, options);
  if (!result.canRender || !result.manifest) {
    throw new Error(
      result.issues.map((candidate) => `${candidate.path}: ${candidate.message}`).join("\n"),
    );
  }
  return result.manifest;
};
