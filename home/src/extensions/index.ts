import { defineHomeExtensionRegistry } from "@cabane/engine";
import { stableFurnishingRegistry } from "@cabane/catalog/furnishing";
import { equippedKitchenModel, kitchenCabinetLightingModel } from "./kitchen";

/** Two code-defined examples; every other item resolves through catalog presets. */
export const homeExtensions = defineHomeExtensionRegistry({
  furnishingModels: { ...stableFurnishingRegistry, "equipped-kitchen": equippedKitchenModel },
  deviceModels: { "kitchen-cabinet-lighting": kitchenCabinetLightingModel },
  roomFurnishings: {},
  openingModels: {},
});
