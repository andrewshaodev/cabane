import { useMemo } from "react";
import {
  cameraEntityAvailable,
  cameraPosterUrl,
  deduplicateCameraStreamRequirements,
} from "./camera-stream";
import type { CameraStreamRequirement } from "./CameraStreamCoordinator";
import { resolveDeviceModelDefinition } from "./devices";
import type { DeviceModelRegistry, HomeManifest, ResolvedHomeBindings } from "./types";
export function useSceneCameraRequirements(
  manifest: HomeManifest,
  deviceModels: DeviceModelRegistry,
  resolvedBindings: ResolvedHomeBindings,
  origin: string | null,
) {
  const floor = manifest.floors[0];
  const liveCameraDeviceIds = useMemo(
    () =>
      new Set(
        floor.rooms.flatMap((room) =>
          room.devices
            .filter((device) => {
              const definition = resolveDeviceModelDefinition(
                device.model,
                deviceModels,
                manifest.extensions.deviceModels,
              );
              const resolved = resolvedBindings.rooms[room.id]?.devices.find(
                (candidate) => candidate.slot.id === device.id,
              );
              const primarySlot = device.entitySlots.find((slot) => slot.deviceRole === "primary");
              const primary = resolved?.entities.find(
                (entity) => entity.slotId === primarySlot?.id,
              );
              return (
                definition?.liveMedia?.kind === "camera-stream" &&
                (!primary || primary.entityId.startsWith("camera."))
              );
            })
            .map((device) => device.id),
        ),
      ),
    [deviceModels, floor.rooms, manifest.extensions.deviceModels, resolvedBindings.rooms],
  );
  const cameraStreamRequirements = useMemo(() => {
    const requirements: CameraStreamRequirement[] = [];
    Object.values(resolvedBindings.rooms).forEach((resolvedRoom) => {
      resolvedRoom.devices.forEach((device) => {
        const definition = resolveDeviceModelDefinition(
          device.slot.model,
          deviceModels,
          manifest.extensions.deviceModels,
        );
        if (definition?.liveMedia?.kind !== "camera-stream") return;
        const primarySlot = device.slot.entitySlots.find(
          (slot) => slot.deviceRole === definition.liveMedia?.slotRole,
        );
        const primary = device.entities.find((entity) => entity.slotId === primarySlot?.id);
        if (!primary || !primary.entityId.startsWith("camera.")) return;
        requirements.push({
          entityId: primary.entityId,
          available: cameraEntityAvailable(primary.state),
          posterUrl: cameraPosterUrl(primary.state, origin),
        });
      });
    });
    return deduplicateCameraStreamRequirements(requirements);
  }, [deviceModels, manifest.extensions.deviceModels, resolvedBindings.rooms, origin]);
  return { liveCameraDeviceIds, cameraStreamRequirements };
}
