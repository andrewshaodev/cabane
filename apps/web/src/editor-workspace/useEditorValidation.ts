import type { evaluateDerivedWalkNavigation } from "@cabane/engine";
import { validateHomeProject, type DeviceModelRegistry, type FurnishingModelRegistry, type HomeProject } from "@cabane/engine";
import { useMemo } from "react";
import type { EditorMode } from "../editor-chrome/EditorModeNav";
import type { useConstructEditor } from "../editor-preview/construct";
import { collectConstructContextualIssues, visibleConstructIssues } from "../editor-preview/construct";
import type { useSceneItemDependencies } from "../editor-preview/construct/useSceneItemDependencies";
import { ownerProjectRegistries } from "../project-runtime";
interface ValidationContext {
  editorProject: HomeProject;
  constructEditor: ReturnType<typeof useConstructEditor>;
  furnishingModels: FurnishingModelRegistry;
  deviceModels: DeviceModelRegistry;
  previewSceneItems: ReturnType<typeof useSceneItemDependencies>["items"];
  ceilingDependencies: ReturnType<typeof useSceneItemDependencies>;
  walkNavigation: ReturnType<typeof evaluateDerivedWalkNavigation>;
  mode: EditorMode;
}

export function useEditorValidation({
  editorProject, constructEditor, previewSceneItems,
  ceilingDependencies, walkNavigation, mode
}: ValidationContext) {
  const semanticValidation = useMemo(() => {
    try {
      return validateHomeProject(editorProject, ownerProjectRegistries);
    } catch {
      return {
        valid: false as const,
        issues: [{
          code: "project.publish-validation",
          path: "$",
          message: "The draft could not be validated for applying.",
          severity: "error" as const,
        }],
      };
    }
  }, [editorProject]);
  const contextualIssues = useMemo(() => collectConstructContextualIssues({
    floor: constructEditor.previewFloor,
    sceneItems: previewSceneItems,
    topologyIssues: constructEditor.topologyIssues,
    projectIssues: semanticValidation.issues,
    dependencyIssues: ceilingDependencies.issues,
    navigationIssues: walkNavigation.diagnostics,
  }), [
    ceilingDependencies.issues,
    constructEditor.previewFloor,
    constructEditor.topologyIssues,
    previewSceneItems,
    semanticValidation.issues,
    walkNavigation.diagnostics,
  ]);
  const displayedContextualIssues = useMemo(() => visibleConstructIssues(
    contextualIssues,
    mode === "construct" ? constructEditor.tool : null,
    { floor: constructEditor.previewFloor, floorIndex: editorProject.floors.findIndex(floor => floor.id === constructEditor.previewFloor.id), hasItems: previewSceneItems.length > 0 },
  ), [contextualIssues, mode, constructEditor.tool, constructEditor.previewFloor, editorProject.floors, previewSceneItems.length]);
  return { contextualIssues, displayedContextualIssues };
}
