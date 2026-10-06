import type { HomeManifest } from "@cabane/engine";
/** Prefer a modeled light; no room-name assumptions or household identifiers. */
export function firstOnboardingLight(manifest: HomeManifest, preferredRoomId?: string) {
  const rooms = manifest.floors.flatMap(floor => floor.rooms);
  const ordered = [...rooms.filter(room => room.id === preferredRoomId), ...rooms.filter(room => room.id !== preferredRoomId)];
  for (const room of ordered) for (const device of room.devices) {
    const slot = device.entitySlots.find(slot => slot.compatibleDomains.includes("light") && slot.deviceRole === "primary");
    if (slot) return { roomId: room.id, deviceId: device.id, slotId: slot.id };
  }
  return undefined;
}
