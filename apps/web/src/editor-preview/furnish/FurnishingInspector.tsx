import type {
  DeviceModelRegistry,
  EntityBindingSlotSpec,
  FloorSpec,
  FurnishingModelRegistry,
  ItemPlacement,
  SceneItemSpec,
  SceneItemSize,
  SceneModelEditorDescriptor,
} from "@cabane/engine";
import { FurnishingProperties } from "./FurnishingProperties";
import { missingModelEditorDescriptor } from "./missing-model";

export interface FurnishingInspectorProps {
  floor?: FloorSpec;
  onWindowFit?: (
    id: string,
    placement: ItemPlacement,
    size: SceneItemSize,
    definition: SceneModelEditorDescriptor,
  ) => void;
  items: readonly SceneItemSpec[];
  selectedId: string | null;
  furnishingModels: FurnishingModelRegistry;
  deviceModels: DeviceModelRegistry;
  onPlacementChange: (id: string, placement: ItemPlacement) => void;
  onSizeChange: (id: string, size: SceneItemSize, definition: SceneModelEditorDescriptor) => void;
  onColorChange?: (
    id: string,
    color: string | null,
    definition: SceneModelEditorDescriptor,
  ) => void;
  onVariantChange?: (id: string, variant: string, definition: SceneModelEditorDescriptor) => void;
  onEntitySlotsChange?: ((id: string, slots: readonly EntityBindingSlotSpec[]) => void) | undefined;
  onLightStateChange?: (
    id: string,
    lightState: "always-off" | "always-on" | "night-only" | "connected",
  ) => void;
  onClose: () => void;
}

export function FurnishingInspector({
  items,
  selectedId,
  furnishingModels,
  deviceModels,
  floor,
  onWindowFit,
  onPlacementChange,
  onSizeChange,
  onLightStateChange,
  onEntitySlotsChange,
  onVariantChange,
  onColorChange,
  onClose,
}: FurnishingInspectorProps) {
  const selected = items.find((item) => item.id === selectedId);
  const definition = selected
    ? ((selected.kind === "device" ? deviceModels : furnishingModels)[selected.modelId] ??
      missingModelEditorDescriptor(selected))
    : undefined;
  return selected && definition ? (
    <FurnishingProperties
      selected={selected}
      definition={definition}
      floor={floor}
      onWindowFit={onWindowFit}
      onLightStateChange={onLightStateChange}
      onEntitySlotsChange={onEntitySlotsChange}
      onVariantChange={onVariantChange}
      onColorChange={onColorChange}
      onPlacementChange={onPlacementChange}
      onSizeChange={onSizeChange}
      onClose={onClose}
    />
  ) : null;
}
