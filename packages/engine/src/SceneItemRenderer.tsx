import { resolveModelVariant } from "./model-variants";
import { memo, useContext, useEffect, useRef, useState } from "react";
import { SceneNightContext, sceneLightState } from "./scene-light-state";
import { deviceVisualStateForSnapshot } from "./devices";
import {
  deviceSlotForItem,
  resolveItemTransform,
  type ResolvedItemTransform,
  type SceneItemSpec,
} from "./home-project";
import { DeviceHoverContext, Outlines, ToonMaterial } from "./rendering";
import type {
  DeviceLiveMedia,
  DeviceModelDefinition,
  DeviceModelRegistry,
  EntityId,
  EntityStateSnapshot,
  ExtensionInteractionTarget,
  FloorSpec,
  FurnishingModelRegistry,
  FurnishingModelDefinition,
  SceneModelProps,
  ResolvedDeviceBinding,
} from "./types";

const deviceSceneItemScaleForSize = (
  size: readonly [number, number, number],
  definition: DeviceModelDefinition,
): readonly [number, number, number] | null => {
  if (size.some((dimension) => !Number.isFinite(dimension) || dimension <= 0)) return null;
  const sizeRatios = size.map((dimension, axis) => dimension / definition.defaultSize[axis]);
  const same = (left: number, right: number) => Math.abs(left - right) <= 1e-6;
  const policy = definition.resizePolicy;
  if (policy.kind === "fixed" && size.some((dimension, axis) =>
    !same(dimension, definition.defaultSize[axis])
  )) return null;
  if (policy.kind === "uniform" && sizeRatios.some((ratio) =>
    !same(ratio, sizeRatios[0])
  )) return null;
  if (policy.kind === "planar" && !same(size[1], definition.defaultSize[1])) return null;
  if (policy.kind === "axes") {
    const allowed = new Set(policy.axes);
    const axisNames = ["width", "height", "depth"] as const;
    if (size.some((dimension, axis) =>
      !allowed.has(axisNames[axis]) && !same(dimension, definition.defaultSize[axis])
    )) return null;
  }
  if (policy.kind === "custom") {
    const normalized = policy.normalize(definition.defaultSize, size);
    if (normalized.some((dimension, axis) => !same(dimension, size[axis]))) return null;
  }
  const extents = definition.bounds.max.map(
    (maximum, axis) => maximum - definition.bounds.min[axis],
  );
  if (extents.some((extent) => !Number.isFinite(extent) || extent <= 0)) return null;
  const scale = size.map((dimension, axis) => dimension / extents[axis]);
  return scale.every((value) => Number.isFinite(value) && value > 0)
    ? scale as [number, number, number]
    : null;
};

function DeviceSceneItem({
  item,
  transform,
  definition,
  resolvedDevice,
  reducedMotion,
  walkMode,
  onInteract,
  liveMediaByEntityId,
  groupName,
}: {
  item: Extract<SceneItemSpec, { kind: "device" }>;
  transform: ResolvedItemTransform;
  definition: DeviceModelDefinition;
  resolvedDevice: ResolvedDeviceBinding;
  reducedMotion: boolean;
  walkMode: boolean;
  onInteract: (target: ExtensionInteractionTarget) => void;
  liveMediaByEntityId: Readonly<Partial<Record<EntityId, DeviceLiveMedia>>>;
  groupName: string;
}) {
  const scale = deviceSceneItemScaleForSize(item.size, definition);
  const press = useRef<{ pointerId: number; x: number; y: number } | null>(null);
  const [hovered, setHovered] = useState(false);
  const nightLighting = useContext(SceneNightContext);

  useEffect(() => {
    if (!hovered || typeof document === "undefined") return;
    const previousCursor = document.body.style.cursor;
    document.body.style.cursor = "pointer";
    return () => { document.body.style.cursor = previousCursor; };
  }, [hovered]);

  const renderable = scale !== null;
  useEffect(() => {
    if (!walkMode && renderable) return;
    press.current = null;
    setHovered(false);
  }, [renderable, walkMode]);

  if (scale === null) return null;
  const Component = definition.component;
  const binding = resolvedDevice.slot;
  const primarySlot = binding.entitySlots.find((slot) => slot.deviceRole === "primary");
  const primary = resolvedDevice.entities.find((entity) => entity.slotId === primarySlot?.id);
  const state = sceneLightState(item.lightState, primary?.state, nightLighting);
  const visualState = deviceVisualStateForSnapshot(state);
  const walkInteractionTarget = {
    id: item.id,
    label: primarySlot?.presentation.label ?? item.id,
    slotId: primarySlot?.id,
  } satisfies ExtensionInteractionTarget;
  const interactionTarget = {
    ...walkInteractionTarget,
    ...(definition.interaction.target === "camera-viewer"
      && (!primary || primary.entityId.startsWith("camera."))
      ? { intent: definition.interaction.target }
      : {}),
  } satisfies ExtensionInteractionTarget;
  const interact = () => onInteract(interactionTarget);

  return (
    <group
      name={groupName}
      position={transform.position}
      rotation={[0, transform.rotationYRadians, 0]}
      scale={scale}
      userData={{
        deviceBindingId: item.id,
        deviceModel: item.modelId,
        visualState,
        walkDeviceInteraction: walkInteractionTarget,
      }}
      onPointerOver={walkMode ? undefined : (event) => {
        event.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={walkMode ? undefined : (event) => {
        event.stopPropagation();
        setHovered(false);
      }}
      onPointerDown={walkMode ? undefined : (event) => {
        event.stopPropagation();
        press.current = {
          pointerId: event.pointerId,
          x: event.nativeEvent.clientX,
          y: event.nativeEvent.clientY,
        };
      }}
      onPointerMove={walkMode ? undefined : (event) => {
        const candidate = press.current;
        if (!candidate || candidate.pointerId !== event.pointerId) return;
        if (Math.hypot(
          event.nativeEvent.clientX - candidate.x,
          event.nativeEvent.clientY - candidate.y,
        ) > definition.interaction.tapTolerancePixels) press.current = null;
      }}
      onPointerUp={walkMode ? undefined : (event) => {
        event.stopPropagation();
        const candidate = press.current;
        press.current = null;
        if (candidate?.pointerId === event.pointerId) interact();
      }}
      onPointerCancel={walkMode ? undefined : () => { press.current = null; }}
    >
      <DeviceHoverContext.Provider value={hovered}>
        <Component
          variant={resolveModelVariant(definition, item.variant).id}
          slot={binding}
          state={state}
          liveMedia={primary ? liveMediaByEntityId[primary.entityId] : undefined}
          visualState={visualState}
          reducedMotion={reducedMotion}
          walkMode={walkMode}
          onInteract={onInteract}
        />
      </DeviceHoverContext.Provider>
    </group>
  );
}

const FurnishingContent = memo(function FurnishingContent({ component: Component, ...props }: SceneModelProps & {
  component: FurnishingModelDefinition["component"];
}) {
  return <Component {...props} />;
});

function MissingFurnishingFallback({ item }: {
  item: Extract<SceneItemSpec, { kind: "furnishing" }>;
}) {
  const y = item.placement.kind === "ceiling"
    ? -item.size[1] / 2
    : item.placement.kind === "wall" ? 0 : item.size[1] / 2;
  return (
    <mesh
      name={`missing-furnishing-model-${item.id}`}
      position={[0, y, 0]}
      userData={{ missingModelId: item.modelId }}
    >
      <boxGeometry args={item.size} />
      <ToonMaterial color="#d9a36a" transparent opacity={.72} />
      <Outlines color="#6f4b2f" thickness={.006} screenspace={false} />
    </mesh>
  );
}

export const SceneItemRenderer = memo(function SceneItemRenderer({
  item,
  floor,
  furnishingModels,
  deviceModels,
  resolvedDevice,
  entityStatesBySlotId,
  reducedMotion,
  walkMode,
  onInteract,
  liveMediaByEntityId,
}: {
  item: SceneItemSpec;
  floor: FloorSpec;
  furnishingModels: FurnishingModelRegistry;
  deviceModels: DeviceModelRegistry;
  resolvedDevice?: ResolvedDeviceBinding;
  entityStatesBySlotId: Readonly<Record<string, EntityStateSnapshot>>;
  reducedMotion: boolean;
  walkMode: boolean;
  onInteract: (target: ExtensionInteractionTarget) => void;
  liveMediaByEntityId: Readonly<Partial<Record<EntityId, DeviceLiveMedia>>>;
  outlineColor?: string;
}) {
  const transform = resolveItemTransform(item.placement, floor);
  if (item.kind === "furnishing") {
    const definition = Object.hasOwn(furnishingModels, item.modelId)
      ? furnishingModels[item.modelId]
      : undefined;
    return (
      <group
        name={`scene-item-${item.id}`}
        position={transform.position}
        rotation={[0, transform.rotationYRadians, 0]}
      >
        {definition ? (
          <FurnishingContent component={definition.component}
            variant={resolveModelVariant(definition, item.variant).id}
            size={item.size}
            entityStatesBySlotId={entityStatesBySlotId}
            reducedMotion={reducedMotion}
            walkMode={walkMode}
            onInteract={onInteract}
          />
        ) : <MissingFurnishingFallback item={item} />}
      </group>
    );
  }

  const definition = Object.hasOwn(deviceModels, item.modelId)
    ? deviceModels[item.modelId]
    : undefined;
  if (!definition) return null;
  // Roomless items (for example outdoor lights) have no room-scoped binding.
  // Their geometry still exists; absence of live state means disconnected.
  const binding = resolvedDevice ?? {
    slot: deviceSlotForItem(item, floor),
    entities: [],
    issues: [],
  };
  // The resolved slot is the runtime source of entity states, while the item
  // remains the source of placement and sizing. A mismatched ID is unsafe.
  if (
    binding.slot.id !== item.id ||
    binding.slot.model !== item.modelId
  ) return null;
  return (
    <DeviceSceneItem
      item={item}
      transform={transform}
      definition={definition}
      resolvedDevice={binding}
      reducedMotion={reducedMotion}
      walkMode={walkMode}
      onInteract={onInteract}
      liveMediaByEntityId={liveMediaByEntityId}
      groupName={`scene-item-${item.id}`}
    />
  );
});

/** @internal Transitional adapter for manifests whose sceneItems are empty. */
export function LegacyDeviceItemRenderer({
  resolvedDevice,
  floor,
  definition,
  reducedMotion,
  walkMode,
  onInteract,
  liveMediaByEntityId,
}: {
  resolvedDevice: ResolvedDeviceBinding;
  floor: FloorSpec;
  definition: DeviceModelDefinition;
  reducedMotion: boolean;
  walkMode: boolean;
  onInteract: (target: ExtensionInteractionTarget) => void;
  liveMediaByEntityId: Readonly<Partial<Record<EntityId, DeviceLiveMedia>>>;
  outlineColor?: string;
}) {
  const scale = resolvedDevice.slot.placement.scale ?? 1;
  const item: Extract<SceneItemSpec, { kind: "device" }> = {
    id: resolvedDevice.slot.id,
    floorId: floor.id,
    kind: "device",
    modelId: resolvedDevice.slot.model,
    placement: {
      kind: "absolute",
      at: resolvedDevice.slot.placement.at,
      elevationMeters: resolvedDevice.slot.placement.elevationMeters,
      rotationYRadians: resolvedDevice.slot.placement.rotationYRadians ?? 0,
    },
    size: definition.defaultSize.map(
      (dimension) => dimension * scale,
    ) as [number, number, number],
    entitySlots: resolvedDevice.slot.entitySlots,
  };
  return (
    <DeviceSceneItem
      item={item}
      transform={resolveItemTransform(item.placement, floor)}
      definition={definition}
      resolvedDevice={resolvedDevice}
      reducedMotion={reducedMotion}
      walkMode={walkMode}
      onInteract={onInteract}
      liveMediaByEntityId={liveMediaByEntityId}
      groupName={`device-${item.id}`}
    />
  );
}
