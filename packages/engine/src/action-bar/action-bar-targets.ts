import type { DeviceModelRegistry, HomeManifest, ResolvedHomeBindings } from "../types";
import type { ActionBarItem } from "./action-bar-config";
import { resolveActionBarDestination } from "./action-bar-navigation";

export function resolveActionBarTargets(
  actionBarItems: readonly ActionBarItem[],
  manifest: HomeManifest,
  resolvedBindings: ResolvedHomeBindings,
  deviceModels: DeviceModelRegistry,
) {
  return Object.fromEntries(
    actionBarItems.flatMap((item) => {
      if (item.target.kind === "built-in" || item.target.kind === "walk-tool") return [];
      const destination = resolveActionBarDestination(manifest, item.target);
      if (!destination)
        return [[item.id, { label: `Unavailable ${item.target.kind}`, available: false }]];
      if (item.target.kind === "room") {
        const room = manifest.floors
          .find((floor) => floor.id === destination.floorId)
          ?.rooms.find((room) => room.id === destination.roomId);
        return [
          [
            item.id,
            {
              label:
                resolvedBindings.rooms[destination.roomId]?.displayName ?? room?.name ?? "Room",
              pictureUrl: resolvedBindings.rooms[destination.roomId]?.pictureUrl,
              available: true,
            },
          ],
        ];
      }
      const deviceId = item.target.deviceId;
      const device = manifest.sceneItems.find((candidate) => candidate.id === deviceId);
      return [
        [
          item.id,
          {
            label:
              resolvedBindings.rooms[destination.roomId]?.devices.find(
                (binding) => binding.slot.id === deviceId,
              )?.displayName ??
              (device
                ? (deviceModels[device.modelId]?.label ?? device.modelId.replaceAll("-", " "))
                : "Device"),
            modelId: device?.modelId,
            available: true,
          },
        ],
      ];
    }),
  );
}
