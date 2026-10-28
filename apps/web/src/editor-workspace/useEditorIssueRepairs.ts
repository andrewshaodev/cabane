import { useState } from "react";
import type { ConstructContextualIssue } from "../editor-preview/construct";
import { workspaceSnapshotFromEditorState } from "../editor-preview/project-sync";
import { missingModelEditorDescriptor } from "../editor-preview/furnish/missing-model";
import { resetSceneItemPlacement } from "../editor-preview/furnish/placement/repair-placement";
import type { useHomeEditorController } from "./useHomeEditorController";

export function useEditorIssueRepairs(
  controller: Pick<
    ReturnType<typeof useHomeEditorController>,
    | "editorProject"
    | "snapshot"
    | "commit"
    | "replaceEditorsFromProject"
    | "furnishingModels"
    | "deviceModels"
  >,
) {
  const [repairMessage, setRepairMessage] = useState<string | null>(null);
  const [repairError, setRepairError] = useState<string | null>(null);
  const itemLabel = (issue: ConstructContextualIssue) => {
    const item =
      issue.target?.kind === "scene-item" &&
      controller.editorProject.sceneItems.find((item) => item.id === issue.target?.id);
    return item
      ? (item.kind === "device" ? controller.deviceModels : controller.furnishingModels)[
          item.modelId
        ]?.label
      : undefined;
  };
  const repairIssue = (issue: ConstructContextualIssue, action: "reset-placement" | "remove") => {
    if (issue.target?.kind !== "scene-item") return;
    const project = controller.editorProject;
    const item = project.sceneItems.find((item) => item.id === issue.target?.id);
    const floor = project.floors.find((floor) => floor.id === item?.floorId);
    if (!item || !floor) return;
    const definition =
      (item.kind === "device" ? controller.deviceModels : controller.furnishingModels)[
        item.modelId
      ] ?? missingModelEditorDescriptor(item);
    const candidate =
      action === "reset-placement" ? resetSceneItemPlacement(item, project, definition) : null;
    if (candidate && !candidate.placement) {
      setRepairError(candidate.error);
      setRepairMessage(null);
      return;
    }
    const items = project.sceneItems
      .filter((other) => other.floorId === floor.id)
      .flatMap((other) =>
        other.id !== item.id
          ? [other]
          : candidate?.placement
            ? [{ ...other, placement: candidate.placement }]
            : [],
      );
    const next = workspaceSnapshotFromEditorState(
      { ...controller.snapshot, project },
      floor,
      items,
      controller,
    );
    controller.commit(next);
    controller.replaceEditorsFromProject(next.project);
    setRepairError(null);
    setRepairMessage(
      action === "remove"
        ? "Item removed. Undo restores it."
        : "Placement reset to the floor. Undo restores the previous placement.",
    );
  };
  return { repairIssue, repairMessage, repairError, itemLabel };
}
