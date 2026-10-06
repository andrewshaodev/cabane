import type {
  FurnishingModelDefinition,
  FurnishingModelRegistry,
} from "../types";

export const defineFurnishingModel = <T extends FurnishingModelDefinition>(
  definition: T,
): T => definition;

export const defineFurnishingModelRegistry = <T extends FurnishingModelRegistry>(
  registry: T,
): T => registry;
