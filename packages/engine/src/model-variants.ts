import type { SceneModelEditorDescriptor, SceneModelVariant } from "./types";

const DEFAULT_VARIANTS: readonly SceneModelVariant[] = [{ id: "default", label: "Default" }];

/** Omitted metadata represents a single standard variant; the first is the default. */
export const modelVariants = (
  definition: SceneModelEditorDescriptor,
): readonly SceneModelVariant[] =>
  definition.variants?.length ? definition.variants : DEFAULT_VARIANTS;

export const resolveModelVariant = (
  definition: SceneModelEditorDescriptor,
  variant?: string,
): SceneModelVariant => {
  const variants = modelVariants(definition);
  return variants.find((candidate) => candidate.id === variant) ?? variants[0];
};
