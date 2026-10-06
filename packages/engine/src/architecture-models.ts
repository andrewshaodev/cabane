import type { ArchitectureModelRegistry, ManifestIssue } from "./types";

export const defineArchitectureModelRegistry = <T extends ArchitectureModelRegistry>(registry: T) =>
  registry;

const requiredKinds = ["door", "window", "passage"] as const;

export const validateArchitectureModelRegistry = (
  registry: Partial<ArchitectureModelRegistry>,
): readonly ManifestIssue[] =>
  requiredKinds.flatMap((kind) =>
    Object.hasOwn(registry, kind) && typeof registry[kind] === "function"
      ? []
      : [
          {
            code: "architecture.model-registry",
            severity: "fatal" as const,
            path: `architectureModels.${kind}`,
            message: `The stable ${kind} architecture model is missing.`,
          },
        ],
  );
