import { lightingSlotForItem, lightingModelId } from "./model-lighting/settings";
import { useContext } from "react";
import { ActiveSceneLightPool, PhysicalSceneLight, type SceneLightSource } from "./SceneLightPool";
import { resolveModelVariant } from "./model-variants";
import { SceneNightContext, sceneLightState } from "./scene-light-state";
import {
  deviceWorldTransform,
  resolveDeviceModelDefinition,
  uniformDeviceScaleForSize,
} from "./devices";
import { planPointToWorld, polygonCentroid } from "./geometry";
import { resolveItemTransform, type SceneItemSpec } from "./home-project";
import { lightBrightnessRatio, lightColorForSnapshot } from "./home-assistant-controls";
import type { DeviceModelRegistry, FloorSpec, ResolvedHomeBindings, RoomSpec } from "./types";

const defaultRoomLight = (room: RoomSpec, floor: FloorSpec) => {
  const [x, z] = planPointToWorld(polygonCentroid(room.polygon), floor.coordinates);
  const worldPoints = room.polygon.map((point) => planPointToWorld(point, floor.coordinates));
  const xs = worldPoints.map(([worldX]) => worldX);
  const zs = worldPoints.map(([, worldZ]) => worldZ);
  const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs));
  return {
    position: [x, floor.defaultCeilingHeightMeters - 0.35, z] as const,
    color: "#ffd99b",
    maxIntensity: 5,
    distance: Math.max(4, Math.min(8, span * 1.1)),
  };
};

const deviceLightPosition = (
  position: readonly [number, number, number],
  rotationYRadians: number,
  scale: number | readonly [number, number, number],
  local: readonly [number, number, number],
): readonly [number, number, number] => {
  const cosine = Math.cos(rotationYRadians);
  const sine = Math.sin(rotationYRadians);
  const axes = typeof scale === "number" ? [scale, scale, scale] : scale;
  const localX = local[0] * axes[0];
  const localZ = local[2] * axes[2];
  return [
    position[0] + localX * cosine + localZ * sine,
    position[1] + local[1] * axes[1],
    position[2] - localX * sine + localZ * cosine,
  ];
};

export function HomeAssistantSceneLighting({
  floor,
  resolvedBindings,
  deviceModels,
  extensionDeviceModels,
  sceneItems = [],
  enabled = true,
}: {
  floor: FloorSpec;
  resolvedBindings: ResolvedHomeBindings;
  deviceModels: DeviceModelRegistry;
  extensionDeviceModels: DeviceModelRegistry;
  sceneItems?: readonly SceneItemSpec[];
  enabled?: boolean | undefined;
}) {
  const nightLighting = useContext(SceneNightContext);
  if (!enabled) return <group name="home-assistant-scene-lighting" />;
  // Bindings cover the whole building; fallback emitters belong only to this floor.
  const resolvedDevices = floor.rooms.flatMap(
    (room) => resolvedBindings.rooms[room.id]?.devices ?? [],
  );
  resolvedDevices.push(...(resolvedBindings.rooms[`outside-rooms:${floor.id}`]?.devices ?? []));
  const resolvedById = new Map(resolvedDevices.map((device) => [device.slot.id, device]));
  // Scene items exist independently of room assignment and HA connectivity.
  const deviceItems = sceneItems.filter(
    (item) => item.floorId === floor.id && (item.kind === "device" || !!item.lightSlotId),
  );
  const deviceItemIds = new Set(
    deviceItems.flatMap((item) => [item.id, ...(item.lightSlotId ? [item.lightSlotId] : [])]),
  );
  const lightDevices = [
    ...deviceItems.map((item) => ({
      id: item.id,
      modelId: item.modelId,
      item,
      resolved: resolvedById.get(item.lightSlotId ?? item.id),
    })),
    ...resolvedDevices
      .filter((device) => !deviceItemIds.has(device.slot.id))
      .map((resolved) => ({
        id: resolved.slot.id,
        modelId: resolved.slot.model,
        item: undefined,
        resolved,
      })),
  ];
  const pooledSources: SceneLightSource[] = [];
  return (
    <group name="home-assistant-scene-lighting">
      {floor.rooms.flatMap((room) => {
        const resolvedRoom = resolvedBindings.rooms[room.id];
        if (!resolvedRoom) return [];
        const roomLights = Object.values(resolvedRoom.sections)
          .flat()
          .flatMap((entity) => {
            const slot = room.dashboardSlots.find((candidate) => candidate.id === entity.slotId);
            if (
              entity.domain !== "light" &&
              !(entity.domain === "switch" && slot?.compatibleDomains.includes("light"))
            )
              return [];
            const brightness = lightBrightnessRatio(entity.state);
            // Keep light counts stable: toggles update uniforms instead of recompiling shaders.
            const configured = slot?.sceneLight;
            const fallback = defaultRoomLight(room, floor);
            const configuredPosition = configured
              ? planPointToWorld(configured.at, floor.coordinates)
              : null;
            const resolvedPosition = configured
              ? ([
                  configuredPosition![0],
                  configured.elevationMeters,
                  configuredPosition![1],
                ] as const)
              : fallback.position;
            return [
              <PhysicalSceneLight
                floor={floor}
                key={`room-light-${entity.slotId}`}
                name={`ha-room-light-${entity.slotId}`}
                position={resolvedPosition}
                color={lightColorForSnapshot(entity.state, configured?.color ?? fallback.color)}
                intensity={(configured?.maxIntensity ?? fallback.maxIntensity) * brightness}
                distance={configured?.distance ?? fallback.distance}
              />,
            ];
          });
        return roomLights;
      })}
      {lightDevices.flatMap(({ id, modelId, item: sceneItem, resolved }) => {
        const definition = resolveDeviceModelDefinition(
          sceneItem?.lightSlotId ? lightingModelId(modelId) : modelId,
          deviceModels,
          extensionDeviceModels,
        );
        if (
          !definition?.sceneLight ||
          resolveModelVariant(definition, sceneItem?.variant).sceneLight === false
        )
          return [];
        const primaryLightSlot = sceneItem
          ? lightingSlotForItem(sceneItem)
          : resolved?.slot.entitySlots.find(
              (slot) => slot.deviceRole === "primary" && slot.compatibleDomains.includes("light"),
            );
        const entity =
          resolved && (resolved.slot.model === modelId || !!sceneItem?.lightSlotId)
            ? resolved.entities.find(
                (candidate) =>
                  (candidate.domain === "light" ||
                    (candidate.domain === "switch" && Boolean(primaryLightSlot))) &&
                  (!primaryLightSlot || candidate.slotId === primaryLightSlot.id),
              )
            : undefined;
        const transform = sceneItem
          ? resolveItemTransform(sceneItem.placement, floor)
          : deviceWorldTransform(resolved.slot, floor.coordinates);
        const state = sceneLightState(sceneItem?.lightState, entity?.state, nightLighting);
        const brightness = lightBrightnessRatio(state);
        // Zero-intensity emitters retain the shader layout while devices are off.
        const sceneItemScale = sceneItem
          ? uniformDeviceScaleForSize(sceneItem.size, definition)
          : null;
        if (sceneItem && sceneItemScale === null && !definition.lighting) return [];
        const scale = sceneItem
          ? definition.lighting
            ? (sceneItem.size.map((n, axis) => n / definition.defaultSize[axis]) as [
                number,
                number,
                number,
              ])
            : sceneItemScale!
          : deviceWorldTransform(resolved.slot, floor.coordinates).scale;
        const sources = definition.sceneLights ?? [definition.sceneLight];
        const pooled = definition.lightingCustomized || modelId.startsWith("custom:");
        return sources.flatMap((source, index) => {
          const properties: SceneLightSource = {
            name: "ha-device-light-" + id + (index ? "-" + index : ""),
            position: deviceLightPosition(
              transform.position,
              transform.rotationYRadians,
              scale,
              source.position,
            ),
            color: lightColorForSnapshot(state, source.color),
            intensity: source.maxIntensity * brightness,
            distance: source.distance * (typeof scale === "number" ? scale : Math.max(...scale)),
          };
          if (pooled) {
            pooledSources.push(properties);
            return [];
          }
          return [
            <PhysicalSceneLight
              key={"device-light-" + id + "-" + index}
              floor={floor}
              {...properties}
            />,
          ];
        });
      })}
      <ActiveSceneLightPool key={floor.id} floor={floor} sources={pooledSources} />
    </group>
  );
}
