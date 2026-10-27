import {
  removeWorkspaceSlotReferences,
  type CustomModel,
  type EditorWorkspaceSnapshot,
  type SceneItemSpec,
} from "@cabane/engine";
import { createSceneItemId } from "../editor-preview/furnish/scene-item-identity";

/** One history entry owns the definition, copies, and draft mappings across all origins. */
export function editCustomModel(
  snapshot: EditorWorkspaceSnapshot,
  model: CustomModel,
): EditorWorkspaceSnapshot {
  const previous = snapshot.project.customModels?.find((entry) => entry.id === model.id);
  if (!previous) throw new Error("This model no longer exists. Close the editor and try again.");
  if (
    previous.asset.sha256 !== model.asset.sha256 ||
    previous.asset.byteLength !== model.asset.byteLength
  )
    throw new Error("Editing a model cannot replace its GLB asset.");
  const profileChanged = previous.profile !== model.profile;
  const removedSlots: string[] = [];
  const occupied = new Set([
    ...snapshot.project.sceneItems.map((item) => item.id),
    ...snapshot.project.sceneItems.flatMap((item) =>
      item.kind === "device" ? item.entitySlots.map((slot) => slot.id) : [],
    ),
  ]);
  const sceneItems = snapshot.project.sceneItems.map((item): SceneItemSpec => {
    if (item.modelId !== model.id) return item;
    // A copy's uniform multiplier survives corrections to the model's dimensions/orientation.
    const size = model.normalization.size.map((value, axis) =>
      value === previous.normalization.size[axis]
        ? item.size[axis]
        : item.size[axis] * (value / previous.normalization.size[axis]),
    ) as [number, number, number];
    if (!profileChanged) return { ...item, size };
    if (item.kind === "device") removedSlots.push(...item.entitySlots.map((slot) => slot.id));
    const {
      entitySlots: _slots,
      lightState: _lightState,
      ...common
    } = item.kind === "device" ? item : { ...item, entitySlots: undefined, lightState: undefined };
    if (model.profile === "furniture") return { ...common, size, kind: "furnishing" };
    const slotId = createSceneItemId(occupied);
    occupied.add(slotId);
    return {
      ...common,
      size,
      kind: "device",
      entitySlots: [
        {
          id: slotId,
          compatibleDomains: [model.profile],
          required: true,
          autoMap: "manual",
          deviceRole: "primary",
          presentation: { label: model.name, dashboardRole: "primary" },
        },
      ],
    };
  });
  return {
    ...snapshot,
    project: {
      ...snapshot.project,
      customModels: snapshot.project.customModels!.map((entry) =>
        entry.id === model.id ? model : entry,
      ),
      sceneItems,
    },
    bindings: removeWorkspaceSlotReferences(snapshot.bindings, removedSlots),
  };
}
