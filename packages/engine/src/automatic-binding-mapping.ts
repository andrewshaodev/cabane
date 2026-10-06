import { compatibleDeviceClass } from "./binding-slot-compatibility";
import { bindingEntityCandidates, canonicalName } from "./binding-entity-candidates";
import { BindingEntityCandidate } from "./binding-profile-contract";
import { collectBindingSlots } from "./binding-slot-descriptors";
import type {
  AutomaticBindingAmbiguity,
  AutomaticBindingChange,
  AutomaticBindingResult,
  EntityId,
  HomeAssistantRuntimeSnapshot,
  HomeBindingManifest,
  RuntimeBindingProfile
} from "./types";

export const automaticallyMapRuntimeBindings = (
  manifest: HomeBindingManifest,
  current: RuntimeBindingProfile,
  runtime: HomeAssistantRuntimeSnapshot,
  exclusions: { manualRoomIds?: readonly string[]; manualSlotIds?: readonly string[] } = {},
): AutomaticBindingResult => {
  const roomAreaIds = { ...current.roomAreaIds };
  const entityIdsBySlotId = { ...current.entityIdsBySlotId };
  const applied: AutomaticBindingChange[] = [];
  const ambiguous: AutomaticBindingAmbiguity[] = [];
  const rooms = manifest.floors.flatMap((floor) => floor.rooms).filter((room) => !exclusions.manualRoomIds?.includes(room.id));
  const claimedAreas = new Set(Object.values(roomAreaIds));
  const unmappedRooms = rooms.filter((room) => !roomAreaIds[room.id]);
  const availableAreas = runtime.areas.filter((area) => !claimedAreas.has(area.area_id));
  const roomMatches = new Map(unmappedRooms.map((room) => [
    room.id,
    availableAreas.filter((area) => canonicalName(area.name) === canonicalName(room.name)),
  ]));
  const matchingRoomCountByArea = new Map<string, number>();
  for (const matches of roomMatches.values()) for (const area of matches) {
    matchingRoomCountByArea.set(area.area_id, (matchingRoomCountByArea.get(area.area_id) ?? 0) + 1);
  }
  for (const room of unmappedRooms) {
    const matches = roomMatches.get(room.id) ?? [];
    if (matches.length === 1 && matchingRoomCountByArea.get(matches[0].area_id) === 1) {
      roomAreaIds[room.id] = matches[0].area_id;
      claimedAreas.add(matches[0].area_id);
      applied.push({ kind: "room", destinationId: room.id, value: matches[0].area_id, reason: "exact-room-name" });
    } else if (matches.length > 0) {
      ambiguous.push({ kind: "room", destinationId: room.id, candidateIds: matches.map((area) => area.area_id) });
    }
  }
  const remainingRooms = rooms.filter((room) => !roomAreaIds[room.id]);
  const remainingAreas = runtime.areas.filter((area) => !claimedAreas.has(area.area_id));
  if (remainingRooms.length === 1 && remainingAreas.length === 1) {
    roomAreaIds[remainingRooms[0].id] = remainingAreas[0].area_id;
    applied.push({ kind: "room", destinationId: remainingRooms[0].id, value: remainingAreas[0].area_id, reason: "only-room-area" });
  }

  const workingProfile: RuntimeBindingProfile = {
    ...current,
    schemaVersion: 1,
    homeId: current.homeId,
    roomAreaIds,
    entityIdsBySlotId,
  };
  const claimedEntities = new Set(Object.values(entityIdsBySlotId));
  const autoSlots = collectBindingSlots(manifest).filter((descriptor) =>
    descriptor.spec.autoMap === "unique-compatible"
    && !exclusions.manualSlotIds?.includes(descriptor.slotId)
    && !entityIdsBySlotId[descriptor.slotId]
    && descriptor.roomIds.length === 1
    && Boolean(roomAreaIds[descriptor.roomIds[0]])
  );
  const candidatesBySlot = new Map<string, BindingEntityCandidate[]>();
  const slotCountByCandidate = new Map<EntityId, number>();
  for (const descriptor of autoSlots) {
    const candidates = bindingEntityCandidates({
      descriptor,
      roomId: descriptor.roomIds[0],
      profile: workingProfile,
      runtime,
    }).filter((candidate) =>
      candidate.matchRank === 0
      && candidate.selectable
      && compatibleDeviceClass(descriptor.spec, candidate.entityId, runtime)
      && candidate.available
      && !candidate.disabled
      && !candidate.hidden
      && !claimedEntities.has(candidate.entityId)
    );
    candidatesBySlot.set(descriptor.slotId, candidates);
    for (const candidate of candidates) {
      slotCountByCandidate.set(candidate.entityId, (slotCountByCandidate.get(candidate.entityId) ?? 0) + 1);
    }
  }
  for (const descriptor of autoSlots) {
    const candidates = candidatesBySlot.get(descriptor.slotId) ?? [];
    if (
      candidates.length === 1
      && slotCountByCandidate.get(candidates[0].entityId) === 1
    ) {
      entityIdsBySlotId[descriptor.slotId] = candidates[0].entityId;
      claimedEntities.add(candidates[0].entityId);
      applied.push({
        kind: "entity",
        destinationId: descriptor.slotId,
        value: candidates[0].entityId,
        reason: "unique-compatible",
      });
    } else if (candidates.length > 0) {
      ambiguous.push({
        kind: "entity",
        destinationId: descriptor.slotId,
        candidateIds: candidates.map((candidate) => candidate.entityId),
      });
    }
  }
  return {
    profile: { ...workingProfile, entityIdsBySlotId },
    applied,
    ambiguous,
  };
};
