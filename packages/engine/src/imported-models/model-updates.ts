import { createBrowserUuid } from "../browser-uuid";
import { isAuxiliaryEntitySlot } from "../entity-slot-roles";
import type { EditorWorkspaceSnapshot } from "../home-editor/workspace-history";
import { collectProjectIds } from "../home-project/cross-references";
import type { SceneItemSpec } from "../home-project/types";
import { removeDeletedItemBindingReferences } from "../home-project/workspace-bindings";
import { editModelLighting } from "../model-lighting/edit";
import type { CustomModel } from "./contracts";
import { validateCustomModels } from "./model-schema";
import type { HomeProjectIssue } from "../home-project/validation-types";

export interface MissingModelReplacement {
  modelId: string;
  kind: SceneItemSpec["kind"];
}

/** Update one definition, all copies and draft mappings as one history-ready snapshot. */
export function editCustomModel(
  snapshot: EditorWorkspaceSnapshot,
  model: CustomModel,
): EditorWorkspaceSnapshot {
  if (!snapshot.project.customModels?.some((entry) => entry.id === model.id))
    throw new Error("This model no longer exists. Close the editor and try again.");
  return importCustomModels(snapshot, [model]);
}

/**
 * Add or update definitions from verified assets. Same-ID assets are immutable.
 * A single-model import can replace missing references; absent old normalization
 * preserves their authored sizes. GLB bytes and persistence stay with the caller.
 */
export function importCustomModels(
  snapshot: EditorWorkspaceSnapshot,
  models: readonly CustomModel[],
  replacement?: MissingModelReplacement,
): EditorWorkspaceSnapshot {
  if (replacement && models.length !== 1)
    throw new Error("Choose one model to replace the missing model.");
  if (!models.length) return snapshot;
  const previous = new Map<string, CustomModel>(
    snapshot.project.customModels?.map((model) => [model.id, model]),
  );
  const definitions = new Map(previous);
  const updates = new Map<string, CustomModel>(models.map((model) => [model.id, model]));
  if (updates.size !== models.length) throw new Error("Model IDs must be unique.");
  for (const model of models) {
    const existing = previous.get(model.id);
    if (
      existing &&
      (existing.asset.sha256 !== model.asset.sha256 ||
        existing.asset.byteLength !== model.asset.byteLength)
    )
      throw new Error(`Model “${model.id}” already exists; editing cannot replace its GLB asset.`);
    definitions.set(model.id, model);
  }
  const issues: HomeProjectIssue[] = [];
  validateCustomModels([...definitions.values()], issues);
  if (issues.length) throw new Error(issues[0].message);
  if (replacement && previous.has(replacement.modelId))
    throw new Error("Only missing model references can be replaced.");

  const occupied = new Set(collectProjectIds(snapshot.project));
  const sceneItems = snapshot.project.sceneItems.map((item): SceneItemSpec => {
    const replacing = replacement?.modelId === item.modelId && replacement.kind === item.kind;
    const model = replacing ? models[0] : updates.get(item.modelId);
    if (!model) return item;
    const oldModel = previous.get(item.modelId);
    // Corrections preserve each copy's relative size and exact support declaration.
    const size = oldModel
      ? (model.normalization.size.map((value, axis) =>
          value === oldModel.normalization.size[axis]
            ? item.size[axis]
            : item.size[axis] * (value / oldModel.normalization.size[axis]),
        ) as [number, number, number])
      : item.size;
    const controls = (item.entitySlots ?? []).filter((slot) => !isAuxiliaryEntitySlot(slot));
    const compatible =
      model.profile === "furniture"
        ? item.kind === "furnishing" && controls.length === 0
        : item.kind === "device" &&
          controls.filter((slot) => slot.deviceRole === "primary").length === 1 &&
          controls.every(
            (slot) =>
              slot.compatibleDomains.length > 0 &&
              slot.compatibleDomains.every((domain) => domain === model.profile),
          );
    if ((!oldModel || oldModel.profile === model.profile) && compatible)
      return { ...item, modelId: model.id, size };
    const readings = (item.entitySlots ?? []).filter(isAuxiliaryEntitySlot);
    const { entitySlots: _slots, lightState: _lightState, ...common } = item;
    if (model.profile === "furniture")
      return {
        ...common,
        modelId: model.id,
        size,
        kind: "furnishing",
        ...(readings.length ? { entitySlots: readings } : {}),
      };
    let slotId = createBrowserUuid();
    while (occupied.has(slotId)) slotId = createBrowserUuid();
    occupied.add(slotId);
    return {
      ...common,
      modelId: model.id,
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
        ...readings,
      ],
    };
  });
  let next: EditorWorkspaceSnapshot = {
    ...snapshot,
    project: { ...snapshot.project, customModels: [...definitions.values()], sceneItems },
  };
  for (const model of models)
    next = editModelLighting(next, model.id, model.light ?? null, {
      furnishingModels: {},
      deviceModels: {},
    });
  return {
    ...next,
    bindings: removeDeletedItemBindingReferences(
      next.bindings,
      snapshot.project.sceneItems,
      next.project.sceneItems,
    ),
  };
}
