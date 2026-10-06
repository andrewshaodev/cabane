import { collectBindingSlots } from "../runtime-binding-profile";
import type { EntityId, HomeBindingManifest, RuntimeBindingProfile } from "../types";

export const changedRoomIds = (
  savedRoomAreaIds: RuntimeBindingProfile["roomAreaIds"],
  draftRoomAreaIds: RuntimeBindingProfile["roomAreaIds"],
) =>
  [...new Set([...Object.keys(savedRoomAreaIds), ...Object.keys(draftRoomAreaIds)])]
    .filter((roomId) => savedRoomAreaIds[roomId] !== draftRoomAreaIds[roomId])
    .sort();

export const saveRoomAreaDraft = ({
  manifest,
  savedProfile,
  roomAreaIds,
}: {
  manifest: HomeBindingManifest;
  savedProfile: RuntimeBindingProfile;
  roomAreaIds: RuntimeBindingProfile["roomAreaIds"];
}) => {
  const changed = changedRoomIds(savedProfile.roomAreaIds, roomAreaIds);
  const changedSet = new Set(changed);
  const affectedSlotIds = new Set(
    collectBindingSlots(manifest)
      .filter((descriptor) => descriptor.roomIds.some((roomId) => changedSet.has(roomId)))
      .map((descriptor) => descriptor.slotId),
  );
  const clearedSlotIds = Object.keys(savedProfile.entityIdsBySlotId)
    .filter((slotId) => affectedSlotIds.has(slotId))
    .sort();
  const clearedSet = new Set(clearedSlotIds);
  const entityIdsBySlotId = Object.fromEntries(
    Object.entries(savedProfile.entityIdsBySlotId).filter(([slotId]) => !clearedSet.has(slotId)),
  ) as Record<string, EntityId>;
  const profile: RuntimeBindingProfile = {
    ...savedProfile,
    roomAreaIds: { ...roomAreaIds },
    entityIdsBySlotId,
  };
  return {
    profile,
    changedRoomIds: changed,
    affectedSlotIds: [...affectedSlotIds].sort(),
    clearedSlotIds,
  };
};

export const rebaseEntityDraftAfterRoomSave = ({
  entityIdsBySlotId,
  clearedSlotIds,
}: {
  entityIdsBySlotId: RuntimeBindingProfile["entityIdsBySlotId"];
  clearedSlotIds: readonly string[];
}) => {
  const cleared = new Set(clearedSlotIds);
  return Object.fromEntries(
    Object.entries(entityIdsBySlotId).filter(([slotId]) => !cleared.has(slotId)),
  ) as Record<string, EntityId>;
};

export const saveEntityMappingDraft = ({
  savedProfile,
  entityIdsBySlotId,
}: {
  savedProfile: RuntimeBindingProfile;
  entityIdsBySlotId: RuntimeBindingProfile["entityIdsBySlotId"];
}): RuntimeBindingProfile => ({
  ...savedProfile,
  roomAreaIds: { ...savedProfile.roomAreaIds },
  entityIdsBySlotId: { ...entityIdsBySlotId },
});
