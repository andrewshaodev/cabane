import type { SceneItemSpec } from "./types";

export const lightingEntitySlotId = (id: string) => `${id}-entity`;

/** All declared item-owned binding IDs, even when geometry/model resolution is unfinished. */
export const itemBindingSlotIds = (item: SceneItemSpec): string[] => [
  ...(item.entitySlots ?? []).map((slot) => slot.id),
  ...(item.lightSlotId ? [lightingEntitySlotId(item.lightSlotId)] : []),
];
