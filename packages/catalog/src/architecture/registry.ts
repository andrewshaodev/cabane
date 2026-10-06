import { defineArchitectureModelRegistry } from "@cabane/engine";
import { DoorModel, PassageModel, WindowModel } from "./presets/openings";

export const stableArchitectureModelRegistry = defineArchitectureModelRegistry({
  door: DoorModel,
  window: WindowModel,
  passage: PassageModel,
});
