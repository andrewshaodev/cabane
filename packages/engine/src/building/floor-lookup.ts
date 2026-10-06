import type { FloorSpec, HomeBindingManifest } from "../types";
export const floorById = <T extends Pick<FloorSpec, "id">>(floors: readonly T[], floorId: string): T | undefined =>
  floors.find((floor) => floor.id === floorId);
export const floorIdForRoom = (manifest: HomeBindingManifest, roomId: string): string | null =>
  manifest.floors.find((floor) => floor.rooms.some((room) => room.id === roomId))?.id ?? null;
export const floorIdForDevice = (manifest: HomeBindingManifest, deviceId: string): string | null =>
  manifest.sceneItems.find((item) => item.id === deviceId)?.floorId
  ?? manifest.floors.find((floor) => floor.rooms.some((room) => room.devices.some((device) => device.id === deviceId)))?.id ?? null;
