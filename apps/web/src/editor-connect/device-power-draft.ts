import {
  createEmptyRuntimeBindingProfile,
  isDevicePowerSlot,
  normalizeWorkspaceBindingOrigin,
  type EditorWorkspaceSnapshot,
  type EntityBindingSlotSpec,
  type EntityId,
} from "@cabane/engine";

/** Commit portable slot configuration and this origin's private mapping together. */
export const setDevicePowerDraft = <T extends EditorWorkspaceSnapshot>(
  snapshot: T,
  origin: string,
  deviceId: string,
  slot: EntityBindingSlotSpec,
  entityId: EntityId | null,
): T => {
  const item = snapshot.project.sceneItems.find((entry) => entry.id === deviceId);
  if (item?.kind !== "device" || !isDevicePowerSlot(slot)) return snapshot;
  const existing = item.entitySlots.find(isDevicePowerSlot);
  if (existing && existing.id !== slot.id) return snapshot;
  if (
    !existing &&
    snapshot.project.sceneItems.some(
      (entry) =>
        entry.id === slot.id ||
        (entry.kind === "device" &&
          entry.entitySlots.some((entrySlot) => entrySlot.id === slot.id)),
    )
  )
    return snapshot;
  const key = normalizeWorkspaceBindingOrigin(origin);
  const empty = createEmptyRuntimeBindingProfile(snapshot.project.home.id);
  const state = snapshot.bindings[key];
  const draft = state?.draft ?? empty;
  const entityIdsBySlotId = { ...draft.entityIdsBySlotId };
  if (entityId) entityIdsBySlotId[slot.id] = entityId;
  else delete entityIdsBySlotId[slot.id];
  return {
    ...snapshot,
    project: {
      ...snapshot.project,
      sceneItems: snapshot.project.sceneItems.map((entry) =>
        entry.id !== deviceId
          ? entry
          : {
              ...item,
              entitySlots: existing
                ? item.entitySlots.map((entrySlot) => (entrySlot.id === slot.id ? slot : entrySlot))
                : [...item.entitySlots, slot],
            },
      ),
    },
    bindings: {
      ...snapshot.bindings,
      [key]: {
        draft: { ...draft, entityIdsBySlotId },
        published: state?.published ?? empty,
        manualRoomIds: state?.manualRoomIds ?? [],
        manualSlotIds: [...new Set([...(state?.manualSlotIds ?? []), slot.id])],
      },
    },
  };
};
